import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import DeviceFeatureValueText from '../../device/DeviceFeatureValueText';
import ApexChartComponent from '../chart/ApexChartComponent';
import Modal from '../../../routes/integration/all/external-integration/components/Modal';
import { text, formatNumber, formatDate, getUrlDomain, CHART_INTERVAL_MINUTES } from './widgetContentUtils';
import style from './style.css';

// semantic colors of the vocabulary -> the accent class of the theme
const COLOR_CLASSES = {
  neutral: style.colorNeutral,
  primary: style.colorPrimary,
  success: style.colorSuccess,
  warning: style.colorWarning,
  danger: style.colorDanger,
  info: style.colorInfo
};

const BADGE_COLOR_CLASSES = {
  primary: style.badgeColorPrimary,
  success: style.badgeColorSuccess,
  warning: style.badgeColorWarning,
  danger: style.badgeColorDanger,
  info: style.badgeColorInfo
};

const colorClass = color => COLOR_CLASSES[color] || '';

// --- header --------------------------------------------------------------

export const WidgetHeader = ({ components, language }) => (
  <div class={style.header}>
    {components.map(component => (
      <div class={component.variant === 'heading' ? style.heading : style.caption}>
        {text(component.text, language)}
      </div>
    ))}
  </div>
);

export const WidgetBody = ({ component, language }) => <p class={style.body}>{text(component.text, language)}</p>;

// --- tiles ---------------------------------------------------------------

// A device-bound tile shows the live value of the feature in the compact
// rendering every core widget uses (open/closed, on/off, rounded value +
// short unit); an inline tile shows the value the integration sent
const TileValue = ({ component, feature, language }) => {
  if (component.device_feature_selector) {
    if (!feature) {
      return <span class={style.tileValue}>…</span>;
    }
    return (
      <span class={style.tileValue}>
        <DeviceFeatureValueText feature={feature} />
      </span>
    );
  }
  const value =
    typeof component.value === 'number' ? formatNumber(component.value, language) : text(component.value, language);
  return (
    <span class={cx(style.tileValue, colorClass(component.color))}>
      {value}
      {component.unit && <span class={style.tileUnit}>{text(component.unit, language)}</span>}
    </span>
  );
};

// 270° arc gauge: the value between min and max, drawn in SVG so the tile
// stays light and themable (no chart library for a tile)
const GAUGE_RADIUS = 34;
const GAUGE_ARC_LENGTH = (2 * Math.PI * GAUGE_RADIUS * 270) / 360;

const Gauge = ({ component, feature, language }) => {
  const min = typeof component.min === 'number' ? component.min : get(feature, 'min', { default: 0 });
  const max = typeof component.max === 'number' ? component.max : get(feature, 'max', { default: 100 });
  const rawValue = component.device_feature_selector ? get(feature, 'last_value', { default: null }) : component.value;
  const hasValue = typeof rawValue === 'number';
  const ratio = hasValue && max > min ? Math.min(1, Math.max(0, (rawValue - min) / (max - min))) : 0;
  const unit = component.device_feature_selector ? null : component.unit;
  return (
    <div>
      <svg class={cx(style.gauge, colorClass(component.color || 'primary'))} viewBox="0 0 88 72" aria-hidden="true">
        <path
          class={style.gaugeTrack}
          d="M 20 62 A 34 34 0 1 1 68 62"
          stroke-dasharray={`${GAUGE_ARC_LENGTH} ${GAUGE_ARC_LENGTH}`}
        />
        <path
          class={style.gaugeArc}
          d="M 20 62 A 34 34 0 1 1 68 62"
          stroke-dasharray={`${ratio * GAUGE_ARC_LENGTH} ${GAUGE_ARC_LENGTH}`}
        />
      </svg>
      <div class={cx(style.tileValue, style.gaugeValue)}>
        {hasValue ? formatNumber(rawValue, language) : '…'}
        {hasValue && unit && <span class={style.tileUnit}>{text(unit, language)}</span>}
      </div>
    </div>
  );
};

export const WidgetTiles = ({ components, featuresBySelector, deviceNamesBySelector, language }) => (
  <div class={style.tiles}>
    {components.map(component => {
      const feature = component.device_feature_selector ? featuresBySelector[component.device_feature_selector] : null;
      const label =
        text(component.label, language) ||
        (component.device_feature_selector && deviceNamesBySelector[component.device_feature_selector]) ||
        '';
      return (
        <div class={style.tile}>
          {component.icon && component.type === 'value' && (
            <i class={cx(`fe fe-${component.icon}`, style.tileIcon, colorClass(component.color))} />
          )}
          {component.type === 'gauge' ? (
            <Gauge component={component} feature={feature} language={language} />
          ) : (
            <TileValue component={component} feature={feature} language={language} />
          )}
          {label && <span class={style.tileLabel}>{label}</span>}
        </div>
      );
    })}
  </div>
);

