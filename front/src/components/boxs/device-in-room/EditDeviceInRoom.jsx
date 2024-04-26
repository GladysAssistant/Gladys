import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import Select from 'react-select';
import BaseEditBox from '../baseEditBox';
import RoomSelector from '../../house/RoomSelector';
import { getDeviceFeatureName } from '../../../utils/device';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import SUPPORTED_FEATURE_TYPES from './SupportedFeatureTypes';

class EditDeviceInRoom extends Component {
  updateBoxRoom = room => {
    this.props.updateBoxConfig(this.props.x, this.props.y, { room: room.selector, device_features: [] });
  };

  updateDeviceFeatures = selectedDeviceFeaturesOptions => {
    selectedDeviceFeaturesOptions = selectedDeviceFeaturesOptions || [];
    const deviceFeatures = selectedDeviceFeaturesOptions.map(option => option.value);
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      device_features: deviceFeatures
    });
    this.setState({ selectedDeviceFeaturesOptions });
  };

  getDeviceFeatures = async () => {
    try {
      this.setState({ loading: true });
      // we get the rooms with the devices
      const room = await this.props.httpClient.get(`/api/v1/room/${this.props.box.room}`, { expand: 'devices' });
      const deviceOptions = [];
      const selectedDeviceFeaturesOptions = [];

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
      await this.setState({ room, deviceOptions, selectedDeviceFeaturesOptions, loading: false });
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
    if (prevProps.box && this.props.box && this.props.box.room) {
      const deviceFeaturesChanged = prevProps.box.device_features !== this.props.box.device_features;
      const roomChanged = prevProps.box.room !== this.props.box.room;
      if (deviceFeaturesChanged || roomChanged) {
        this.getDeviceFeatures();
      }
    }
  }

  render(props, { selectedDeviceFeaturesOptions, deviceOptions, loading, room }) {
    const roomName = room && room.name;
    return (
      <BaseEditBox {...props} titleKey="dashboard.boxTitle.devices-in-room" titleValue={roomName}>
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
                  defaultValue={[]}
                  value={selectedDeviceFeaturesOptions}
                  isMulti
                  onChange={this.updateDeviceFeatures}
                  options={deviceOptions}
                  maxMenuHeight={220}
                />
              </div>
            )}
          </div>
        </div>
      </BaseEditBox>
    );
  }
}

export default withIntlAsProp(connect('httpClient', {})(EditDeviceInRoom));
