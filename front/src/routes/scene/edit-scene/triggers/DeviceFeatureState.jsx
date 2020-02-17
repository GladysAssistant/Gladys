import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
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
          roomDeviceFeatures.sort((a, b) => {
            if (a.label < b.label) {
              return -1;
            } else if (a.label > b.label) {
              return 1;
            }
            return 0;
          });
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
      this.props.updateTriggerProperty(this.props.index, 'device_feature', selectedOption.value);
      this.props.updateTriggerProperty(this.props.index, 'value', null);
    } else {
      this.props.updateTriggerProperty(this.props.index, 'device_feature', null);
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
    if (nextProps.trigger.device_feature && this.state.deviceOptions) {
      let deviceOption;
      let i = 0;
      while (i < this.state.deviceOptions.length && deviceOption === undefined) {
        deviceOption = this.state.deviceOptions[i].options.find(
          option => option.value === nextProps.trigger.device_feature
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
    <div class="col-2">
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
              <Text id="editScene.triggersCard.newState.on" />
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
              <Text id="editScene.triggersCard.newState.off" />
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
          <div class="col-6">
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
                  <option value="=">
                    <Text id="editScene.triggersCard.newState.equal" />
                  </option>
                  <option value=">=">
                    <Text id="editScene.triggersCard.newState.superiorOrEqual" />
                  </option>
                  <option value=">">
                    <Text id="editScene.triggersCard.newState.superior" />
                  </option>
                  <option value="!=">
                    <Text id="editScene.triggersCard.newState.different" />
                  </option>
                  <option value="<=">
                    <Text id="editScene.triggersCard.newState.lessOrEqual" />
                  </option>
                  <option value="<">
                    <Text id="editScene.triggersCard.newState.less" />
                  </option>
                </select>
              </div>
            </div>
          )}
          {selectedOption && selectedOption.type !== 'binary' && (
            <div class="col-3">
              <div class="form-group">
                <div class="input-group">
                  <Localizer>
                    <input
                      type="text"
                      class="form-control"
                      placeholder={<Text id="editScene.triggersCard.newState.valuePlaceholder" />}
                      value={props.trigger.value}
                      onChange={this.handleValueChange}
                    />
                  </Localizer>
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
