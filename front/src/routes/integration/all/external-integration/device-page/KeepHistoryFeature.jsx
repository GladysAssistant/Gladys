import { DEVICE_FEATURE_CATEGORIES } from '../../../../../../../server/utils/constants';

// A text feature holds a string state, which is never historized (the core
// only keeps its last value): offering the toggle there would promise a
// history that will never exist. The MQTT device screen hides it for the
// same reason.
export const isHistorizableFeature = feature => feature.category !== DEVICE_FEATURE_CATEGORIES.TEXT;

// The definition of a feature belongs to the integration (name, category,
// unit, bounds...): only the "keep history" choice is the user's, so it is
// the only thing this row makes editable.
const KeepHistoryFeature = ({ deviceIndex, feature, featureIndex, updateFeatureKeepHistory }) => (
  <div class="d-flex align-items-center justify-content-between mb-2">
    <span class="mr-3">{feature.name}</span>
    <label class="custom-switch mb-0">
      <input
        id={`keep_history_${deviceIndex}_${featureIndex}`}
        type="checkbox"
        checked={Boolean(feature.keep_history)}
        onChange={e => updateFeatureKeepHistory(featureIndex, e.target.checked)}
        class="custom-switch-input"
      />
      <span class="custom-switch-indicator" />
    </label>
  </div>
);

export default KeepHistoryFeature;
