import { Handle, Position } from 'reactflow';
import { getTriggerSummary } from '../sceneToGraph';
import style from '../canvasStyle.css';

// Nœud déclencheur (vert) — représente un événement Gladys déclenchant la scène.
// N'a qu'une sortie (en bas) ; pas d'entrée car rien ne précède un déclencheur.
const TriggerNode = ({ data, selected }) => {
  const summary = getTriggerSummary(data.trigger);
  return (
    <div class={`${style.node} ${style.triggerNode} ${selected ? style.nodeSelected : ''}`} title={(data.trigger && data.trigger.comment) || undefined}>
      {selected && <span class={style.selectedBadge}><i class="fe fe-check" /></span>}
      <div class={style.nodeHeader}>
        <i class={`fe ${data.icon} ${style.nodeHeaderIcon}`} />
        <span class={style.nodeHeaderLabel}>{data.label}</span>
      </div>
      {summary && (
        <div class={style.nodeBody}>
          {[].concat(summary).map((line, i) => (
            <span key={i} class={i === 0 ? style.nodeSummary : style.nodeSummary2}>{line}</span>
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default TriggerNode;
