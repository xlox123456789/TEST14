# 第一階段測試結果

執行日期：2026-10-14。環境：Windows、Node.js 24.19.0、pnpm 11.25.0。

| 項目 | 結果 |
| --- | --- |
| `pnpm install --frozen-lockfile` | 通過 |
| `pnpm run typecheck` | 通過 |
| `pnpm test` | 2 個測試檔、15 項測試全部通過 |
| `VITE_BASE_PATH=/torchlight-infinite-ss14-tartarus-planner/ pnpm run build` | 通過，輸出 dist |
| 本機正式建置子路徑 | 初始版本瀏覽器載入 `/talos-ai-assistant/` 成功；更名後建置資產路徑已更新為 `/torchlight-infinite-ss14-tartarus-planner/` |
| 本機子路徑重新整理 | 初始版本成功，介面及按鈕狀態正確；新名稱路徑待正式部署驗證 |
| GitHub 遠端與 Pages | 未發布；建立 Repository 頁面導向 GitHub 登入畫面 |

自動化涵蓋：未分享時禁止截圖、分享後未點擊不截圖、點擊擷取與更新、Blob URL 釋放、取消授權後重試、分享中斷後重新授權、重新分享釋放舊串流、手動停止、擷取錯誤、HTTPS / API 支援檢查、停止後才回傳的授權結果、未解碼/零解析度畫格、PNG 編碼失败、黑畫面提醒與常見授權錯誤訊息。

測試使用 mock MediaStream 與 canvas 驗證邏輯，沒有將模擬畫面宣稱為實際遊戲截圖。

尚未驗證：Chrome / Edge 真實分享選擇器、火炬遊戲前景/背景/最小化/無邊框/全螢幕模式、雙螢幕操作、正式 HTTPS 網站擷取、GitHub Actions 遠端執行、Pages 正式網址與 HTTPS、正式網站重新整理。請依 README 手動驗收表執行。

本機 Windows 沙箱限制 esbuild 讀取父目錄，測試與建置以獲准的沙箱外命令完成。GitHub Actions 將使用 Ubuntu / Node.js 22，遠端執行結果仍待首次推送確認。
