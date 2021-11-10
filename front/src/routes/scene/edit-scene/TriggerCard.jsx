import { h } from 'preact';
import { Text } from 'preact-i18n';
import DeviceFeatureState from './triggers/DeviceFeatureState';
import ScheduledTrigger from './triggers/ScheduledTrigger';
import ChooseTriggerType from './triggers/ChooseTriggerTypeCard';
import SunriseSunsetTrigger from './triggers/SunriseSunsetTrigger';
import UserPresenceTrigger from './triggers/UserPresenceTrigger';
import HouseEmptyOrNot from './triggers/HouseEmptyOrNot';
import UserEnteredOrLeftArea from './triggers/UserEnteredOrLeftArea';

import { EVENTS } from '../../../../../server/utils/constants';

const deleteTriggerFromList = (deleteTrigger, index) => () => {
  deleteTrigger(index);
};

const TriggerCard = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      {props.trigger.type === EVENTS.DEVICE.NEW_STATE && <i class="icon-activity" />}
      {props.trigger.type === EVENTS.TIME.CHANGED && <i class="icon-watch" />}
      {props.trigger.type === EVENTS.TIME.SUNSET && <i class="icon-sunset" />}
      {props.trigger.type === EVENTS.TIME.SUNRISE && <i class="icon-sunrise" />}
      {props.trigger.type === EVENTS.USER_PRESENCE.BACK_HOME && <i class="icon-home" />}
      {props.trigger.type === EVENTS.USER_PRESENCE.LEFT_HOME && <i class="icon-home" />}
      {props.trigger.type === EVENTS.HOUSE.EMPTY && <i class="icon-home" />}
      {props.trigger.type === EVENTS.HOUSE.NO_LONGER_EMPTY && <i class="icon-home" />}
      {props.trigger.type === EVENTS.AREA.USER_ENTERED && <i class="icon-compass" />}
      {props.trigger.type === EVENTS.AREA.USER_LEFT && <i class="icon-compass" />}
      {props.trigger.type === null && <i class="icon-plus-circle" />}
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
            <i class="icon-chevron-down" />
          </a>
        )}
        <a onClick={deleteTriggerFromList(props.deleteTrigger, props.index)} class="card-options-remove">
          <i class="icon-x" />
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
      {props.trigger.type === EVENTS.TIME.SUNRISE && (
        <SunriseSunsetTrigger
          updateTriggerProperty={props.updateTriggerProperty}
          index={props.index}
          trigger={props.trigger}
        />
      )}
      {props.trigger.type === EVENTS.TIME.SUNSET && (
        <SunriseSunsetTrigger
          updateTriggerProperty={props.updateTriggerProperty}
          index={props.index}
          trigger={props.trigger}
        />
      )}
      {props.trigger.type === EVENTS.HOUSE.EMPTY && (
        <HouseEmptyOrNot
          updateTriggerProperty={props.updateTriggerProperty}
          index={props.index}
          trigger={props.trigger}
        />
      )}
      {props.trigger.type === EVENTS.HOUSE.NO_LONGER_EMPTY && (
        <HouseEmptyOrNot
          updateTriggerProperty={props.updateTriggerProperty}
          index={props.index}
          trigger={props.trigger}
        />
      )}
      {props.trigger.type === EVENTS.USER_PRESENCE.BACK_HOME && (
        <UserPresenceTrigger
          updateTriggerProperty={props.updateTriggerProperty}
          index={props.index}
          trigger={props.trigger}
        />
      )}
      {props.trigger.type === EVENTS.USER_PRESENCE.LEFT_HOME && (
        <UserPresenceTrigger
          updateTriggerProperty={props.updateTriggerProperty}
          index={props.index}
          trigger={props.trigger}
        />
      )}
      {props.trigger.type === EVENTS.AREA.USER_ENTERED && (
        <UserEnteredOrLeftArea
          updateTriggerProperty={props.updateTriggerProperty}
          index={props.index}
          trigger={props.trigger}
        />
      )}
      {props.trigger.type === EVENTS.AREA.USER_LEFT && (
        <UserEnteredOrLeftArea
          updateTriggerProperty={props.updateTriggerProperty}
          index={props.index}
          trigger={props.trigger}
        />
      )}
    </div>
  </div>
);

export default TriggerCard;
