import { RARITIES, SPECIES, type Board, type Cell, type Species } from './model';
import { ACTIVE_FOOD_CHAIN, devourKind, deterministicGain, tier } from './mechanics';
import { REFERENCE_ASSUMPTIONS as A, toolById, toolIds, type ToolId } from './tools';

export interface Advice {
  kind:'patrol'|'devour'|'swap'|'end'|'accept'|'reject'|'bestow'|'instigate'|'tool';
  target:number|null; tool?:string; title:string; reasons:string[]; score:number;
}
export interface Plan { best:Advice|null; alternatives:Advice[]; blockedBy:string[]; provisional:true; limited:boolean }
export const EVENTS = [
  ['chain','連鎖反應'],['execution','處決'],['trickster','閉門之後'],['appetite','貪食慾望'],
  ['convict','高危囚犯'],['crow','烏鴉低語'],['freedom','自由滋味'],['usurp1','篡位 I'],['usurp2','篡位 II'],
] as const;
const POINTS=[1,2,5,12,30,150]; // Our own heuristic utility, NOT reward prices or measured game data.
const label=(n:number)=>String(n).padStart(2,'0');
const weight=(t:number)=>POINTS[Math.min(5,Math.max(0,t))];
const known=(b:Board)=>b.cells.filter(c=>c.id!==1&&c.state==='prisoner'&&c.species&&tier(c)>=0);
const locked=(b:Board)=>b.cells.filter(c=>c.id!==1&&c.state==='locked');
const steps=(from:number,to:number)=>(to-from+16)%16;
interface Search { nodes:number; limited:boolean; memo:Map<string,number> }
const search=():Search=>({nodes:0,limited:false,memo:new Map()});
function exhausted(s:Search) { if(++s.nodes>600) s.limited=true; return s.limited; }
function distribution(tools:ToolId[],mode:'swap'|'door',revealed:number|null=null) {
  if(revealed!==null) return A.tierWeights.map((_,t)=>t===revealed?1:0);
  const values=A.tierWeights.map((v,t)=>mode==='swap'&&tools.includes('rope')&&t<2?0:mode==='door'&&tools.includes('hook')&&t===0?0:v);
  const total=values.reduce((a,b)=>a+b,0); return values.map(v=>v/total);
}
function meanRaise(board:Board) { const pool=known(board).filter(c=>tier(c)<5); return pool.length?pool.reduce((n,c)=>n+weight(tier(c)+1)-weight(tier(c)),0)/pool.length:0; }
function branchBonus(tools:ToolId[],chained:boolean) {
  let out=[{extra:0,p:1}];
  for(const [enabled,p] of [[tools.includes('saw'),A.saw],[chained&&tools.includes('collar'),A.collar]] as const)
    if(enabled) out=out.flatMap(v=>[{extra:v.extra,p:v.p*(1-p)},{extra:v.extra+1,p:v.p*p}]);
  return out;
}
function markCost(c:Cell,days:number) { return c.markers?.includes('prey')&&days>1?Math.min(3,days-1)*weight(tier(c))*.6:0; }

