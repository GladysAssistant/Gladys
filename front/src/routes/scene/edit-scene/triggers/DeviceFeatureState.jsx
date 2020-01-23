import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import Select from 'react-select';
import cx from 'classnames';

@connect('httpClient', {})
class TurnOnLight extends Component {
  getOptions = async () => {
    try {
      const rooms = await this.props.httpClient.get('/api/v1/room?expand=devices');
      const deviceOptions = [];
      rooms.forEach(room => {
        const roomDeviceFeatures = [];
        room.devices.forEach(device => {
          device.features.forEach(feature => {
            roomDeviceFeatures.push({
              value: feature.selector,
              label: feature.name,
              type: feature.type,
              unit: feature.unit
            });
          });
        });
        if (roomDeviceFeatures.length > 0) {
          deviceOptions.push({
            label: room.name,
            options: roomDeviceFeatures
          });
        }
      });
      await this.setState({ deviceOptions });
      this.refreshSelectedOptions(this.props);
      return deviceOptions;
    } catch (e) {
      console.log(e);
    }
  };
  handleChange = selectedOption => {
    if (selectedOption && selectedOption.value) {
      this.props.updateTriggerProperty(this.props.index, 'deviceFeature', selectedOption.value);
      this.props.updateTriggerProperty(this.props.index, 'value', null);
    } else {
      this.props.updateTriggerProperty(this.props.index, 'deviceFeature', null);
    }
    if (selectedOption && selectedOption.type === 'binary') {
      this.props.updateTriggerProperty(this.props.index, 'operator', '=');
    }
  };
  handleOperatorChange = e => {
    this.props.updateTriggerProperty(this.props.index, 'operator', e.target.value);
  };
  handleValueChange = e => {
    if (!isNaN(parseFloat(e.target.value))) {
      this.props.updateTriggerProperty(this.props.index, 'value', parseFloat(e.target.value));
    } else {
      this.props.updateTriggerProperty(this.props.index, 'value', null);
    }
  };
  handleValueChangeBinary = newValue => () => {
    this.props.updateTriggerProperty(this.props.index, 'value', newValue);
  };
  refreshSelectedOptions = nextProps => {
    let selectedOption = '';
    if (nextProps.trigger.deviceFeature && this.state.deviceOptions) {
      let deviceOption;
      let i = 0;
      while (i < this.state.deviceOptions.length && deviceOption === undefined) {
        deviceOption = this.state.deviceOptions[i].options.find(
          option => option.value === nextProps.trigger.deviceFeature
        );
        i++;
      }

      if (deviceOption) {
        selectedOption = deviceOption;
      }
    }
    this.setState({ selectedOption });
  };
  getBinaryOperator = () => (
    <div class="col-3">
      <div class="text-center" style={{ marginTop: '10px' }}>
        <i class="fe fe-arrow-right" style={{ fontSize: '20px' }} />
      </div>
    </div>
  );
  getBinaryButtons = () => (
    <div class="col-4">
      <div class="form-group">
        <div class="row">
          <div class="col-6">
            <button
              class={cx('btn btn-block', {
                'btn-primary': this.props.trigger.value === 1,
                'btn-outline-primary': this.props.trigger.value !== 1,
                active: this.props.trigger.value === 1
              })}
              onClick={this.handleValueChangeBinary(1)}
            >
              On
            </button>
          </div>
          <div class="col-6">
            <button
              class={cx('btn btn-block', {
                'btn-primary': this.props.trigger.value === 0,
                'btn-outline-primary': this.props.trigger.value !== 0,
                active: this.props.trigger.value === 0
              })}
              onClick={this.handleValueChangeBinary(0)}
            >
              Off
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  constructor(props) {
    super(props);
    this.state = {
      deviceOptions: null,
      selectedOption: ''
    };
  }
  async componentDidMount() {
    this.getOptions();
  }
  componentWillReceiveProps(nextProps) {
    this.refreshSelectedOptions(nextProps);
  }

  render(props, { selectedOption, deviceOptions }) {
    return (
      <div>
        <div class="row">
          <div class="col-5">
            <div class="form-group">
              <Select defaultValue={''} value={selectedOption} onChange={this.handleChange} options={deviceOptions} />
            </div>
          </div>
          {selectedOption && selectedOption.type === 'binary' && this.getBinaryOperator()}
          {selectedOption && selectedOption.type === 'binary' && this.getBinaryButtons()}
          {selectedOption && selectedOption.type !== 'binary' && (
            <div class="col-3">
              <div class="form-group">
                <select class="form-control" onChange={this.handleOperatorChange} value={props.trigger.operator}>
                  <option value="">-----</option>
                  <option value="=">equal</option>
                  <option value=">=">superior or equal</option>
                  <option value=">">superior</option>
                  <option value="!=">different</option>
                  <option value="<=">less or equal</option>
                  <option value="<">less</option>
                </select>
              </div>
            </div>
          )}
          {selectedOption && selectedOption.type !== 'binary' && (
            <div class="col-4">
              <div class="form-group">
                <div class="input-group">
                  <input
                    type="text"
                    class="form-control"
                    placeholder="Value"
                    value={props.trigger.value}
                    onChange={this.handleValueChange}
                  />
                  {selectedOption && selectedOption.unit && (
                    <span class="input-group-append" id="basic-addon2">
                      <span class="input-group-text">
                        <Text id={`deviceFeatureUnitShort.${selectedOption.unit}`} />
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default TurnOnLight;
