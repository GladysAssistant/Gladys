import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import Select from 'react-select';

import BaseEditBox from '../baseEditBox';
import RoomSelector from '../../house/RoomSelector';
import ChartSelector from './ChartSelector';
import { getDeviceFeatureName } from '../../../utils/device';
import { DEVICE_FEATURE_TYPES } from '../../../../../server/utils/constants';

import actions from '../../../actions/dashboard/edit-boxes/editDevicesInRoomChart';

@connect('httpClient', actions)
class EditDeviceInRoomChart extends Component {
  updateBoxChart = chart => {
    this.props.updateBoxChart(this.props.x, this.props.y, chart.selector);
  };

  updateBoxRoom = room => {
    this.props.updateBoxRoom(this.props.x, this.props.y, room.selector);
    this.updateDeviceFeatures([]);
  };

  updateDeviceFeatures = selectedDeviceFeaturesOptions => {
    selectedDeviceFeaturesOptions = selectedDeviceFeaturesOptions || [];
    const deviceFeatures = selectedDeviceFeaturesOptions.map(option => option.value);
    this.props.updateBoxDeviceFeatures(this.props.x, this.props.y, deviceFeatures);
    this.setState({ selectedDeviceFeaturesOptions });
  };

  getDeviceFeatures = async () => {
    try {
      this.setState({ loading: true });
      console.log(this.props.box.chartType);

      // we get the rooms with the devices
      const room = await this.props.httpClient.get(`/api/v1/room/${this.props.box.room}?expand=devices`);
      const deviceOptions = [];
      const selectedDeviceFeaturesOptions = [];

      room.devices.forEach(device => {
        const roomDeviceFeatures = [];
        device.features.forEach(feature => {
          const featureOption = {
            value: feature.selector,
            label: getDeviceFeatureName(this.context.intl.dictionary, device, feature)
          };
          // for now, we only supports binary on/off and sensors
          if (feature.read_only || feature.type === DEVICE_FEATURE_TYPES.LIGHT.BINARY) {
            roomDeviceFeatures.push(featureOption);
          }
          if (this.props.box.device_features && this.props.box.device_features.indexOf(feature.selector) !== -1) {
            selectedDeviceFeaturesOptions.push(featureOption);
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
      await this.setState({ deviceOptions, selectedDeviceFeaturesOptions, loading: false });
    } catch (e) {
      console.log(e);
      this.setState({ loading: false });
    }
  };

  componentDidMount() {
    this.getDeviceFeatures();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.box.room !== this.props.box.room) {
      this.getDeviceFeatures();
    }
  }

  render(props, { selectedDeviceFeaturesOptions, deviceOptions, loading }) {
    return (
      <BaseEditBox {...props} titleKey="dashboard.boxTitle.chart-devices-in-room">
        <div class={loading ? 'dimmer active' : 'dimmer'}>
          <div class="loader" />
          <div class="dimmer-content">
            <div class="form-group">
              <label>
                <Text id="dashboard.boxes.devicesInRoomChart.editChartStyle" />
              </label>
              {props.box.chartType}
              <ChartSelector selectedChartType={props.box.chartType} updateChartSelection={this.updateBoxChart} />
            </div>
            <div class="form-group">
              <label>
                <Text id="dashboard.boxes.devicesInRoomChart.editRoomLabel" />
              </label>
              <RoomSelector selectedRoom={props.box.room} updateRoomSelection={this.updateBoxRoom} />
            </div>
            {deviceOptions && props.box.room && (
              <div class="form-group">
                <label>
                  <Text id="dashboard.boxes.devicesInRoomChart.editDeviceFeaturesLabel" />
                </label>
                <Select
                  defaultValue={[]}
                  value={selectedDeviceFeaturesOptions}
                  isMulti
                  onChange={this.updateDeviceFeatures}
                  options={deviceOptions}
                />
              </div>
            )}
          </div>
        </div>
      </BaseEditBox>
    );
  }
}

export default EditDeviceInRoomChart;
