import { RARITIES, type Board, type Cell, type Species } from './model';
import { toolIds, type ToolId } from './tools';

export const FOOD_CHAINS: Record<'single'|'double', Record<Species, readonly Species[]>> = {
  single:{ mammoth:['lion'], lion:['wolf'], wolf:['rat'], rat:['mammoth'] },
  double:{ mammoth:['lion','wolf'], lion:['wolf','rat'], wolf:['rat'], rat:['mammoth'] },
};
export const ACTIVE_FOOD_CHAIN = FOOD_CHAINS.single;
export const MARKERS = [{id:'tusk',name:'獠牙（換囚觸發）'},{id:'prey',name:'獵物連結（保留成長）'},{id:'scratch',name:'抓痕（封閉門）'}] as const;
export const tier = (cell:Pick<Cell,'rarity'>) => cell.rarity === null ? -1 : RARITIES.indexOf(cell.rarity);
export function devourKind(eater:Cell, meal:Cell, tools: readonly ToolId[]): 'normal'|'scratch'|null {
  if(eater.id===1 || meal.id===1 || eater.id===meal.id || eater.state!=='prisoner' || !eater.species || tier(eater)<0 || tier(eater)>=5) return null;
  if(meal.state==='locked' && meal.markers?.includes('scratch') && eater.species==='wolf' && meal.revealedRarity===eater.rarity) return 'scratch';
  if(meal.state!=='prisoner' || !meal.species || tier(meal)<0) return null;
  const prey=ACTIVE_FOOD_CHAIN[eater.species].includes(meal.species);
  if(eater.rarity===meal.rarity && (prey || (tools.includes('skewer') && eater.species==='rat' && meal.species==='rat'))) return 'normal';
  return tools.includes('guillotine') && eater.species==='wolf' && prey && tier(meal)<tier(eater) ? 'normal' : null;
}
export function deterministicGain(board:Board,eater:Cell,meal:Cell): number {
  const tools=toolIds(board.tools), kind=devourKind(eater,meal,tools);
  if(!kind) return 0;
  let gain=kind==='scratch'?3:1;
  // Unknown cell contents cannot be assumed absent when testing the four-inmate threshold.
  const maximumCrowd=board.cells.filter(c=>c.id!==1 && (c.state==='prisoner'||c.state==='unknown')).length-(kind==='normal'?1:0);
  if(tools.includes('muzzle') && maximumCrowd<=4) gain+=2;
  if(tools.includes('skewer') && eater.species==='rat') gain++;
  return gain;
}
export function officeBoard(board:Board): Board {
  return {...board,cells:board.cells.map(c=>c.id===1?{...c,state:'office' as const,species:null,rarity:null,markers:[],event:null}:c)};
}
