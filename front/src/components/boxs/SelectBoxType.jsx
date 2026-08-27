import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';
import { DASHBOARD_BOX_TYPE_LIST } from '../../../../server/utils/constants';
import withIntlAsProp from '../../utils/withIntlAsProp';
import normalizeSearchText from '../../utils/normalizeSearchText';
import style from './selectBoxType.css';

// Widget "devices in room" is deprecated and will be removed soon
const DASHBOARD_BOX_TYPE_LIST_FILTERED = DASHBOARD_BOX_TYPE_LIST.filter(
  dashboardBoxType => dashboardBoxType !== 'devices-in-room'
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
  tide: 'waves',
  chips: 'more-horizontal',
  'house-view': 'home',
  actions: 'zap'
};

import BaseEditBox from './baseEditBox';

class SelectBoxType extends Component {
  state = { search: '' };

  updateSearch = e => {
    this.setState({ search: e.target.value });
  };

  selectType = type => {
    this.props.updateNewSelectedBox(this.props.x, this.props.y, type);
  };

  render(props, { search }) {
    const searchTerm = normalizeSearchText(search);
    const boxTypes = DASHBOARD_BOX_TYPE_LIST_FILTERED.map(dashboardBoxType => ({
      type: dashboardBoxType,
      label: get(props.intl.dictionary, `dashboard.boxTitle.${dashboardBoxType}`, { default: dashboardBoxType })
    }))
      .filter(
        ({ type, label }) => searchTerm.length === 0 || normalizeSearchText(`${type} ${label}`).includes(searchTerm)
      )
      .sort((a, b) => a.label.localeCompare(b.label));
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
            {boxTypes.length === 0 && (
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

export default withIntlAsProp(SelectBoxType);
