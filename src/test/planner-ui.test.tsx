import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { createBoard, updateCell, type Board } from '../board/model';
import { officeBoard } from '../board/mechanics';
import { BoardEditor } from '../board/BoardEditor';
import { ToolPicker } from '../board/ToolPicker';
import { NextAdvice } from '../board/NextAdvice';
import { usePlanner } from '../board/usePlanner';
import { planBoard } from '../board/planner';
import { AnimalRelations } from '../board/AnimalRelations';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
function fixture():Board {let b=officeBoard(createBoard());b={...b,cells:b.cells.map(c=>c.id===1?c:{...c,state:'locked',markers:[]})};b=updateCell(b,2,{state:'prisoner',species:'wolf',rarity:'legendary',markers:[]});b=updateCell(b,3,{state:'prisoner',species:'rat',rarity:'rare',markers:[]});return {...b,phase:'manage',warden:2,daysRemaining:4,tools:[],swapsRemaining:0,devoursRemaining:1,reviewedAt:'2026-10-16'};}
function Harness(){const [board,setBoard]=useState(fixture);const {plan,pending}=usePlanner(board);return <><BoardEditor board={board} onChange={setBoard} recommendedTarget={plan?.best?.target}/><ToolPicker value={board.tools} onChange={tools=>setBoard({...board,tools})}/><NextAdvice plan={plan} pending={pending} tools={board.tools}/></>;}
it('adding and removing a tool recalculates the latest confirmed board and target highlight',async()=>{
  render(<Harness/>);await screen.findByText('結束今天');
  fireEvent.focus(screen.getByLabelText('搜尋持有刑具'));fireEvent.change(screen.getByLabelText('搜尋持有刑具'),{target:{value:'獠牙'}});
  fireEvent.click(screen.getByRole('button',{name:/^獠牙斷頭台/}));await screen.findByText('吞噬 03 號');
  expect(screen.getByRole('button',{name:'格子 3 囚犯'})).toHaveClass('recommended');
  fireEvent.click(screen.getByRole('button',{name:'移除持有刑具：獠牙斷頭台'}));await waitFor(()=>expect(screen.queryByText('吞噬 03 號')).not.toBeInTheDocument());
  expect(screen.getByText('結束今天')).toBeInTheDocument();
});
it('direct consecutive cell edits invalidate advice until confirmation and office stays special',async()=>{
  render(<Harness/>);await screen.findByText('結束今天');
  fireEvent.click(screen.getByRole('button',{name:'格子 3 囚犯'}));expect(screen.getByRole('dialog',{name:'修正格子 3'})).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('稀有度'),{target:{value:'legendary'}});
  await screen.findByText('請先確認盤面。');fireEvent.click(screen.getByRole('button',{name:'格子 4 封閉'}));
  fireEvent.change(screen.getByLabelText('狀態'),{target:{value:'nest'}});expect(screen.getByRole('button',{name:'格子 4 老鼠巢穴'})).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'格子 1 典獄長辦公室'}));expect(screen.queryByLabelText('狀態')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'確認整個盤面'}));await screen.findByText('吞噬 03 號');
});
it('the relation chart contains all four shared edges plus the conditional rat self-loop',()=>{
  const {container,rerender}=render(<AnimalRelations tools={[]}/>);
  expect(container.querySelectorAll('.relation-arrows>path')).toHaveLength(4);
  rerender(<AnimalRelations tools={['skewer']}/>);expect(container.querySelectorAll('.relation-arrows>path')).toHaveLength(5);
  expect(screen.getByText(/僅同品質老鼠互吃/)).toBeInTheDocument();
});
it('worker results from an older board are discarded after a new board arrives',async()=>{
  const instances:FakeWorker[]=[];
  class FakeWorker {onmessage:((e:{data:ReturnType<typeof planBoard>})=>void)|null=null;onerror:(()=>void)|null=null;terminate=vi.fn();postMessage=vi.fn();constructor(){instances.push(this);}}
  vi.stubGlobal('Worker',FakeWorker);
  function View({board}:{board:Board}){const r=usePlanner(board);return <p>{r.plan?.best?.title??'pending'}</p>;}
  const first=fixture(), next={...fixture(),tools:['guillotine']};const {rerender}=render(<View board={first}/>);
  rerender(<View board={next}/>);expect(instances[0].terminate).toHaveBeenCalled();
  act(()=>instances[0].onmessage?.({data:planBoard(first)}));expect(screen.getByText('pending')).toBeInTheDocument();
  act(()=>instances[1].onmessage?.({data:planBoard(next)}));await screen.findByText('吞噬 03 號');
});
