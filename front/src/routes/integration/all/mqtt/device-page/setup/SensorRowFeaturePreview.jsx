import get from 'get-value';
import { DeviceFeatureCategoriesIcon } from '../../../../../../utils/consts';

const SensorRowFeaturePreview = ({ label, category, type, children }) => (
  <tr>
    <td>
      <i class={`mr-2 fe fe-${get(DeviceFeatureCategoriesIcon, `${category}.${type}`, 'radio')}`} />
    </td>
    <td>{label}</td>
    <td class="text-right">{children}</td>
  </tr>
);

export default SensorRowFeaturePreview;
