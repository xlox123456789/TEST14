import { expect, it } from 'vitest';
import { createBoard, updateCell, type Board, type Species, type Rarity } from '../board/model';
import { ACTIVE_FOOD_CHAIN, devourKind, deterministicGain, officeBoard } from '../board/mechanics';
import { planBoard } from '../board/planner';
import { TOOLS } from '../board/tools';
import { parseBoardJSON, exportBoardJSON } from '../board/json';
function base():Board { const b=officeBoard(createBoard()); return {...b,cells:b.cells.map(c=>c.id===1?c:{...c,state:'locked',markers:[]}),phase:'manage',warden:2,daysRemaining:5,tools:[],swapsRemaining:0,devoursRemaining:1,reviewedAt:'2026-10-16T00:00:00Z'}; }
function inmate(b:Board,id:number,species:Species,rarity:Rarity):Board { const next=updateCell(b,id,{state:'prisoner',species,rarity,markers:[]}); return {...next,reviewedAt:b.reviewedAt}; }
function pair(species:Species='wolf',prey:Species='rat',rarity:Rarity='legendary') { return inmate(inmate(base(),2,species,rarity),3,prey,rarity); }
const score=(b:Board,kind:string)=>{const p=planBoard(b);return [p.best,...p.alternatives].find(a=>a?.kind===kind)?.score;};
it.each([['mammoth','lion'],['lion','wolf'],['wolf','rat'],['rat','mammoth']] as const)('single chain permits %s eating %s at equal rarity',(a,b)=>{
  const board=pair(a,b); expect(devourKind(board.cells[1],board.cells[2],[])).toBe('normal');
  for(const other of ['mammoth','lion','wolf','rat'] as const) if(other!==b) expect(devourKind(board.cells[1],{...board.cells[2],species:other},[])).toBeNull();
  expect(ACTIVE_FOOD_CHAIN[a]).toEqual([b]);
});
it('never uses office, unknown or unopened occupants as normal meals',()=>{
  const b=pair(); expect(devourKind(b.cells[1],{...b.cells[2],state:'unknown'},[])).toBeNull();
  expect(devourKind(b.cells[1],{...b.cells[2],state:'locked'},[])).toBeNull();
  expect(devourKind({...b.cells[1],id:1},b.cells[2],[])).toBeNull();
  expect(devourKind(b.cells[1],{...b.cells[2],id:1},[])).toBeNull();
});
it('skewered rat heads allow same-tier rat meals and add exactly one tier',()=>{
  const b={...pair('rat','rat','rare'),tools:['skewer']}; expect(devourKind(b.cells[1],b.cells[2],[])).toBeNull();
  expect(devourKind(b.cells[1],b.cells[2],['skewer'])).toBe('normal'); expect(deterministicGain(b,b.cells[1],b.cells[2])).toBe(2);
  expect(devourKind(b.cells[1],{...b.cells[2],rarity:'magic'},['skewer'])).toBeNull();
});
it('guillotine only grants wolves lower-tier legal prey',()=>{
  const b=pair(); const meal={...b.cells[2],rarity:'rare' as const};
  expect(devourKind(b.cells[1],meal,[])).toBeNull(); expect(devourKind(b.cells[1],meal,['guillotine'])).toBe('normal');
  expect(devourKind(b.cells[1],{...meal,species:'lion'},['guillotine'])).toBeNull();
  expect(devourKind({...b.cells[1],species:'lion'}, {...meal,species:'wolf'},['guillotine'])).toBeNull();
  expect(devourKind(b.cells[1],{...meal,rarity:'supreme'},['guillotine'])).toBeNull();
});
it('muzzle counts prisoners after the meal and never counts unknown cells as empty',()=>{
  let b:Board={...pair(),tools:['muzzle']}; expect(deterministicGain(b,b.cells[1],b.cells[2])).toBe(3);
  for(let n=4;n<=7;n++) b=inmate(b,n,'lion','normal');
  expect(deterministicGain(b,b.cells[1],b.cells[2])).toBe(1);
  const uncertain={...pair(),tools:['muzzle']}; uncertain.cells[4]={...uncertain.cells[4],state:'unknown'};
  uncertain.cells[5]={...uncertain.cells[5],state:'unknown'};uncertain.cells[6]={...uncertain.cells[6],state:'unknown'};uncertain.cells[7]={...uncertain.cells[7],state:'unknown'};
  expect(deterministicGain(uncertain,uncertain.cells[1],uncertain.cells[2])).toBe(1);
});
it('muzzle and rat-head bonuses stack by their own conditions',()=>{
  const b={...pair('rat','rat','normal'),tools:['muzzle','skewer']}; expect(deterministicGain(b,b.cells[1],b.cells[2])).toBe(4);
});
it('scratch requires a wolf and explicitly revealed matching rarity',()=>{
  const b=inmate(base(),2,'wolf','rare'); b.cells[3]={...b.cells[3],markers:['scratch'],revealedRarity:'rare'};
  expect(devourKind(b.cells[1],b.cells[3],[])).toBe('scratch');expect(deterministicGain(b,b.cells[1],b.cells[3])).toBe(3);
  expect(devourKind(b.cells[1],{...b.cells[3],revealedRarity:null},[])).toBeNull();
  expect(devourKind({...b.cells[1],species:'lion'},b.cells[3],[])).toBeNull();
});
it('changing a special tool changes the actual recommendation',()=>{
  const b=inmate(inmate(base(),2,'wolf','legendary'),3,'rat','rare');
  expect(planBoard(b).best?.kind).toBe('end');
  const next=planBoard({...b,tools:['guillotine']});expect(next.best).toMatchObject({kind:'devour',target:3});
  expect(next.alternatives.length).toBeLessThanOrEqual(2);
});
it('rope raises the swap valuation; pestle evaluates the retained species',()=>{
  const b={...inmate(base(),2,'wolf','normal'),swapsRemaining:1,devoursRemaining:0};
  expect(score({...b,tools:['rope']},'swap')).toBeGreaterThan(score(b,'swap')!);
  const wolves=inmate(b,4,'rat','rare'); expect(score({...wolves,tools:['rope','pestle']},'swap')).not.toBe(score({...wolves,tools:['rope']},'swap'));
});
it('shackles can reverse patrol preference toward a four-plus-step route',()=>{
  let b=inmate(inmate(base(),3,'mammoth','normal'),9,'rat','supreme'); b={...b,phase:'patrol',warden:2,patrolOptions:[3,7]};
  b.cells[6]={...b.cells[6],state:'empty'};
  expect(planBoard(b).best?.target).toBe(3);
  const next=planBoard({...b,tools:['shackles']}); expect(next.best?.target).toBe(7);expect(next.best?.reasons.join('')).toContain('長鏈鐐銬');
});
it('saw increases expected value and collar affects continuation, not the first bite',()=>{
  const single=pair('mammoth','lion','rare');
  expect(score({...single,tools:['saw']},'devour')).toBeGreaterThan(score(single,'devour')!);
  expect(score({...single,tools:['collar']},'devour')).toBe(score(single,'devour'));
  const stair=inmate(single,4,'wolf','legendary');
  expect(score({...stair,tools:['collar']},'devour')).toBeGreaterThan(score(stair,'devour')!);
});
it('preserving prey marks has more value with time left, while late rainbows get priority',()=>{
  let b=pair('mammoth','lion','legendary'); b.cells[2]={...b.cells[2],markers:['prey']};
  expect(score({...b,daysRemaining:1},'devour')).toBeGreaterThan(score({...b,daysRemaining:5},'devour')!);
  expect(planBoard({...b,tools:['muzzle'],daysRemaining:1}).best?.reasons.join('')).toContain('彩虹');
});
it('does not recommend used actions or actions belonging to another phase',()=>{
  const b=pair(); expect(planBoard({...b,devoursRemaining:0}).best?.kind).toBe('end');
  const chain=planBoard({...b,phase:'chain',devoursRemaining:0,swapsRemaining:1}); expect(chain.best?.kind).toBe('devour');
  expect(chain.alternatives.every(a=>a.kind==='devour')).toBe(true);
  const patrol=planBoard({...b,phase:'patrol',patrolOptions:[4]}); expect([patrol.best,...patrol.alternatives].every(a=>a?.kind==='patrol')).toBe(true);
});
it.each(['review','phase','days','tools','warden','availability','marks'] as const)('missing %s blocks a best move',missing=>{
  const b=pair(); if(missing==='review')b.reviewedAt=null;if(missing==='phase')b.phase='unknown';if(missing==='days')b.daysRemaining=null;if(missing==='tools')b.tools=null;if(missing==='warden')b.warden=null;if(missing==='availability')b.swapsRemaining=null;if(missing==='marks')b.cells[1].markers=null;
  expect(planBoard(b).best).toBeNull();expect(planBoard(b).blockedBy.length).toBeGreaterThan(0);
});
it('unknown content never becomes a prisoner or a precisely predicted outcome',()=>{
  const b=pair();b.cells[2]={...b.cells[2],state:'unknown'};
  expect(planBoard(b).best?.kind).not.toBe('devour');
  const wrong={...pair(),warden:1}; expect(planBoard(wrong).best?.kind).toBe('end');
});
it('event decisions compare accept/reject only and reject a no-gain downgrade',()=>{
  const b={...inmate(base(),2,'lion','supreme'),phase:'event' as const,eventKind:'trickster'};
  expect(planBoard(b).best?.kind).toBe('reject');
  expect(planBoard({...b,eventKind:'unknown'}).best).toBeNull();
  const freedom=planBoard({...b,eventKind:'freedom'});expect(freedom.best?.kind).toBe('accept');expect(freedom.alternatives.map(a=>a.kind)).toEqual(['reject']);
});
it('office decision never treats cell 01 as an inmate and phases must match',()=>{
  const b={...pair(),phase:'office' as const,warden:1};expect(['bestow','instigate']).toContain(planBoard(b).best?.kind);
  expect(planBoard({...b,warden:2}).best).toBeNull();
});
it('tool decisions rank only offered tools by their marginal value in the held combination',()=>{
  const b={...pair('rat','rat','legendary'),phase:'tool' as const,tools:['ironbox'],offeredTools:['skewer','pestle']};
  expect(planBoard(b).best?.tool).toBe('skewer');
  expect(planBoard({...b,offeredTools:null}).best).toBeNull();
  expect(planBoard({...b,offeredTools:['unknown-tool']}).best).toBeNull();
});
it('unknown instruments and unsupported markers block rather than silently dropping effects',()=>{
  expect(planBoard({...pair(),tools:['not-supported']}).best).toBeNull();const b=pair();b.cells[2].markers=['unseen'];expect(planBoard(b).best).toBeNull();
});
it('new fields round-trip and reject malformed phase, counts, and revealed rarity',()=>{
  const b={...pair(),phase:'chain' as const,eventKind:'chain',offeredTools:['rope'],chainActive:true}; b.cells[3].revealedRarity='rare';
  expect(parseBoardJSON(exportBoardJSON(b))).toMatchObject({phase:'chain',swapsRemaining:0,chainActive:true,offeredTools:['rope']});
  expect(()=>parseBoardJSON(JSON.stringify({...b,phase:'hack'}))).toThrow();expect(()=>parseBoardJSON(JSON.stringify({...b,devoursRemaining:-1}))).toThrow();
});
it('bounded analysis is deterministic, finite, and completes a dense tool-choice board',()=>{
  let b=base(); const beasts:Species[]=['mammoth','lion','wolf','rat']; for(let id=2;id<=16;id++)b=inmate(b,id,beasts[id%4],RARITIES_FOR_TEST[id%4]);
  b={...b,phase:'tool',offeredTools:TOOLS.map(t=>t.id)};const started=performance.now();const first=planBoard(b),second=planBoard(b);
  expect(first).toEqual(second);expect(first.best?.score).toSatisfy(Number.isFinite);expect(performance.now()-started).toBeLessThan(1500);
});
const RARITIES_FOR_TEST:Rarity[]=['normal','magic','rare','legendary'];


