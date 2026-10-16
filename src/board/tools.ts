// Independently written summaries of the referenced simulator model, not official SS14 data.
// See docs/STRATEGY_REFERENCE.md for the pinned source, uncertainty and licensing audit.
export const TOOL_SOURCE = 'https://github.com/blahdot3h/tartarus-simulator/blob/60908f69330e9bd46e74628a8261a8d2b85d0b35/js/engine.js';
export const TOOLS = [
  { id:'rope', name:'絞刑繩', english:"Hangman's Noose", effect:'換入囚犯不會是普通或魔法。' },
  { id:'shackles', name:'長鏈鐐銬', english:'Long-Chained Shackles', effect:'巡邏走至少4格，有機會使場上一名囚犯升1階。' },
  { id:'muzzle', name:'痛苦口枷', english:"Raging Beast's Agonizing Muzzle", effect:'吞食後場上囚犯不多於4名時，額外升2階。' },
  { id:'skewer', name:'穿刺鼠首', english:'Skewered Rat Heads', effect:'老鼠可吃同品質老鼠；老鼠每次吞食額外升1階。' },
  { id:'guillotine', name:'獠牙斷頭台', english:'Fanged Guillotine', effect:'狼也可吞食較低品質的合法獵物，並非跨物種任意吞食。' },
  { id:'revenge', name:'復仇棺匣', english:"Avenger's Casket", effect:'吞食後有機會開啟一扇門，得到符合新形態的同品質獵物；不觸發其他開門效果。' },
  { id:'saw', name:'生鏽鋸刃', english:'Rusty Saw', effect:'每次吞食有機會額外升1階。' },
  { id:'keys', name:'遺失的鑰匙圈', english:'Lost Ring of Keys', effect:'巡邏開門時有機會一併開啟兩側封閉牢房；額外開門不再連動。' },
  { id:'fire', name:'灼熱烙鐵', english:'Searing Branding Iron', effect:'巡邏開門時有機會複製新囚犯到另一封閉牢房並開門；額外開門不連動。' },
  { id:'ironbox', name:'蠕動鐵箱', english:'Squirming Iron Box', effect:'每日讓一間封閉牢房變成鼠巢，等待後孵出稀有老鼠。' },
  { id:'hook', name:'分揀鉤', english:'Sorting Hook', effect:'開門產生的囚犯不會是普通品質。' },
  { id:'pestle', name:'鐵杵', english:'Iron Pestle', effect:'換囚保留原動物種類，只重新決定品質。' },
  { id:'scales', name:'典獄長天秤', english:"Warden's Scales", effect:'換囚後有機會揭露封閉牢房中最高品質囚犯的種類及品質。' },
  { id:'tongs', name:'欲望鐵鉗', english:'Iron Tongs of Lust', effect:'每日隨機給場上一頭猛獁象加上獠牙標記。' },
  { id:'axe', name:'獄卒行刑斧', english:"Gaoler's Execution Axe", effect:'換入品質較高的囚犯時，額外開啟最多2間封閉牢房；不連動其他開門效果。' },
  { id:'collar', name:'狂獸棘刺項圈', english:"Maddened Beast's Barbed Collar", effect:'吞食連鎖的第二口起，有機會額外升1階；第一口無效。' },
  { id:'forged', name:'偽造鑰匙', english:'Forged Key', effect:'每日巡邏候選少1個；巡邏開門有機會額外開啟1間封閉牢房，不再連動。' },
] as const;
export type ToolId = typeof TOOLS[number]['id'];
export const toolById = (id:string) => TOOLS.find(t=>t.id===id || t.name===id || t.english===id);
export const toolIds = (tools: readonly string[] | null) => [...new Set((tools ?? []).map(t=>toolById(t)?.id).filter((id):id is ToolId=>!!id))];

// Explicitly provisional practice probabilities. Never presented as live-game success rates.
export const REFERENCE_ASSUMPTIONS = {
  status:'provisional' as const,
  tierWeights:[52,27,15,6,0] as readonly number[],
  speciesWeights:[1,1,1,1] as readonly number[],
  saw:.25, revenge:.30, keys:.80, fire:.35, scales:.80, shackles:.40, collar:.80, forged:.50,
  tuskRecipients:4, scratchGain:3, nestDays:2, appetiteTries:5, appetiteChance:.5,
};
