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
# 2026-10-15 · 2026.10.15.2／2026.10.15.3

- TypeScript 型別檢查通過；62 項自動測試通過（含原有45項）。
- 新測試涵蓋修正模式、四獸顯示名稱、同意前零傳送、未設定端點停用、傳送成功／失敗、拒絕非本機圖片、HTTPS 限制。
- Worker 以模擬 R2 測試收件雙檔、CORS／方法限制、限流、資料格式／圖片檔頭與同意驗證，以及不完整寫入清理。這不是 Cloudflare 正式整合測試。
- 本機瀏覽器實際驗證原創測試圖、四獸名稱、進入／退出修正模式、回報二次確認、未設定服務提示、版本視窗與補登歷史紀錄。
- 網站正式建置與 Worker 單檔建置通過。
- 真實 SQLite 測試同日250次申請只有200次成功，次日重新計數；台灣午夜邊界測試通過。
- 真實 Cloudflare D1 用獨立測試鍵驗證199→200成功，下一筆無更新且仍為200；不占用當日正式額度。測試鍵 integration-limit-check 保留作驗證紀錄。
- 已透過 Wrangler 部署 Worker，核對 R2／D1／Rate Limiter 繫結與已啟用的30天到期清除規則。真實遊戲再次分享仍需人工測試。
- 正式站 2026.10.15.3 的匿名回報已實際送出成功（未登入 GitHub 收件流程，不經 Issues）；收據 `11c15675-187e-4fc5-ade7-a8ecb67fe7e6`。
- 從私人 R2 讀回980×740 PNG（29,473 bytes）及 JSON，確認16格、版本、synthetic 標記、原始格2 lion 與修正後 rat 各自保存。真實 D1 當日計數為1。測試回報保留供核對，依30天規則到期清除。
- GitHub Actions run 38676056150 的 build／deploy 均 Success，正式頁面顯示 2026.10.15.3，回報收據已保存為驗證畫面。

## 2026-10-15 · 2026.10.15.4

- TypeScript型別檢查通過；12個測試檔、81項測試通過（保留原分享、手動截圖、錯誤回報與D1額度測試）。
- 新增GA4同意、拒絕、白名單、去重與環境排除測試；影片格式、時間、盤面差異、JSON往返／非法資料、已知欄位計分與明確點擊才擷取的UI測試。
- 本機瀏覽器實際匯入MP4／WebM、選0.5與1.5秒並手動擷取；WebM外圈16位置符合獨立預期JSON，已知欄位50/50。MP4校準失敗保持未知，未隱藏失敗案例。純像素三尺寸75/75是同一色碼協定測試，不是遊戲準確率。
- 實際保存2張標註、1筆前後操作，匯出並重新匯入JSON，重跑資料集回歸；瀏覽器產物public/fixtures/browser-webm-dataset.json可重現，僅含原創素材。0段真實遊戲影片，實戰辨識率未知。
- GA4真實資源559072703、G-XD85CB7TMV已建立，Webstream16132135406；加強型評估關閉，使用者同意後建立有效的開發流量排除篩選器。正式站事件與部署驗證會補登實際結果。

### 正式發布後補驗證

- Commit [87646bb](https://github.com/xlox123456789/TEST14/commit/87646bbd93d75f2b7acc3e89f27fca555e9b2d79) 的 [Actions #11](https://github.com/xlox123456789/TEST14/actions/runs/38692751585) build33秒／deploy10秒成功；正式HTTPS頁面顯示2026.10.15.4。
- GA4 DebugView實際收到page_view、video_imported、board_analysis_requested、board_recognition_completed、video_frame_analyzed、manual_correction_saved、error_report_submitted、board_recognition_failed，共8種網站事件；即時總覽顯示1瀏覽、1活躍使用者及對應事件。Google額外自動事件first_visit／session_start亦可見。
- 正式WebM手動影格0.5秒成功辨識；第二格獅人工修正為鼠後完成修正；原創測試回報收據b87383fd-35be-47f0-9a13-4dcd901474ea。2.5秒黑畫面辨識全未知，發送failed結果，無虛構成功。
- 實際同意前Google script數0；撤回後0，後續操作不追加追蹤；同頁重新同意未新增page_view。結束恢復拒絕及無debug參數正式網址。
- GA4開發流量篩選「有效」已確認，但官方說明可能需24–36小時生效，本次即時報表仍顯示QA；一般報表最終排除尚未驗證。
- 標註PNG下載已通過，原先data URL下載等待未完成，改為Blob URL後成功下載並檢查畫面。
- 本次未重新在正式站擷取實際遊戲視窗，因此capture_started／capture_completed／capture_failed只有程式接線與自動化回歸，未確認本次GA4後台收件。正式開服樣本、多解析度實戰、刑具／連鎖／升階機率、收益與最佳策略仍未知。

### 最終像素回歸補強

增加node:zlib讀取已存瀏覽器PNG影格的測試輔助程式（僅測試端，可信原創素材限定），每次CI直接重跑目前recognizeRaster並比對獨立的before／after標註，兩張25/25。不是僅比較舊辨識JSON。最終12個測試檔共83項通過，型別檢查通過；新增測試不改變網站執行期或辨識演算法。

## 2026-10-16 · 2026.10.16.1

依維護者要求改為正式站自動啟用GA4，移除分析設定／同意提示，不再讀寫舊同意選擇。保留事件白名單、單次page_view、本機／一般自動化排除與?no_analytics=1停用入口。錯誤回報仍需要獨立勾選同意。

隱私簡單版整段改為18px粗體、淺綠文字及邊框，標題22px；文字具體說明不收集姓名／遊戲帳號／郵件、GA4技術統計與完整回報圖片例外，避免宣稱Google完全不處理識別資料。

型別檢查、83項測試及正式建置通過。分析測試改驗證直接啟用、舊拒絕設定不影響新版、重複初始化不重複瀏覽、敏感參數不外傳與環境排除。

正式頁面已確認2026.10.16.1、無分析同意按鈕，自動載入G-XD85CB7TMV並產生1次page_view；免責聲明實際顯示淺綠色粗體放大的簡單版區塊。
