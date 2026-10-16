import { useId } from 'react';
import { BeastIcon } from './BeastIcon';
import { speciesNames, type Species } from './model';
import { ACTIVE_FOOD_CHAIN } from './mechanics';
import { toolIds } from './tools';

export function AnimalRelations({tools=[]}:{tools?:string[]|null}) {
  const arrow = useId();
  const extra=toolIds(tools).includes('skewer');
  const edgePaths:Record<string,string>={ 'mammoth-lion':'M112 34 L244 34','lion-wolf':'M304 102 L304 174','wolf-rat':'M248 230 L112 230','rat-mammoth':'M56 178 L56 102' };
  const nodes: { species: Species; position: string }[] = [
    { species: 'mammoth', position: 'top-left' },
    { species: 'lion', position: 'top-right' },
    { species: 'rat', position: 'bottom-left' },
    { species: 'wolf', position: 'bottom-right' },
  ];
  return <figure className="animal-relations" aria-label={`吞噬關係：猛獁象吃獅子、獅子吃狼、狼吃老鼠、老鼠吃猛獁象${extra?'；穿刺鼠首另允許同品質老鼠吃老鼠':''}`}>
    <figcaption><h3>動物吞噬關係</h3><span>箭頭：吃 → 被吃</span></figcaption>
    <div className="animal-diagram">
      <svg className="relation-arrows" viewBox="0 0 360 270" preserveAspectRatio="none" aria-hidden="true">
        <defs><marker id={arrow} viewBox="0 0 12 12" refX="10" refY="6" markerWidth="9" markerHeight="9" orient="auto"><path d="M2 2 L10 6 L2 10" /></marker></defs>
        {(Object.entries(ACTIVE_FOOD_CHAIN) as [Species,readonly Species[]][]).flatMap(([from,to])=>to.map(target=><path key={`${from}-${target}`} d={edgePaths[`${from}-${target}`]} markerEnd={`url(#${arrow})`}/>))}
        {extra&&<path className="special-relation" d="M32 200 C2 172 2 258 32 236" markerEnd={`url(#${arrow})`}/>}
      </svg>
      {nodes.map(({ species, position }) => <div key={species} className={`animal-node ${position} animal-${species}`}>
        <BeastIcon species={species} /><span>{speciesNames[species]}</span>
      </div>)}
    </div>
    {extra&&<p className="compact-hint">虛線：穿刺鼠首，僅同品質老鼠互吃。</p>}
  </figure>;
}
