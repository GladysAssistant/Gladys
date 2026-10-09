import get from 'get-value';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { resolveFeatureOptions } from '../../../../utils/supportedOptions';
import { SIREN_MODE } from '../../../../../../server/utils/constants';
import AdaptiveOptionControl from './AdaptiveOptionControl';

const MODE_OPTIONS = [
  { value: SIREN_MODE.IDLE, i18nKey: 'idle' },
  { value: SIREN_MODE.SOUND, i18nKey: 'sound' },
  { value: SIREN_MODE.LIGHT, i18nKey: 'light' },
  { value: SIREN_MODE.SOUND_AND_LIGHT, i18nKey: 'sound_and_light' }
];

const SirenAlarmModeDeviceFeature = props => {
  const { deviceFeature } = props;
  const { category, type } = deviceFeature;
  const rawValue = deviceFeature.last_value;
  const lastValue = rawValue != null && !Number.isNaN(Number(rawValue)) ? Number(rawValue) : rawValue;

  // Sirens do not all offer the same effects (sound only, light only, both, or nothing at all), so
  // the feature's supported_options drive which entries appear. Features published without them
  // fall back to the whole catalog: these values are a set and not a ladder, so the feature's
  // `max` says nothing about which effects the siren really has.
  const options = resolveFeatureOptions(deviceFeature, MODE_OPTIONS);
  const updateValue = value => props.updateValueWithDebounce(deviceFeature, value);

  return (
    <tr>
      <td>
        <i class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${category}.${type}`, { default: 'sliders' })}`} />
      </td>
      <td>{props.rowName}</td>
      <AdaptiveOptionControl
        options={options}
        value={lastValue}
        category={category}
        type={type}
        updateValue={updateValue}
      />
    </tr>
  );
};

export default SirenAlarmModeDeviceFeature;
