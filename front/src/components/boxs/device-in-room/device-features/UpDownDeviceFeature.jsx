import get from 'get-value';

import { getDeviceName } from './utils';
import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';

const UpDownDeviceFeature = ({ children, ...props }) => {
  function updateValue(value) {
    props.updateValueWithDebounce(
      props.x,
      props.y,
      props.device,
      props.deviceFeature,
      props.deviceIndex,
      props.deviceFeatureIndex,
      value,
      props.deviceFeature.last_value
    );
  }

  function up() {
    updateValue(0);
  }

  function down() {
    updateValue(1);
  }

  function stop() {
    updateValue(2);
  }

  return (
    <tr>
      <td>
        <i
          class={`fe fe-${get(
            DeviceFeatureCategoriesIcon,
            `${props.deviceFeature.category}.${props.deviceFeature.type}`,
            { default: 'sliders' }
          )}`}
        />
      </td>
      <td>{getDeviceName(props.device, props.deviceFeature)}</td>

      <td class="py-0">
        <div class="d-flex justify-content-end">
          <button class="btn btn-secondary fe fe-chevron-down mx-1" onClick={down} />
          <button class="btn btn-secondary fe fe-pause" onClick={stop} />
          <button class="btn btn-secondary fe fe-chevron-up mx-1" onClick={up} />
        </div>
      </td>
    </tr>
  );
};

export default UpDownDeviceFeature;