// --- status list ---------------------------------------------------------

export const WidgetStatus = ({ component, language }) => (
  <ul class={style.statusList}>
    {component.items.map(item => (
      <li class={style.statusRow}>
        {item.icon ? (
          <i class={cx(`fe fe-${item.icon}`, style.statusIcon, colorClass(item.color || 'neutral'))} />
        ) : (
          <span class={cx(style.statusDot, colorClass(item.color || 'neutral'))} />
        )}
        <span class={style.statusLabel}>{text(item.label, language)}</span>
        <span class={style.statusValue}>
          {typeof item.value === 'number' ? formatNumber(item.value, language) : text(item.value, language)}
        </span>
      </li>
    ))}
  </ul>
);

// --- images --------------------------------------------------------------

// An image declared by the content, served from the Gladys origin through
// the image route of the integration. Loaded lazily: the bytes are only
// requested once the frame enters the viewport, so a poster grid below the
// fold costs nothing until it is scrolled to.
export class LazyWidgetImage extends Component {
  state = { src: null, error: false };

  componentDidMount() {
    if (typeof IntersectionObserver === 'undefined') {
      this.load();
      return;
    }
    // guarded just above: a browser without the observer loads at once
    // eslint-disable-next-line compat/compat
    this.observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        this.disconnect();
        this.load();
      }
    });
    if (this.frame) {
      this.observer.observe(this.frame);
    }
  }

  // another key: the frame empties and the new image loads
  reload = () => {
    this.setState({ src: null, error: false });
    this.load();
  };

  componentDidUpdate(previousProps) {
    if (previousProps.imageKey !== this.props.imageKey || previousProps.selector !== this.props.selector) {
      this.reload();
    }
  }

  componentWillUnmount() {
    this.unmounted = true;
    this.disconnect();
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  load = async () => {
    const { httpClient, selector, imageKey } = this.props;
    try {
      const { image } = await httpClient.get(
        `/api/v1/external_integration/${encodeURIComponent(selector)}/image/${encodeURIComponent(imageKey)}`
      );
      if (!this.unmounted) {
        this.setState({ src: image, error: false });
      }
    } catch (e) {
      if (!this.unmounted) {
        this.setState({ error: true });
      }
    }
  };

  render({ alt, fit, className, language }, { src, error }) {
    return (
      <div
        class={cx(style.imageFrame, className)}
        ref={element => {
          this.frame = element;
        }}
      >
        {src && (
          <img
            src={src}
            alt={text(alt, language) || ''}
            class={fit === 'contain' ? style.imageContain : style.imageCover}
          />
        )}
        {!src && (
          <div class={style.imagePlaceholder}>
            <i class={`fe fe-${error ? 'image' : 'loader'}`} />
          </div>
        )}
      </div>
    );
  }
}

// --- card list -----------------------------------------------------------

const hasDetail = item => Boolean(item.description) || (item.links && item.links.length > 0);

const CardBadge = ({ badge, language }) =>
  badge ? <span class={cx(style.badge, BADGE_COLOR_CLASSES[badge.color])}>{text(badge.text, language)}</span> : null;

const CardDetail = ({ item, language, onClose }) => (
  <Modal title={text(item.title, language)} onClose={onClose}>
    <div class="card-body">
      {(item.subtitle || item.date) && (
        <div class="text-muted mb-2">
          {text(item.subtitle, language)}
          {item.subtitle && item.date ? ' · ' : ''}
          {formatDate(item.date, language)}
        </div>
      )}
      <CardBadge badge={item.badge} language={language} />
      {item.description && <p class={cx(style.detailDescription, 'mt-2')}>{text(item.description, language)}</p>}
      {(item.links || []).map(link => (
        <div>
          <a href={link.url} target="_blank" rel="noopener noreferrer">
            <i class="fe fe-external-link mr-1" />
            {text(link.label, language) || link.url}
          </a>{' '}
          <span class="text-muted small">({getUrlDomain(link.url)})</span>
        </div>
      ))}
    </div>
  </Modal>
);

export class WidgetCardList extends Component {
  state = { openItem: null };

  open = item => {
    if (hasDetail(item)) {
      this.setState({ openItem: item });
    }
  };

  close = () => {
    this.setState({ openItem: null });
  };

