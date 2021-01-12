import { Text } from 'preact-i18n';
import get from 'get-value';
import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../../server/utils/constants';
import { NETATMO_VALUES } from '../../../../../../server/services/netatmo/lib/constants'
import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';


const CommandDeviceFeature = ({ children, ...props }) => {
  const netatmoSecurityLight=[];
  Object.keys(NETATMO_VALUES.SECURITY.LIGHT).forEach(key => {
    netatmoSecurityLight.push(NETATMO_VALUES.SECURITY.LIGHT[key])
  });

  return (
    <tr>
      <td>
        <i
          class={`mr-2 fe fe-${get(
            DeviceFeatureCategoriesIcon,
            `${props.deviceFeature.category}.${props.deviceFeature.type}`
          )}`}
        />
      </td>
      <td>{props.deviceFeature.name}</td>
      
      {props.deviceFeature.category === DEVICE_FEATURE_CATEGORIES.LIGHT &&
        props.deviceFeature.type === DEVICE_FEATURE_TYPES.LIGHT.STRING && (
        <td class="col-6 text-right">
          <div class="form-group">
            <select onChange={""} class="form-control">
              {netatmoSecurityLight.map(light => (
                <option  selected={light === props.deviceFeature.last_value} value={light}>
                  {<Text id={`integration.netatmo.DeviceFeatureValues.security.light.${light}`} />}
                </option>
              ))}
            </select>
          </div>
        </td>
      )}
    </tr>
  );
};

export default CommandDeviceFeature;