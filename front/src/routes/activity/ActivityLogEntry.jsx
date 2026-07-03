import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';
import { getActivityTitle, getActivitySource, getEntryStyle } from './utils';

dayjs.extend(isToday);
dayjs.extend(isYesterday);

const formatEntryTime = (createdAt, language, dictionary) => {
  const date = dayjs(createdAt).locale(language);
  const time = date.format('HH:mm');
  const activityLog = dictionary.activityLog || {};

  if (date.isToday()) {
    const todayLabel = activityLog.todayPrefix || 'Today';
    return `${todayLabel}, ${time}`;
  }
  if (date.isYesterday()) {
    const yesterdayLabel = activityLog.yesterdayPrefix || 'Yesterday';
    return `${yesterdayLabel}, ${time}`;
  }
  return `${date.format('dddd D MMMM')}, ${time}`;
};

const ActivityLogEntry = ({ entry, dictionary, language }) => {
  const style = getEntryStyle(entry);
  const title = getActivityTitle(entry, dictionary);
  const source = getActivitySource(entry, dictionary);
  const timeLabel = formatEntryTime(entry.created_at, language, dictionary);

  return (
    <div class="activity-log-entry">
      <div class="activity-log-entry-time">{timeLabel}</div>
      <div class="activity-log-entry-body">
        <div class="activity-log-entry-icon" style={{ '--entry-color': style.color }}>
          <i class={`fe fe-${style.icon}`} />
        </div>
        <div class="activity-log-entry-content">
          <div class="activity-log-entry-title">{title}</div>
          <div class="activity-log-entry-meta">
            {entry.room_name && <span>{entry.room_name}</span>}
            {entry.room_name && source && <span class="activity-log-entry-separator">•</span>}
            {source && <span>{source}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogEntry;
