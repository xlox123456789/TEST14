import { useScreenCapture } from './capture/useScreenCapture';
import { SiteInfo } from './SiteInfo';

export default function App() {
  const { videoRef, supported, status, capturing, error, snapshot, start, stop, capture } = useScreenCapture();
  const sharing = status === 'sharing';
  return <div className="app">
    <header><a className="brand" href="#"><span className="brand-mark">T</span><span>Tartarus <b>Planner</b><small>TORCHLIGHT: INFINITE · SS14</small></span></a><span className="phase">PHASE 01 <i/> 截圖功能驗證</span></header>
    <main>
      <SiteInfo />
      <div className="intro"><p className="eyebrow">你的副螢幕，下一步的起點</p><h1>看清棋盤，<span>再做決定。</span></h1><p>分享遊戲視窗，手動擷取當前畫面。第一階段專注截圖，AI 分析尚未開放。</p></div>
      <div className="workspace">
        <section className="panel capture-panel"><div className="panel-heading"><h2><span className="step">01</span> 遊戲畫面</h2><span className={`status ${sharing ? 'active' : ''}`}><i/>{sharing ? '分享中' : status === 'requesting' ? '等待授權' : '尚未分享'}</span></div>
          <div className="instructions"><span>↗</span><div><strong>主螢幕玩遊戲，副螢幕開啟助手</strong><p>按「開始分享」，在瀏覽器視窗選擇器中選取火炬遊戲視窗。分享期間可重複截圖。</p></div></div>
          <div className="actions"><button onClick={start} disabled={!supported || status === 'requesting'} className="secondary">{status === 'requesting' ? '等待選擇來源…' : sharing ? '重新分享' : '開始分享'}</button><button onClick={stop} disabled={status === 'idle'} className="quiet">停止分享</button></div>
          {!supported && <p className="notice" role="alert">需要 HTTPS 與支援 Screen Capture API 的 Chrome / Edge。本機請使用 localhost。</p>}
          {error && <p className="notice error" role="alert">{error}</p>}
          <video ref={videoRef} muted playsInline className="capture-source" aria-hidden="true" />
          <div className="preview">{snapshot ? <img src={snapshot.url} alt="最近一次手動擷取的遊戲畫面"/> : <div className="empty"><span className="viewfinder">⌗</span><h3>等待第一張棋盤截圖</h3><p>開始分享後，點擊下方按鈕擷取畫面</p><span className="empty-tag">僅在你點擊時截圖</span></div>}</div>
          <div className="capture-meta"><span>{snapshot ? `擷取於 ${snapshot.capturedAt.toLocaleString('zh-TW', { hour12: false })}` : '尚無截圖'}</span><span>{snapshot ? `${snapshot.width} × ${snapshot.height} px` : '— × — px'}</span></div>
          {snapshot?.warning && <p className="notice" role="status">{snapshot.warning}</p>}
          <button className="primary" disabled={!sharing || capturing} onClick={capture}><span>⌗</span> {capturing ? '正在擷取…' : '分析棋盤'} <small>第一階段：僅截圖</small></button>
          <p className="privacy">◇ 截圖僅在瀏覽器記憶體中處理，不上傳伺服器；重新整理即清除。</p>
        </section>
        <aside><section className="panel"><div className="panel-heading"><h2><span className="step">02</span> 策略選擇</h2><span className="soon">尚未開放</span></div><p className="muted">為下一階段預留的策略模式</p><div className="strategies">{[['⚡','極速','效率優先'],['✦','綺彩','色彩策略'],['◈','收益','回報優先'],['⊞','自訂','你的打法']].map(([icon,name,desc]) => <button key={name} disabled><span>{icon}</span><strong>{name}</strong><small>{desc}</small></button>)}</div></section>
          <section className="panel ai-panel"><div className="panel-heading"><h2><span className="step">03</span> AI 推薦</h2><span className="soon">尚未開放</span></div><div className="ai-empty"><span>✧</span><h3>策略建議，即將到來</h3><p>本階段不進行棋盤辨識或 AI 分析。<br/>截圖成功後，請直接檢查左側預覽。</p></div></section>
          <section className="tip"><h3>擷取小提醒</h3><p>遊戲最小化、全螢幕獨佔模式或受保護畫面可能造成黑畫面。建議先測試無邊框視窗模式，並保持遊戲視窗開啟。</p><p>授權由瀏覽器管理；停止分享或重新整理後，需要再次選擇來源。</p></section>
        </aside>
      </div>
      <footer><span>Tartarus Planner <b>·</b> SS14</span><span>本機處理 / 無後端 / 手動截圖</span></footer>
    </main>
  </div>;
}
