import cx from 'classnames';
import { Text } from 'preact-i18n';
import { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } from '../../../../../../../../server/utils/constants';
import DeviceRow from '../../../../../../components/boxs/device-in-room/DeviceRow';
import BatteryLevelFeature from '../../../../../../components/boxs/device-in-room/device-features/sensor-value/BatteryLevelFeature';
import SignalQualityDeviceValue from '../../../../../../components/boxs/device-in-room/device-features/sensor-value/SignalQualityDeviceValue';
import CameraFeaturePreview from './CameraFeaturePreview';
import PushButtonFeaturePreview from './PushButtonFeaturePreview';
import SensorRowFeaturePreview from './SensorRowFeaturePreview';
import style from '../style.css';
import {
  getCatalogPreviewLabelKey,
  getCatalogPreviewMode,
  getFeatureDefaultValues,
  getFeaturePreviewValue,
  getFeaturePreviewStringValue,
  isSensorCategory
} from '../utils';

const FeaturePreview = ({ category, type, label, intl, user }) => {
  if (category === DEVICE_FEATURE_CATEGORIES.CAMERA) {
    return (
      <div class={cx(style.featurePreview, style.cameraFeaturePreviewWrapper, 'dark-mode-no-invert')}>
        <CameraFeaturePreview label={label} />
      </div>
    );
  }

  const previewLabelKey = getCatalogPreviewLabelKey(category, type);

  if (previewLabelKey) {
    return (
      <div class={cx(style.featurePreview, 'dark-mode-no-invert')}>
        <div class="table-responsive">
          <table class="table card-table table-vcenter table-sm mb-0">
            <tbody>
              <tr>
                <td>{label}</td>
                <td class="text-right">
                  <Text id={previewLabelKey} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const previewMode = getCatalogPreviewMode(category, type);
  const defaults = getFeatureDefaultValues(category, type);
  const previewValue = getFeaturePreviewValue(category, type);
  const previewStringValue = getFeaturePreviewStringValue(category, type);

  const mockDevice = {
    name: label,
    selector: 'mqtt:preview-device'
  };

  const mockFeature = {
    id: 'preview-feature',
    category,
    type,
    name: label,
    read_only: defaults.read_only !== undefined ? defaults.read_only : isSensorCategory(category),
    last_value: previewValue,
    last_value_string: previewStringValue,
    min: defaults.min,
    max: defaults.max,
    unit: defaults.unit
  };

  return (
    <div class={cx(style.featurePreview, 'dark-mode-no-invert')}>
      <div class="table-responsive">
        <table class="table card-table table-vcenter table-sm mb-0">
          <tbody>
            {previewMode === 'push-button' && <PushButtonFeaturePreview label={label} />}
            {previewMode === 'lock-battery' && (
              <SensorRowFeaturePreview
                label={label}
                category={DEVICE_FEATURE_CATEGORIES.BATTERY}
                type={DEVICE_FEATURE_TYPES.BATTERY.INTEGER}
              >
                <BatteryLevelFeature deviceFeature={{ last_value: 78 }} />
              </SensorRowFeaturePreview>
            )}
            {previewMode === 'signal-quality' && (
              <SensorRowFeaturePreview label={label} category={category} type={type}>
                <SignalQualityDeviceValue deviceFeature={mockFeature} />
              </SensorRowFeaturePreview>
            )}
            {previewMode === 'device-row' && (
              <DeviceRow
                user={user}
                x={0}
                y={0}
                device={mockDevice}
                deviceFeature={mockFeature}
                roomIndex={0}
                deviceFeatureIndex={0}
                updateValue={() => {}}
                updateValueWithDebounce={() => {}}
                intl={intl}
              />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FeaturePreview;
