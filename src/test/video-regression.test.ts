// @vitest-environment node
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { parseBoardJSON } from '../board/json';
import { makeTestRaster, recognizeRaster } from '../recognition/raster';
import { recognitionScore } from '../video/history';
const truth=parseBoardJSON(readFileSync(new URL('../../public/fixtures/expected-before.json',import.meta.url),'utf8'));
it.each([.5,1,1.5])('original calibration regression at scale %s: known fields match independent labels', scale=>{
  const result=recognizeRaster(makeTestRaster(scale),'synthetic',null); const score=recognitionScore(result.board,truth);
  expect(score.total).toBe(25); expect(score.correct).toBe(25); expect(score.errors).toHaveLength(0);
});
it('rejects the original sample in game mode and abstains on invalid pixels',()=>{
  expect(recognizeRaster(makeTestRaster(),'game',null).board.cells.every(c=>c.state==='unknown')).toBe(true);
  const black=makeTestRaster(); black.data.fill(0); expect(recognizeRaster(black,'synthetic',null).board.cells.every(c=>c.state==='unknown')).toBe(true);
});

it('browser-decoded WebM results match independent before/after truth and preserve actual delta',()=>{
  const dataset = JSON.parse(readFileSync(new URL('../../public/fixtures/browser-webm-dataset.json',import.meta.url),'utf8'));
  const afterTruth=parseBoardJSON(readFileSync(new URL('../../public/fixtures/expected-after.json',import.meta.url),'utf8'));
  expect(dataset.frames).toHaveLength(2); expect(dataset.operations).toHaveLength(1);
  for(const [i,expected] of [truth,afterTruth].entries()) {
    const recognized=parseBoardJSON(JSON.stringify(dataset.frames[i].recognizedBoard));
    expect(recognitionScore(recognized,expected)).toMatchObject({correct:25,total:25,errors:[]});
  }
  expect(dataset.operations[0].validation).toBe('unknown');
  expect(dataset.operations[0].before.board.cells[1].species).toBe('lion');
  expect(dataset.operations[0].after.board.cells[1].species).toBe('rat');
});
