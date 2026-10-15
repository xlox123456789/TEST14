import { useState } from 'react';
import { BeastIcon } from './BeastIcon';
import { createBoard, evidence, RARITIES, rarityNames, SPECIES, speciesNames, STATES, stateNames, updateCell, type Board } from './model';
import { parseBoardJSON } from './json';

export function BoardEditor({ board, onChange, disabled = false, editing = true }: { board: Board; onChange: (b: Board) => void; disabled?: boolean; editing?: boolean }) {
  const [selected, setSelected] = useState(1);
  const [error, setError] = useState('');
  const cell = board.cells.find(c => c.id === selected)!;
  const patch = (value: Parameters<typeof updateCell>[2]) => onChange(updateCell(board, selected, value));
  function applyGlobal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    try {
      const form = new FormData(event.currentTarget);
      const get = (key: string) => String(form.get(key) ?? '').trim();
      const number = (key: string) => get(key) === '' ? null : Number(get(key));
      const list = (key: string, numeric = false) => get(key) === '' ? null : get(key) === '無' ? [] : get(key).split(/[,，]/).map(v => numeric ? Number(v.trim()) : v.trim());
      const values = { warden: number('warden'), currentDay: number('currentDay'), daysRemaining: number('daysRemaining'), patrolOptions: list('patrolOptions', true), tools: list('tools'),
        resources: get('resources') ? JSON.parse(get('resources')) : null, collected: get('collected') ? JSON.parse(get('collected')) : null };
      const next = parseBoardJSON(JSON.stringify({ ...board, ...values }));
      for (const [key, val] of Object.entries(values)) next.fieldEvidence[key] = val === null ? evidence() : evidence('manual', '使用者輸入');
      onChange(next);
    } catch (e) { setError(e instanceof Error ? e.message : '欄位格式錯誤'); }
  }
  return <div className="board-editor">
    <p className="muted">暫定外圈布局：6×4 邊框，共16個位置；中央不是牢房。{editing ? '修正模式：點任意格子修正。空白代表未知，「無」代表已確認沒有。' : '檢視模式：按「修正盤面」後即可修改格子與全局欄位。'}</p>
    <div className="prison-ring" role="group" aria-label="監獄外圈棋盤">
      {board.cells.map(c => <button type="button" key={c.id} disabled={disabled} aria-label={`格子 ${c.id} ${stateNames[c.state]}`} aria-pressed={c.id === selected}
        className={`prison-cell ${c.id === selected ? 'selected' : ''} rarity-${c.rarity ?? 'unknown'}`} style={{ gridRow: c.row + 1, gridColumn: c.column + 1 }} onClick={() => setSelected(c.id)}>
        <small>{c.id.toString().padStart(2, '0')}{board.warden === c.id ? ' ◆' : ''}{board.patrolOptions?.includes(c.id) ? ' ↗' : ''}</small>
        {c.state === 'prisoner' ? <BeastIcon species={c.species} /> : <span className="cell-symbol">{{ unknown: '?', locked: '▣', empty: '—', event: '!' }[c.state]}</span>}
        <span>{c.state === 'prisoner' ? c.species ? speciesNames[c.species] : '種類未知' : stateNames[c.state]}</span>
      </button>)}
      <div className="courtyard">典獄長：{board.warden ?? '未知'}<br/>◆ 所在位置　↗ 可巡視<br/><small>位置1暫定辦公室</small></div>
    </div>
    {editing && <fieldset disabled={disabled} className="cell-form"><legend>修正格子 {selected}</legend>
      <label>狀態<select value={cell.state} onChange={e => patch({ state: e.target.value as typeof cell.state })}>{STATES.map(s => <option key={s} value={s}>{stateNames[s]}</option>)}</select></label>
      {cell.state === 'prisoner' && <><label>野獸種類<select value={cell.species ?? ''} onChange={e => patch({ species: e.target.value as typeof cell.species || null })}><option value="">未知</option>{SPECIES.map(s => <option key={s} value={s}>{speciesNames[s]}</option>)}</select></label>
        <label>稀有度<select value={cell.rarity ?? ''} onChange={e => patch({ rarity: e.target.value as typeof cell.rarity || null })}><option value="">未知</option>{RARITIES.map(r => <option key={r} value={r}>{rarityNames[r]}</option>)}</select></label></>}
      {cell.state === 'event' && <label>事件名稱<input value={cell.event ?? ''} maxLength={200} onChange={e => patch({ event: e.target.value || null })} /></label>}
      <label>特殊標記（逗號分隔；無＝空清單）<input value={cell.markers === null ? '' : cell.markers.length ? cell.markers.join(',') : '無'} maxLength={200} onChange={e => patch({ markers: !e.target.value ? null : e.target.value === '無' ? [] : e.target.value.split(/[,，]/) })} /></label>
    </fieldset>}
    <p className="provenance">狀態來源：{cell.evidence.state.source} · 信心：{cell.evidence.state.confidence === null ? '未評估' : `${cell.evidence.state.confidence * 100}%（僅測試色碼）`}<br/>種類：{cell.evidence.species.source}／品質：{cell.evidence.rarity.source}。人工修正不偽造辨識信心。</p>
    {editing && <details><summary>全局欄位與其他資源</summary>
      <form key={JSON.stringify([board.warden, board.currentDay, board.daysRemaining, board.patrolOptions, board.tools, board.resources, board.collected])} onSubmit={applyGlobal}>
        <fieldset disabled={disabled} className="global-form">
          <label>典獄長位置（1–16）<input name="warden" type="number" min="1" max="16" defaultValue={board.warden ?? ''} /></label>
          <label>當前天數<input name="currentDay" type="number" min="1" max="999" defaultValue={board.currentDay ?? ''} /></label>
          <label>剩餘天數<input name="daysRemaining" type="number" min="0" max="999" defaultValue={board.daysRemaining ?? ''} /></label>
          <label>可巡視位置（例如 2,3,5）<input name="patrolOptions" defaultValue={board.patrolOptions?.length === 0 ? '無' : board.patrolOptions?.join(',') ?? ''} /></label>
          <label>持有刑具（逗號分隔）<input name="tools" defaultValue={board.tools?.length === 0 ? '無' : board.tools?.join(',') ?? ''} /></label>
          <label>資源 JSON（例如 {`{"刷新次數":1}`}）<textarea name="resources" defaultValue={board.resources === null ? '' : JSON.stringify(board.resources)} /></label>
          <label>已收容囚犯 JSON（未知留白；確認沒有填 []）<textarea name="collected" placeholder={'[{"species":"rat","rarity":"rainbow"}]'} defaultValue={board.collected === null ? '' : JSON.stringify(board.collected)} /></label>
          <button className="secondary" type="submit">套用全局欄位</button>
        </fieldset>
      </form>
    </details>}
    {error && <p className="notice error" role="alert">{error}</p>}
    <div className="board-actions"><button className="secondary" disabled={disabled} onClick={() => onChange({ ...board, reviewedAt: new Date().toISOString() })}>確認整個盤面</button>
      {editing && <button className="quiet" disabled={disabled} onClick={() => onChange(createBoard())}>建立全未知盤面</button>}</div>
    <p role="status" className="muted">{board.reviewedAt ? '盤面已確認（未知欄位仍是未知；修改後須重新確認）' : '盤面待確認；暫不提供操作候選'}</p>
  </div>;
}
