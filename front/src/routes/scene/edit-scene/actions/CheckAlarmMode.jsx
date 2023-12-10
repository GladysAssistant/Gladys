import Select from 'react-select';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import withIntlAsProp from '../../../../utils/withIntlAsProp';
import get from 'get-value';

import { ALARM_MODES_LIST } from '../../../../../../server/utils/constants';

const capitalizeFirstLetter = string => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

class CheckAlarmMode extends Component {
  getOptions = async () => {
    try {
      const houses = await this.props.httpClient.get('/api/v1/house');
      const houseOptions = [];
      houses.forEach(house => {
        houseOptions.push({
          label: house.name,
          value: house.selector
        });
      });
      await this.setState({ houseOptions });
      this.refreshSelectedOptions(this.props);
    } catch (e) {
      console.error(e);
    }
  };
  handleHouseChange = selectedOption => {
    if (selectedOption && selectedOption.value) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'house', selectedOption.value);
    } else {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'house', null);
    }
  };
  handleAlarmModeChange = selectedOption => {
    if (selectedOption && selectedOption.value) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'alarm_mode', selectedOption.value);
    } else {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'alarm_mode', null);
    }
  };
  refreshSelectedOptions = nextProps => {
    let selectedHouseOption = '';
    if (nextProps.action.house && this.state.houseOptions) {
      const houseOption = this.state.houseOptions.find(option => option.value === nextProps.action.house);

      if (houseOption) {
        selectedHouseOption = houseOption;
      }
    }
    let selectedAlarmModeOption = '';
    if (nextProps.action.alarm_mode && this.state.alarmModesOptions) {
      const alarmModeOption = this.state.alarmModesOptions.find(option => option.value === nextProps.action.alarm_mode);

      if (alarmModeOption) {
        selectedAlarmModeOption = alarmModeOption;
      }
    }
    this.setState({ selectedHouseOption, selectedAlarmModeOption });
  };
  constructor(props) {
    super(props);
    this.props = props;
    const alarmModesOptions = ALARM_MODES_LIST.map(alarmMode => {
      return {
        value: alarmMode,
        label: capitalizeFirstLetter(get(props.intl.dictionary, `alarmModes.${alarmMode}`, { default: alarmMode }))
      };
    });
    this.state = {
      alarmModesOptions,
      selectedHouseOption: ''
    };
  }
  componentDidMount() {
    this.getOptions();
  }
  componentWillReceiveProps(nextProps) {
    this.refreshSelectedOptions(nextProps);
  }
  render(props, { alarmModesOptions, houseOptions, selectedHouseOption, selectedAlarmModeOption }) {
    return (
      <div>
        <p>
          <Text id="editScene.actionsCard.alarmCheckMode.description" />
        </p>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.alarmCheckMode.houseLabel" />
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <Select
            options={houseOptions}
            class="scene-check-alarm-mode-choose-house"
            value={selectedHouseOption}
            onChange={this.handleHouseChange}
          />
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.alarmCheckMode.alarmModeLabel" />
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <Select
            options={alarmModesOptions}
            class="scene-check-alarm-mode-choose-alarm-mode"
            value={selectedAlarmModeOption}
            onChange={this.handleAlarmModeChange}
          />
        </div>
      </div>
    );
  }
}

export default withIntlAsProp(connect('httpClient', {})(CheckAlarmMode));
