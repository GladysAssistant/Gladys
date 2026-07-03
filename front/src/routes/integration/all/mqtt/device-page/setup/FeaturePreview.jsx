import DeviceRow from '../../../../../../components/boxs/device-in-room/DeviceRow';
import style from '../style.css';
import {
  getFeatureDefaultValues,
  getFeaturePreviewValue,
  getFeaturePreviewStringValue,
  isSensorCategory
} from '../utils';

const FeaturePreview = ({ category, type, label, intl, user }) => {
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
    <div class={style.featurePreview}>
      <div class="table-responsive">
        <table class="table card-table table-vcenter table-sm mb-0">
          <tbody>
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
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FeaturePreview;
