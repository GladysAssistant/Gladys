import { Text, Localizer } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import get from 'get-value';

import { DeviceFeatureCategoriesIcon } from '../../utils/consts';
import style from './style.css';

const MAX_FEATURE_ICONS = 5;

// Stable color per integration so devices of the same integration
// share the same stamp color
const STAMP_COLORS = [
  'bg-blue',
  'bg-azure',
  'bg-indigo',
  'bg-purple',
  'bg-pink',
  'bg-red',
  'bg-orange',
  'bg-yellow',
  'bg-lime',
  'bg-green',
  'bg-teal',
  'bg-cyan'
];

const getStampColor = slug => {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return STAMP_COLORS[hash % STAMP_COLORS.length];
};

// Only features whose history is kept have states to export: exporting the
// others would always produce an empty file.
export const getExportableFeatures = device => (device.features || []).filter(feature => feature.keep_history);

export const getFeatureIcon = feature =>
  get(DeviceFeatureCategoriesIcon, `${feature.category}.${feature.type}`) || 'sliders';

export const DeviceStamp = ({ device, integration }) => {
  const features = device.features || [];
  return (
    <span class={cx('stamp', 'stamp-md', style.deviceStamp, integration && getStampColor(integration.slug))}>
      <i class={`fe fe-${features.length ? getFeatureIcon(features[0]) : 'toggle-right'}`} />
    </span>
  );
};

export const FeatureIcons = ({ device }) => {
  const features = device.features || [];
  return (
    <div class={style.featureIcons}>
      {features.slice(0, MAX_FEATURE_ICONS).map(feature => (
        <Localizer>
          <i
            class={cx(`fe fe-${getFeatureIcon(feature)}`, style.featureIcon)}
            title={<Text id={`deviceFeatureCategory.${feature.category}.${feature.type}`}>{feature.name}</Text>}
            aria-label={<Text id={`deviceFeatureCategory.${feature.category}.${feature.type}`}>{feature.name}</Text>}
          />
        </Localizer>
      ))}
      {features.length > MAX_FEATURE_ICONS && (
        <span class="small text-muted">+{features.length - MAX_FEATURE_ICONS}</span>
      )}
      {features.length === 0 && (
        <span class="text-muted small">
          <Text id="device.noFeatures" />
        </span>
      )}
    </div>
  );
};

// Only a badge, to keep the list light: the numbers of the period are in its
// tooltip, and the device page tells which features to act on.
export const VerboseBadge = ({ device, statesStats, periodInHours, class: className }) => {
  if (!statesStats || !statesStats.is_verbose) {
    return null;
  }
  const featuresById = new Map((device.features || []).map(feature => [feature.id, feature]));
  const verboseFeatureNames = statesStats.features
    .filter(featureStats => featureStats.is_verbose)
    .map(featureStats => featuresById.get(featureStats.device_feature_id))
    .filter(feature => feature)
    .map(feature => feature.name);
  const fields = {
    count: statesStats.states.toLocaleString(),
    hours: periodInHours,
    features: verboseFeatureNames.join(', ')
  };
  return (
    <Localizer>
      <span
        class={cx('badge', 'badge-warning', style.verboseBadge, className)}
        title={
          verboseFeatureNames.length > 0 ? (
            <Text id="devicesList.verbose.details" fields={fields} />
          ) : (
            <Text id="devicesList.verbose.detailsWithoutFeatures" fields={fields} />
          )
        }
      >
        <i class="fe fe-activity mr-1" />
        <Text id="devicesList.verbose.badge" />
      </span>
    </Localizer>
  );
};

export const IntegrationName = ({ integration, link = true }) => {
  if (!integration) {
    return <span class="text-muted">-</span>;
  }
  const name = integration.i18nKey ? <Text id={integration.i18nKey}>{integration.name}</Text> : integration.name;
  const label = link && integration.url ? <Link href={integration.url}>{name}</Link> : <span>{name}</span>;
  if (!integration.external) {
    return label;
  }
  // same tag as in the integration catalog: the list mixes both families, and
  // a community integration can be named like a built-in one
  return (
    <span class={style.integrationName}>
      {label}
      <span class="badge badge-secondary">
        <Text id="integration.tags.external" />
      </span>
    </span>
  );
};
