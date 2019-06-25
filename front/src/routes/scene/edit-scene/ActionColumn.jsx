import { h } from 'preact';
import { Text } from 'preact-i18n';
import ActionCard from './ActionCard';

import { ACTION_LIST } from '../../../../../server/utils/constants';

const addActionToColumn = (columnIndex, addAction) => () => {
  addAction(columnIndex, 'new');
};

const ActionColumn = ({ children, ...props }) => (
  <div class="col-lg-4">
    <h4 class="text-center">{props.index === 0 ? <Text id="editScene.first" /> : <Text id="editScene.then" />}</h4>
    <hr />
    {props.actions.map((action, index) => (
      <ActionCard
        sceneParamsData={props.sceneParamsData}
        action={action}
        columnIndex={props.index}
        index={index}
        updateActionProperty={props.updateActionProperty}
        highLightedActions={props.highLightedActions}
        deleteAction={props.deleteAction}
      />
    ))}
    <div class="row">
      <div class="col-md-8">
        <select onChange={props.updateSelectedNewAction} class="form-control">
          <option>-------</option>
          {ACTION_LIST.map(actionType => (
            <option value={actionType}>
              <Text id={`editScene.actions.${actionType}`} />
            </option>
          ))}
        </select>
      </div>
      <div class="col-md-4">
        <button onClick={addActionToColumn(props.index, props.addAction)} class="btn btn-block btn-outline-primary">
          <i class="fe fe-plus" />
        </button>
      </div>
    </div>
  </div>
);

export default ActionColumn;
