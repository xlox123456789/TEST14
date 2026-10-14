import { useRef } from 'react';

export function SiteInfo({ onStartShare, shareDisabled, sharing }: { onStartShare: () => Promise<void>; shareDisabled: boolean; sharing: boolean }) {
  const tutorial = useRef<HTMLDialogElement>(null);
  const privacy = useRef<HTMLDialogElement>(null);
  function closeOnBackdrop(event: React.MouseEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.currentTarget.close();
  }
  return <nav className="site-info" aria-label="網站資訊">
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
          <li><strong>擷取當前畫面</strong><p>狀態變成「分享中」後，點「分析棋盤」。目前只截圖，會顯示預覽、擷取時間與解析度，不會產生 AI 建議。再次點擊即可更新截圖。</p></li>
          <li><strong>停止或更換來源</strong><p>點「停止分享」結束串流；「重新分享」可更換視窗。停止分享或重新整理後，需要再次授權。</p></li>
        </ol>
        <p className="notice">如果截圖全黑或未更新，請讓遊戲保持開啟、避免最小化，嘗試無邊框視窗模式後重新分享。</p>
      </div>
    </dialog>
    <dialog ref={privacy} className="info-modal" aria-labelledby="privacy-title" onClick={closeOnBackdrop}>
      <div className="modal-heading"><h2 id="privacy-title">免責聲明與隱私權</h2><button onClick={() => privacy.current?.close()} aria-label="關閉免責聲明與隱私權">×</button></div>
      <div className="info-content">
        <p className="eyebrow">更新日期：2026-10-14</p><h2>免責聲明</h2>
        <p>本站是玩家製作的非官方工具，與《火炬之光：無限》的開發商、發行商或營運團隊沒有隸屬關係。遊戲名稱與相關商標屬其各自權利人。</p>
        <p>第一階段只提供畫面分享與手動截圖，尚未提供 AI 分析、棋盤辨識或策略推薦。擷取結果可能受瀏覽器、作業系統、顯示卡與遊戲視窗模式影響；黑畫面提醒僅供參考。請自行確認截圖內容，本站不保證可擷取所有畫面或帶來特定遊戲收益。</p>
        <h2>隱私權政策</h2>
        <h3>簡單版</h3><p>本站不需要註冊、不要求姓名或電子郵件，也沒有帳號系統。分享的遊戲畫面與截圖都在你自己的瀏覽器中處理，不會上傳給本站或 AI 服務。</p>
        <h3>截圖存在哪裡</h3><p>截圖僅保留在目前分頁的記憶體中，用來顯示最近一次預覽。更新截圖會釋放舊圖片；重新整理或關閉分頁後清除。不使用 sessionStorage、localStorage 或 Cookie 儲存截圖，目前也沒有圖片分享連結功能。</p>
        <h3>流量分析 · GA4 尚未啟用</h3><p>本站目前未載入 Google Analytics 4，也不會送出 GA4 分析事件或設定 GA4 Cookie。若未來啟用，會先更新本頁，說明收集的資料、用途與控制方式；遊戲畫面與截圖不會作為流量分析資料上傳。</p>
        <p>GA4 一般可能使用 Cookie 與裝置／瀏覽器相關資料衡量網站使用情形；不應將它描述為完全不涉及識別資訊。詳見 <a href="https://support.google.com/analytics/answer/6004245" target="_blank" rel="noopener noreferrer">Google 的資料保護說明</a>。</p>
        <h3>網站託管與外部服務</h3><p>本站由 GitHub Pages 託管。開啟網站仍會向託管服務請求網頁與靜態檔案，服務供應商可能依自己的政策處理連線資料。詳見 <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer">GitHub 隱私權聲明</a>。</p>
        <p>Ko-fi 是外部贊助平台。只有點擊連結才會前往，本站沒有嵌入 Ko-fi 追蹤元件；在 Ko-fi 的付款、Cookie 與資料處理由該平台負責。</p>
        <h3>廣告與資料用途</h3><p>本站目前沒有 AdSense 或其他廣告，不販售、交換或出租截圖資料，不建立使用者輪廓，也不發送郵件。</p>
        <h3>政策異動與聯絡</h3><p>政策更新會直接公布於本頁。使用問題或隱私疑問，請至 <a href="https://github.com/xlox123456789/TEST14/issues" target="_blank" rel="noopener noreferrer">GitHub Issues</a> 提出；Issues 是公開的，請勿附上私人資料或敏感截圖。</p>
      </div>
    </dialog>
  </nav>;
}
