import { useEffect, useId, useRef, useState } from 'react';
import { BeastIcon } from './BeastIcon';
import { RARITIES, rarityNames, SPECIES, speciesNames, STATES, stateNames, updateCell, type Board, type Cell } from './model';
import { MARKERS } from './mechanics';

export function BoardEditor({board,onChange,disabled=false,recommendedTarget=null,showConfirm=true}: {board:Board;onChange:(board:Board)=>void;disabled?:boolean;editing?:boolean;recommendedTarget?:number|null;showConfirm?:boolean}) {
  const [selected,setSelected]=useState<number|null>(null), root=useRef<HTMLDivElement>(null), popup=useId();
  const cell=board.cells.find(c=>c.id===selected);
  useEffect(()=>{const close=(e:PointerEvent)=>{if(!root.current?.contains(e.target as Node))setSelected(null);};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);},[]);
  const patch=(value:Partial<Pick<Cell,'state'|'species'|'rarity'|'markers'|'event'|'revealedRarity'|'nestDays'>>)=>{if(selected&&selected!==1)onChange(updateCell(board,selected,value));};
  const symbols={unknown:'?',locked:'▣',empty:'—',nest:'⌂',event:'!',office:'▤'};
  return <div className="board-editor">
    <div ref={root} className="prison-ring" role="group" aria-label="監獄外圈棋盤" onKeyDown={e=>{if(e.key==='Escape')setSelected(null);}}>
      {board.cells.map(c=>{
        const state=c.id===1?'office':c.state;
        return <button type="button" key={c.id} disabled={disabled} aria-label={`格子 ${c.id} ${stateNames[state]}`} aria-pressed={c.id===selected} aria-expanded={c.id===selected} aria-controls={c.id===selected?popup:undefined}
          className={`prison-cell ${c.id===selected?'selected':''} ${c.id===recommendedTarget?'recommended':''} rarity-${c.rarity??'unknown'} ${c.id===1?'office-cell':''}`} style={{gridRow:c.row+1,gridColumn:c.column+1}} onClick={()=>setSelected(c.id)}>
          <small>{String(c.id).padStart(2,'0')}{board.warden===c.id?' ◆':''}{board.patrolOptions?.includes(c.id)?' ↗':''}{c.id===recommendedTarget?' ★':''}</small>
          {state==='prisoner'?<BeastIcon species={c.species}/>:<span className="cell-symbol">{symbols[state]}</span>}
          <span>{state==='prisoner'?c.species?speciesNames[c.species]:'種類未知':stateNames[state]}</span>
          {state==='prisoner'&&<span className="cell-tier">{c.rarity?rarityNames[c.rarity]:'品質未知'}</span>}
        </button>;
      })}
      <div className="courtyard">典獄長：{board.warden??'未知'}<br/>◆ 所在位置　↗ 今日門牌<br/>★ 推薦位置</div>
      {cell&&<div id={popup} role="dialog" aria-label={`修正格子 ${cell.id}`} className={`cell-editor-popover ${cell.column<3?'align-left':'align-right'}`} style={cell.row<2?{top:`${(cell.row+1)*25}%`}:{bottom:`${(4-cell.row)*25}%`}}>
        <div className="popover-heading"><strong>{String(cell.id).padStart(2,'0')} 號{cell.id===1?'辦公室':''}</strong><button type="button" className="quiet" aria-label="關閉格子編輯" onClick={()=>setSelected(null)}>×</button></div>
        <fieldset disabled={disabled}>
          {cell.id===1?<p className="compact-hint">辦公室不放囚犯、巢穴或事件。</p>:<>
            <label>狀態<select value={cell.state} onChange={e=>patch({state:e.target.value as Cell['state']})}>{STATES.filter(s=>s!=='office').map(s=><option value={s} key={s}>{stateNames[s]}</option>)}</select></label>
            {cell.state==='prisoner'&&<div className="decision-fields"><label>野獸種類<select value={cell.species??''} onChange={e=>patch({species:e.target.value as Cell['species']||null})}><option value="">未知</option>{SPECIES.map(s=><option key={s} value={s}>{{mammoth:'猛獁象',lion:'獅子',wolf:'狼',rat:'老鼠'}[s]}（{speciesNames[s]}）</option>)}</select></label><label>稀有度<select value={cell.rarity??''} onChange={e=>patch({rarity:e.target.value as Cell['rarity']||null})}><option value="">未知</option>{RARITIES.map(r=><option key={r} value={r}>{rarityNames[r]}</option>)}</select></label></div>}
            {cell.state==='nest'&&<label>巢穴剩餘天數<input type="number" min="0" max="99" value={cell.nestDays??''} placeholder="未知" onChange={e=>patch({nestDays:e.target.value===''?null:Math.max(0,Math.min(99,Number(e.target.value)))})}/></label>}
            {cell.state==='event'&&<label>事件名稱<input maxLength={200} value={cell.event??''} onChange={e=>patch({event:e.target.value||null})}/></label>}
            <div className="marker-options"><label className="inline-check"><input type="checkbox" checked={cell.markers!==null&&cell.markers.length===0} onChange={e=>patch({markers:e.target.checked?[]:null})}/>確認無特殊標記</label>
              {MARKERS.map(m=><label key={m.id} className="inline-check"><input type="checkbox" checked={cell.markers?.includes(m.id)??false} onChange={e=>patch({markers:e.target.checked?[...new Set([...(cell.markers??[]),m.id])]:(cell.markers??[]).filter(x=>x!==m.id)})}/>{m.name}</label>)}</div>
            {cell.state==='locked'&&cell.markers?.includes('scratch')&&<label>門上已揭露品質<select value={cell.revealedRarity??''} onChange={e=>patch({revealedRarity:e.target.value as Cell['rarity']||null})}><option value="">未知</option>{RARITIES.map(r=><option value={r} key={r}>{rarityNames[r]}</option>)}</select></label>}
          </>}
          <button type="button" className="secondary" onClick={()=>onChange({...board,warden:cell.id,reviewedAt:null})}>設為典獄長位置</button>
          <label className="inline-check"><input type="checkbox" checked={board.patrolOptions?.includes(cell.id)??false} onChange={e=>onChange({...board,patrolOptions:e.target.checked?[...new Set([...(board.patrolOptions??[]),cell.id])]: (board.patrolOptions??[]).filter(id=>id!==cell.id),reviewedAt:null})}/>今日可選巡邏門</label>
        </fieldset>
      </div>}
    </div>
    {showConfirm&&<><div className="board-actions"><button type="button" className="secondary" disabled={disabled} onClick={()=>{setSelected(null);onChange({...board,reviewedAt:new Date().toISOString()});}}>確認整個盤面</button></div>
    <p role="status" className="compact-hint">{board.reviewedAt?'盤面已確認；未知資訊不補值。':'盤面待確認；點格子修正。'}</p></>}
  </div>;
}
