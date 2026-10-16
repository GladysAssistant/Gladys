import get from 'get-value';

import { DeviceFeatureCategoriesIcon } from '../../../../utils/consts';
import { resolveFeatureOptions } from '../../../../utils/supportedOptions';
import { LIGHT_OPERATING_MODE } from '../../../../../../server/utils/constants';
import AdaptiveOptionControl from './AdaptiveOptionControl';

const MODE_OPTIONS = [
  { value: LIGHT_OPERATING_MODE.OFF, i18nKey: 'off' },
  { value: LIGHT_OPERATING_MODE.ON, i18nKey: 'on' },
  { value: LIGHT_OPERATING_MODE.AUTO, i18nKey: 'auto' },
  { value: LIGHT_OPERATING_MODE.SCHEDULE, i18nKey: 'schedule' }
];

const LightOperatingModeDeviceFeature = props => {
  const { deviceFeature } = props;
  const { category, type } = deviceFeature;
  const rawValue = deviceFeature.last_value;
  const lastValue = rawValue != null && !Number.isNaN(Number(rawValue)) ? Number(rawValue) : rawValue;

  // Most lights offer off / on / auto and no timetable of their own, so the feature's
  // supported_options drive which modes appear. Features published without them fall back to the
  // whole catalog: the modes are a set and not a ladder, so the feature's `max` says nothing about
  // which ones the light really has.
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

export default LightOperatingModeDeviceFeature;
