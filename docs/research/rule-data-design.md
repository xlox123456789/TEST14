# 未來規則資料結構（設計，不是實作）

全部欄位為候選schema，未建立程式、JSON資料檔或策略引擎。目標是讓來源、版本與未知值都可追蹤，而非將研究假設變成預設常數。

## RuleSet

| 欄位 | 概念型別／用途 |
| --- | --- |
| schema_version / ruleset_id | schema與規則集版本獨立 |
| season / region / build / effective_at | SS14、區服、build；未知可null，不用網站日期代替build |
| stage | preview / test / live / simulation-hypothesis |
| evidence_status | confirmed / empirically-supported / inferred / unknown；與stage分開 |
| horizon | 天數及計數語義；20為前瞻摘要，日切換機制另列證據 |
| rarity_catalog | 官方品質代碼、順序及綺彩判定；未核對時不填0..5 |
| species_catalog / devour_matrix | 種群及有向克制表，關係附條件／例外與證據 |
| phases / transitions | 合法phase、可做動作、日內次数、触发顺序、消耗與停止條件 |
| modifiers | 刑具／事件／綺彩效果，各有觸發、前提、持續、疊加、優先序 |
| stochastic_models | outcomes、distribution、sample_size、估計區間；未知不是均勻分布 |
| reward_model | 每品質箱EV、群轉箱、鎮壓成功、成本、耗時，附區服／估價日 |
| provenance | source_id、URL、timestamp_range、取得方式、版本適用性、反例 |
| validation | 是否允許正式建議、阻擋的未知ID、測試例／反例 |

每一條規則都帶獨立 `evidence`，不能整個ruleset只掛一個官方URL便宣稱所有數值已確認。

## BoardObservation 與 PlanningState

| 物件 | 欄位 |
| --- | --- |
| observation | 本地快照ID、時間、UI尺寸、day文字、phase、OCR信心與需人工核對欄位 |
| cell | cell_id、位置、locked/empty/occupied/unknown、囚犯代號／品質／標記、是否目前可吞提示 |
| player_context | 典獄長位置、當日候選目的地、行動剩餘次數、工具及刷新資源 |
| collected | 已離盤綺彩及效果、已點亮箱數；不要從版面槽位推上限 |
| uncertainty | 看不見或讀不準的欄位、可能值集合、是否有概率依據 |
| planning_state | observation與ruleset ID連結、剩餘期限、日內phase、歷史中影響未来的因素 |

禁止把unknown cell當empty；若同一字段來自tooltip、AI字幕與民間模型，应保留候选說法，不能合成一个「确认值」。

## Action／Transition／Recommendation

- Action：種類、作用囚犯／目的地／工具、前置條件、合法性證據、消耗。候選種類為巡邏、交換、吞食、選工具、刷新、接受／略過事件；每種仍須確認实际存在與順序。
- Transition：before_state、action、隨機結果、觸發序列、after_state、是否日切換、證據ID。連鎖內每次變化留event log。
- Objective：A收益/總時間、B綺彩數、C掉落EV；共同報風險与失败機率，不强行加總不同单位。
- Recommendation：候選行動、近似EV、區間、搜索预算、假設、未知規則、替代行動、觸發重算條件。若P0未知導致合法性無法判定，回傳「需核對」，不冒充最佳操作。

純設計示例：

```text
rule_id: devour.same_rarity
statement: 同品質是否為吞食必要條件
value: null  # 未達實作所需驗證門檻
candidate_value: true
stage: preview
evidence_status: inferred
sources: S02
verification_needed: U02
```

`null`与false不同；每個未驗證字段附blocking reason。未來測試資料至少覆盖非法行動、交換改變合法目標、連鎖途中隨機變化、綺彩離盤、最後日結與工具例外。
