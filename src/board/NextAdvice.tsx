import type { Plan } from './planner';
import { AnimalRelations } from './AnimalRelations';
export function NextAdvice({plan,pending,tools}:{plan:Plan|null;pending:boolean;tools:string[]|null}) {
  return <section className="panel suggestions-panel" aria-label="下一步建議">
    <div className="panel-heading"><h2><span className="step">03</span> 下一步建議</h2><span className="soon">參考模型</span></div>
    <p className="compact-hint">規則、機率與中文譯名待正式服驗證；每次操作後請重新核對盤面。</p>
    {pending?<p role="status">正在分析目前盤面…</p>:plan?.best?<>
      <h3>最佳建議</h3><p className="best-advice">{plan.best.title}</p>
      <h3>推薦原因</h3><ul className="advice-reasons">{plan.best.reasons.slice(0,3).map(reason=><li key={reason}>{reason}</li>)}</ul>
      {plan.limited&&<p className="compact-hint">盤面組合較多，此次採有限連鎖展望；建議並非完整最佳解。</p>}
      {!!plan.alternatives.length&&<><h3>其他選項</h3><ol className="advice-alternatives">{plan.alternatives.map((item,i)=><li key={i}><strong>{item.title}</strong><span>{item.reasons[0]}</span></li>)}</ol></>}
    </>:<><p className="notice">尚無可靠策略建議</p><ul>{plan?.blockedBy.map(reason=><li key={reason}>{reason}</li>)}</ul></>}
    <AnimalRelations tools={tools}/>
  </section>;
}
