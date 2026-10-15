# GA4 設定與驗證

更新：2026-10-15；版本2026.10.15.4。

- 帳戶：xlox123456789（403351982）。原有 Louis Git 資源屬其他網站，未更動。
- 新資源：Torchlight SS14 - Tartarus Planner（Property ID 559072703）。
- 時區：台灣 GMT+08；幣別：TWD；產業：遊戲；目標：流量及互動。
- Web stream：Tartarus Planner（16132135406）。
- 真實 Measurement ID：`G-XD85CB7TMV`，已存 GitHub Actions variable `VITE_GA_MEASUREMENT_ID`。
- [資源管理頁](https://analytics.google.com/analytics/web/#/a403351982p559072703/admin)
- 關閉 Enhanced Measurement，避免自動檔名、外連或影片事件。未建立 Firebase 或 Google Cloud 專案。
- TEST14 Developer Traffic 篩選器為「排除／有效」；使用者已明確同意永久排除未來 debug_mode 測試資料。DebugView 可查看開發事件；一般報表不計入此類測試流量。預設 Internal Traffic 仍為測試狀態，未任意設定 IP。

## 同意與資料範圍

使用者同意前不載入 gtag.js、不發送無 Cookie ping。拒絕不影響功能；可由「分析統計設定」撤回，設置 ga-disable 並清除本網站前綴的分析 Cookie。同意選擇存於 localStorage，圖片／影片／盤面只存分頁記憶體（下載的資料集由使用者保管）。

僅正式 HTTPS origin 且 `/TEST14/`、production build、有效 Measurement ID 啟用；本機、測試模式、webdriver 預設停用。`?no_analytics` 強制停用。`?analytics_debug=1` 是人工啟動的正式站 QA 模式，仍需同意，帶 debug_mode 並由 GA4 開發篩選器排除。

config 使用 send_page_view:false，僅一次手動 page_view；React StrictMode 或反覆切換同意不重複計數。page_location 固定為無參數正式網址，referrer 清空。關閉 Google Signals／廣告個人化；Cookie 限主機、/TEST14/、30天。GA4 仍會處理必要連線與裝置資訊，不能宣稱完全匿名或零個資。

自訂參數僅 app_version、operation_result、analysis_mode、correction_count、processing_time_ms。使用執行期白名單，絕不傳送原始錯誤、檔名、視窗名稱、圖片、影片、完整盤面或附件。

## 事件觸發條件

|事件|真實觸發條件|
|---|---|
|page_view|同意後當次頁面首次初始化|
|capture_started|取得分享串流並成功播放|
|capture_completed|手動螢幕截圖成功|
|capture_failed|螢幕或影片手動擷取失敗|
|board_analysis_requested|點擊手動截圖／影片擷取|
|board_recognition_completed|本機辨識結果至少有一格非未知|
|board_recognition_failed|全未知或非取消的處理錯誤|
|manual_correction_saved|完成修正且盤面實際有差異|
|video_imported|影片 metadata 解碼成功|
|video_frame_analyzed|手動影片影格辨識完成，success／failed如實標示|
|error_report_submitted|接收服務 HTTP 成功且回傳有效收件編號|

strategy_requested 尚未啟用；資料集回歸不偽造手動操作事件。標註載入、播放、拖動時間軸不截圖。

## 驗證界線

analytics.test.ts 驗證未同意、拒絕、撤回、重複瀏覽、敏感參數過濾、環境排除。正式站事件送達結果另見 TEST_RESULTS.md；網站 debug 面板僅表示事件進入 gtag 佇列，不能單獨證明 GA4 收到。

官方參考：[手動 page_view](https://developers.google.com/analytics/devguides/collection/ga4/views)、[隱私控制](https://developers.google.com/tag-platform/security/guides/privacy)、[開發流量篩選](https://support.google.com/analytics/answer/13296662)。
