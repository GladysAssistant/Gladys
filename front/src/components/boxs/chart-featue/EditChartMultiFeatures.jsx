import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { connect } from 'unistore/preact';
import Select from 'react-select';

import BaseEditBox from '../baseEditBox';
import RoomSelector from '../../house/RoomSelector';
import ChartTypeSelector from './ChartTypeSelector';
import ChartPeriodSelector from './ChartPeriodSelector';
import { getDeviceFeatureName } from '../../../utils/device';
import { DEVICE_FEATURE_TYPES } from '../../../../../server/utils/constants';

import actions from '../../../actions/dashboard/edit-boxes/editChartMultiFeatures';

@connect('httpClient', actions)
class EditChartMultiFeatures extends Component {
  updateBoxChartName = chartName => {
    this.props.updateBoxChartName(this.props.x, this.props.y, chartName.target.value);
  };

  updateBoxChartType = chartType => {
    this.props.updateBoxChartType(this.props.x, this.props.y, chartType.value);
  };

  updateBoxChartPeriod = chartPeriod => {
    this.props.updateBoxChartPeriod(this.props.x, this.props.y, chartPeriod.value);
  };

  updateBoxChartLimitClass = async chartLimitClass => {
    const chartLimitClassValue = chartLimitClass.target.value;
    const roomDiv = document.getElementById('room-div-' + this.props.x + '-' + this.props.y);
    if (chartLimitClassValue === 'no-limit') {
      this.props.updateBoxRoom(this.props.x, this.props.y, null);
      roomDiv.hidden = true;
    } else if (chartLimitClassValue === 'room-limit') {
      roomDiv.hidden = false;
      const houses = await this.props.httpClient.get(`/api/v1/house?expand=rooms`);
      if (houses && houses.length > 0 && houses[0].rooms && houses[0].rooms.length > 0) {
        this.props.updateBoxRoom(this.props.x, this.props.y, houses[0].rooms[0].selector);
      }
    }

    this.props.updateBoxChartLimitClass(this.props.x, this.props.y, chartLimitClassValue);
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

      const excludeFeatyreType = [
        DEVICE_FEATURE_TYPES.SENSOR.BINARY, 
        DEVICE_FEATURE_TYPES.CAMERA.IMAGE,
        DEVICE_FEATURE_TYPES.SENSOR.UNKNOWN,
        DEVICE_FEATURE_TYPES.UNKNOWN.UNKNOWN,
        DEVICE_FEATURE_TYPES.LIGHT.COLOR      
      ];

      let devices;
      if (this.props.box.chartLimitClass === 'room-limit') {
        // we get the rooms with the devices
        const room = await this.props.httpClient.get(`/api/v1/room/${this.props.box.room}?expand=devices`);
        devices = room.devices;
      } else {
        devices = await this.props.httpClient.get(`/api/v1/device`); 
      }

      const deviceOptions = [];
      const selectedDeviceFeaturesOptions = [];
      devices.forEach(device => {
        const roomDeviceFeatures = [];
        device.features.forEach(feature => {
          if( !excludeFeatyreType.includes(feature.type)){ 
            const featureOption = {
              value: feature.selector,
              label: getDeviceFeatureName(this.context.intl.dictionary, device, feature)
            }; 
            if (feature.read_only) { 
              roomDeviceFeatures.push(featureOption);
            }
            if (this.props.box.device_features && this.props.box.device_features.indexOf(feature.selector) !== -1) {
              selectedDeviceFeaturesOptions.push(featureOption);
            }
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
    const roomDiv = document.getElementById('room-div-' + this.props.x + '-' + this.props.y);
    if (!this.props.box.chartLimitClass || this.props.box.chartLimitClass === 'no-limit') {
      this.props.box.chartLimitClass = 'no-limit';
      roomDiv.hidden = true;
    } else if (this.props.chartLimitClass === 'room-limit') {
      roomDiv.hidden = false;
    }
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.box.room !== this.props.box.room ||
      prevProps.box.chartLimitClass !== this.props.box.chartLimitClass
    ) {
      this.getDeviceFeatures();
    }
  }

  render(props, { selectedDeviceFeaturesOptions, deviceOptions, loading }) {
    return (
      <BaseEditBox {...props} titleKey="dashboard.boxTitle.chart-multi-feature">
        <div class={loading ? 'dimmer active' : 'dimmer'}>
          <div class="loader" />
          <div class="dimmer-content">
            <div class="form-group">
              <Localizer>
                <input
                  type="text"
                  value={props.box.chartName}
                  onInput={this.updateBoxChartName}
                  class="form-control"
                  placeholder={<Text id="dashboard.boxes.devicesChart.editChartNamePlaceHolder" />}
                />
              </Localizer>
            </div>
            <div class="form-group">
              <label>
                <Text id="dashboard.boxes.devicesChart.editChartType" />
              </label>
              <ChartTypeSelector
                selectedChartType={props.box.chartType}
                updateChartTypeSelection={this.updateBoxChartType}
              />
            </div>
            <div class="form-group">
              <label>
                <Text id="dashboard.boxes.devicesChart.editChartPeriod" />
              </label>
              <ChartPeriodSelector
                selectedChartPeriod={props.box.chartPeriod}
                updateChartPeriodSelection={this.updateBoxChartPeriod}
              />
            </div>
            <div class="form-group">
              <label>
                <Text id="dashboard.boxes.devicesChart.editChartDeviceClass" />
              </label>
              <label class="custom-control custom-radio">
                <input
                  type="radio"
                  class="custom-control-input"
                  name={'chart-limitclass-radio-' + props.x + '-' + props.y}
                  onChange={this.updateBoxChartLimitClass}
                  value="no-limit"
                  checked={props.box.chartLimitClass === 'no-limit'}
                />
                <div class="custom-control-label">
                  <Text id="dashboard.boxes.devicesChart.editChartClass.no" />
                </div>
              </label>
              <label class="custom-control custom-radio">
                <input
                  type="radio"
                  class="custom-control-input"
                  name={'chart-limitclass-radio-' + props.x + '-' + props.y}
                  onChange={this.updateBoxChartLimitClass}
                  value="room-limit"
                  checked={props.box.chartLimitClass === 'room-limit'}
                />
                <div class="custom-control-label">
                  <Text id="dashboard.boxes.devicesChart.editChartClass.room" />
                </div>
              </label>
            </div>
            <div class="form-group" id={'room-div-' + props.x + '-' + props.y}>
              <label>
                <Text id="dashboard.boxes.devicesChart.editRoomLabel" />
              </label>
              <RoomSelector selectedRoom={props.box.room} updateRoomSelection={this.updateBoxRoom} />
            </div>
            {deviceOptions && (
              <div class="form-group">
                <label>
                  <Text id="dashboard.boxes.devicesChart.editDeviceFeaturesLabel" />
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

export default EditChartMultiFeatures;