it('revenge, keys, fire, hook and forged keys change the corresponding expected opening value',()=>{
  const b=pair('mammoth','lion','legendary');expect(score({...b,tools:['revenge']},'devour')).toBeGreaterThan(score(b,'devour')!);
  const p={...base(),phase:'patrol' as const,warden:2,patrolOptions:[3]}; const raw=score(p,'patrol')!;
  for(const id of ['keys','fire','hook','forged'])expect(score({...p,tools:[id]},'patrol'),id).toBeGreaterThan(raw);
  const empty={...p,cells:p.cells.map(c=>c.id===3?{...c,state:'empty' as const}:c)};
  expect(score({...empty,tools:['keys','fire','forged']},'patrol')).toBe(score(empty,'patrol'));
});
it('axe requires a higher swap roll, while scales independently values information',()=>{
  const b={...inmate(base(),2,'wolf','legendary'),swapsRemaining:1,devoursRemaining:0};
  expect(score({...b,tools:['axe']},'swap')).toBe(score(b,'swap'));
  expect(score({...b,tools:['scales']},'swap')).toBeGreaterThan(score(b,'swap')!);
  const low=inmate(b,2,'wolf','normal');expect(score({...low,tools:['rope','axe']},'swap')).toBeGreaterThan(score({...low,tools:['rope']},'swap')!);
});
it('iron box synergizes with rat heads and tongs require mammoths and future days',()=>{
  const b={...pair('mammoth','lion','rare'),phase:'tool' as const,offeredTools:['ironbox']};
  expect(planBoard({...b,tools:['skewer']}).best!.score).toBeGreaterThan(planBoard(b).best!.score);
  const tongs={...b,offeredTools:['tongs']};expect(planBoard(tongs).best!.score).toBeGreaterThan(planBoard({...tongs,daysRemaining:0}).best!.score);
  expect(planBoard({...tongs,cells:tongs.cells.map(c=>c.species==='mammoth'?{...c,species:'rat' as const}:c)}).best!.score).toBe(0);
});
it('tusk swap bonus and nest timing are evaluated without opening hidden data',()=>{
  let b={...inmate(base(),2,'mammoth','normal'),swapsRemaining:1,devoursRemaining:0};
  const plain=score(b,'swap')!; b.cells[1].markers=['tusk'];expect(score(b,'swap')).toBeGreaterThan(plain);
  const p={...base(),phase:'patrol' as const,patrolOptions:[3],tools:['skewer']};p.cells[2]={...p.cells[2],state:'nest',nestDays:2};
  expect(score({...p,daysRemaining:5},'patrol')).toBeLessThan(score({...p,daysRemaining:1},'patrol')!);
});



