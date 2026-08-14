import { Component } from 'preact';
import get from 'get-value';
import { Text } from 'preact-i18n';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';

// Recall-a-preset row. Recalling a preset is an action, not a state: no option stays
// selected, and the select returns to its placeholder after each command.
class CameraPresetDeviceFeature extends Component {
  recallPreset = e => {
    const { value } = e.currentTarget;
    if (value === '') {
      return;
    }
    this.props.updateValue(this.props.deviceFeature, Number(value));
    e.currentTarget.value = '';
  };

  render(props) {
    const { category, type } = props.deviceFeature;
    const supportedOptions = Array.isArray(props.deviceFeature.supported_options)
      ? [...props.deviceFeature.supported_options].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      : [];

    if (supportedOptions.length === 0) {
      return null;
    }

    return (
      <tr>
        <td>
          <i class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${category}.${type}`, { default: 'map-pin' })}`} />
        </td>
        <td>{props.rowName}</td>
        <td class="text-right py-0">
          <div class="d-flex justify-content-end">
            <select value="" onChange={this.recallPreset} class="form-control form-control-sm">
              <option value="">
                <Text id="dashboard.boxes.devicesInRoom.cameraPresetPlaceholder" />
              </option>
              {supportedOptions.map(option => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </td>
      </tr>
    );
  }
}

export default CameraPresetDeviceFeature;
