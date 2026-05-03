import { Handle, Position } from 'reactflow';
import { getActionSummary } from '../sceneToGraph';
import style from '../canvasStyle.css';

const ActionNode = ({ data, selected }) => {
  const summary = getActionSummary(data.action);
  return (
    <div class={`${style.node} ${style.actionNode} ${selected ? style.nodeSelected : ''}`}>
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
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default ActionNode;
