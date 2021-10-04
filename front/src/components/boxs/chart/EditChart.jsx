import { Component } from 'preact';
import { Localizer, Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import Select from 'react-select';
import get from 'get-value';

import BaseEditBox from '../baseEditBox';
import Chart from './Chart';
import RoomSelector from '../../house/RoomSelector';
import { getDeviceFeatureName } from '../../../utils/device';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import { DEVICE_FEATURE_TYPES } from '../../../../../server/utils/constants';

class EditChart extends Component {
  updateBoxRoom = room => {
    this.props.updateBoxConfig(this.props.x, this.props.y, { room: room.selector, device_feature: null });
  };

  updateDefaultInterval = e => {
    if (e.target.value && e.target.value.length) {
      this.props.updateBoxConfig(this.props.x, this.props.y, { interval: e.target.value });
    } else {
      this.props.updateBoxConfig(this.props.x, this.props.y, { interval: undefined });
    }
  };

  updateChartType = e => {
    if (e.target.value && e.target.value.length) {
      this.props.updateBoxConfig(this.props.x, this.props.y, { chart_type: e.target.value });
    } else {
      this.props.updateBoxConfig(this.props.x, this.props.y, { chart_type: undefined });
    }
  };

  updateDisplayAxes = e => {
    if (e.target.value && e.target.value.length) {
      const valueBoolean = e.target.value === 'yes';
      this.props.updateBoxConfig(this.props.x, this.props.y, { display_axes: valueBoolean });
    } else {
      this.props.updateBoxConfig(this.props.x, this.props.y, { display_axes: undefined });
    }
  };

  updateBoxTitle = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, { title: e.target.value });
  };

  updateDeviceFeatures = selectedDeviceFeaturesOption => {
    if (selectedDeviceFeaturesOption) {
      const currentDeviceFeature = this.deviceFeatureBySelector.get(selectedDeviceFeaturesOption.value);
      this.props.updateBoxConfig(this.props.x, this.props.y, {
        device_feature: selectedDeviceFeaturesOption.value,
        unit: currentDeviceFeature && currentDeviceFeature.unit ? currentDeviceFeature.unit : undefined
      });
    } else {
      this.props.updateBoxConfig(this.props.x, this.props.y, {
        device_feature: null
      });
    }
    this.setState({ selectedDeviceFeaturesOption });
  };

  getDeviceFeatures = async () => {
    try {
      this.setState({ loading: true });
      // we get the rooms with the devices
      const room = await this.props.httpClient.get(`/api/v1/room/${this.props.box.room}?expand=devices`);
      const deviceOptions = [];
      let selectedDeviceFeaturesOption = null;

      room.devices.forEach(device => {
        const roomDeviceFeatures = [];
        device.features.forEach(feature => {
          const featureOption = {
            value: feature.selector,
            label: getDeviceFeatureName(this.props.intl.dictionary, device, feature)
          };
          this.deviceFeatureBySelector.set(feature.selector, feature);
          // for now, we only supports binary on/off and sensors
          if (feature.type !== DEVICE_FEATURE_TYPES.LIGHT.BINARY) {
            roomDeviceFeatures.push(featureOption);
          }
          if (this.props.box.device_feature && this.props.box.device_feature === feature.selector) {
            selectedDeviceFeaturesOption = featureOption;
          }
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
            label: device.name,
            options: roomDeviceFeatures
          });
        }
      });
      await this.setState({ deviceOptions, selectedDeviceFeaturesOption, loading: false });
    } catch (e) {
      console.error(e);
      this.setState({ loading: false });
    }
  };

  constructor(props) {
    super(props);
    this.props = props;
    this.deviceFeatureBySelector = new Map();
  }

  componentDidMount() {
    if (this.props.box.room) {
      this.getDeviceFeatures();
    }
  }

  componentDidUpdate(previousProps) {
    const deviceFeatureChanged = get(previousProps, 'box.device_feature') !== get(this.props, 'box.device_feature');
    const unitChanged = get(previousProps, 'box.unit') !== get(this.props, 'box.unit');
    const roomChanged = get(previousProps, 'box.room') !== get(this.props, 'box.room');
    if (deviceFeatureChanged || unitChanged || roomChanged) {
      this.getDeviceFeatures();
    }
  }

  render(props, { selectedDeviceFeaturesOption, deviceOptions, loading }) {
    return (
      <BaseEditBox {...props} titleKey="dashboard.boxTitle.chart">
        <div class={loading ? 'dimmer active' : 'dimmer'}>
          <div class="loader" />
          <div class="dimmer-content">
            <div class="form-group">
              <label>
                <Text id="dashboard.boxes.chart.editRoomLabel" />
              </label>
              <RoomSelector selectedRoom={props.box.room} updateRoomSelection={this.updateBoxRoom} />
            </div>
            {deviceOptions && props.box.room && (
              <div class="form-group">
                <label>
                  <Text id="dashboard.boxes.chart.editDeviceFeaturesLabel" />
                </label>
                <Select
                  defaultValue={null}
                  value={selectedDeviceFeaturesOption}
                  onChange={this.updateDeviceFeatures}
                  options={deviceOptions}
                />
              </div>
            )}
            {deviceOptions && props.box.room && (
              <div class="form-group">
                <label>
                  <Text id="dashboard.boxes.chart.editNameLabel" />
                </label>
                <Localizer>
                  <input
                    type="text"
                    class="form-control"
                    placeholder={<Text id="dashboard.boxes.chart.editNamePlaceholder" />}
                    value={props.box.title}
                    onChange={this.updateBoxTitle}
                  />
                </Localizer>
              </div>
            )}
            <div class="form-group">
              <label>
                <Text id="dashboard.boxes.chart.chartType" />
              </label>
              <select onChange={this.updateChartType} class="form-control" value={props.box.chart_type}>
                <option>
                  <Text id="global.emptySelectOption" />
                </option>
                <option value="line">
                  <Text id="dashboard.boxes.chart.line" />
                </option>
                <option value="stepline">
                  <Text id="dashboard.boxes.chart.stepline" />
                </option>
                <option value="area">
                  <Text id="dashboard.boxes.chart.area" />
                </option>
                <option value="bar">
                  <Text id="dashboard.boxes.chart.bar" />
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>
                <Text id="dashboard.boxes.chart.displayAxes" />
              </label>
              <select
                onChange={this.updateDisplayAxes}
                class="form-control"
                value={props.box.display_axes ? 'yes' : 'no'}
              >
                <option>
                  <Text id="global.emptySelectOption" />
                </option>
                <option value="yes">
                  <Text id="dashboard.boxes.chart.yes" />
                </option>
                <option value="no">
                  <Text id="dashboard.boxes.chart.no" />
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>
                <Text id="dashboard.boxes.chart.defaultInterval" />
              </label>
              <select onChange={this.updateDefaultInterval} class="form-control" value={props.box.interval}>
                <option>
                  <Text id="global.emptySelectOption" />
                </option>
                <option value="last-hour">
                  <Text id="dashboard.boxes.chart.lastHour" />
                </option>
                <option value="last-day">
                  <Text id="dashboard.boxes.chart.lastDay" />
                </option>
                <option value="last-week">
                  <Text id="dashboard.boxes.chart.lastSevenDays" />
                </option>
                <option value="last-month">
                  <Text id="dashboard.boxes.chart.lastThirtyDays" />
                </option>
                <option value="last-three-months">
                  <Text id="dashboard.boxes.chart.lastThreeMonths" />
                </option>
                <option value="last-year">
                  <Text id="dashboard.boxes.chart.lastYear" />
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>
                <Text id="dashboard.boxes.chart.preview" />
              </label>
              <Chart box={props.box} />
            </div>
          </div>
        </div>
      </BaseEditBox>
    );
  }
}

export default withIntlAsProp(connect('httpClient', {})(EditChart));
