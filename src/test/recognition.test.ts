import { describe, expect, it } from 'vitest';
import { cellRegions, locateCalibration, makeTestRaster, recognizeRaster, validRegion } from '../recognition/raster';
describe('local image pipeline using original synthetic fixtures', () => {
  it.each([.5, 1, 1.5])('locates and classifies known code samples at scale %s', scale => {
    const image = makeTestRaster(scale); const result = recognizeRaster(image, 'synthetic', null);
    expect(result.synthetic).toBe(true); expect(result.region?.x).toBeCloseTo(40 / 980, 2);
    expect(result.board.cells[0].state).toBe('empty');
    expect(result.board.cells[2]).toMatchObject({ state: 'prisoner', species: 'wolf', rarity: 'rare' });
    expect(result.board.cells[5].state).toBe('unknown');
    expect(result.board.cells[6].state).toBe('locked');
    expect(result.board.cells[9].state).toBe('event');
    expect(result.board.warden).toBeNull(); expect(result.board.cells[2].markers).toBeNull();
  });
  it('never treats test colors as game recognition and respects a manual region', () => {
    const r = makeTestRaster(), region = { x: .1, y: .1, width: .8, height: .8 };
    const result = recognizeRaster(r, 'game', region);
    expect(result.region).toEqual(region); expect(result.synthetic).toBe(false); expect(result.board.cells.every(c => c.state === 'unknown')).toBe(true);
  });
  it('does not fabricate classifications after damaged calibration or on black frames', () => {
    const image = makeTestRaster(); image.data.fill(0);
    expect(locateCalibration(image)).toBeNull();
    expect(recognizeRaster(image, 'synthetic', null).region).toBeNull();
    expect(recognizeRaster(image, 'game', null).board.cells.every(c => c.state === 'unknown')).toBe(true);
  });
  it('leaves an incorrectly aligned manual test crop unknown', () => {
    const result = recognizeRaster(makeTestRaster(), 'synthetic', { x: 0, y: 0, width: 1, height: 1 });
    expect(result.synthetic).toBe(false); expect(result.message).toContain('未對齊');
    expect(result.board.cells.every(c => c.state === 'unknown')).toBe(true);
  });
  it('rejects malformed raster, zero/negative/outside crop and slices only the perimeter', () => {
    expect(recognizeRaster({ width: 0, height: 10, data: new Uint8ClampedArray() }, 'game', null).message).toContain('無效');
    expect(validRegion({ x: 0, y: 0, width: NaN, height: 1 })).toBe(false);
    expect(validRegion({ x: .8, y: 0, width: .5, height: 1 })).toBe(false);
    expect(() => cellRegions({ x: 0, y: 0, width: 0, height: 1 })).toThrow();
    expect(cellRegions({ x: .1, y: .2, width: .6, height: .4 })).toHaveLength(16);
  });
});
