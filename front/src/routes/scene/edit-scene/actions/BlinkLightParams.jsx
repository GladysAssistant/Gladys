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
  handleChangeTimesToBlink = e => {
    let newValue = Number.isInteger(parseInt(e.target.value, 10)) ? parseInt(e.target.value, 10) : 0;
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'timesToBlink', newValue);
  };
  handleChangeWaitingTime = e => {
    let newValue = Number.isInteger(parseInt(e.target.value, 10)) ? parseInt(e.target.value, 10) : 0;
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'waitingTime', newValue);
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
  }

  componentWillReceiveProps(nextProps) {
    this.refreshSelectedOptions(nextProps);
  }

  render(props, { selectedOptions, deviceOptions }) {
    return (
      <div class="row">
        <div class="col-sm-4">
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
        <div class="col-sm-4">
          <div class="form-group">
            <div class="form-label">Répéter</div>
            <Localizer>
              <input
                type="text"
                class="form-control"
                value={props.action.timesToBlink}
                onChange={this.handleChangeTimesToBlink}
                placeholder={<Text id="editScene.actionsCard.blinkLights.timesToBlink.placeholder" />}
              />
            </Localizer>
          </div>
        </div>
        <div class="col-sm-4">
          <div class="form-group">
            <div class="form-label">toutes les</div>
            <Localizer>
              <div class="input-group">
                <input
                  type="text"
                  class="form-control"
                  value={props.action.waitingTime}
                  onChange={this.handleChangeWaitingTime}
                  aria-describedby="basic-addon2"
                  placeholder={<Text id="editScene.actionsCard.blinkLights.waitingTime.placeholder" />}
                />
                <div class="input-group-append">
                  <span class="input-group-text" id="basic-addon2">
                    ms
                  </span>
                </div>
              </div>
            </Localizer>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(BlinkLight);
