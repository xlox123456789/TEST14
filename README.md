# Torchlight: Infinite SS14 — Tartarus Planner

《火炬之光：無限》的副螢幕網頁工具。第一階段只驗證畫面分享與手動截圖，**沒有 AI、棋盤辨識或策略推薦**。React + TypeScript + Vite，純靜態網站，不需要後端。

## 功能與使用

頂部提供分享／截圖教學、免責聲明與隱私權政策，以及 [Ko-fi 支持開發](https://ko-fi.com/louissu)。目前未啟用 GA4 或 AdSense；隱私政策依實際功能描述，不收集或上傳遊戲截圖。

1. 用 Chrome / Edge 開啟 HTTPS 網站（開發時 localhost 亦可）。
2. 主螢幕開啟遊戲、副螢幕開啟網站，按「開始分享」，由瀏覽器選取遊戲視窗。網站無法自動指定或保證來源就是火炬。
3. 授權後持續保留影像串流；按「分析棋盤」才將當前畫格轉成 PNG，顯示預覽、時間與解析度。
4. 重複點擊更新截圖；「停止分享」釋放串流，「重新分享」停止舊來源後重新授權。浏览器停止分享也會顯示提醒。

沒有定時截圖或持續分析。隱藏 video 只接收分享串流；canvas 僅在點擊時建立。截圖使用 Blob URL 留在瀏覽器記憶體，不上傳、不儲存至 localStorage；更新及離開頁面會釋放 URL，重新整理會清除截圖與分享授權。網站沒有遙測、外部字型或 API 請求。網站本身的靜態檔案仍會從 GitHub Pages 下載。

黑畫面檢查以 64 × 36 縮圖中至少 98% 像素的 RGB 均不超過 12 作提醒；深色場景可能誤判，也無法偵測所有凍結或無效畫面。零解析度、未解碼影像與 PNG 編碼失敗會顯示錯誤。分享權限由瀏覽器管理，不能永久記住；停止或重整後需再次授權。

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

已建立公開 [GitHub Repository](https://github.com/xlox123456789/torchlight-infinite-ss14-tartarus-planner)，並發布至 [GitHub Pages 正式網站](https://xlox123456789.github.io/torchlight-infinite-ss14-tartarus-planner/)。Pages 使用 GitHub Actions 部署，HTTPS 已啟用，正式入口載入與重新整理已驗證。後續更新提交並推送至 main 即自動驗證與部署。

以下為其他帳號重建部署的步驟：

1. 登入 GitHub，建立 **Public** Repository，例如 `torchlight-infinite-ss14-tartarus-planner`。為避免合併衝突，不要先產生 README / .gitignore。
2. 本地完成提交後，連接遠端並推送（將帳號與 Repository 換成真實值）：

```sh
git add .
git commit -m "Implement phase-one screen capture assistant"
git remote add origin https://github.com/YOUR_ACCOUNT/torchlight-infinite-ss14-tartarus-planner.git
git push -u origin main
```

3. Repository → Settings → Pages → Build and deployment → Source 選 **GitHub Actions**。確認 Actions 可執行且 `github-pages` environment 允許 main 部署。
4. 若首次推送的部署因 Pages 尚未啟用而失敗，設定完後在 Actions 重新執行 workflow。
5. 等待 `Validate and deploy Pages` 的 build 與 deploy 成功，從 deployment environment 開啟實際 URL。預設是 `https://YOUR_ACCOUNT.github.io/torchlight-infinite-ss14-tartarus-planner/`。在 Settings → Pages 確認 HTTPS。

Workflow 在 main push 或手動觸發時安裝鎖定依賴、型別檢查、測試、建置，全部成功後才部署。PR 只做驗證，不部署。`VITE_BASE_PATH` 根據 repository 名稱設定子路徑；`*.github.io` repository 使用 `/`。自訂網域則需將建置 base 改為 `/`。本機測試子路徑可設 `VITE_BASE_PATH=/torchlight-infinite-ss14-tartarus-planner/` 後建置，並以 `pnpm preview --base /torchlight-infinite-ss14-tartarus-planner/` 開啟相同路徑。

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
