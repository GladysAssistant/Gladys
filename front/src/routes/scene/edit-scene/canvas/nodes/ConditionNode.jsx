import { Handle, Position } from 'reactflow';
import { isIfThenElse, getActionSummary } from '../sceneToGraph';
import style from '../canvasStyle.css';

const ConditionNode = ({ data, selected }) => {
  const branching = isIfThenElse(data.action);
  const summary = getActionSummary(data.action);
  return (
    <div class={`${style.node} ${style.conditionNode} ${selected ? style.nodeSelected : ''}`}>
      {selected && <span class={style.selectedBadge}><i class="fe fe-check" /></span>}
      <Handle type="target" position={Position.Top} id="input" />
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
      {branching ? (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="then"
            style={{ left: '20%' }}
          />
          <span class={style.conditionHandleLabelThen}>Oui</span>

          <Handle
            type="source"
            position={Position.Bottom}
            id="after"
            style={{ left: '50%' }}
          />
          <span class={style.conditionHandleLabelAfter}>Suite</span>

          <Handle
            type="source"
            position={Position.Bottom}
            id="else"
            style={{ left: '80%' }}
          />
          <span class={style.conditionHandleLabelElse}>Non</span>
        </>
      ) : (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            style={{ background: '#10b981' }}
          />
          <span class={style.conditionHandleLabelYes}>Oui</span>
        </>
      )}
    </div>
  );
};

export default ConditionNode;
