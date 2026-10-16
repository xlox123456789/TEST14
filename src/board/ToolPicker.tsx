import { useState } from 'react';
import { TOOLS, toolById } from './tools';

export function ToolPicker({value,onChange,title='持有刑具'}:{value:string[]|null;onChange:(value:string[])=>void;title?:string}) {
  const [query,setQuery]=useState(''),[open,setOpen]=useState(false);
  const selected=value??[];
  return <section className="tool-picker" aria-label={title}>
    <div className="tool-picker-heading"><h3>{title}</h3><span title="依公開模擬器整理，中文譯名、機率與正式服效果待驗證">名稱／數值待驗證</span></div>
    <div className="tool-tags">{selected.map(id=><button type="button" className="tool-tag" key={id} title={toolById(id)?.effect} aria-label={`移除${title}：${toolById(id)?.name??id}`} onClick={()=>onChange(selected.filter(t=>t!==id))}>{toolById(id)?.name??id} <span aria-hidden="true">×</span></button>)}
      {value===null?<button type="button" className="quiet" onClick={()=>onChange([])}>{title==='持有刑具'?'確認沒有刑具':'確認沒有候選'}</button>:!selected.length&&<span className="muted">無</span>}
    </div>
    <div className="tool-search"><input aria-label={`搜尋${title}`} placeholder="搜尋刑具名稱或效果" value={query} onFocus={()=>setOpen(true)} onChange={e=>{setQuery(e.target.value);setOpen(true);}} />
      <button type="button" className="quiet" aria-expanded={open} onClick={()=>setOpen(!open)}>{open?'收合':'選擇'}</button></div>
    {open&&<ul className="tool-options" aria-label={`${title}選項`}>{TOOLS.filter(t=>`${t.name} ${t.english} ${t.effect}`.toLowerCase().includes(query.toLowerCase())).map(t=><li key={t.id}><button type="button" disabled={selected.some(id=>toolById(id)?.id===t.id)} onClick={()=>{onChange([...selected,t.id]);setQuery('');setOpen(false);}}><strong>{t.name}</strong><span>{t.effect}</span></button></li>)}</ul>}
  </section>;
}
