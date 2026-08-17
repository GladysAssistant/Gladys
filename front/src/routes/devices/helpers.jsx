import { Text, Localizer } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';
import get from 'get-value';

import { DeviceFeatureCategoriesIcon } from '../../utils/consts';
import style from './style.css';

const MAX_FEATURE_ICONS = 5;
const MAX_USAGE_LINKS = 3;

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

// Where a device is used: the dashboards and the scenes referencing the
// device itself or any of its features. Useful to know what will break
// before deleting a device, and to spot devices used nowhere.
export const DeviceUsage = ({ usage, max = MAX_USAGE_LINKS, link = true }) => {
  const dashboards = usage ? usage.dashboards : [];
  const scenes = usage ? usage.scenes : [];
  const total = dashboards.length + scenes.length;

  if (total === 0) {
    return (
      <span class="text-muted small">
        <Text id="devicesList.usedNowhere" />
      </span>
    );
  }

  const links = [
    ...dashboards.map(dashboard => ({
      key: `dashboard-${dashboard.selector}`,
      href: `/dashboard/${dashboard.selector}`,
      icon: 'layout',
      name: dashboard.name
    })),
    ...scenes.map(scene => ({
      key: `scene-${scene.selector}`,
      href: `/dashboard/scene/${scene.selector}`,
      icon: 'play-circle',
      name: scene.name
    }))
  ];

  return (
    <div class={style.usageLinks}>
      {links.slice(0, max).map(usageLink => {
        const content = [
          <i class={cx(`fe fe-${usageLink.icon}`, style.usageIcon)} />,
          <span class={style.usageName}>{usageLink.name}</span>
        ];
        // On the mobile list the whole item is already a link, so the usage
        // tags are displayed as plain tags to avoid nesting links
        if (!link) {
          return (
            <span key={usageLink.key} class={cx('tag', style.usageTag)} title={usageLink.name}>
              {content}
            </span>
          );
        }
        return (
          <Link key={usageLink.key} href={usageLink.href} class={cx('tag', style.usageTag)} title={usageLink.name}>
            {content}
          </Link>
        );
      })}
      {total > max && <span class="small text-muted">+{total - max}</span>}
    </div>
  );
};

export const IntegrationName = ({ integration, link = true }) => {
  if (!integration) {
    return <span class="text-muted">-</span>;
  }
  const name = integration.i18nKey ? <Text id={integration.i18nKey}>{integration.name}</Text> : integration.name;
  if (!link || !integration.url) {
    return <span>{name}</span>;
  }
  return <Link href={integration.url}>{name}</Link>;
};
