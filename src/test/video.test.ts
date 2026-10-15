import { expect, it } from 'vitest';
import { boardDiff, exportDataset, parseDataset, recognitionScore, stepTime, validateVideo, type LabeledFrame, type Operation } from '../video/history';
import { createBoard, updateCell } from '../board/model';
const frame = (): LabeledFrame => ({ id:'sample',timeSeconds:.5,profile:'game',imagePng:'data:image/png;base64,aGVsbG8=',board:createBoard(),recognizedBoard:createBoard(),region:null });
it('validates MP4/WebM imports and rejects wrong formats/oversized files', () => {
  expect(()=>validateVideo(new File(['x'],'a.mp4',{type:'video/mp4'}))).not.toThrow(); expect(()=>validateVideo(new File(['x'],'b.webm',{type:'video/webm'}))).not.toThrow();
  expect(()=>validateVideo(new File(['x'],'private.txt',{type:'video/mp4'}))).toThrow();
  const file = new File(['x'],'a.mp4',{type:'video/mp4'}); Object.defineProperty(file,'size',{value:513*1024*1024}); expect(()=>validateVideo(file)).toThrow();
});
it('clamps frame stepping and records actual board/resource differences', () => {
  expect(stepTime(0,-1,30,3)).toBe(0); expect(stepTime(3,1,30,3)).toBe(3);
  expect(stepTime(1,1,30,3)).toBeCloseTo(1.033333);
  const before=createBoard(); const after={...updateCell(before,2,{state:'prisoner',species:'rat',rarity:'rare'}),currentDay:2,resources:{refresh:0}};
  const diff=boardDiff(before,after); expect(diff.cells[0].id).toBe(2); expect(diff.globals.map(v=>v.field)).toEqual(['currentDay','resources']);
});
it('round-trips labeled frames and operation history without promoting user evidence to official rules', () => {
  const before=frame(),after={...frame(),id:'after',timeSeconds:1.5,board:updateCell(createBoard(),2,{state:'empty'})};
  const op: Operation={ id:'operation',before,after,action:'observed choice',validation:'verified',evidence:'user-annotation',note:'one observation only' };
  const parsed=parseDataset(exportDataset([before,after],[op])); expect(parsed.operations[0].evidence).toBe('user-annotation'); expect(parsed.frames[1].timeSeconds).toBe(1.5);
});
it('rejects arbitrary image URLs, invalid boards, oversized images and backwards time', () => {
  const before=frame(); expect(()=>parseDataset(exportDataset([{...before,imagePng:'https://example.com/private.png'}],[]))).toThrow();
  expect(()=>parseDataset(exportDataset([{...before,board:{} as never}],[]))).toThrow();
  expect(()=>parseDataset(exportDataset([{...before,imagePng:`data:image/png;base64,${'a'.repeat(4_000_001)}`}],[]))).toThrow();
  expect(()=>parseDataset(exportDataset([],[{id:'x',before:{...before,timeSeconds:2},after:before,action:'x',validation:'unknown',evidence:'user-annotation',note:''}]))).toThrow();
});
it('scores only human-known labels, counts missed recognition as errors and reports coverage', () => {
  const unknown=createBoard(),truth=updateCell(unknown,2,{state:'prisoner',species:'rat',rarity:'rare'});
  expect(recognitionScore(unknown,unknown).accuracy).toBeNull();
  expect(recognitionScore(unknown,truth)).toMatchObject({total:3,correct:0,covered:0,accuracy:0});
  expect(recognitionScore(truth,truth)).toMatchObject({total:3,correct:3,accuracy:1});
});
