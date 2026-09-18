import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';
import { DASHBOARD_BOX_TYPE_LIST } from '../../../../server/utils/constants';
import withIntlAsProp from '../../utils/withIntlAsProp';
import normalizeSearchText from '../../utils/normalizeSearchText';
import { getLocalizedText } from '../../routes/integration/all/external-integration/utils';
import { loadWidgetList } from './external-widget/widgetList';
import style from './selectBoxType.css';

// Widget "devices in room" is deprecated and will be removed soon.
// "external-widget" is not a tile of its own either: the picker lists one
// tile per widget declared by the installed integrations instead (below).
const DASHBOARD_BOX_TYPE_LIST_FILTERED = DASHBOARD_BOX_TYPE_LIST.filter(
  dashboardBoxType => !['devices-in-room', 'external-widget'].includes(dashboardBoxType)
);

const BOX_TYPE_ICONS = {
  alarm: 'shield',
  weather: 'cloud',
  'temperature-in-room': 'thermometer',
  'humidity-in-room': 'droplet',
  'user-presence': 'users',
  camera: 'video',
  devices: 'sliders',
  chart: 'bar-chart-2',
  ecowatt: 'battery-charging',
  'edf-tempo': 'calendar',
  clock: 'clock',
  scene: 'play',
  music: 'music',
  gauge: 'activity',
  'energy-consumption': 'trending-up',
  'voice-assistant': 'mic',
  link: 'link',
  photo: 'image',
  sun: 'sun',
  chips: 'more-horizontal',
  'house-view': 'home',
  actions: 'zap'
};

import BaseEditBox from './baseEditBox';

class SelectBoxType extends Component {
  state = { search: '', externalWidgets: [] };

  updateSearch = e => {
    this.setState({ search: e.target.value });
  };

  selectType = type => {
    this.props.updateNewSelectedBox(this.props.x, this.props.y, type);
  };

  // an integration widget tile stands for one declared widget of one
  // installed integration: the box carries both on top of its type
  selectExternalWidget = widget => {
    this.props.updateNewSelectedBox(this.props.x, this.props.y, 'external-widget', {
      integration: widget.integration_selector,
      widget: widget.key
    });
  };

  loadExternalWidgets = async () => {
    try {
      const externalWidgets = await loadWidgetList(this.props.httpClient);
      this.setState({ externalWidgets });
    } catch (e) {
      console.error(e);
    }
  };

  componentDidMount() {
    this.loadExternalWidgets();
  }

  render(props, { search, externalWidgets }) {
    const searchTerm = normalizeSearchText(search);
    const boxTypes = DASHBOARD_BOX_TYPE_LIST_FILTERED.map(dashboardBoxType => ({
      type: dashboardBoxType,
      label: get(props.intl.dictionary, `dashboard.boxTitle.${dashboardBoxType}`, { default: dashboardBoxType })
    }))
      .filter(
        ({ type, label }) => searchTerm.length === 0 || normalizeSearchText(`${type} ${label}`).includes(searchTerm)
      )
      .sort((a, b) => a.label.localeCompare(b.label));
    const language = get(props, 'user.language') || 'en';
    // after the core tiles: one tile per widget of every installed
    // integration, searchable on its label and the integration's name
    const widgetTiles = (externalWidgets || [])
      .map(widget => ({
        widget,
        label: getLocalizedText(widget.label, language) || widget.key,
        caption: widget.integration_name
      }))
      .filter(
        ({ widget, label, caption }) =>
          searchTerm.length === 0 || normalizeSearchText(`${widget.key} ${label} ${caption}`).includes(searchTerm)
      );
    return (
      <BaseEditBox {...props} titleKey="dashboard.selectBoxType">
        <div class="form-group">
          <label>
            <Text id="dashboard.selectBoxTypeLabel" />
          </label>
          <div class="input-icon mb-3">
            <span class="input-icon-addon">
              <i class="fe fe-search" />
            </span>
            <Localizer>
              <input
                type="text"
                class="form-control"
                value={search}
                onInput={this.updateSearch}
                placeholder={<Text id="dashboard.selectBoxTypeSearchPlaceholder" />}
              />
            </Localizer>
          </div>
          <div class={style.boxTypeGrid} data-cy="select-box-type">
            {boxTypes.map(({ type, label }) => (
              <button
                type="button"
                key={type}
                data-cy={`box-type-${type}`}
                class={style.boxTypeTile}
                onClick={() => this.selectType(type)}
              >
                <i class={cx(`fe fe-${BOX_TYPE_ICONS[type] || 'square'}`, style.boxTypeIcon)} />
                <span class={style.boxTypeLabel}>{label}</span>
              </button>
            ))}
            {widgetTiles.map(({ widget, label, caption }) => (
              <button
                type="button"
                key={`external-widget-${widget.integration_selector}-${widget.key}`}
                data-cy={`box-type-external-widget-${widget.integration_selector}-${widget.key}`}
                class={style.boxTypeTile}
                title={getLocalizedText(widget.description, language) || undefined}
                onClick={() => this.selectExternalWidget(widget)}
              >
                <i class={cx(`fe fe-${widget.icon || 'grid'}`, style.boxTypeIcon)} />
                <span class={style.boxTypeLabel}>{label}</span>
                <span class={cx('text-muted', style.boxTypeCaption)}>{caption}</span>
              </button>
            ))}
            {boxTypes.length === 0 && widgetTiles.length === 0 && (
              <div class={cx('text-muted', style.boxTypeNoResult)}>
                <Text id="dashboard.selectBoxTypeNoResult" fields={{ search }} />
              </div>
            )}
          </div>
        </div>
      </BaseEditBox>
    );
  }
}

export default connect('httpClient,user', {})(withIntlAsProp(SelectBoxType));