// Visible-state expectimax: each promotion branches over the explicit practice distribution.
// No hidden prisoner is read. Only Avenger's Casket may spawn a modeled future meal.
function chain(board:Board,eater:Cell,meal:Cell,chained:boolean,s:Search):number {
  const tools=toolIds(board.tools), kind=devourKind(eater,meal,tools);
  if(!kind) return 0;
  const gain=deterministicGain(board,eater,meal), old=tier(eater), days=board.daysRemaining??0;
  const rest={...board,cells:board.cells.map(c=>c.id===meal.id?{...c,state:'locked' as const,species:null,rarity:null,markers:[]}:c)};
  let result=0;
  for(const bonus of branchBonus(tools,chained)) {
    const next=Math.min(5,old+gain+bonus.extra);
    let after=weight(next);
    if(next<5&&!exhausted(s)) {
      let sum=0;
      for(const species of SPECIES) {
        const raised={...eater,species,rarity:RARITIES[next],markers:eater.markers?.filter(m=>m!=='prey')??null};
        const state={...rest,cells:rest.cells.map(c=>c.id===eater.id?raised:c)};
        sum+=continueChain(state,raised,s);
        if(tools.includes('revenge')&&locked(state).length&&!s.limited) {
          const food=ACTIVE_FOOD_CHAIN[species][0], slot=locked(state)[0];
          const spawned={...slot,state:'prisoner' as const,species:food,rarity:raised.rarity,markers:[]};
          const imagined={...state,cells:state.cells.map(c=>c.id===slot.id?spawned:c)};
          sum+=A.revenge*(continueChain(imagined,raised,s)-continueChain(state,raised,s));
        }
      }
      after=sum/4;
    }
    result+=bonus.p*(after-weight(old)-(kind==='normal'?weight(tier(meal)):0));
  }
  // Preserve known prey growth links unless near the end or the rainbow gain outweighs them.
  return result-markCost(eater,days)-markCost(meal,days);
}
function continueChain(board:Board,eater:Cell,s:Search):number {
  if(exhausted(s)) return weight(tier(eater));
  const key=JSON.stringify([toolIds(board.tools),eater.id,eater.species,eater.rarity,board.cells.map(c=>[c.state,c.species,c.rarity,c.markers,c.revealedRarity])]);
  const cached=s.memo.get(key); if(cached!==undefined) return cached;
  const meals=board.cells.filter(c=>devourKind(eater,c,toolIds(board.tools)));
  // Forced continuation: there is no artificial stop option while a legal meal exists.
  const value=meals.length?weight(tier(eater))+Math.max(...meals.map(m=>chain(board,eater,m,true,s))):weight(tier(eater));
  s.memo.set(key,value); return value;
}
function freshValue(board:Board,mode:'door'|'swap',s:Search,old:Cell|null=null,revealed:number|null=null,doorTarget:Cell|null=null):number {
  const tools=toolIds(board.tools), dist=distribution(tools,mode,revealed);
  let value=0;
  for(let t=0;t<dist.length;t++) if(dist[t]) {
    const species=mode==='swap'&&tools.includes('pestle')&&old?.species?[old.species]:SPECIES;
    let forms=0;
    for(const animal of species) {
      const slot=old??doorTarget??locked(board)[0]; if(!slot) continue;
      const fresh={...slot,state:'prisoner' as const,species:animal,rarity:RARITIES[t],markers:[]};
      const state={...board,cells:board.cells.map(c=>c.id===slot.id?fresh:c)};
      const meals=state.cells.filter(c=>devourKind(fresh,c,tools));
      forms+=weight(t)+(meals.length&&!s.limited?Math.max(...meals.map(m=>chain(state,fresh,m,false,s))):0);
    }
    value+=dist[t]*forms/species.length;
  }
  return value;
}
function swapScore(board:Board,actor:Cell,s:Search) {
  const tools=toolIds(board.tools); let score=freshValue(board,'swap',s,actor)-weight(tier(actor))-markCost(actor,board.daysRemaining??0);
  if(actor.markers?.includes('tusk')) score+=Math.min(A.tuskRecipients,known(board).length)*meanRaise(board);
  if(tools.includes('axe')) { const higher=distribution(tools,'swap').reduce((n,p,t)=>n+(t>tier(actor)?p:0),0); score+=higher*Math.min(2,locked(board).length)*2; }
  if(tools.includes('scales')) score+=A.scales*Math.min(3,locked(board).length)*.6;
  return score;
}
function openingBonus(board:Board,target:Cell) {
  const tools=toolIds(board.tools); if(target.state!=='locked') return 0;
  const extra=locked(board).filter(c=>c.id!==target.id).length;
  const adjacent=[target.id===2?1:target.id-1,target.id===16?1:target.id+1];
  const sides=board.cells.filter(c=>c.id!==1&&adjacent.includes(c.id)&&c.state==='locked').length;
  return (tools.includes('keys')?A.keys*sides*2:0)+(tools.includes('fire')?A.fire*Math.min(1,extra)*3:0)+(tools.includes('forged')?A.forged*Math.min(1,extra)*2:0);
}
function passiveValue(board:Board) {
  const tools=toolIds(board.tools), days=Math.min(board.daysRemaining??0,8), doors=locked(board).length, pool=known(board);
  let score=0;
  if(tools.includes('ironbox')&&doors&&days>A.nestDays) score+=Math.min(doors,Math.floor(days/A.nestDays))* (tools.includes('skewer')?7:2);
  if(tools.includes('tongs')&&pool.some(c=>c.species==='mammoth'&&!c.markers?.includes('tusk'))) score+=Math.min(days,3)*Math.min(A.tuskRecipients,pool.length)*.8;
  if(tools.includes('rope')) score+=Math.min(days,3)*pool.filter(c=>tier(c)<2).length*.7;
  if(tools.includes('pestle')) score+=pool.filter(c=>pool.some(p=>p.id!==c.id&&c.species&&p.species&&ACTIVE_FOOD_CHAIN[c.species].includes(p.species)&&tier(p)>=2)).length*.5;
  if(tools.includes('hook')&&doors) score+=Math.min(days,doors)*.5;
  if(tools.includes('keys')&&doors) score+=Math.min(days,doors)*A.keys*.6;
  if(tools.includes('fire')&&doors>1) score+=Math.min(days,doors-1)*A.fire*(tools.includes('skewer')?1.5:1);
  if(tools.includes('shackles')&&pool.length) score+=Math.min(days,4)*A.shackles*meanRaise(board)*.3;
  if(tools.includes('scales')&&doors) score+=Math.min(days,3)*A.scales*.3;
  if(tools.includes('axe')&&doors) score+=Math.min(days,3)*Math.min(2,doors)*(tools.includes('rope')?1:.3);
  if(tools.includes('forged')) score+=Math.min(days,doors)*A.forged*.5-Math.min(days,4)*.5;
  return score;
}
function toolUtility(board:Board,s:Search) {
  let value=passiveValue(board), best=0;
  for(const actor of known(board)) for(const meal of board.cells) if(devourKind(actor,meal,toolIds(board.tools))) best=Math.max(best,chain(board,actor,meal,false,s));
  value+=best;
  // Evaluate swap-dependent instruments on the actual known low-rarity roster.
  for(const actor of known(board).filter(c=>tier(c)<2).slice(0,2)) value+=Math.max(0,swapScore(board,actor,s))*.3;
  return value;
}
function eventOptions(board:Board,s:Search):Advice[] {
  const kind=board.eventKind, here=board.cells.find(c=>c.id===board.warden), doors=locked(board).length, pool=known(board);
  if(!EVENTS.some(e=>e[0]===kind)) return [];
  let score=0; let why='';
  if(kind==='execution') {
    if(!here?.species||tier(here)<0||here.state!=='prisoner'||board.cells.some(c=>c.id!==1&&c.state==='unknown')) return [];
    const victims=pool.filter(c=>c.id!==here.id&&c.species&&ACTIVE_FOOD_CHAIN[here.species!].includes(c.species)&&tier(c)<tier(here));
    score=weight(tier(here)+victims.length)-weight(tier(here))-victims.reduce((v,c)=>v+weight(tier(c))+markCost(c,board.daysRemaining??0),0);
    why=`依「較低品質獵物」參考版本比較${victims.length}名犧牲者與升階收益；正式條件待驗證。`;
  } else if(kind==='trickster') {
    if(!here||here.state!=='prisoner'||tier(here)<0) return [];
    score=weight(4)-weight(tier(here))-markCost(here,board.daysRemaining??0); why='比較轉為至高的收益；原本已至高時不假定重新變種有利。';
  } else if(kind==='chain') {score=doors&&((board.daysRemaining??0)>0)?doors*.8:0;why='下一次巡邏可能開啟沿途封閉門；不假定門後內容。';}
  else if(kind==='freedom'){score=Math.min(3,doors)*2;why='最多額外開3扇封閉門，不重複觸發巡邏開門刑具。';}
  else if(kind==='convict'){score=doors?weight(3):0;why='參考模型會開出至少傳奇的囚犯；隱藏內容不作已知。';}
  else if(kind==='crow'){score=Math.min(4,doors)*.7;why='揭露封閉門品質，增加後續選擇資訊。';}
  else if(kind==='usurp1'||kind==='usurp2'){score=meanRaise(board)*Math.min(pool.length,kind==='usurp1'?1:2);why='評估場上隨機囚犯升階，篡位II人數仍為模擬假設。';}
  else if(kind==='appetite'){
    if(!pool.length||board.cells.some(c=>c.id!==1&&c.state==='unknown')) return [];
    const low=Math.min(...pool.map(tier));
    // Binomial coefficients for the referenced five independent practice rolls.
    score=[1,5,10,10,5,1].reduce((n,w,g)=>n+w/32*(weight(low+g)-weight(low)),0);
    why='比較最低品質囚犯的多次升階機會；次數與機率採參考假設，不顯示正式成功率。';
  }
  return [{kind:'accept',target:board.warden,title:'接受特殊事件',score,reasons:[why]}, {kind:'reject',target:board.warden,title:'拒絕特殊事件',score:0.01,reasons:['保留現有盤面，避免無收益的變化。']}];
}
export function planBoard(board:Board):Plan {
  const out:Plan={best:null,alternatives:[],blockedBy:[],provisional:true,limited:false}; const runs:Search[]=[]; const nextSearch=()=>{const run=search();runs.push(run);return run;};
  if(!board.reviewedAt) out.blockedBy.push('請先確認盤面。');
  if(!board.phase||board.phase==='unknown') out.blockedBy.push('請選擇目前的決策階段。');
  if(board.daysRemaining==null) out.blockedBy.push('請確認剩餘天數。');
  if(board.tools===null) out.blockedBy.push('請選擇持有刑具，或確認沒有刑具。');
  if(board.tools?.some(t=>!toolById(t))) out.blockedBy.push('有尚未支援的刑具，請先核對效果。');
  if(board.cells.some(c=>c.id!==1&&c.state==='office')) out.blockedBy.push('只有01號可以是典獄長辦公室。');
  if(known(board).some(c=>tier(c)===5)) out.blockedBy.push('彩虹囚犯通常已離開盤面收容，請核對該格是否應改為封閉。');
  if(board.cells.some(c=>c.markers?.some(m=>!['tusk','prey','scratch'].includes(m)))) out.blockedBy.push('存在未支援的特殊標記，請核對後再分析。');
  if(known(board).some(c=>c.markers===null)) out.blockedBy.push('請核對可見囚犯的特殊標記，避免連鎖時錯估標記收益。');
  if(board.phase!=='tool'&&board.warden==null) out.blockedBy.push('請點格子設定典獄長位置。');
  if(board.phase==='ended') out.blockedBy.push('對局已結束。');
  if(out.blockedBy.length) return out;
  const tools=toolIds(board.tools), here=board.cells.find(c=>c.id===board.warden), candidates:Advice[]=[];
  const add=(v:Advice)=>candidates.push(v);
  if(board.phase==='patrol') {
    if(!board.patrolOptions?.length) out.blockedBy.push('請勾選遊戲今日實際提供的巡邏門。');
    for(const id of board.patrolOptions??[]) {
      const target=board.cells.find(c=>c.id===id); if(!target||steps(board.warden!,id)===0||steps(board.warden!,id)>6) continue;
      const distance=steps(board.warden!,id), reasons:string[]=[]; let score=distance*.02;
      if(id===1){score+=meanRaise(board);reasons.push('到辦公室後可比較賜予與煽動，不把辦公室當囚犯。');}
      else if(target.state==='locked') { score+=freshValue(board,'door',nextSearch(),null,target.revealedRarity?RARITIES.indexOf(target.revealedRarity):null,target)+openingBonus(board,target); reasons.push('開啟封閉牢房，以未知新囚犯的參考分布估值。'); if(openingBonus(board,target)) reasons.push('目前開門刑具可帶來額外開門／複製機會，額外門不重複連動。'); }
      else if(target.state==='prisoner'&&target.species&&tier(target)>=0) { const meals=board.cells.filter(c=>devourKind(target,c,tools)); score+=meals.length?Math.max(...meals.map(m=>chain(board,target,m,false,nextSearch()))):0; score+=Math.max(0,swapScore(board,target,nextSearch()))*.5; reasons.push('抵達後比較該囚犯的吞噬與換囚機會。'); }
      else if(target.state==='nest') {score-=(target.nestDays!=null&&board.daysRemaining!>target.nestDays)?(tools.includes('skewer')?7:3):1;reasons.push('鼠巢尚未孵化時保留後續老鼠來源，避免提前打開。');}
      else if(target.state==='event'){score+=1;reasons.push('抵達後須先確認事件種類，再決定接受或拒絕。');}
      else reasons.push('該格內容未知或為空，不假設藏有囚犯。');
      if(tools.includes('shackles')&&distance>=4&&known(board).length){score+=A.shackles*meanRaise(board);reasons.push(`順時針走${distance}格，可觸發長鏈鐐銬升階機會。`);}
      if(board.chainActive){const path=board.cells.filter(c=>c.id!==1&&c.state==='locked'&&steps(board.warden!,c.id)>0&&steps(board.warden!,c.id)<=distance);score+=path.length*2;reasons.push(`已確認連鎖反應，沿途有${path.length}扇封閉門。`);}
      add({kind:'patrol',target:id,title:`巡邏至 ${label(id)} 號`,score,reasons});
    }
  } else if(board.phase==='manage'||board.phase==='chain') {
    if(board.phase==='manage'&&here&&(here.id===1||here.state==='empty')) add({kind:'end',target:null,title:'結束今天',score:0,reasons:['目前所在格沒有囚犯，不能開始吞噬或換囚；此階段可結束今天。']});
    else if(!here||here.id===1||here.state!=='prisoner'||!here.species||tier(here)<0) out.blockedBy.push('請確認典獄長所在格的囚犯種類與品質；辦公室不能吞噬或換囚。');
    else {
      const chainPhase=board.phase==='chain';
      if(here.markers===null) out.blockedBy.push('請核對目前囚犯的特殊標記。');
      if(here.species==='wolf'&&board.cells.some(c=>c.state==='locked'&&c.markers?.includes('scratch')&&!c.revealedRarity)) out.blockedBy.push('請核對抓痕門已揭露的品質。');
      if(!chainPhase&&board.devoursRemaining==null) out.blockedBy.push('請確認今天是否仍可吞噬。');
      if(!chainPhase&&board.swapsRemaining==null) out.blockedBy.push('請確認今天是否仍可換囚。');
      if(chainPhase||(board.devoursRemaining??0)>0) for(const meal of board.cells) if(devourKind(here,meal,tools)) {
        if(here.markers===null||meal.markers===null){out.blockedBy.push(`請核對 ${label(here.id)}／${label(meal.id)} 號特殊標記。`);continue;}
        const gain=deterministicGain(board,here,meal), reasons=[`依已知盤面及刑具，此口可升${gain}階（隨機額外升階另依參考模型評估）。`,'已計入升階變種後、目前可見獵物的強制連鎖；未知門不當作現有獵物。'];
        if(tools.includes('guillotine')&&tier(meal)>=0&&tier(meal)<tier(here)) reasons.unshift('獠牙斷頭台允許狼吞食這名較低品質的合法獵物。');
        if(tools.includes('muzzle')&&gain>(devourKind(here,meal,tools)==='scratch'?3:1)+(tools.includes('skewer')&&here.species==='rat'?1:0)) reasons.push('吞食後人數符合痛苦口枷，額外升2階。');
        if(tools.includes('skewer')&&here.species==='rat') reasons.push('穿刺鼠首讓老鼠吞食額外升階，並允許同品質老鼠互吃。');
        if(here.markers.includes('prey')||meal.markers.includes('prey')) reasons.push('已扣除破壞獵物標記的未來成長價值。');
        if(board.daysRemaining!<=2&&tier(here)+gain>=5) reasons.push('接近結束，優先立即收容彩虹囚犯。');
        let score=chain(board,here,meal,chainPhase,nextSearch()); if(board.daysRemaining!<=2&&tier(here)+gain>=5) score+=100;
        add({kind:'devour',target:meal.id,title:`吞噬 ${label(meal.id)} 號`,score,reasons});
      }
      if(!chainPhase&&(board.swapsRemaining??0)>0&&tier(here)<5&&here.markers!==null) add({kind:'swap',target:here.id,title:`替換 ${label(here.id)} 號囚犯`,score:swapScore(board,here,nextSearch()),reasons:[tools.includes('rope')?'絞刑繩排除普通及魔法換入結果。':'以參考換囚分布比較現有品質與新吞噬機會；結果仍隨機。',...(tools.includes('pestle')?['鐵杵保留原動物種類，已依現有獵物重新估值。']:[]),...(here.markers?.includes('tusk')?['獠牙標記使換囚後多名囚犯升階，已納入評分。']:[]),...(tools.includes('axe')?['行刑斧僅在換入品質較高時額外開門，已依組合估值。']:[]),...(tools.includes('scales')?['天秤的揭露資訊機會已納入。']:[])]});
      if(!chainPhase&&board.swapsRemaining!=null&&board.devoursRemaining!=null) add({kind:'end',target:null,title:'結束今天',score:0,reasons:['保留現有高品質囚犯或標記，等待下一次巡邏。']});
    }
  } else if(board.phase==='event') {const options=eventOptions(board,nextSearch());candidates.push(...options);if(!options.length)out.blockedBy.push('請確認事件種類、所在囚犯及相關盤面；無法估值時不猜接受結果。');}
  else if(board.phase==='office') {
    if(board.warden!==1)out.blockedBy.push('辦公室決策只適用01號，請核對典獄長位置。');
    else {add({kind:'bestow',target:1,title:'辦公室：賜予',score:meanRaise(board),reasons:['評估場上隨機一名囚犯升1階。']});add({kind:'instigate',target:1,title:'辦公室：煽動',score:Math.min(2,locked(board).length)*Math.min(board.daysRemaining!,4)*.5,reasons:['在封閉門增加事件機會；仍需日後巡邏抵達。']});}
  } else if(board.phase==='tool') {
    if(!board.offeredTools?.length) out.blockedBy.push('請只加入遊戲此刻提供的候選刑具。');
    const base=toolUtility(board,nextSearch());
    for(const id of [...new Set(board.offeredTools??[])]) { const tool=toolById(id); if(!tool||tools.includes(tool.id))continue; const trial={...board,tools:[...(board.tools??[]),tool.id]}; add({kind:'tool',target:null,tool:tool.id,title:`選擇刑具：${tool.name}`,score:toolUtility(trial,nextSearch())-base,reasons:['比較此刑具加入目前組合後的增益，依可見囚犯、封閉門與剩餘天數評估。',tool.effect]}); }
  }
  // Missing action availability or unresolved relevant data must not produce a false best move.
  if(out.blockedBy.length) return {...out,blockedBy:[...new Set(out.blockedBy)],limited:runs.some(r=>r.limited)};
  candidates.sort((a,b)=>b.score-a.score||(a.target??99)-(b.target??99));
  if(!candidates.length) out.blockedBy.push('沒有可確認的合法選項，請核對階段、今日門牌與盤面。');
  out.best=candidates[0]??null;out.alternatives=candidates.slice(1,3);out.limited=runs.some(r=>r.limited);return out;
}

