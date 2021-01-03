import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Localizer, Text } from 'preact-i18n';
import Select from 'react-select';

@connect('httpClient', {})
class LightFadeInParams extends Component {
  handleChangeDuration = e => {
    let newValue = Number.isInteger(parseInt(e.target.value, 10)) ? parseInt(e.target.value, 10) : 0;
    this.setState({ parameters: { ...this.state.parameters, durationValue: newValue}}, () => {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'parameters', this.state.parameters);
    })
  };
  handleChangeUnit = e => {
    this.setState({ parameters: { ...this.state.parameters, durationUnit: e.target.value}}, () => {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'parameters', this.state.parameters);
    })
  };
  handleChangeTargetBrightness = e => {
    this.setState({ parameters: { ...this.state.parameters, targetBrightness: e.target.value}}, () => {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'parameters', this.state.parameters);
    })
  }
  getOptions = async () => {
    try {
      const devices = await this.props.httpClient.get('/api/v1/device', {
        device_feature_category: 'light',
        device_feature_type: 'brightness'
      });
      const deviceOptions = devices.map(device => ({
        value: device.selector,
        label: device.name
      }));
      await this.setState({ deviceOptions });
      this.refreshSelectedOptions(this.props);
      return deviceOptions;
    } catch (e) {
      console.log(e);
    }
  };
  handleChange = selectedOptions => {
    if (selectedOptions) {
      const lights = selectedOptions.map(selectedOption => selectedOption.value);
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'devices', lights);
    } else {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'devices', []);
    }
  };
  refreshSelectedOptions = nextProps => {
    const selectedOptions = [];
    if (nextProps.action.devices && this.state.deviceOptions) {
      nextProps.action.devices.forEach(light => {
        const deviceOption = this.state.deviceOptions.find(deviceOption => deviceOption.value === light);
        if (deviceOption) {
          selectedOptions.push(deviceOption);
        }
      });
    }
    this.setState({ selectedOptions });
  };
  constructor(props) {
    super(props);
    this.state = {
      deviceOptions: null,
      selectedOptions: [],
      parameters: props.parameters
    };
  }
  async componentDidMount() {
    this.getOptions();
  }

  componentWillReceiveProps(nextProps) {
    this.refreshSelectedOptions(nextProps);
  }

  render(props, { selectedOptions, deviceOptions }) {
    const { parameters } = props.action;
    return (
      <div class="form-group">
        <label class="form-label">
          <Text id="editScene.actionsCard.fadeInLights.label" />
        </label>
        <Select
          defaultValue={[]}
          isMulti
          value={selectedOptions}
          onChange={this.handleChange}
          options={deviceOptions}
        />
        <label className="form-label">
          <Text id="editScene.actionsCard.fadeInLights.targetBrightness" />
        </label>
        <input
          style={{
            minHeight: '30px'
          }}
          type="range"
          value={parameters ? parameters.targetBrightness : undefined}
          onChange={this.handleChangeTargetBrightness}
          className="form-control custom-range"
          step="1"
          min="0"
          max="100"
        />
        <div className="row">
          <div className="col-md-6">
            <Localizer>
              <input
                type="text"
                className="form-control"
                value={parameters ? parameters.durationValue : undefined}
                onChange={this.handleChangeDuration}
                placeholder={<Text id="editScene.actionsCard.fadeInLights.inputPlaceholder" />}
              />
            </Localizer>
          </div>
          <div className="col-md-6">
            <select className="custom-select" value={parameters ? parameters.durationUnit : 'seconds'} onChange={this.handleChangeUnit}>
              <option value="seconds">
                <Text id="editScene.actionsCard.fadeInLights.seconds" />
              </option>
              <option value="minutes">
                <Text id="editScene.actionsCard.fadeInLights.minutes" />
              </option>
              <option value="hours">
                <Text id="editScene.actionsCard.fadeInLights.hours" />
              </option>
            </select>
          </div>
        </div>
      </div>
    );
  }
}

export default LightFadeInParams;
