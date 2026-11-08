import { beforeAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

// Decode actual generated PNG scanlines; a successful HTTP response alone cannot
// catch invisible artwork caused by a zero alpha channel.
function pixels(name: string) {
  const png = readFileSync(`public/icons/${name}`);
  expect(png.subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');
  const width=png.readUInt32BE(16), height=png.readUInt32BE(20);
  expect(png[24]).toBe(8);
  expect(png[25]).toBe(6); // RGBA
  const chunks: Buffer[]=[];
  for (let offset=8;offset<png.length;) {
    const length=png.readUInt32BE(offset);
    if (png.toString('ascii',offset+4,offset+8)==='IDAT') chunks.push(png.subarray(offset+8,offset+8+length));
    offset+=12+length;
  }
  const raw=inflateSync(Buffer.concat(chunks));
  const data: number[][]=[];
  for(let y=0;y<height;y++) {
    expect(raw[y*(width*4+1)]).toBe(0); // Encoder uses unfiltered scanlines.
    for(let x=0;x<width;x++) {
      const start=y*(width*4+1)+1+x*4;
      data.push([...raw.subarray(start,start+4)]);
    }
  }
  return {width,height,data};
}

beforeAll(()=>execFileSync(process.execPath,['scripts/generate-icons.mjs']));

describe('generated app icons',()=>{
  for(const size of [192,512]) it(`${size}px artwork has visible opaque colours`,()=>{
    const icon=pixels(`icon-${size}-v3.png`);
    expect([icon.width,icon.height]).toEqual([size,size]);
    expect(icon.data.filter(p=>p[3]===255).length).toBeGreaterThan(size*size*.8);
    expect(icon.data.filter(p=>p.join(',')==='245,210,170,255').length).toBeGreaterThan(size*size*.12);
    expect(readFileSync(`public/icons/icon-${size}.png`)).toEqual(readFileSync(`public/icons/icon-${size}-v3.png`));
  });
  it('maskable icon is opaque with all artwork inside the 80% safe circle',()=>{
    const icon=pixels('icon-maskable-512-v3.png');
    expect([icon.width,icon.height]).toEqual([512,512]);
    expect(icon.data.every(p=>p[3]===255)).toBe(true);
    const artwork=icon.data.flatMap((p,index)=>p.join(',')==='245,210,170,255'? [index] : []);
    expect(artwork.length).toBeGreaterThan(10000);
    expect(artwork.every(index=>Math.hypot(index%512+.5-256,Math.floor(index/512)+.5-256)<=512*.4)).toBe(true);
  });
  it('Apple touch icon uses 180px opaque artwork',()=>{
    const icon=pixels('apple-touch-180-v3.png');
    expect([icon.width,icon.height]).toEqual([180,180]);
    expect(icon.data.every(p=>p[3]===255)).toBe(true);
  });
});
