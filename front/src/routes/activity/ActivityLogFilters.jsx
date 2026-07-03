import { Text } from 'preact-i18n';
import cx from 'classnames';
import style from './style.css';

const PERIOD_OPTIONS = [
  { value: '24h', labelId: 'activityLog.filters.period24h' },
  { value: '7d', labelId: 'activityLog.filters.period7d' },
  { value: '30d', labelId: 'activityLog.filters.period30d' }
];

const ActivityLogFilters = ({
  period,
  roomSelector,
  rooms,
  mode,
  onPeriodChange,
  onRoomChange,
  onModeChange,
  onRefresh
}) => (
  <div class={style.toolbar}>
    <div class={style.segment}>
      {PERIOD_OPTIONS.map(option => (
        <button
          key={option.value}
          type="button"
          class={cx(style.segmentBtn, { [style.segmentBtnActive]: period === option.value })}
          onClick={() => onPeriodChange(option.value)}
        >
          <Text id={option.labelId} />
        </button>
      ))}
      <button
        type="button"
        class={cx(style.segmentBtn, style.segmentBtnIcon, { [style.segmentBtnActive]: period === 'custom' })}
        onClick={() => onPeriodChange('custom')}
        title="Custom date range"
      >
        <i class="fe fe-calendar" />
      </button>
    </div>

    <select class={style.roomSelect} value={roomSelector} onChange={onRoomChange}>
      <option value="">
        <Text id="activityLog.filters.allRooms" />
      </option>
      {rooms.map(room => (
        <option key={room.selector} value={room.selector}>
          {room.name}
        </option>
      ))}
    </select>

    <div class={style.segment}>
      <button
        type="button"
        class={cx(style.segmentBtn, { [style.segmentBtnActive]: mode === 'events' })}
        onClick={() => onModeChange('events')}
      >
        <Text id="activityLog.filters.eventsOnly" />
      </button>
      <button
        type="button"
        class={cx(style.segmentBtn, { [style.segmentBtnActive]: mode === 'all' })}
        onClick={() => onModeChange('all')}
      >
        <Text id="activityLog.filters.allStates" />
      </button>
    </div>

    <button type="button" class={style.refreshBtn} onClick={onRefresh} title="Refresh">
      <i class="fe fe-refresh-cw" />
    </button>
  </div>
);

export default ActivityLogFilters;
