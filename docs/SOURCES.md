# 第二階段來源與查閱範圍

查閱日2026-10-15。所有「已確認」僅指來源或畫面足以證明的該事實；不代表正式服全規則已驗證。前次影片與時間戳台帳見 [research/video-sources.md](research/video-sources.md)。

| ID | 網址 | 語言／取得內容 | 可信度與限制 |
| --- | --- | --- | --- |
| P01 | [官方SS14更新日誌](https://torchlight.xd.com/ss14pn/?lang=zh-TW) | 要求繁中URL；本次文字擷取實際回傳簡中，保留此差異；含10/14補充條目 | 官方文字已確認，補充條目優先；沒有完整盤面像素規格 |
| P02 | [英文官方日誌](https://torchlight.xd.com/ss14pn?lang=en) | 英文搜尋可讀開季公告與更新 | 官方；本次不以其他語系時間推翻中文公告 |
| P03 | [英文模擬器](https://blahdot3h.github.io/tartarus-simulator/) | 前次研究已閱讀來源README及原作者影片；本次結合原始碼說明核對 | 民間練習模型，暫定；不複製原始碼／資產 |
| P04 | [英文原始庫README](https://github.com/blahdot3h/tartarus-simulator) | 讀布局、patrol／swap／devour、兩種克制模型、練習值聲明 | 作者對自己模型的第一手說明，不是遊戲官方規則；目前main並非鎖定前瞻當日版本 |
| P05 | [中文模擬器](https://torchlightskill.com/talos/) | 一般web工具讀取失敗，改用瀏覽器：作者聲明、起始頁、玩法手冊「公開文字明確的規則」 | 網站明示玩家自製，隨機／耗日用練習參數，12日合約為原創；即使手冊章名聲稱明確，本站仍將其遊戲規則分類暫定 |
| P06 | [前瞻回放](https://www.bilibili.com/video/BV1fQpb6zE9S/) | 官方帳號，2026-10-09；前次抽樣04:13、04:26、05:42、10:00，AI中文字幕 | 部分畫格直接支持UI；沒有看完／沒有完整逐字稿 |
| P07 | [圓桌會談&試玩](https://www.bilibili.com/video/BV1VRpm6nEzn/) | 官方帳號，2026-10-14；前次核對metadata與開頭 | **未能驗證影片實際玩法段落**；不假稱完整觀看 |
| P08 | [演示切片](https://www.bilibili.com/video/BV1svpm6PExy/) | 高远寒，2026-10-14；前次01:34刑具、01:47外圈、02:39決策UI | 有限演示，非獨立實測；版權未確認，不隨網站公開散布截圖 |
| P09 | [CoffeeBns原片](https://www.youtube.com/watch?v=BYO4wMcf5jQ) | 2026-10-13；前次取得完整英文自動字幕；00:12–01:28模型限制、01:32–02:00吞食／換、05:24再次承認概率未知 | 可證明作者建議與限制，不證明遊戲正式數據；不散布完整字幕 |
| P10 | [17173前瞻](https://news.17173.com/content/10112026/143712170.shtml) | 簡中，2026-10-11；同品質／克制摘要 | 媒體二手整理，暫定 |
| P11 | [火炬編年史](https://tlidb.com/tw/Tartarus_Season) | 繁中入口含簡中玩法摘要，20天／終局 | 社群資料，暫定；不是官方 |
| P12 | [TapTap前瞻討論](https://www.taptap.cn/moment/856202385536584986) | 簡中，獸核／追隨者背景 | 玩家整理；未提供可重現日流程，不作吞食次數依據 |
| P13 | [Reddit官方預告討論](https://www.reddit.com/r/TorchlightInfinite/comments/1woqfc1/tartarus_season_teaser_torchlight_infinite/) | 英文搜尋頁摘要，多為期待與評論 | 未找到可核對20天正式服樣本，不用評論代替實測 |
| P14 | [engine.js](https://raw.githubusercontent.com/blahdot3h/tartarus-simulator/main/js/engine.js)／[solver.js](https://raw.githubusercontent.com/blahdot3h/tartarus-simulator/main/js/solver.js) | 直接讀取公開原始檔；engine明列16位置／辦公室、可調的日限制與兩種克制、工具及機率參數 | 模擬實作只能證明該模型設定，不能證明正式遊戲概率；只讀研究，未下載執行或複製程式 |

研究中的重要差異：中文模型聲稱16間牢房，英文模型留1格辦公室；中文六條克制与英文單鏈四條不同。兩者均非官方，保留兩種實驗設定，不選其一當正式推薦。其他候選六彩影片的標題也不當作辨識或收益證據。

## 素材與授權處理

- 本次沒有下載或複製第三方模擬器程式、囚犯圖像、聲音或模板。
- 過去留在 `docs/research/evidence/` 的兩張影片畫格僅作本機研究。沒有確認公開散布權，因此本次Git提交明確排除該目錄；文件改用影片時間戳供查證。
- 網站測試圖由 `makeTestRaster` 原創產生，四角定位與色碼是測試協定，不是遊戲特徵；四獸線條SVG由本專案新繪。
- 不提供真實圖示辨識率、沒有聲稱在正式服測試；自製樣本測試僅驗證工程流程。

## 新增研究與既有研究

本次重新閱讀優先來源、中文手冊與官方補充日誌；前次影片抽樣未重播全文。詳細演算法推論沿用研究文件並與遊戲證據分開。任何未知都可回到 [GAME_RULES](GAME_RULES.md) 的驗證清單，不以工具生成的JSON自證正確。
