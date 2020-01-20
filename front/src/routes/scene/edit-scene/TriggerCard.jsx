import { h } from 'preact';
import { Text } from 'preact-i18n';
import DeviceFeatureState from './triggers/DeviceFeatureState';
import ChooseTriggerType from './triggers/ChooseTriggerTypeCard';

const deleteTriggerFromList = (deleteTrigger, index) => () => {
  deleteTrigger(index);
};

const TriggerCard = ({ children, ...props }) => (
  <div
    class="card"
    style={{
      minWidth: '350px'
    }}
  >
    <div class="card-header">
      {props.trigger.type === 'device.new-state' && <i class="fe fe-activity" />}
      <div class="card-title">
        <i
          class={props.trigger.icon}
          style={{
            marginRight: '10px'
          }}
        />{' '}
        <Text id={`editScene.triggers.${props.trigger.type}`} />
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
      {props.trigger.type === 'device.new-state' && (
        <DeviceFeatureState
          updateTriggerProperty={props.updateTriggerProperty}
          index={props.index}
          trigger={props.trigger}
        />
      )}
    </div>
  </div>
);

export default TriggerCard;
