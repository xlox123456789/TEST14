import { PHASES, type Board, type Phase } from './model';
import { EVENTS } from './planner';
import { ToolPicker } from './ToolPicker';
const names:Record<Phase,string>={unknown:'請選擇目前階段',patrol:'選擇巡邏門',manage:'巡邏後：吞噬／換囚',chain:'連鎖吞噬選目標',event:'特殊事件：接受／拒絕',office:'辦公室：賜予／煽動',tool:'正在選擇新刑具',ended:'對局已結束'};
export function DecisionControls({board,onChange}:{board:Board;onChange:(board:Board)=>void}) {
  const patch=(value:Partial<Board>)=>onChange({...board,...value,reviewedAt:null});
  return <section className="decision-controls" aria-label="目前決策資訊">
    <div className="decision-fields"><label>目前階段<select value={board.phase??'unknown'} onChange={e=>patch({phase:e.target.value as Phase})}>{PHASES.map(p=><option key={p} value={p}>{names[p]}</option>)}</select></label>
      <label>剩餘天數<input type="number" min="0" max="99" placeholder="未知" value={board.daysRemaining??''} onChange={e=>patch({daysRemaining:e.target.value===''?null:Math.max(0,Math.min(99,Math.floor(Number(e.target.value))))})}/></label></div>
    {board.phase==='manage'&&<div className="decision-fields">{(['swapsRemaining','devoursRemaining'] as const).map(key=><label key={key}>{key==='swapsRemaining'?'今日換囚':'今日吞噬'}<select value={board[key]??''} onChange={e=>patch({[key]:e.target.value===''?null:Number(e.target.value)})}><option value="">尚未確認</option><option value="1">仍可使用</option><option value="0">已使用／不能使用</option></select></label>)}</div>}
    {board.phase==='patrol'&&<><p className="compact-hint">點格子勾選今日門牌：{board.patrolOptions===null?'未確認':board.patrolOptions.map(id=>String(id).padStart(2,'0')).join('、')||'無'}；典獄長：{board.warden??'未知'}</p><label className="inline-check"><input type="checkbox" checked={board.chainActive===true} onChange={e=>patch({chainActive:e.target.checked})}/>已確認觸發連鎖巡邏</label></>}
    {board.phase==='event'&&<label>目前事件<select value={board.eventKind??''} onChange={e=>patch({eventKind:e.target.value||null})}><option value="">未知，請核對事件</option>{EVENTS.map(([id,name])=><option key={id} value={id}>{name}（參考譯名）</option>)}</select></label>}
    {board.phase==='tool'&&<ToolPicker title="候選刑具" value={board.offeredTools??null} onChange={offeredTools=>patch({offeredTools})}/>}
  </section>;
}
