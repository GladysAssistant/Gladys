import get from 'get-value';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { resolveFeatureOptions } from '../../../../utils/supportedOptions';
import { MUSIC_REPEAT_MODE } from '../../../../../../server/utils/constants';
import AdaptiveOptionControl from './AdaptiveOptionControl';

// The full generic set of repeat modes; a player that only has a subset (a radio without
// single-track repeat) declares it through supported_options, which drive the list
const REPEAT_OPTIONS = [
  { value: MUSIC_REPEAT_MODE.OFF, i18nKey: 'off' },
  { value: MUSIC_REPEAT_MODE.ALL, i18nKey: 'all' },
  { value: MUSIC_REPEAT_MODE.ONE, i18nKey: 'one' }
];

const MusicRepeatDeviceFeature = props => {
  const { deviceFeature } = props;
  const { category, type } = deviceFeature;
  const rawValue = deviceFeature.last_value;
  const lastValue = rawValue != null && !Number.isNaN(Number(rawValue)) ? Number(rawValue) : rawValue;
  const options = resolveFeatureOptions(deviceFeature, REPEAT_OPTIONS);
  const updateValue = value => props.updateValueWithDebounce(deviceFeature, value);

  return (
    <tr>
      <td>
        <i class={`fe fe-${get(DeviceFeatureCategoriesIcon, `${category}.${type}`, { default: 'repeat' })}`} />
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

export default MusicRepeatDeviceFeature;
