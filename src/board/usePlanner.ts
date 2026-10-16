import { useEffect, useState } from 'react';
import type { Board } from './model';
import { planBoard, type Plan } from './planner';
import { track } from '../analytics/analytics';
export function usePlanner(board:Board) {
  const [result,setResult]=useState<{board:Board;plan:Plan}|null>(null);
  useEffect(()=>{
    let alive=true,worker:Worker|undefined;
    const publish=(plan:Plan)=>{if(alive)setResult({board,plan});};
    const fallback=()=>publish(planBoard(board));
    if(board.reviewedAt) track('strategy_requested',{analysis_mode:'screenshot'});
    if(!board.reviewedAt||typeof Worker==='undefined') fallback();
    else try {
      worker=new Worker(new URL('./planner.worker.ts',import.meta.url),{type:'module'});
      worker.onmessage=(e:MessageEvent<Plan>)=>publish(e.data);
      worker.onerror=()=>{worker?.terminate();if(alive)fallback();};
      worker.postMessage(board);
    } catch {fallback();}
    return()=>{alive=false;worker?.terminate();};
  },[board]);
  return {plan:result?.board===board?result.plan:null,pending:result?.board!==board};
}
