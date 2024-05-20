import get from 'get-value';
import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import ShutterButtons from '../../../device/ShutterButtons';

const CoverDeviceFeature = ({ children, ...props }) => {
  const { deviceFeature } = props;
  const { category, type, last_value: lastValue } = deviceFeature;

  function updateValue(value) {
    props.updateValueWithDebounce(deviceFeature, value);
  }

  return (
    <tr>
      <td>
        <i class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${category}.${type}`, { default: 'sliders' })}`} />
      </td>
      <td>{props.rowName}</td>

      <td class="py-0">
        <div class="d-flex justify-content-end">
          <ShutterButtons category={category} type={type} updateValue={updateValue} value={lastValue} isLive />
        </div>
      </td>
    </tr>
  );
};

export default CoverDeviceFeature;
