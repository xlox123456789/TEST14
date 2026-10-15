# 第一階段測試結果

## 第二階段補充（2026-10-15）

- 型別檢查與 `/TEST14/` 正式建置通過。
- 6個測試檔、45項測試通過，包含原本15項分享／截圖回歸；`src/capture/` 沒有修改。
- 新測試涵蓋外圈16位置、未知／null、人工修正清除舊囚犯資訊與取消確認、JSON round-trip、重複ID／非法座標／錯誤enum／越界數值／無效可信度／版本／大小限制、實驗規則隔離、三種尺寸自製圖定位與切格、黑圖／損壞校準、無效ROI、外部圖片URL拒絕、取消舊解碼、編輯／匯入／匯出與過期辨識結果保護。
- 本機瀏覽器實際測試：測試圖載入→未知格修改為象／綺彩→確認→匯出→清空→匯入還原；匯入後正確要求重新確認。自製圖標記／全局欄位維持未知。
- 自製圖通過不是遊戲圖示辨識率；目前真實圖片沒有可靠模板，會保留未知，須手動框選／編輯。沒有宣稱正式服最佳策略。
- 正式服圖示樣本、不同透視／UI縮放、Chrome／Edge真實分享完整回歸、P0日限制／連鎖／刑具等仍待驗證，見 `docs/GAME_RULES.md`。
- 正式站部署結果以本次 GitHub Actions 及交付訊息為準；以下保留第一階段歷史紀錄。

## 第一階段歷史紀錄

執行日期：2026-10-14。環境：Windows、Node.js 24.19.0、pnpm 11.25.0。

使用者於 2026-10-14 回報正式站實機測試成功，附件顯示選取 Torchlight: Infinite 遊戲視窗後取得 1762 × 1022 px 截圖，預覽、分享狀態與時間正常。尚未明確確認的模式仍列於下方。

| 項目 | 結果 |
| --- | --- |
| `pnpm install --frozen-lockfile` | 通過 |
| `pnpm run typecheck` | 通過 |
| `pnpm test` | 2 個測試檔、15 項測試全部通過 |
| `VITE_BASE_PATH=/torchlight-infinite-ss14-tartarus-planner/ pnpm run build` | 通過，輸出 dist |
| 本機正式建置子路徑 | 初始版本瀏覽器載入 `/talos-ai-assistant/` 成功；更名後建置資產路徑已更新為 `/torchlight-infinite-ss14-tartarus-planner/` |
| 本機子路徑重新整理 | 初始版本成功，介面及按鈕狀態正確 |
| GitHub 遠端與 Pages | 公開 Repository 已建立、main 推送成功，GitHub Actions build / deploy 成功 |
| 正式網站 HTTPS / 子路徑 / 重新整理 | 瀏覽器驗證成功，分享按鈕可用；未分享前截圖按鈕停用 |

Repository：https://github.com/xlox123456789/torchlight-infinite-ss14-tartarus-planner

正式網站：https://xlox123456789.github.io/torchlight-infinite-ss14-tartarus-planner/

首次成功部署：https://github.com/xlox123456789/torchlight-infinite-ss14-tartarus-planner/actions/runs/38550946373

自動化涵蓋：未分享時禁止截圖、分享後未點擊不截圖、點擊擷取與更新、Blob URL 釋放、取消授權後重試、分享中斷後重新授權、重新分享釋放舊串流、手動停止、擷取錯誤、HTTPS / API 支援檢查、停止後才回傳的授權結果、未解碼/零解析度畫格、PNG 編碼失败、黑畫面提醒與常見授權錯誤訊息。

測試使用 mock MediaStream 與 canvas 驗證邏輯，沒有將模擬畫面宣稱為實際遊戲截圖。

尚未驗證：Chrome / Edge 真實分享選擇器、火炬遊戲前景/背景/最小化/無邊框/全螢幕模式、雙螢幕操作、正式 HTTPS 網站實際遊戲擷取。請依 README 手動驗收表執行。

本機 Windows 沙箱限制 esbuild 讀取父目錄，測試與建置以獲准的沙箱外命令完成。GitHub Actions 使用 Ubuntu / Node.js 22，遠端依賴安裝、型別檢查、測試、建置與部署已成功。
# 2026-10-15 · 2026.10.15.2

- TypeScript 型別檢查通過；59 項自動測試通過（含原有45項）。
- 新測試涵蓋修正模式、四獸顯示名稱、同意前零傳送、未設定端點停用、傳送成功／失敗、拒絕非本機圖片、HTTPS 限制。
- Worker 以模擬 R2 測試收件雙檔、CORS／方法限制、限流、資料格式／圖片檔頭與同意驗證，以及不完整寫入清理。這不是 Cloudflare 正式整合測試。
- 本機瀏覽器實際驗證原創測試圖、四獸名稱、進入／退出修正模式、回報二次確認、未設定服務提示、版本視窗與補登歷史紀錄。
- 網站正式建置與 Worker 單檔建置通過。
- 真實遊戲再次分享、Cloudflare R2 正式收件仍未完成驗證；R2 啟用有帳單及條款步驟，待帳戶擁有人操作。
