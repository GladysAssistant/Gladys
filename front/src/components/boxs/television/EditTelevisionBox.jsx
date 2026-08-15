import { Component } from 'preact';
import { Text } from 'preact-i18n';
import Select from 'react-select';
import { connect } from 'unistore/preact';

import BaseEditBox from '../baseEditBox';
import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../server/utils/constants';

class EditTelevisionBoxComponent extends Component {
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
      let televisionDevices = await this.props.httpClient.get('/api/v1/device', {
        device_feature_category: DEVICE_FEATURE_CATEGORIES.TELEVISION
      });
      televisionDevices = televisionDevices.filter(d =>
        d.features.find(f => f.type === DEVICE_FEATURE_TYPES.TELEVISION.PLAY)
      );
      const televisionDevicesOptions = televisionDevices.map(d => ({
        label: d.name,
        value: d.selector
      }));
      this.setState({
        televisionDevicesOptions
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

  render(props, { televisionDevicesOptions }) {
    let optionSelected = null;
    if (televisionDevicesOptions && props.box.device) {
      optionSelected = televisionDevicesOptions.find(o => o.value === props.box.device);
    }
    return (
      <BaseEditBox {...props} titleKey="dashboard.boxTitle.television">
        <div class="form-group">
          <label>
            <Text id="dashboard.boxes.television.selectDeviceLabel" />
          </label>
          <Select
            defaultValue={null}
            value={optionSelected}
            onChange={this.updateDevice}
            options={televisionDevicesOptions}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>
      </BaseEditBox>
    );
  }
}

export default connect('httpClient', {})(EditTelevisionBoxComponent);
