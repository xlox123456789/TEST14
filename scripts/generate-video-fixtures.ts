// Original test assets only. Run: pnpm dlx tsx scripts/generate-video-fixtures.ts <ffmpeg-path>
import { makeTestRaster } from '../src/recognition/raster';
import { createBoard, updateCell, type CellState } from '../src/board/model';
import { writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
const ffmpeg = process.argv[2]; if (!ffmpeg) throw new Error('Provide ffmpeg executable');
const output = 'public/fixtures'; mkdirSync(output, { recursive: true }); const temp = mkdtempSync(join(tmpdir(), 'test14-original-'));
const base = makeTestRaster();
for (let frame = 0; frame < 3; frame++) {
  const raster = new Uint8ClampedArray(base.data);
  if (frame === 1) for (let y = 145; y < 165; y++) for (let x = 245; x < 285; x++) raster.set([200,110,150,255], (y * base.width + x) * 4);
  if (frame === 2) raster.fill(0);
  const rgb = Buffer.alloc(base.width * base.height * 3); for (let i = 0, p = 0; i < raster.length; i += 4) { rgb[p++] = raster[i]; rgb[p++] = raster[i+1]; rgb[p++] = raster[i+2]; }
  const path = join(temp, `frame${frame.toString().padStart(2,'0')}.ppm`); writeFileSync(path, Buffer.concat([Buffer.from(`P6\n${base.width} ${base.height}\n255\n`), rgb]));
  execFileSync(ffmpeg, ['-y','-i',path,`${output}/frame-${frame}.png`], { stdio: 'ignore' });
}
const input = ['-y','-framerate','1','-i',join(temp,'frame%02d.ppm'),'-r','30','-t','3'];
execFileSync(ffmpeg, [...input,'-c:v','libvpx-vp9','-lossless','1',`${output}/original-board.webm`], { stdio: 'ignore' });
execFileSync(ffmpeg, [...input,'-c:v','libx264','-crf','10','-pix_fmt','yuv420p','-profile:v','high','-movflags','+faststart',`${output}/original-board.mp4`], { stdio: 'ignore' });
let board = createBoard(); const states: CellState[] = ['empty','prisoner','prisoner','prisoner','prisoner','unknown','locked','empty','prisoner','event','unknown','locked','empty','prisoner','event','unknown'];
states.forEach((state,i) => { board = updateCell(board,i+1,{state}); });
for (const [id,species,rarity] of [[2,'lion','magic'],[3,'wolf','rare'],[4,'rat','legendary'],[5,'mammoth','supreme'],[9,'mammoth','rare'],[14,'lion','magic']] as const) board = updateCell(board,id,{species,rarity});
writeFileSync(`${output}/expected-before.json`,JSON.stringify(board,null,2));
writeFileSync(`${output}/expected-after.json`,JSON.stringify(updateCell(board,2,{species:'rat'}),null,2));
writeFileSync(`${output}/manifest.json`,JSON.stringify({ license:'CC0-1.0', original:true, gameFootage:false, durationSeconds:3, fps:30, cases:[{timeSeconds:.5,image:'frame-0.png',expected:'expected-before.json'},{timeSeconds:1.5,image:'frame-1.png',expected:'expected-after.json'},{timeSeconds:2.5,image:'frame-2.png',expected:null,abstain:true}] },null,2));
console.log('Generated original 3-frame, 2-format video fixtures.');
