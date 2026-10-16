import { useScreenCapture } from './capture/useScreenCapture';
import { SiteInfo } from './SiteInfo';
import { BoardWorkspace } from './board/BoardWorkspace';
import './board/board.css';
import { Analytics } from './analytics/AnalyticsBootstrap';
import { ThemeToggle } from './ThemeToggle';
import { releases } from './releases';
import './theme.css';

export default function App() {
  const { videoRef, supported, status, capturing, error, snapshot, start, stop, capture } = useScreenCapture();
  const sharing = status === 'sharing';
  return <div className="app">
    <header><a className="brand" href="#"><span className="brand-mark">T</span><span>塔羅斯<small>TORCHLIGHT: INFINITE · SS14</small></span></a><div className="header-tools"><SiteInfo onStartShare={start} shareDisabled={!supported || status === 'requesting'} sharing={sharing} /><span className="phase">PHASE 02 <i/> 盤面辨識與修正</span><ThemeToggle /></div></header>
    <main>
      <Analytics />
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
          <button className="primary" disabled={!sharing || capturing} onClick={capture}><span>⌗</span> {capturing ? '正在擷取…' : '分析棋盤'} <small>截圖並嘗試本機辨識</small></button>
          <p className="privacy">◇ 截圖在本機處理；只有同意並確認錯誤回報才會外傳該次圖片與盤面。</p>
        </section>
        <BoardWorkspace snapshot={snapshot} />
      </div>
      <footer className="site-footer"><span><time dateTime={releases[0].date}>{releases[0].date.replaceAll('-', '/')}</time> 夏烏拉</span><div><a href="https://github.com/xlox123456789/TEST14" target="_blank" rel="noopener noreferrer">GITHUB頁面</a><a href="https://github.com/xlox123456789/TEST14/discussions/categories/%E6%84%8F%E8%A6%8B%E5%8F%8D%E9%A5%8B%E5%8D%80" target="_blank" rel="noopener noreferrer">意見反饋區</a></div></footer>
    </main>
  </div>;
}