  render({ component, language, selector, httpClient }, { openItem }) {
    const isGrid = component.display === 'grid';
    return (
      <div>
        <div class={isGrid ? style.cardGrid : style.cardList}>
          {component.items.map(item => {
            const clickable = hasDetail(item);
            const meta = item.date ? formatDate(item.date, language) : text(item.subtitle, language);
            return (
              <button
                type="button"
                class={cx(isGrid ? style.cardGridItem : style.cardListItem, { [style.clickable]: clickable })}
                onClick={() => this.open(item)}
                disabled={!clickable}
              >
                {item.image && (
                  <LazyWidgetImage
                    httpClient={httpClient}
                    selector={selector}
                    imageKey={item.image}
                    alt={item.title}
                    fit="cover"
                    language={language}
                  />
                )}
                <div class={style.cardListText}>
                  <span class={style.cardTitle}>{text(item.title, language)}</span>
                  {meta && <span class={style.cardMeta}>{meta}</span>}
                  <CardBadge badge={item.badge} language={language} />
                </div>
              </button>
            );
          })}
        </div>
        {openItem && <CardDetail item={openItem} language={language} onClose={this.close} />}
      </div>
    );
  }
}

// --- chart ---------------------------------------------------------------

// The time span of the plotted series: the tooltip date format follows it,
// and the "now" marker is only drawn when now falls inside it
const seriesTimeRange = series => {
  let min = Infinity;
  let max = -Infinity;
  series.forEach(oneSeries => {
    oneSeries.data.forEach(([time]) => {
      min = Math.min(min, time);
      max = Math.max(max, time);
    });
  });
  return { min, max, minutes: max > min ? Math.round((max - min) / 60000) : 60 };
};

// semantic colors of the vocabulary -> the accent the chart draws with (the
// same values as the accent classes of style.css: ApexCharts needs a value)
const ANNOTATION_COLORS = {
  neutral: '#667081',
  primary: '#467fcf',
  success: '#2e8f5b',
  warning: '#f68f00',
  danger: '#d63939',
  info: '#45aaf2'
};

// A label sits centered on its marker, except near the right edge of the
// chart where it hangs to the left so it is never clipped by the card
const annotationLabel = (label, color, textAnchor = 'middle') => ({
  text: label,
  borderColor: color,
  orientation: 'horizontal',
  position: 'top',
  textAnchor,
  style: { background: color, color: '#fff', fontSize: '10px', fontWeight: 600, padding: { left: 4, right: 4 } }
});

const labelAnchor = (x, { min, max }) => (x > max - (max - min) * 0.08 ? 'end' : 'middle');

// The markers of the content, in the ApexCharts `annotations` shape: a time
// with a value is a dot on the curve, a time alone is a vertical line; the
// `now_marker` is a dashed line at the current time, when the series spans it
const buildAnnotations = (component, series, language, nowLabel) => {
  const xaxis = [];
  const points = [];
  const range = seriesTimeRange(series);
  (component.annotations || []).forEach(annotation => {
    const x = new Date(annotation.t).getTime();
    const color = ANNOTATION_COLORS[annotation.color] || ANNOTATION_COLORS.neutral;
    const label = text(annotation.label, language);
    if (typeof annotation.value === 'number') {
      points.push({
        x,
        y: annotation.value,
        marker: { size: 4, fillColor: '#fff', strokeColor: color, strokeWidth: 2 },
        ...(label ? { label: annotationLabel(label, color, labelAnchor(x, range)) } : {})
      });
    } else {
      xaxis.push({
        x,
        borderColor: color,
        strokeDashArray: 0,
        ...(label ? { label: annotationLabel(label, color, labelAnchor(x, range)) } : {})
      });
    }
  });
  if (component.now_marker) {
    const now = Date.now();
    const { min, max } = range;
    // a series that ends "now" was produced a few minutes before it renders:
    // now sits just past its last point, and is drawn there rather than off
    // the chart; a forecast entirely in the future has no "now" to draw
    const tolerance = Math.max((max - min) * 0.05, 5 * 60 * 1000);
    if (now >= min - tolerance && now <= max + tolerance) {
      const x = Math.min(Math.max(now, min), max);
      xaxis.push({
        x,
        borderColor: ANNOTATION_COLORS.neutral,
        strokeDashArray: 4,
        ...(nowLabel ? { label: annotationLabel(nowLabel, ANNOTATION_COLORS.neutral, labelAnchor(x, range)) } : {})
      });
    }
  }
  if (xaxis.length === 0 && points.length === 0) {
    return undefined;
  }
  return { xaxis, points };
};

export class WidgetChart extends Component {
  state = { series: null };

  componentDidMount() {
    this.loadSeries();
  }

