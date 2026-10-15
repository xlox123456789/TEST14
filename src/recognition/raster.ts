import { createBoard, evidence, RARITIES, SPECIES, type Board, type Rect } from '../board/model';
export interface Raster { width: number; height: number; data: Uint8ClampedArray }
export interface Recognition { board: Board; region: Rect | null; message: string; synthetic: boolean }
type RGB = readonly [number, number, number];
const ANCHORS: RGB[] = [[255, 0, 200], [0, 255, 220], [250, 230, 0], [120, 30, 255]];
const STATES: RGB[] = [[55, 65, 75], [110, 125, 140], [30, 80, 60], [160, 100, 50], [80, 60, 130]];
const BEASTS: RGB[] = [[90, 170, 200], [220, 150, 70], [160, 160, 200], [200, 110, 150]];
const TIERS: RGB[] = [[210, 210, 210], [70, 120, 230], [240, 210, 60], [240, 140, 40], [170, 70, 220], [80, 230, 180]];
function matches(data: Uint8ClampedArray, offset: number, rgb: RGB) { return rgb.every((v, i) => Math.abs(data[offset + i] - v) <= 7) && data[offset + 3] >= 240; }
function validRaster(r: Raster) { return Number.isInteger(r.width) && Number.isInteger(r.height) && r.width >= 24 && r.height >= 16 && r.width * r.height <= 4_000_000 && r.data.length === r.width * r.height * 4; }
export function validRegion(r: Rect): boolean { return Object.values(r).every(Number.isFinite) && r.x >= 0 && r.y >= 0 && r.width > 0 && r.height > 0 && r.x + r.width <= 1.000001 && r.y + r.height <= 1.000001; }
export function cellRegions(region: Rect) {
  if (!validRegion(region)) throw new Error('擷取區域必須完整位於圖片內');
  return createBoard().cells.map(c => ({ id: c.id, x: region.x + c.column * region.width / 6, y: region.y + c.row * region.height / 4, width: region.width / 6, height: region.height / 4 }));
}
// Only recognizes our four-color calibration frame. No claim of general game-board detection.
export function locateCalibration(r: Raster): Rect | null {
  if (!validRaster(r)) return null;
  const boxes = ANCHORS.map(() => ({ minX: Infinity, minY: Infinity, maxX: -1, maxY: -1, count: 0 }));
  for (let y = 0; y < r.height; y++) for (let x = 0; x < r.width; x++) {
    const index = ANCHORS.findIndex(rgb => matches(r.data, (y * r.width + x) * 4, rgb));
    if (index < 0) continue;
    const box = boxes[index]; box.count++; box.minX = Math.min(box.minX, x); box.minY = Math.min(box.minY, y); box.maxX = Math.max(box.maxX, x); box.maxY = Math.max(box.maxY, y);
  }
  if (boxes.some(b => b.count < 9 || b.maxX - b.minX > r.width * .04 || b.maxY - b.minY > r.height * .04)) return null;
  const [tl, tr, br, bl] = boxes;
  if (Math.abs(tl.minY - tr.minY) > 3 || Math.abs(bl.maxY - br.maxY) > 3 || Math.abs(tl.minX - bl.minX) > 3 || Math.abs(tr.maxX - br.maxX) > 3) return null;
  const region = { x: tl.minX / r.width, y: tl.minY / r.height, width: (tr.maxX + 1 - tl.minX) / r.width, height: (br.maxY + 1 - tl.minY) / r.height };
  return validRegion(region) && region.width > .3 && region.height > .3 ? region : null;
}
function sample(r: Raster, x: number, y: number, palette: RGB[]) {
  const px = Math.min(r.width - 1, Math.max(0, Math.floor(x * r.width)));
  const py = Math.min(r.height - 1, Math.max(0, Math.floor(y * r.height)));
  return palette.findIndex(rgb => matches(r.data, (py * r.width + px) * 4, rgb));
}
export function recognizeRaster(r: Raster, profile: 'game' | 'synthetic', manual: Rect | null): Recognition {
  const board = createBoard();
  if (!validRaster(r)) return { board, region: null, message: '無效或過大的影像資料，未產生辨識結果。', synthetic: false };
  if (manual && !validRegion(manual)) throw new Error('擷取區域必須完整位於圖片內');
  const calibration = profile === 'synthetic' ? locateCalibration(r) : null;
  if (profile === 'game') board.evidence = evidence('image', '本機圖片；尚無可靠遊戲模板，未知欄位不補值');
  const region = manual ?? calibration;
  if (!region) return { board, region: null, message: '未找到可靠盤面邊框。請拖曳選區或輸入區域；真實遊戲模板尚不足。', synthetic: false };
  // Gate test colors behind a calibration frame AND explicit test profile.
  if (profile !== 'synthetic' || !calibration) return { board, region, message: '已依選區切分外圈16格；沒有可靠遊戲模板，內容全部保留未知，請手動修正。', synthetic: false };
  if ((['x', 'y', 'width', 'height'] as const).some(key => Math.abs(region[key] - calibration[key]) > .012)) return { board, region, message: '選區未對齊測試圖校準框，未套用色碼結果；請調整或重新自動定位。', synthetic: false };
  board.evidence = evidence('synthetic', '自製色碼測試圖；非真實遊戲辨識');
  const regions = cellRegions(region);
  board.cells = board.cells.map((cell, index) => {
    const c = regions[index];
    const state = sample(r, c.x + c.width * .5, c.y + c.height * .2, STATES);
    const beast = sample(r, c.x + c.width * .5, c.y + c.height * .5, BEASTS);
    const tier = sample(r, c.x + c.width * .5, c.y + c.height * .8, TIERS);
    const knownState = state >= 0 ? (['unknown', 'locked', 'empty', 'prisoner', 'event'] as const)[state] : 'unknown';
    return { ...cell, state: knownState, species: knownState === 'prisoner' && beast >= 0 ? SPECIES[beast] : null,
      rarity: knownState === 'prisoner' && tier >= 0 ? RARITIES[tier] : null,
      evidence: { ...cell.evidence, state: state > 0 ? evidence('synthetic', '已匹配測試色碼') : evidence(),
        species: knownState === 'prisoner' && beast >= 0 ? evidence('synthetic', '測試種類色碼') : evidence(),
        rarity: knownState === 'prisoner' && tier >= 0 ? evidence('synthetic', '測試品質色碼') : evidence() } };
  });
  return { board, region, message: '已讀取自製色碼測試圖；僅驗證定位、切格與資料流程，不代表遊戲辨識率。標記與全局欄位仍為未知。', synthetic: true };
}
export function makeTestRaster(scale = 1): Raster {
  if (![.5, 1, 1.5].includes(scale)) throw new Error('不支援的測試尺寸');
  const width = Math.round(980 * scale), height = Math.round(740 * scale);
  const r: Raster = { width, height, data: new Uint8ClampedArray(width * height * 4) };
  const fill = (x: number, y: number, w: number, h: number, color: RGB) => {
    for (let yy = Math.round(y * scale); yy < Math.round((y + h) * scale); yy++) for (let xx = Math.round(x * scale); xx < Math.round((x + w) * scale); xx++) {
      const i = (yy * width + xx) * 4; r.data.set([...color, 255], i);
    }
  };
  fill(0, 0, 980, 740, [16, 20, 24]);
  createBoard().cells.forEach((cell, index) => {
    const x = 40 + cell.column * 150, y = 80 + cell.row * 150;
    fill(x + 4, y + 4, 142, 142, [35, 40, 46]);
    const state = index === 0 ? 2 : index <= 4 ? 3 : index % 5;
    fill(x + 55, y + 20, 40, 20, STATES[state]);
    if (state === 3) { fill(x + 55, y + 65, 40, 20, BEASTS[index % 4]); fill(x + 55, y + 110, 40, 20, TIERS[index % 6]); }
  });
  [[40, 80], [930, 80], [930, 670], [40, 670]].forEach(([x, y], index) => fill(x, y, 10, 10, ANCHORS[index]));
  return r;
}
