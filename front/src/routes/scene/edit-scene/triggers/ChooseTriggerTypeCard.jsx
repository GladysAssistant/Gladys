import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import Select from 'react-select';

import { EVENTS } from '../../../../../../server/utils/constants';
import withIntlAsProp from '../../../../utils/withIntlAsProp';
import get from 'get-value';

const TRIGGER_LIST = [
  EVENTS.DEVICE.NEW_STATE,
  EVENTS.TIME.CHANGED,
  EVENTS.TIME.SUNRISE,
  EVENTS.TIME.SUNSET,
  EVENTS.USER_PRESENCE.BACK_HOME,
  EVENTS.USER_PRESENCE.LEFT_HOME,
  EVENTS.HOUSE.EMPTY,
  EVENTS.HOUSE.NO_LONGER_EMPTY,
  EVENTS.AREA.USER_ENTERED,
  EVENTS.AREA.USER_LEFT,
  EVENTS.CALENDAR.EVENT_IS_COMING
];

@connect('httpClient', {})
class ChooseTriggerType extends Component {
  handleChange = selectedOption => {
    if (selectedOption) {
      this.setState({
        currentTrigger: selectedOption
      });
    } else {
      this.setState({
        currentTrigger: null
      });
    }
  };
  changeBoxType = () => {
    if (this.state.currentTrigger) {
      this.props.updateTriggerProperty(this.props.index, 'type', this.state.currentTrigger.value);
    }
  };

  constructor(props) {
    super(props);

    const options = TRIGGER_LIST.map(trigger => {
      return {
        value: trigger,
        label: get(props.intl.dictionary, `editScene.triggers.${trigger}`, { default: trigger })
      };
    });

    this.state = {
      options,
      currentTrigger: null
    };
  }

  render(props, { currentTrigger, options }) {
    return (
      <div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.selectTriggerLabel" />
          </label>
          <Select
            class="choose-scene-trigger-type"
            value={currentTrigger}
            options={options}
            onChange={this.handleChange}
          />
        </div>
        <div class="form-group">
          <button onClick={this.changeBoxType} class="btn btn-success">
            <Text id="editScene.addTriggerButton" />
          </button>
        </div>
      </div>
    );
  }
}

export default withIntlAsProp(ChooseTriggerType);
