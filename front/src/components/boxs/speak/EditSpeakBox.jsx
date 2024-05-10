import { Component } from 'preact';
import { Localizer, Text } from 'preact-i18n';
import BaseEditBox from '../baseEditBox';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import { connect } from 'unistore/preact';
import slugify from '../../../utils/slugify';
import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../server/utils/constants';

class EditSpeakBox extends Component {
  updateDeviceName = e => {
    this.setState({ deviceName: e.target.value });
  };
  getCurrentDevice = async () => {
    if (this.props.box.device) {
      const currentDevice = await this.props.httpClient.get(`/api/v1/device/${this.props.box.device}`);
      this.setState({ currentDevice, deviceName: currentDevice.name });
    }
  };
  save = async () => {
    const browserMusicIntegration = await this.props.httpClient.get(`/api/v1/service/browser-music`, {
      pod_id: null
    });
    let newDevice;
    if (this.state.currentDevice) {
      newDevice = { ...this.state.currentDevice, name: this.state.deviceName };
    } else {
      const externalIdDevice = slugify(`browser-music:${this.state.deviceName}`);
      newDevice = {
        name: this.state.deviceName,
        service_id: browserMusicIntegration.id,
        external_id: externalIdDevice,
        selector: externalIdDevice,
        features: [
          {
            name: 'Play notification',
            selector: `${externalIdDevice}:play-notification`,
            category: DEVICE_FEATURE_CATEGORIES.MUSIC,
            type: DEVICE_FEATURE_TYPES.MUSIC.PLAY_NOTIFICATION,
            external_id: `${externalIdDevice}:play-notification`,
            min: 0,
            max: 1,
            read_only: false,
            has_feedback: false
          }
        ]
      };
    }
    const deviceCreated = await this.props.httpClient.post('/api/v1/device', newDevice);
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      device: deviceCreated.selector
    });
  };
  componentDidMount = () => {
    this.getCurrentDevice();
  };

  render(props, { loading, deviceName }) {
    return (
      <BaseEditBox {...props} titleKey="dashboard.boxTitle.speak">
        <div class={loading ? 'dimmer active' : 'dimmer'}>
          <div class="loader" />
          <div class="dimmer-content">
            <div class="form-group">
              <label>
                <Text id="dashboard.boxes.speak.editDeviceName" />
              </label>
              <Localizer>
                <input
                  type="text"
                  className="form-control"
                  placeholder={<Text id="dashboard.boxes.speak.editDeviceNamePlaceholder" />}
                  value={deviceName}
                  onInput={this.updateDeviceName}
                />
              </Localizer>
            </div>
            <div class="form-group">
              <button class="btn btn-success" onClick={this.save}>
                Save
              </button>
            </div>
          </div>
        </div>
      </BaseEditBox>
    );
  }
}

export default withIntlAsProp(connect('httpClient', {})(EditSpeakBox));
