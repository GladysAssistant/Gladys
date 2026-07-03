import { Text } from 'preact-i18n';
import cx from 'classnames';

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
  <div class="activity-log-filters">
    <div class="activity-log-filters-row">
      <div class="activity-log-filter-group">
        <label class="activity-log-filter-label">
          <Text id="activityLog.filters.period" />
        </label>
        <div class="btn-group">
          {PERIOD_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              class={cx('btn', 'btn-sm', period === option.value ? 'btn-primary' : 'btn-outline-secondary')}
              onClick={() => onPeriodChange(option.value)}
            >
              <Text id={option.labelId} />
            </button>
          ))}
        </div>
      </div>
      <div class="activity-log-filter-group">
        <label class="activity-log-filter-label">
          <Text id="activityLog.filters.room" />
        </label>
        <select class="form-control form-control-sm activity-log-room-select" value={roomSelector} onChange={onRoomChange}>
          <option value="">
            <Text id="activityLog.filters.allRooms" />
          </option>
          {rooms.map(room => (
            <option key={room.selector} value={room.selector}>
              {room.name}
            </option>
          ))}
        </select>
      </div>
      <div class="activity-log-filter-group">
        <label class="activity-log-filter-label">
          <Text id="activityLog.filters.type" />
        </label>
        <div class="btn-group">
          <button
            type="button"
            class={cx('btn', 'btn-sm', mode === 'events' ? 'btn-primary' : 'btn-outline-secondary')}
            onClick={() => onModeChange('events')}
          >
            <Text id="activityLog.filters.eventsOnly" />
          </button>
          <button
            type="button"
            class={cx('btn', 'btn-sm', mode === 'all' ? 'btn-primary' : 'btn-outline-secondary')}
            onClick={() => onModeChange('all')}
          >
            <Text id="activityLog.filters.allStates" />
          </button>
        </div>
      </div>
      <button type="button" class="btn btn-sm btn-outline-primary activity-log-refresh-btn" onClick={onRefresh}>
        <i class="fe fe-refresh-cw" />
      </button>
    </div>
  </div>
);

export default ActivityLogFilters;
