import { h } from 'preact';
import { Text } from 'preact-i18n';
import DeviceFeatureState from './triggers/DeviceFeatureState';
import ScheduledTrigger from './triggers/ScheduledTrigger';
import ChooseTriggerType from './triggers/ChooseTriggerTypeCard';

import { EVENTS } from '../../../../../server/utils/constants';

const deleteTriggerFromList = (deleteTrigger, index) => () => {
  deleteTrigger(index);
};

const TriggerCard = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      {props.trigger.type === EVENTS.DEVICE.NEW_STATE && <i class="fe fe-activity" />}
      {props.trigger.type === EVENTS.TIME.CHANGED && <i class="fe fe-watch" />}
      {props.trigger.type === null && <i class="fe fe-plus-circle" />}
      <div class="card-title">
        <i
          class={props.trigger.icon}
          style={{
            marginRight: '10px'
          }}
        />{' '}
        <Text id={`editScene.triggers.${props.trigger.type}`} />
        {props.trigger.type === null && <Text id="editScene.newTrigger" />}
      </div>
      <div class="card-options">
        {false && (
          <a class="card-options-collapse">
            <i class="fe fe-chevron-down" />
          </a>
        )}
        <a onClick={deleteTriggerFromList(props.deleteTrigger, props.index)} class="card-options-remove">
          <i class="fe fe-x" />
        </a>
      </div>
    </div>
    <div class="card-body">
      {props.trigger.type === null && (
        <ChooseTriggerType updateTriggerProperty={props.updateTriggerProperty} index={props.index} />
      )}
      {props.trigger.type === EVENTS.DEVICE.NEW_STATE && (
        <DeviceFeatureState
          updateTriggerProperty={props.updateTriggerProperty}
          index={props.index}
          trigger={props.trigger}
        />
      )}
      {props.trigger.type === EVENTS.TIME.CHANGED && (
        <ScheduledTrigger
          updateTriggerProperty={props.updateTriggerProperty}
          index={props.index}
          trigger={props.trigger}
        />
      )}
    </div>
  </div>
);

export default TriggerCard;
