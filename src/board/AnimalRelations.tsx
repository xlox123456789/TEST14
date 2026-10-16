import { useId } from 'react';
import { BeastIcon } from './BeastIcon';
import { speciesNames, type Species } from './model';

export function AnimalRelations() {
  const arrow = useId();
  const nodes: { species: Species; position: string }[] = [
    { species: 'mammoth', position: 'top-left' },
    { species: 'lion', position: 'top-right' },
    { species: 'rat', position: 'bottom-left' },
    { species: 'wolf', position: 'bottom-right' },
  ];
  return <figure className="animal-relations" aria-label="動物關係示意：老象P指向惡魔獅及狼阿奇，低欸鼠位於左下方">
    <figcaption><h3>動物關係圖</h3><span>示意</span></figcaption>
    <div className="animal-diagram">
      <svg className="relation-arrows" viewBox="0 0 360 270" preserveAspectRatio="none" aria-hidden="true">
        <defs><marker id={arrow} viewBox="0 0 12 12" refX="10" refY="6" markerWidth="9" markerHeight="9" orient="auto"><path d="M2 2 L10 6 L2 10" /></marker></defs>
        <path d="M112 34 L244 34" markerEnd={`url(#${arrow})`} />
        <path d="M108 70 L244 190" markerEnd={`url(#${arrow})`} />
      </svg>
      {nodes.map(({ species, position }) => <div key={species} className={`animal-node ${position} animal-${species}`}>
        <BeastIcon species={species} /><span>{speciesNames[species]}</span>
      </div>)}
    </div>
  </figure>;
}
