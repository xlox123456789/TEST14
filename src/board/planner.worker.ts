import { planBoard } from './planner';
import type { Board } from './model';
self.onmessage=(event:MessageEvent<Board>)=>{self.postMessage(planBoard(event.data));};
