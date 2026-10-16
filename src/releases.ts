// 新增重大功能時，必須在最前面補上日期、版號與使用者可理解的摘要。
// 歷史日期依 Git 提交回補；回補版號不是既有 Git tag。
export const releases = [
  { version: '2026.10.16.6', date: '2026-10-16', notes: '右上角深色／淺色切換並記住偏好；底部顯示更新日期與夏烏拉署名，加入GitHub及意見反饋討論區入口。', backfilled: false },
  { version: '2026.10.16.5', date: '2026-10-16', notes: '點格小選單、17種刑具搜尋與管理、階段限定的參考模型建議及連鎖展望；共用四獸循環關係，標示推薦格子。', backfilled: false },
  { version: '2026.10.16.4', date: '2026-10-16', notes: '主標題改為塔羅斯；右欄加入四獸圖像關係示意，依提供範例顯示兩條箭頭。', backfilled: false },
  { version: '2026.10.16.3', date: '2026-10-16', notes: '首頁改為寬版三欄，響應式切換兩欄／單欄；移除首頁JSON與影片測試工具，免責聲明移至隱私視窗底部。', backfilled: false },
  { version: '2026.10.16.2', date: '2026-10-16', notes: '盤面修正、回報與圖片載入集中右上角；移除盤面上方描述，影片測試移至棋盤下方。', backfilled: false },
  { version: '2026.10.16.1', date: '2026-10-16', notes: '正式站直接啟用 GA4，移除分析同意提示；隱私簡單版整段放大、加粗及換色，明確說明資料範圍。', backfilled: false },
  { version: '2026.10.15.4', date: '2026-10-15', notes: 'GA4 同意與停用控制、匿名事件；本機影片回放、影格標註、操作前後紀錄及辨識回歸資料集。', backfilled: false },
  { version: '2026.10.15.3', date: '2026-10-15', notes: '匿名回報接收服務：私人儲存、30天清除、每IP限流與全站每日200筆額度（台灣時間重置）。', backfilled: false },
  { version: '2026.10.15.2', date: '2026-10-15', notes: '四獸名稱更新、獨立修正模式、辨識錯誤回報介面與版本紀錄。', backfilled: false },
  { version: '2026.10.15.1', date: '2026-10-15', notes: '第二階段：盤面資料模型、測試圖片辨識、手動編輯、JSON 匯入匯出與規則研究。', backfilled: true },
  { version: '2026.10.14.4', date: '2026-10-14', notes: '移除介紹區文字；教學加入分享按鈕與私人內容提醒。', backfilled: true },
  { version: '2026.10.14.3', date: '2026-10-14', notes: '教學、免責聲明與 Ko-fi 移至頂部；說明改為浮動視窗。', backfilled: true },
  { version: '2026.10.14.2', date: '2026-10-14', notes: '專案改名 TEST14，更新 GitHub Pages 網址；加入教學、隱私說明與 Ko-fi。', backfilled: true },
  { version: '2026.10.14.1', date: '2026-10-14', notes: '第一階段：遊戲視窗分享、手動單張截圖、預覽、錯誤處理與自動部署。', backfilled: true },
] as const;
export const currentVersion = releases[0].version;
