# 原創影片測試素材

由本專案 scripts/generate-video-fixtures.ts 產生，圖片與影片素材採 CC0-1.0 提供。沒有第三方遊戲圖像、音訊或程式素材。

- original-board.mp4 / original-board.webm：同一份3秒、30FPS人工色碼素材的兩種編碼，不能視為兩份獨立遊戲樣本。
- 0–1秒：frame-0.png，expected-before.json。
- 1–2秒：frame-1.png，expected-after.json（位置2由lion改成rat，只是人工測試變化，不宣稱合法吞食）。
- 2–3秒：frame-2.png，無效黑畫面，應保持未知。
- JSON 是手工列出的已知欄位，未知內容不補值。影片壓縮可能使色碼辨識失敗；應保留錯誤並計入結果。

真實遊戲影片樣本數：0。所有準確率僅反映原創工程樣本，無法推出遊戲辨識率。

browser-webm-dataset.json是瀏覽器實際解碼WebM後保存的2張影格、1筆前後操作記錄，僅含上述原創素材，可在影片測試區匯入再執行回歸。獨立expected-before／after.json用於檢查其25+25個已知欄位；未知格與規則不補值。
