import { Component } from 'preact';
import { connect } from 'unistore/preact';
import Select from 'react-select';
import { Text, withText } from 'preact-i18n';

import { ACTIONS } from '../../../../../../server/utils/constants';

const ACTION_LIST = [
  ACTIONS.LIGHT.TURN_ON,
  ACTIONS.LIGHT.TURN_OFF,
  ACTIONS.SWITCH.TURN_ON,
  ACTIONS.SWITCH.TURN_OFF,
  ACTIONS.TIME.DELAY,
  ACTIONS.MESSAGE.SEND,
  ACTIONS.DEVICE.GET_VALUE,
  ACTIONS.CONDITION.ONLY_CONTINUE_IF,
  ACTIONS.USER.SET_SEEN_AT_HOME,
  ACTIONS.USER.SET_OUT_OF_HOME,
  ACTIONS.USER.CHECK_PRESENCE,
  ACTIONS.HTTP.REQUEST,
  ACTIONS.CONDITION.CHECK_TIME
];

const TRANSLATIONS = ACTION_LIST.reduce((acc, action) => {
  acc[`editScene.actions.${action}`] = `editScene.actions.${action}`;
  return acc;
}, {});
@withText(TRANSLATIONS)
@connect('httpClient', {})
class ChooseActionType extends Component {
  state = {
    currentAction: null
  };
  handleChange = selectedOption => {
    this.setState({
      currentAction: selectedOption
    });
  };
  changeBoxType = () => {
    if (this.state.currentAction) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'type', this.state.currentAction.value);
    }
  };
  render(props, { currentAction }) {
    const options = ACTION_LIST.map(action => ({
      value: action,
      label: props[`editScene.actions.${action}`]
    }));

    return (
      <div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.selectActionType" />
          </label>
          <Select onChange={this.handleChange} value={currentAction} options={options} />
        </div>
        <div class="form-group">
          <button onClick={this.changeBoxType} class="btn btn-success">
            <Text id="editScene.addActionButton" />
          </button>
        </div>
      </div>
    );
  }
}

export default ChooseActionType;
