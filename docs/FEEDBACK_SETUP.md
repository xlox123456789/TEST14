# 匿名辨識錯誤回報：Cloudflare Worker＋私人 R2

## 狀態與流程

程式與部署設定已準備，但不代表已建立 Cloudflare 資源。網站維持 GitHub Pages；一般擷取、辨識皆在本機。訪客按回報、檢查資料、同意並確認後，自動 POST 完整圖片與盤面 JSON 到 Worker，不需要 GitHub 帳號或手動附檔。保留原先要求的二次確認，避免誤傳私人內容。

2026-10-15：已部署正式接收端 `https://test14-feedback.xlox123456789.workers.dev/reports`，繫結 ALLOWED_ORIGIN、REPORT_RATE_LIMITER、私人桶 `test14-feedback-private` 與 D1 `test14-feedback-quota`。已核對30天清除規則；真實 D1 的獨立測試鍵確認第200筆通過、第201筆拒絕。GitHub Actions 的 VITE_REPORT_ENDPOINT 已設定。新版 Worker version ID：`d24e6b6d-2ad1-40bb-8097-978915f6d038`。網站實際圖片收件驗證另見 TEST_RESULTS.md。

只有管理者需要登入 Cloudflare。這個版本不建立公開 GitHub Issue；回報存入你擁有的私人 R2 桶。前端沒有寫入權杖。未設定端點時無法送出。

## 管理者部署步驟

請先在 Cloudflare 帳戶啟用 R2；若平台要求帳單設定，須由帳戶擁有人自行確認。費用與配額以你的帳戶方案為準，不宣稱永久免費。

在專案根目錄，以已安裝 Node.js 與 pnpm 的終端機執行：

```powershell
pnpm dlx wrangler@4 login
pnpm dlx wrangler@4 r2 bucket create test14-feedback-private
pnpm dlx wrangler@4 d1 create test14-feedback-quota
```

將 D1 建立結果的 database_id 加到 `feedback-worker/wrangler.jsonc` 的 `d1_databases`（binding 必須為 `QUOTA_DB`、database_name 為 `test14-feedback-quota`），再初始化資料表：

```powershell
pnpm dlx wrangler@4 d1 execute test14-feedback-quota --remote --file feedback-worker/migrations/0001_daily_quota.sql --config feedback-worker/wrangler.jsonc
pnpm dlx wrangler@4 deploy --config feedback-worker/wrangler.jsonc
```

`wrangler.jsonc` 已指定 R2 binding `REPORTS`、允許來源 `https://xlox123456789.github.io`、每 IP 每 Cloudflare 節點約每分鐘5次限流。若帳戶已有 namespace `1001`，換成獨立的正整數字串以免共用限流。IP 限流可能影響共用網路的訪客，不是全域硬配額；Origin/CORS 也不是防偽造認證。匿名公開端點仍可能遭濫用，請監控用量，必要時關閉 Worker，或後續加入 Turnstile。程式不記錄 IP 與上傳內容到應用程式日誌；平台仍處理連線資料。

## 全站每日200筆

使用 D1 唯一日期主鍵及單一原子 UPSERT ... WHERE used < 200 RETURNING，跨 Worker 實例共用計數。以台灣時間每日00:00切換日期，不使用前端變數、KV 最終一致性計數或每節點限流冒充全站配額。

只在圖片、盤面與同意驗證通過後，R2 寫入前預留額度。**寫入失敗也保守計入額度**，因此每天至多200次有效收件嘗試，不會因退款式回補造成競態超額。D1 不可用時回503，不繞過上限。200筆滿後回429；午夜換日可再收件。D1 只存日期及數量，不存圖片、盤面或 IP。

此上限限制回報儲存數量，**不等於整個 Cloudflare 帳戶的費用上限，也不能阻止攻擊者發出 HTTP 請求**。請求仍可能消耗 Workers／D1 配額；攻擊者也可能耗完當日回報額度。必要時加入 Turnstile 與帳戶用量監控。

部署成功會顯示你的實際 `https://test14-feedback.<你的子網域>.workers.dev`。回報 API 是它的 `/reports`，**不要將範例佔位網址直接設定到正式站**。

## R2 必做設定

到 Cloudflare Dashboard → R2 → `test14-feedback-private`：

1. 保持 Public Development URL、Custom Domains 關閉，不提供公開讀取。
2. 在 Settings → Object lifecycle rules 新增「所有物件，30天後刪除」。網站隱私說明依此約定保留最多30天；啟用正式收件前必須完成這項設定。
3. 管理者從 Objects 檢視／下載回報。每份回報位於 `日期/UUID/`，有 `screenshot.png`（或 jpg/webp）與 `report.json`。只有 JSON 寫入成功才回覆成功收據。
4. 不要把真實回報檔案再提交到公開 Git；下載後妥善保管並按期限清理。若收到刪除請求，依日期及收據 ID 找到該資料夾刪除。

## 連接 GitHub Pages

在 GitHub `TEST14` → Settings → Secrets and variables → Actions → **Variables** 新增 repository variable：

```text
VITE_REPORT_ENDPOINT=https://你部署後的實際Worker網址/reports
```

這是公開網址，不能填 API Token。現有 Pages workflow 會在建置時讀取該變數；到 Actions → Validate and deploy Pages → Run workflow，待成功後正式站才生效。沒有變數時照常部署，回報按鈕可檢視說明但無法送出。目前此變數已替 TEST14 設定完成。

本機可複製 `.env.example` 為 `.env.local` 並填入 HTTPS 端點；Worker 預設只接受正式站 Origin。如需測試 localhost，使用獨立測試 Worker／桶與對應 ALLOWED_ORIGIN，勿將正式桶打開為任意來源。

## 正式驗證（管理者部署後執行）

1. 正式站載入「自製測試圖片」，按回報；確認勾選前沒有任何外傳。
2. 確認送出後看到成功訊息；R2 中須有同一資料夾的圖片與 JSON，核對原始／修正盤面及版號。
3. 測試取消、不勾同意、離線、接收端拒絕、連續請求限流。不應出現假成功。
4. 刪除這次測試回報。未完成上述驗證前，不能宣稱正式回報已可用。

## 資料與限制

POST `/reports` 使用 multipart，包含 `image` 與 `report`。圖片限 PNG/JPEG/WebP、16 MiB，整體上限18 MiB；檢查檔頭、盤面 schema、選區及同意旗標。單份 JSON 上限約2.1 MB。伺服器忽略任意額外欄位，不保存 IP、Cookie 或請求標頭。圖片本身仍可能包含角色名稱與聊天；二次確認會清楚提醒。匿名同意旗標僅記錄客戶端聲明，無法證明真人身份。網路中斷時可能已收件但未取得回覆，重試可能產生重複資料。

## 官方參考

- [R2 Workers API 與 bucket binding](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)
- [Wrangler 設定](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [Rate Limiting binding 與限制](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
- [R2 物件生命週期](https://developers.cloudflare.com/r2/buckets/object-lifecycles/)

除 mock R2／rate limiter 單元測試外，已完成真實 Cloudflare D1 額度邊界及正式站→Worker→私人R2 圖片／JSON 收件驗證，詳見 TEST_RESULTS.md。管理者可到 R2 的日期／收據編號資料夾下載回報；回報不會寄信通知，也不寫入公開 GitHub。
