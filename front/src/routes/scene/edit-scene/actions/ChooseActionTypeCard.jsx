import { Component } from 'preact';
import { connect } from 'unistore/preact';
import Select from 'react-select';
import { Text, withText } from 'preact-i18n';

import { ACTIONS } from '../../../../../../server/utils/constants';

const ACTION_LIST = [
  ACTIONS.LIGHT.TURN_ON,
  ACTIONS.LIGHT.TURN_OFF,
  ACTIONS.LIGHT.TOGGLE,
  ACTIONS.LIGHT.BLINK,
  ACTIONS.SWITCH.TURN_ON,
  ACTIONS.SWITCH.TURN_OFF,
  ACTIONS.SWITCH.TOGGLE,
  ACTIONS.TIME.DELAY,
  ACTIONS.MESSAGE.SEND,
  ACTIONS.MESSAGE.SEND_CAMERA,
  ACTIONS.DEVICE.GET_VALUE,
  ACTIONS.CONDITION.IF_THEN_ELSE,
  ACTIONS.CONDITION.ONLY_CONTINUE_IF,
  ACTIONS.USER.SET_SEEN_AT_HOME,
  ACTIONS.USER.SET_OUT_OF_HOME,
  ACTIONS.USER.CHECK_PRESENCE,
  ACTIONS.HTTP.REQUEST,
  ACTIONS.CONDITION.CHECK_TIME,
  ACTIONS.SCENE.START,
  ACTIONS.HOUSE.IS_EMPTY,
  ACTIONS.HOUSE.IS_NOT_EMPTY,
  ACTIONS.DEVICE.SET_VALUE,
  ACTIONS.CALENDAR.IS_EVENT_RUNNING,
  ACTIONS.ECOWATT.CONDITION,
  ACTIONS.EDF_TEMPO.CONDITION,
  ACTIONS.ALARM.CHECK_ALARM_MODE,
  ACTIONS.ALARM.SET_ALARM_MODE,
  ACTIONS.MQTT.SEND,
  ACTIONS.ZIGBEE2MQTT.SEND,
  ACTIONS.MUSIC.PLAY_NOTIFICATION,
  ACTIONS.AI.ASK,
  ACTIONS.SMS.SEND
];

const TRANSLATIONS = ACTION_LIST.reduce((acc, action) => {
  acc[`editScene.actions.${action}`] = `editScene.actions.${action}`;
  return acc;
}, {});

class ChooseActionType extends Component {
  state = {
    currentAction: null
  };
  handleChange = selectedOption => {
    this.setState({
      currentAction: selectedOption
    });
    if (selectedOption) {
      this.props.updateActionProperty(this.props.path, 'type', selectedOption.value);
      this.props.updateActionProperty(this.props.path, 'filter', undefined);
    }
  };
  render(props, { currentAction }) {
    const actionListFiltered = props.action && props.action.filter ? props.action.filter : ACTION_LIST;
    const options = actionListFiltered.map(action => ({
      value: action,
      label: props[`editScene.actions.${action}`]
    }));

    return (
      <div>
        <div class="form-group">
          <label class="form-label">
            {props.path.includes('if') && <Text id="editScene.selectConditionType" />}
            {!props.path.includes('if') && <Text id="editScene.selectActionType" />}
          </label>
          <Select
            class="choose-scene-action-type"
            onChange={this.handleChange}
            value={currentAction}
            options={options}
          />
        </div>
      </div>
    );
  }
}

export default withText(TRANSLATIONS)(connect('httpClient', {})(ChooseActionType));
