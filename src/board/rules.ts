import type { Board, Species } from './model';
import { FOOD_CHAINS } from './mechanics';
export interface Candidate { kind: 'patrol' | 'devour'; target: number; actor?: number; status: 'observed' | 'experimental'; explanation: string }
export interface PlanningResult { message: string; candidates: Candidate[]; blockedBy: string[]; optimal: false }
// No production food-chain claim: these are two incompatible community-model hypotheses.
const SINGLE = FOOD_CHAINS.single;
const TWO = FOOD_CHAINS.double;
export type RuleMode = 'verified-only' | 'experimental-single' | 'experimental-two';
export function possibleActions(board: Board, mode: RuleMode = 'verified-only'): PlanningResult {
  const result: PlanningResult = { message: '尚無可靠策略建議', candidates: [], blockedBy: [], optimal: false };
  if (!board.reviewedAt) { result.blockedBy.push('盤面尚未經使用者確認'); return result; }
  // These are user-observed destinations, never generated from an assumed daily rule.
  for (const target of board.patrolOptions ?? []) result.candidates.push({ kind: 'patrol', target, status: 'observed', explanation: '來自已確認盤面的可選巡視位置；不代表已驗證當日可再次巡視。' });
  result.blockedBy.push('每日限制、刑具例外與完整正式吞食規則尚未驗證');
  if (mode === 'verified-only') return result;
  const actor = board.cells.find(c => c.id === board.warden);
  if (!actor || actor.state !== 'prisoner' || !actor.species || !actor.rarity) { result.blockedBy.push('典獄長位置或該格囚犯種類／品質未知'); return result; }
  if (board.tools === null || board.tools.length || board.cells.some(c => c.markers === null || c.markers.length || c.state === 'event')) { result.blockedBy.push('實驗吞食僅適用已明確確認無刑具、無特殊標記／事件的盤面'); return result; }
  const chain = mode === 'experimental-single' ? SINGLE : TWO;
  for (const target of board.cells) if (target.id !== actor.id && target.state === 'prisoner' && target.species && target.rarity === actor.rarity && chain[actor.species].includes(target.species)) {
    result.candidates.push({ kind: 'devour', actor: actor.id, target: target.id, status: 'experimental', explanation: '僅符合民間模型的同品質／克制條件；未檢查每日次數、位置限制或後續隨機連鎖，不是正式合法性保證。' });
  }
  return result;
}
// Stage-three boundary: a solver must return assumptions and never silently promote provisional rules.
export interface FutureSolver { solve(board: Board, budgetMs: number, signal: AbortSignal): Promise<PlanningResult> }
