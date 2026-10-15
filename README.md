# Torchlight: Infinite SS14 — Tartarus Planner

《火炬之光：無限》的副螢幕網頁工具。第二階段提供手動截圖、原創測試圖辨識、結構化盤面、人工修正與 JSON 匯入匯出。**真實遊戲模板與正式規則仍不足，不提供最佳策略或虛構辨識率**。沿用 React + TypeScript + Vite；主要功能為純靜態，不使用付費 AI API。自願錯誤回報另由可選的 Cloudflare Worker＋R2 接收。

## 功能與使用

頂部提供版本紀錄、分享／截圖教學、免責聲明與隱私權政策，以及 [Ko-fi 支持開發](https://ko-fi.com/louissu)。目前未啟用 GA4 或 AdSense；一般擷取與辨識不外傳圖片，只有使用者主動同意並確認回報才傳送該次資料。

1. 用 Chrome / Edge 開啟 HTTPS 網站（開發時 localhost 亦可）。
2. 主螢幕開啟遊戲、副螢幕開啟網站，按「開始分享」，由瀏覽器選取遊戲視窗。網站無法自動指定或保證來源就是火炬。
3. 授權後持續保留影像串流；按「分析棋盤」才將當前畫格轉成 PNG，顯示預覽、時間與解析度，並對該張圖片嘗試本機辨識。沒有可靠遊戲模板時保持未知，截圖預覽仍可使用。
4. 重複點擊更新截圖；「停止分享」釋放串流，「重新分享」停止舊來源後重新授權。浏览器停止分享也會顯示提醒。

沒有定時截圖或持續分析。隱藏 video 只接收分享串流；canvas 僅在點擊時建立。截圖使用 Blob URL 留在瀏覽器記憶體，不儲存至 localStorage；更新及離開頁面會釋放 URL，重新整理會清除截圖與分享授權。沒有遙測或外部字型；一般操作沒有外部 API 請求，自願錯誤回報才會 POST 至已設定的接收端。網站本身的靜態檔案仍會從 GitHub Pages 下載。

## 2026.10.15.2 更新

- 四獸顯示名稱：老象P、惡魔獅、狼阿奇、低欸鼠；JSON 穩定 ID 保持相容。
- 第二區塊按「修正盤面」進入修正模式，「完成修正」回到檢視；修改後仍須確認盤面。
- 「回報辨識錯誤」顯示完整圖片與資料，勾選同意、確認後自動傳送，不要求 GitHub 登入。接收端未設定時停用傳送，不顯示成功。
- 頂部版號可開啟日期與更新摘要；舊紀錄依 Git 提交補登。重大更新須更新 `src/releases.ts`（亦見 AGENTS.md）。
- 接收服務與部署教學：[docs/FEEDBACK_SETUP.md](docs/FEEDBACK_SETUP.md)。已部署 Cloudflare Worker、私人 R2、D1 額度與30天清除規則，接收網址由 GitHub 建置變數設定。

### 2026.10.15.3 回報配額

接收器加入全站每日200筆的 D1 原子額度，依台灣時間00:00重置，額度服務故障時停止收件。保留每IP每分鐘5次限制及私人桶30天清除。此為回報數量上限，不是帳戶費用上限；Cloudflare 資源繫結與正式實測狀態見接收服務文件。

黑畫面檢查以 64 × 36 縮圖中至少 98% 像素的 RGB 均不超過 12 作提醒；深色場景可能誤判，也無法偵測所有凍結或無效畫面。零解析度、未解碼影像與 PNG 編碼失敗會顯示錯誤。分享權限由瀏覽器管理，不能永久記住；停止或重整後需再次授權。

## 第二階段：盤面辨識與手動修正

1. 不開遊戲也可按「載入測試圖片」。這張本專案自製的圖用四角校準標記定位，再讀取種類／品質色碼；**只是定位、切格、資料管線的測試，不是遊戲圖示辨識**。
2. 可載入16 MB內的PNG／JPEG／WebP，圖片解碼後縮至最長1600px處理。實際遊戲、非盤面、黑圖、未支援圖示不會猜囚犯。真實遊戲自動定位與模板識別留待取得可靠樣本。
3. 拖曳框選或輸入左／上／寬／高百分比，按「套用選區辨識」。目前幾何是暫定6×4邊框16位置，中央不放格子；位置1是否辦公室仍保留來源差異。
4. 點任意位置修改未知／封閉／空格／囚犯／事件、四獸種類、品質與標記。象獅狼鼠SVG為原創線條圖示。全局欄位可修改典獄長、當前／剩餘天數、巡視候選、刑具、資源與已收容囚犯。
5. 空白表示未知；清單欄位填「無」表示明確空清單，JSON使用null與[]區分。手動修正不填偽造的影像信心值。
6. 按「確認整個盤面」表示已人工核對，不會把未知欄位補成已知。修改／匯入後須重新確認。
7. 展開JSON區域匯出下載，或貼上JSON／載入檔案再匯入。JSON只含盤面資料、來源與暫定布局版本，不含截圖。驗證版本、16個唯一位置、座標、enum、數值界限及一致性；壞資料不覆蓋舊盤面。範例為 [原創測試JSON](public/examples/test-board.json)。

新截圖、載入圖片或重新辨識會重設盤面，請先匯出要保留的人工修正。圖片、盤面皆只存目前分頁記憶體；關閉／重整清除，下載的JSON檔則由使用者保管。不讀遊戲日誌、不監控全域鍵盤、不定時擷取或辨識。

預設保守規則只列出人工確認的巡視選項，不宣稱剩餘次數或最佳步。可選兩種互相矛盾的實驗食物鏈，比較同品質／克制條件；有刑具、特殊事件或未知標記時不輸出簡化吞食候選，亦不模擬連鎖。每日限制、位置例外與結果概率尚未確認，始終提示「尚無可靠策略建議」。

研究：[GAME_RULES.md](docs/GAME_RULES.md)、[SOURCES.md](docs/SOURCES.md)。所有已確認／暫定／未知均分開記錄；第三方模擬器程式與圖像未複製，未確認散布權的影片畫格僅留本機且不提交。

## 第二階段新增／修改檔案

- `src/board/model.ts`、`json.ts`：與UI獨立的盤面模型、原始值與來源、嚴格JSON邊界。
- `src/board/rules.ts`：保守候選、隔離的實驗食物鏈、第三階段求解器介面。
- `src/board/BoardEditor.tsx`、`BoardWorkspace.tsx`、`BeastIcon.tsx`、`board.css`：外圈棋盤、全局修正、JSON、選區與原創圖示。
- `src/recognition/raster.ts`、`image.ts`：純像素測試協定、定位／切格、圖片解碼及過期請求取消。
- `src/App.tsx`、`src/SiteInfo.tsx`：沿用既有分享hook，單次快照接辨識，更新教學與隱私內容。
- `src/test/board.test.ts`、`recognition.test.ts`、`editor.test.tsx`、`image.test.ts`：資料／規則／圖片／編輯／匯入匯出與競態測試。
- `public/examples/test-board.json`、`docs/`、`TEST_RESULTS.md`、`.gitignore`：原創範例、研究與驗收紀錄；保護本機研究畫格。

未修改第一階段 `src/capture/` 串流生命週期；既有分享／截圖回歸測試保留。正式遊戲盤面識別、透視校準、工具模板、規則與掉落數值、雙瀏覽器實機測試均待開季驗證。Monte Carlo／MCTS尚未實作。

## 開發

需要 Node.js 22.13+ 與 pnpm 11.25.0。

```sh
corepack enable
corepack prepare pnpm@11.25.0 --activate
pnpm install --frozen-lockfile
pnpm dev
pnpm run typecheck
pnpm test
pnpm run build
pnpm preview
```

開啟終端機印出的 localhost 網址。`pnpm test` 執行 Vitest + Testing Library：測試手動觸發、重試、中斷、停止、資源釋放及黑畫面/無效畫格。瀏覽器授權、作業系統與真實遊戲擷取仍須手動驗證。

## GitHub 與 Pages 部署

已建立公開 [GitHub Repository](https://github.com/xlox123456789/TEST14)，並發布至 [GitHub Pages 正式網站](https://xlox123456789.github.io/TEST14/)。Pages 使用 GitHub Actions 部署，HTTPS 已啟用，正式入口載入與重新整理已驗證。後續更新提交並推送至 main 即自動驗證與部署。

以下為其他帳號重建部署的步驟：

1. 登入 GitHub，建立 **Public** Repository，例如 `TEST14`。為避免合併衝突，不要先產生 README / .gitignore。
2. 本地完成提交後，連接遠端並推送（將帳號與 Repository 換成真實值）：

```sh
git add .
git commit -m "Implement phase-one screen capture assistant"
git remote add origin https://github.com/YOUR_ACCOUNT/TEST14.git
git push -u origin main
```

3. Repository → Settings → Pages → Build and deployment → Source 選 **GitHub Actions**。確認 Actions 可執行且 `github-pages` environment 允許 main 部署。
4. 若首次推送的部署因 Pages 尚未啟用而失敗，設定完後在 Actions 重新執行 workflow。
5. 等待 `Validate and deploy Pages` 的 build 與 deploy 成功，從 deployment environment 開啟實際 URL。預設是 `https://YOUR_ACCOUNT.github.io/TEST14/`。在 Settings → Pages 確認 HTTPS。

Workflow 在 main push 或手動觸發時安裝鎖定依賴、型別檢查、測試、建置，全部成功後才部署。PR 只做驗證，不部署。`VITE_BASE_PATH` 根據 repository 名稱設定子路徑；`*.github.io` repository 使用 `/`。自訂網域則需將建置 base 改為 `/`。本機測試子路徑可設 `VITE_BASE_PATH=/TEST14/` 後建置，並以 `pnpm preview --base /TEST14/` 開啟相同路徑。

本站只有單一入口，沒有 history router 或不存在的子路由；在正式網站根路徑重新整理會繼續取得 index.html，不需 SPA 404 workaround。網址必須含正確 repository 路徑。

## 架構與後續擴充

- `src/capture/frame.ts`：按需畫格擷取、PNG 編碼與黑畫面提醒。
- `src/capture/useScreenCapture.ts`：授權、串流生命週期、非同步競態處理與快照資源管理。
- `src/App.tsx` / `styles.css`：繁體中文深色介面與未開放功能區。
- `src/test/`：單元及 UI 流程測試。
- `.github/workflows/pages.yml`：驗證與 Pages 部署。

後續可在獨立模組加入 OpenCV.js、棋盤模型、策略介面、GitHub JSON 策略更新、20 天最佳化、對局紀錄及 i18n；目前不載入或執行這些功能。極速、綺彩、收益、自訂按鈕均停用。

## 手動驗收（目前未驗證）

在正式 HTTPS 網站，以 Chrome 與 Edge 分別測試：

| 情境 | 驗證重點 |
| --- | --- |
| 主螢幕遊戲、副螢幕助手 | 授權後多次点击截圖皆為當前畫面 |
| 遊戲前景 / 背景 | 切回助手後截圖是否更新或被系統凍結 |
| 無邊框 / 全螢幕 / 視窗模式 | 解析度與畫面內容正確；黑畫面可提示及重試 |
| 遊戲最小化 | 確認平台行為，不能把凍結畫格視為已驗證成功 |
| 取消選擇、瀏覽器停止分享 | 顯示訊息並能重新授權 |
| 停止、重新分享、頁面重新整理 | 舊來源釋放，按鈕狀態正確，根路徑不 404 |
| Network 面板 | 截圖點擊沒有新增上傳請求 |

這些結果受 GPU、作業系統與遊戲呈現模式影響，mock 測試無法代替實機結果。

技術依據：[MDN Screen Capture API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API)、[getDisplayMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia)、[GitHub Pages 自訂 workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。
