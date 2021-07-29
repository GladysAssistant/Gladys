import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import Select from 'react-select';

import BaseEditBox from '../baseEditBox';
import RoomSelector from '../../house/RoomSelector';
import { getDeviceFeatureName } from '../../../utils/device';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import { DEVICE_FEATURE_TYPES } from '../../../../../server/utils/constants';

const SUPPORTED_FEATURE_TYPES = [
  DEVICE_FEATURE_TYPES.LIGHT.BINARY,
  DEVICE_FEATURE_TYPES.LIGHT.COLOR,
  DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
  DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
  DEVICE_FEATURE_TYPES.SWITCH.DIMMER
];

class EditChart extends Component {
  updateBoxRoom = room => {
    this.props.updateBoxConfig(this.props.x, this.props.y, { room: room.selector, device_feature: null });
  };

  updateDeviceFeatures = selectedDeviceFeaturesOption => {
    if (selectedDeviceFeaturesOption) {
      this.props.updateBoxConfig(this.props.x, this.props.y, {
        device_feature: selectedDeviceFeaturesOption.value
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
          // for now, we only supports binary on/off and sensors
          if (feature.read_only || SUPPORTED_FEATURE_TYPES.includes(feature.type)) {
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

  componentDidMount() {
    if (this.props.box.room) {
      this.getDeviceFeatures();
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.box.room !== this.props.box.room && this.props.box.room) {
      this.getDeviceFeatures();
    }
  }

  render(props, { selectedDeviceFeaturesOption, deviceOptions, loading }) {
    return (
      <BaseEditBox {...props} titleKey="dashboard.boxTitle.devices-in-room">
        <div class={loading ? 'dimmer active' : 'dimmer'}>
          <div class="loader" />
          <div class="dimmer-content">
            <div class="form-group">
              <label>
                <Text id="dashboard.boxes.devicesInRoom.editRoomLabel" />
              </label>
              <RoomSelector selectedRoom={props.box.room} updateRoomSelection={this.updateBoxRoom} />
            </div>
            {deviceOptions && props.box.room && (
              <div class="form-group">
                <label>
                  <Text id="dashboard.boxes.devicesInRoom.editDeviceFeaturesLabel" />
                </label>
                <Select
                  defaultValue={null}
                  value={selectedDeviceFeaturesOption}
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

export default withIntlAsProp(connect('httpClient', {})(EditChart));
