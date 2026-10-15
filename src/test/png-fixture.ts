// Minimal PNG reader for trusted browser-generated regression fixtures (8-bit RGB/RGBA).
// No production image decoding uses this helper.
import { inflateSync } from 'node:zlib';
import type { Raster } from '../recognition/raster';
export function decodeFixturePNG(dataURL: string): Raster {
  const file=Buffer.from(dataURL.split(',')[1],'base64');
  if(file.subarray(0,8).toString('hex')!=='89504e470d0a1a0a') throw Error('Not PNG');
  let width=0,height=0,channels=0; const chunks:Buffer[]=[];
  for(let offset=8;offset<file.length;) {
    const length=file.readUInt32BE(offset), type=file.toString('ascii',offset+4,offset+8), data=file.subarray(offset+8,offset+8+length);
    if(type==='IHDR') { width=data.readUInt32BE(0); height=data.readUInt32BE(4); channels=data[9]===6?4:data[9]===2?3:0; if(data[8]!==8||!channels||data[12]!==0) throw Error('Unsupported fixture PNG'); }
    if(type==='IDAT') chunks.push(data); offset+=length+12;
  }
  const scan=inflateSync(Buffer.concat(chunks)), stride=width*channels, pixels=Buffer.alloc(height*stride);
  const paeth=(a:number,b:number,c:number)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
  if(scan.length!==height*(stride+1)) throw Error('Unexpected scanline length');
  for(let y=0;y<height;y++) {
    const filter=scan[y*(stride+1)]; if(filter>4) throw Error('Unsupported filter');
    for(let x=0;x<stride;x++) {
      const index=y*stride+x, left=x>=channels?pixels[index-channels]:0, up=y?pixels[index-stride]:0, corner=y&&x>=channels?pixels[index-stride-channels]:0;
      const prediction=[0,left,up,Math.floor((left+up)/2),paeth(left,up,corner)][filter];
      pixels[index]=(scan[y*(stride+1)+x+1]+prediction)&255;
    }
  }
  const rgba=new Uint8ClampedArray(width*height*4);
  for(let p=0;p<width*height;p++) { rgba[p*4]=pixels[p*channels]; rgba[p*4+1]=pixels[p*channels+1]; rgba[p*4+2]=pixels[p*channels+2]; rgba[p*4+3]=channels===4?pixels[p*channels+3]:255; }
  return {width,height,data:rgba};
}
