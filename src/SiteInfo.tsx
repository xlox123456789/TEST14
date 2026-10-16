import { useRef } from 'react';
import { currentVersion, releases } from './releases';

export function SiteInfo({ onStartShare, shareDisabled, sharing }: { onStartShare: () => Promise<void>; shareDisabled: boolean; sharing: boolean }) {
  const tutorial = useRef<HTMLDialogElement>(null);
  const privacy = useRef<HTMLDialogElement>(null);
  const versions = useRef<HTMLDialogElement>(null);
  function closeOnBackdrop(event: React.MouseEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.currentTarget.close();
  }
  return <nav className="site-info" aria-label="網站資訊">
    <button className="info-trigger" onClick={() => versions.current?.showModal()}>版號 {currentVersion}</button>
    <dialog ref={versions} className="info-modal" aria-labelledby="versions-title" onClick={closeOnBackdrop}>
      <div className="modal-heading"><h2 id="versions-title">版本紀錄</h2><button onClick={() => versions.current?.close()} aria-label="關閉版本紀錄">×</button></div>
      <div className="info-content"><p>舊紀錄依 Git 提交整理，標示「補登」的版號為回補紀錄，並非既有發布標籤。</p>
        {releases.map(release => <article key={release.version}><h3>{release.version} {release.backfilled && '（補登）'}</h3><time dateTime={release.date}>{release.date}</time><p>{release.notes}</p></article>)}
      </div>
    </dialog>
    <button className="info-trigger" onClick={() => tutorial.current?.showModal()}>教學</button>
    <button className="info-trigger" onClick={() => privacy.current?.showModal()}>免責聲明與隱私權</button>
    <a className="kofi-link" href="https://ko-fi.com/louissu" target="_blank" rel="noopener noreferrer">☕ Ko-fi <span>支持開發 ↗</span></a>
    <dialog ref={tutorial} className="info-modal" aria-labelledby="tutorial-title" onClick={closeOnBackdrop}>
      <div className="modal-heading"><h2 id="tutorial-title">教學</h2><button onClick={() => tutorial.current?.close()} aria-label="關閉教學">×</button></div>
      <div className="info-content">
        <p className="eyebrow">快速開始</p><h2>分享畫面與截圖</h2>
        <ol>
          <li><strong>開啟遊戲與網站</strong><p>使用 Chrome 或 Edge 開啟本站。可在主螢幕玩遊戲、副螢幕操作助手。</p></li>
          <li><strong>分享遊戲視窗</strong><p>點「開始分享」，在瀏覽器選擇器切到「視窗」，選取 Torchlight: Infinite，再點「分享」。</p><p className="notice"><strong>請確認只選取遊戲視窗，避免分享其他私人內容。</strong></p><button className="secondary" disabled={shareDisabled} onClick={() => { tutorial.current?.close(); void onStartShare(); }}>{sharing ? '重新分享畫面' : '開始分享畫面'}</button></li>
          <li><strong>擷取當前畫面</strong><p>狀態變成「分享中」後，點「分析棋盤」，顯示預覽並嘗試本機辨識。遊戲模板不足的內容會保留未知；可手動框選外圈並修正格子。再次點擊會更新截圖與盤面，請先匯出要保留的修改。</p></li>
          <li><strong>修正與分析盤面</strong><p>直接點任意格子，在附近小選單修正狀態、動物、品質與標記，也可設定典獄長與今日巡邏門。01號是辦公室，不放囚犯。棋盤下方選擇持有刑具（沒有時請確認無刑具），核對目前階段、剩餘天數與當天可用操作，再按「確認整個盤面」。右欄顯示參考模型建議與最多兩個備選，棋盤以星號標示推薦位置。刑具可隨時增減並重新分析；每次遊戲操作後請重新截圖核對。</p></li>
          <li><strong>停止或更換來源</strong><p>點「停止分享」結束串流；「重新分享」可更換視窗。停止分享或重新整理後，需要再次授權。</p></li>
        </ol>
        <p className="notice">如果截圖全黑或未更新，請讓遊戲保持開啟、避免最小化，嘗試無邊框視窗模式後重新分享。</p>
      </div>
    </dialog>
    <dialog ref={privacy} className="info-modal" aria-labelledby="privacy-title" onClick={closeOnBackdrop}>
      <div className="modal-heading"><h2 id="privacy-title">免責聲明與隱私權</h2><button onClick={() => privacy.current?.close()} aria-label="關閉免責聲明與隱私權">×</button></div>
      <div className="info-content">
        <p className="eyebrow">更新日期：2026-10-16</p>
        <h2>隱私權政策</h2>
        <section className="privacy-summary" aria-labelledby="privacy-summary-title"><h3 id="privacy-summary-title">簡單版</h3><p>本站不需要註冊，沒有帳號系統，不會蒐集你的姓名、遊戲帳號、電子郵件等個人隱私資料。遊戲截圖、影片與盤面辨識都在你的瀏覽器本機處理，不會自動上傳，也不傳給 AI 服務。本站會直接啟用 GA4 統計瀏覽與操作，Google 可能使用 Cookie、連線及裝置資料。只有你主動同意並送出錯誤回報，才會傳送該次完整圖片與盤面；請先確認圖片沒有私人內容。</p></section>
        <h3>截圖與盤面存在哪裡</h3><p>截圖、載入的圖片及盤面只保留在目前分頁的記憶體，重新整理或關閉後清除。不使用 sessionStorage、localStorage 或 Cookie 儲存截圖。首頁不提供JSON匯入／匯出與影片測試；本機圖片載入與辨識都在瀏覽器處理。深色／淺色偏好會存於自己瀏覽器的 localStorage，只記住顯示模式。</p>
        <h3>流量分析 · Google Analytics 4</h3><p>正式站開啟後會直接載入 GA4，不另外顯示分析同意視窗，用於統計頁面瀏覽、分享、截圖、辨識結果、人工修正次數、影片匯入／影格分析及成功回報等操作。僅傳送事件類型、成功或失敗、模式、修正格數、處理時間與工具版號；不包含圖片、影片、盤面 JSON、附件、玩家姓名／帳號、視窗名稱、檔名或路徑。策略分析只傳送請求事件，不傳送盤面或建議內容。</p>
        <p>Google 可能透過 Cookie、連線及裝置資料統計造訪，這不是完全無識別資訊的服務；本站未啟用 Google signals、廣告個人化或加強型自動互動評估。分析 Cookie 最長設定30天。不再儲存或讀取舊版的分析同意選擇。若要停用本次頁面的統計，可在網址加上 ?no_analytics=1 重新開啟，也可使用瀏覽器的 Cookie／追蹤封鎖設定；停用不影響其他功能，亦不會刪除先前已傳送的統計。開發、本機、一般自動化測試與加上 no_analytics 參數的頁面不追蹤。明確啟用的正式站偵錯使用 debug_mode，供 DebugView 驗證。</p>
        <h3>自願回報辨識錯誤</h3><p>只有在回報視窗勾選同意並確認送出後，才會將該次完整圖片、原始辨識盤面、目前修正盤面、選區與工具版號傳到維護者管理的 Cloudflare Worker 與私人 R2 儲存桶，供改善辨識。請先檢查圖片中的角色名稱、聊天與私人內容。未設定接收服務時無法送出；不會自動改成公開 GitHub Issue，也不要求使用者登入 GitHub。回報不公開，設定於上傳滿30天後自動清除，實際清除時間依 Cloudflare 排程。接收服務以 IP 限流但不將 IP 寫入回報檔；D1 僅保存每日總筆數以執行全站每日200筆額度。Cloudflare 仍可能依其服務政策處理連線資料。送出後不能由本頁撤回，資料問題請聯絡維護者並提供回報時間及收據編號。</p>
        <p>GA4 一般可能使用 Cookie 與裝置／瀏覽器相關資料衡量網站使用情形；不應將它描述為完全不涉及識別資訊。詳見 <a href="https://support.google.com/analytics/answer/6004245" target="_blank" rel="noopener noreferrer">Google 的資料保護說明</a>。</p>
        <h3>網站託管與外部服務</h3><p>本站由 GitHub Pages 託管。開啟網站仍會向託管服務請求網頁與靜態檔案，服務供應商可能依自己的政策處理連線資料。詳見 <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer">GitHub 隱私權聲明</a>。</p>
        <p>Ko-fi 是外部贊助平台。只有點擊連結才會前往，本站沒有嵌入 Ko-fi 追蹤元件；在 Ko-fi 的付款、Cookie 與資料處理由該平台負責。</p>
        <h3>廣告與資料用途</h3><p>本站目前沒有 AdSense 或其他廣告，不販售、交換或出租截圖資料，不建立使用者輪廓，也不發送郵件。</p>
        <h3>政策異動與聯絡</h3><p>政策更新會直接公布於本頁。使用問題或隱私疑問，請至 <a href="https://github.com/xlox123456789/TEST14/issues" target="_blank" rel="noopener noreferrer">GitHub Issues</a> 提出；Issues 是公開的，請勿附上私人資料或敏感截圖。</p>
        <h2>免責聲明</h2>
        <p>本站是玩家製作的非官方工具，與《火炬之光：無限》的開發商、發行商或營運團隊沒有隸屬關係。遊戲名稱與相關商標屬其各自權利人。</p>
        <p>目前提供畫面分享、手動截圖、本機辨識與盤面修正。真實遊戲圖示模板與正式規則尚未充分驗證，未知欄位須人工核對；推薦依公開參考模型與可見資料評估，規則與機率仍待驗證，不是正式服合法性或最佳策略保證。擷取可能受瀏覽器、作業系統、顯示卡與遊戲模式影響，本站不保證帶來特定遊戲收益。</p>
      </div>
    </dialog>
  </nav>;
}
