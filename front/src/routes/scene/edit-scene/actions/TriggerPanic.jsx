import Select from '../../../../components/form/Select';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';

class TriggerPanic extends Component {
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
      this.props.updateActionProperty(this.props.path, 'house', selectedOption.value);
    } else {
      this.props.updateActionProperty(this.props.path, 'house', null);
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
    this.setState({ selectedHouseOption });
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      selectedHouseOption: ''
    };
  }
  componentDidMount() {
    this.getOptions();
  }
  componentWillReceiveProps(nextProps) {
    this.refreshSelectedOptions(nextProps);
  }
  render(props, { houseOptions, selectedHouseOption }) {
    return (
      <div>
        <p>
          <Text id="editScene.actionsCard.alarmTriggerPanic.description" />
        </p>
        <div class="form-group" data-cy="scene-trigger-panic-choose-house">
          <label class="form-label">
            <Text id="editScene.actionsCard.alarmTriggerPanic.houseLabel" />
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <Select
            options={houseOptions}
            value={selectedHouseOption}
            onChange={this.handleHouseChange}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(TriggerPanic);
