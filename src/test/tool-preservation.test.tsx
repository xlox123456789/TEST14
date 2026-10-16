import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { BoardWorkspace } from '../board/BoardWorkspace';
import { createBoard } from '../board/model';
import { analyzeImage } from '../recognition/image';
vi.mock('../recognition/image',()=>({analyzeImage:vi.fn()}));
afterEach(()=>{cleanup();vi.resetAllMocks();});
it('keeps manually verified tools across unrecognized screenshots and decode failure',async()=>{
  vi.mocked(analyzeImage).mockResolvedValue({board:createBoard(),region:null,message:'unrecognized',synthetic:false});
  const {rerender}=render(<BoardWorkspace snapshot={null}/>);
  fireEvent.focus(screen.getByLabelText('搜尋持有刑具'));
  fireEvent.change(screen.getByLabelText('搜尋持有刑具'),{target:{value:'獠牙'}});
  fireEvent.click(screen.getByRole('button',{name:/^獠牙斷頭台/}));
  rerender(<BoardWorkspace snapshot={{url:'blob:frame1',width:100,height:100,capturedAt:new Date()}}/>);
  await waitFor(()=>expect(analyzeImage).toHaveBeenCalledTimes(1));
  await waitFor(()=>expect(screen.getByRole('button',{name:'確認整個盤面'})).toBeEnabled());
  expect(screen.getByRole('button',{name:'移除持有刑具：獠牙斷頭台'})).toBeInTheDocument();
  vi.mocked(analyzeImage).mockRejectedValueOnce(new Error('decode failed'));
  rerender(<BoardWorkspace snapshot={{url:'blob:frame2',width:100,height:100,capturedAt:new Date()}}/>);
  await screen.findByText('decode failed');
  expect(screen.getByRole('button',{name:'移除持有刑具：獠牙斷頭台'})).toBeInTheDocument();
  expect(screen.getByRole('button',{name:'格子 1 典獄長辦公室'})).toBeInTheDocument();
});