  componentDidUpdate(previousProps) {
    if (previousProps.component !== this.props.component) {
      this.loadSeries();
    }
  }

  // series and markers are built once per content: ApexCharts redraws on a
  // new reference, so the state keeps one for the life of the content
  setSeries = (series, interval) => {
    const { component, language, dictionary } = this.props;
    const nowLabel = get(dictionary, 'dashboard.boxes.external-widget.now');
    this.setState({ series, interval, annotations: buildAnnotations(component, series, language, nowLabel) });
  };

  loadSeries = async () => {
    const { component, httpClient, language, deviceNamesBySelector } = this.props;
    if (component.series) {
      const series = component.series.map((oneSeries, index) => ({
        name: text(oneSeries.name, language) || `${index + 1}`,
        data: oneSeries.points.map(point => [new Date(point.t).getTime(), point.v])
      }));
      this.setSeries(series, seriesTimeRange(series).minutes);
      return;
    }
    // live device features: the history the core already keeps, with the
    // chart box's own aggregation defaults for the declared interval
    const interval = CHART_INTERVAL_MINUTES[component.interval] || CHART_INTERVAL_MINUTES['last-day'];
    try {
      const data = await httpClient.get('/api/v1/device_feature/aggregated_states', {
        interval,
        max_states: 100,
        device_features: component.device_feature_selectors.join(',')
      });
      this.setSeries(
        data.map((oneFeature, index) => ({
          name:
            get(oneFeature, 'deviceFeature.name') ||
            deviceNamesBySelector[component.device_feature_selectors[index]] ||
            `${index + 1}`,
          data: (oneFeature.values || []).map(point => [new Date(point.created_at).getTime(), point.value])
        })),
        interval
      );
    } catch (e) {
      console.error(e);
      this.setState({ series: [], annotations: undefined });
    }
  };

  render({ component, language, user, dictionary }, { series, interval, annotations }) {
    if (!series) {
      return <div class={style.skeleton} />;
    }
    const isEmpty = series.every(oneSeries => oneSeries.data.length === 0);
    return (
      <div>
        {component.title && <div class={cx(style.caption, 'mb-1')}>{text(component.title, language)}</div>}
        {isEmpty ? (
          <div class="text-muted small">
            <Text id="dashboard.boxes.external-widget.emptyChart" />
          </div>
        ) : (
          <ApexChartComponent
            series={series}
            interval={interval}
            user={user}
            size="small"
            chart_type={component.chart_type}
            display_axes
            additionalHeight={0}
            annotations={annotations}
            dictionary={dictionary}
            y_axis_unit={component.unit ? text(component.unit, language) : undefined}
          />
        )}
      </div>
    );
  }
}

// --- buttons -------------------------------------------------------------

export const WidgetButtons = ({ components, featuresBySelector, pending, onAction, onDeviceFeature, language }) => (
  <div class={style.buttons}>
    {components.map((component, index) => {
      const icon = component.icon;
      const label = text(component.label, language);
      const buttonClass = cx(style.button, {
        [style.buttonPrimary]: component.style === 'primary',
        [style.buttonDanger]: component.style === 'danger'
      });
      if (component.link) {
        return (
          <a href={component.link.url} target="_blank" rel="noopener noreferrer" class={buttonClass}>
            <span class={style.buttonIcon}>
              <i class={`fe fe-${icon || 'external-link'}`} />
            </span>
            <span class={style.buttonLabel}>{label}</span>
            <span class={style.buttonDomain}>({getUrlDomain(component.link.url)})</span>
          </a>
        );
      }
      if (component.device_feature_selector) {
        const feature = featuresBySelector[component.device_feature_selector];
        const active = Boolean(feature) && feature.last_value === component.value;
        return (
          <button
            type="button"
            class={cx(buttonClass, { [style.buttonActive]: active })}
            disabled={pending[index] || !feature}
            onClick={() => onDeviceFeature(component, index)}
          >
            <span class={style.buttonIcon}>
              <i class={`fe fe-${pending[index] ? 'loader' : icon || 'zap'}`} />
            </span>
            <span class={style.buttonLabel}>{label}</span>
          </button>
        );
      }
      return (
        <button
          type="button"
          class={buttonClass}
          disabled={pending[index]}
          onClick={() => onAction(component, index)}
          data-cy={`external-widget-action-${component.action.key}`}
        >
          <span class={style.buttonIcon}>
            <i class={`fe fe-${pending[index] ? 'loader' : icon || 'play'}`} />
          </span>
          <span class={style.buttonLabel}>{label}</span>
        </button>
      );
    })}
  </div>
);
