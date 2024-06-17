import { Component } from 'preact';
import { Text } from 'preact-i18n';
import Select from 'react-select';
import { connect } from 'unistore/preact';

import BaseEditBox from '../baseEditBox';
import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../server/utils/constants';

class EditMusicBoxComponent extends Component {
  updateDevice = option => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      device: option ? option.value : null
    });
  };

  getDevices = async () => {
    try {
      await this.setState({
        error: false
      });
      let musicDevices = await this.props.httpClient.get('/api/v1/device', {
        device_feature_category: DEVICE_FEATURE_CATEGORIES.MUSIC
      });
      // We only keep music player with at least the "play" capability
      // Some music devices like the Nest Mini only exposes the "notification" for now
      musicDevices = musicDevices.filter(d => d.features.find(f => f.type === DEVICE_FEATURE_TYPES.MUSIC.PLAY));
      const musicDevicesOptions = musicDevices.map(d => ({
        label: d.name,
        value: d.selector
      }));
      this.setState({
        musicDevicesOptions
      });
    } catch (e) {
      console.error(e);
      this.setState({
        error: true
      });
    }
  };

  componentDidMount() {
    this.getDevices();
  }

  render(props, { musicDevicesOptions }) {
    let optionSelected = null;
    if (musicDevicesOptions && props.box.device) {
      optionSelected = musicDevicesOptions.find(o => o.value === props.box.device);
    }
    return (
      <BaseEditBox {...props} titleKey="dashboard.boxTitle.music">
        <div class="form-group">
          <label>
            <Text id="dashboard.boxes.music.selectDeviceLabel" />
          </label>
          <Select
            defaultValue={null}
            value={optionSelected}
            onChange={this.updateDevice}
            options={musicDevicesOptions}
          />
        </div>
      </BaseEditBox>
    );
  }
}

export default connect('httpClient', {})(EditMusicBoxComponent);