it('unrevealed inmate payloads cannot influence a locked-door patrol score',()=>{
  const b={...base(),phase:'patrol' as const,patrolOptions:[3]};const original=planBoard(b);
  const poisoned={...b,cells:b.cells.map(c=>c.state==='locked'?{...c,species:'rat' as const,rarity:'supreme' as const}:c)};
  expect(planBoard(poisoned)).toEqual(original);
});
it('office after its choice can end the day but never devour or swap',()=>{
  const b={...base(),phase:'manage' as const,warden:1}; const result=planBoard(b);expect(result.best?.kind).toBe('end');expect(result.alternatives).toHaveLength(0);
});
it('does not treat unverified markers on future chain prey as absent',()=>{
  const b=inmate(pair(),4,'mammoth','supreme');b.cells[3]={...b.cells[3],markers:null};
  const plan=planBoard(b);expect(plan.best).toBeNull();expect(plan.blockedBy.join(' ')).toContain('特殊標記');
});
it('clears state-specific revealed quality and nest timing on cell state changes',()=>{
  let b=updateCell(base(),3,{state:'locked',revealedRarity:'rare'});
  b=updateCell(b,3,{state:'nest',nestDays:2});expect(b.cells[2].revealedRarity).toBeNull();
  b=updateCell(b,3,{state:'empty'});expect(b.cells[2].nestDays).toBeNull();
});
