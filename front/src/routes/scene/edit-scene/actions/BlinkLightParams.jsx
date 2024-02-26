import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import Select from 'react-select';

class BlinkLight extends Component {
  getOptions = async () => {
    try {
      const devices = await this.props.httpClient.get('/api/v1/device', {
        device_feature_category: 'light',
        device_feature_type: 'binary'
      });
      const deviceOptions = devices.map(device => ({
        value: device.selector,
        label: device.name
      }));
      await this.setState({ deviceOptions });
      this.refreshSelectedOptions(this.props);
      return deviceOptions;
    } catch (e) {
      console.error(e);
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
  handleChangeBlinkingTime = e => {
    let newValue = Number.isInteger(parseInt(e.target.value, 10)) ? parseInt(e.target.value, 10) : 0;
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'blinking_time', newValue);
  };
  handleChangeBlinkingSpeed = e => {
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'blinking_speed', e.target.value);
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
      selectedOptions: []
    };
  }
  async componentDidMount() {
    this.getOptions();
    if (!this.props.action.blinking_speed) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'blinking_speed', 'slow');
    }
  }

  componentWillReceiveProps(nextProps) {
    this.refreshSelectedOptions(nextProps);
  }

  render(props, { selectedOptions, deviceOptions }) {
    return (
      <div>
        <div class="row">
          <div class="col-sm-12">
            <div class="form-group">
              <div class="form-label">
                <Text id="editScene.actionsCard.blinkLigths.label" />
              </div>
              <Select
                defaultValue={[]}
                isMulti
                value={selectedOptions}
                onChange={this.handleChange}
                options={deviceOptions}
              />
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-sm-6">
            <div class="form-group">
              <div class="form-label">
                <Text id="editScene.actionsCard.blinkLights.blinkingTime.label" />
              </div>
              <Localizer>
                <input
                  type="text"
                  class="form-control"
                  value={props.action.blinking_time}
                  onChange={this.handleChangeBlinkingTime}
                  placeholder={<Text id="editScene.actionsCard.blinkLights.blinkingTime.placeholder" />}
                />
              </Localizer>
            </div>
          </div>
          <div class="col-sm-6">
            <div class="form-group">
              <div class="form-label">
                <Text id="editScene.actionsCard.blinkLights.blinkingSpeed.label" />
              </div>
              <select
                class="custom-select"
                value={props.action.blinking_speed}
                onChange={this.handleChangeBlinkingSpeed}
              >
                <option value="slow">
                  <Text id="editScene.actionsCard.blinkLights.blinkingSpeed.slow" />
                </option>
                <option value="medium">
                  <Text id="editScene.actionsCard.blinkLights.blinkingSpeed.medium" />
                </option>
                <option value="fast">
                  <Text id="editScene.actionsCard.blinkLights.blinkingSpeed.fast" />
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(BlinkLight);
