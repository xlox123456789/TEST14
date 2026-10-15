import { speciesNames, stateNames, rarityNames } from '../board/model';
import { cellRegions } from '../recognition/raster';
import type { LabeledFrame } from './history';
export async function annotateFrame(frame: LabeledFrame): Promise<string> {
  const image = new Image(); image.src = frame.imagePng; await image.decode();
  if (image.naturalWidth * image.naturalHeight > 33_000_000) throw new Error('圖片過大');
  const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('無法建立標註圖片'); ctx.drawImage(image,0,0);
  ctx.font = `${Math.max(12, Math.round(canvas.width / 80))}px sans-serif`; ctx.lineWidth = 2;
  if (frame.region) for (const region of cellRegions(frame.region)) {
    const cell = frame.board.cells.find(c => c.id === region.id)!; const x = region.x * canvas.width, y = region.y * canvas.height, width = region.width * canvas.width;
    ctx.strokeStyle = '#bde77d'; ctx.strokeRect(x,y,width,region.height * canvas.height);
    ctx.fillStyle = '#101416dd'; ctx.fillRect(x,y,width,45); ctx.fillStyle = '#ffffff';
    ctx.fillText(`${cell.id} ${cell.species ? speciesNames[cell.species] : stateNames[cell.state]}`,x+3,y+17,width-6);
    ctx.fillText(cell.rarity ? rarityNames[cell.rarity] : '品質未知',x+3,y+35,width-6);
  }
  ctx.fillStyle = '#101416ee'; ctx.fillRect(0,0,canvas.width,25); ctx.fillStyle='#ffffff'; ctx.fillText(`TEST14 人工標註 · ${frame.timeSeconds.toFixed(3)}秒 · 非最佳策略`,8,18);
  return canvas.toDataURL('image/png');
}
