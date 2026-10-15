# 研究摘要與下一步

研究日：2026-10-15。專案：Torchlight: Infinite SS14 — Tartarus Auto Planner。**這是前次僅研究任務的紀錄；當時未修改網站或推送發布。後續第二階段實作與更新研究請見 [GAME_RULES](../GAME_RULES.md) 及 [SOURCES](../SOURCES.md)。**

## 這次取得什麼

- 已核對兩部指定官方帳號影片的標題、作者與發布日期；前瞻片作少量玩法／寶箱畫格抽樣，圓桌片只抽樣開頭，沒有宣稱完整觀看。
- 找到玩家圓桌演示切片，保存01:47、02:39畫格；能核對上鎖牢房、目的地卡、剩餘天數與決策介面。
- 發現多部六彩、口枷、交換吞食與Demo攻略候選，另找到CoffeeBns模擬影片，從其原始YouTube來源取得並閱讀完整自動字幕。
- 未取得完整官方逐字稿、完整20天逐操作紀錄、可重現的正式服掉落資料。候選影片未能驗證實際內容的部分都有標示。

所有影片、查閱範圍、評論與搜尋紀錄見 [video-sources.md](video-sources.md)。

## 能確定的框架與不能確定的細節

官方公告預告10月16日開季，因此研究仍屬前瞻。[官方藍貼](https://torchlight.xd.com/ss14pn?lang=zh-CN)

前瞻摘要描述名牌進場→20天典獄培養→暴亂鎮壓→秘藏獎勵的框架。精確日內限制、全部克制／升階與工具條件、随机概率和寶箱EV仍未足够確認。[前瞻摘要](https://shouyou.gamersky.com/news/202610/2225220.shtml)

模型跑幾百萬次不代表規則正確。CoffeeBns承認尚有未知與演示差異，原片還討論未在前瞻看到的合約模式；模型資料必須隔離，不能輸入正式規則集。[原片](https://www.youtube.com/watch?v=BYO4wMcf5jQ&t=12s)

## 最佳化方向

先做合法性、轉移與獎勵模型研究，再比較Greedy、短Beam与固定預算MC；小局面用DP作精確對照。MCTS保留為候選，不預設最好；沒有敵手的隨機決策不直接套Minimax。這是設計建議，不是性能測試結果。

每次隨機升階、工具／事件或開門結果後重算下一步，避免承諾固定20天最優腳本。A每分鐘收益、B綺彩數與C可兌現獎勵是不同目標；沒有箱值與鎮壓成功率就不能宣稱綺彩最大等於收益最大。

## 可交付給未來策略引擎的內容

| 文件 | 用途 |
| --- | --- |
| [game-rules.md](game-rules.md) | 帶來源／版本與可信度的最小規則集，逐天未知表 |
| [strategy-analysis.md](strategy-analysis.md) | 12問題逐項回答、A/B/C目標與對照實驗 |
| [algorithm-analysis.md](algorithm-analysis.md) | 六種演算法比較、狀態與延遲研究方案 |
| [unknown-mechanics.md](unknown-mechanics.md) | P0/P1缺口、反例與實戰記錄計畫 |
| [rule-data-design.md](rule-data-design.md) | schema草案，區分stage／evidence與unknown |

下一次最重要的資料是：一局完整20天與鎮壓錄影、每個工具清晰tooltip、相同條件全部隨機結果、包含失败局的收益／耗時紀錄。未達這個門檻前，適合顯示「可能操作與假設」，不適合聲稱「最優解」。
