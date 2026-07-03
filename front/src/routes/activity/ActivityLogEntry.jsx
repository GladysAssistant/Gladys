import { getActivityTitle, getActivitySource, getEntryStyle, formatEntryTime } from './utils';
import style from './style.css';

const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const ActivityLogEntry = ({ entry, dictionary, language }) => {
  const entryStyle = getEntryStyle(entry);
  const title = getActivityTitle(entry, dictionary);
  const source = getActivitySource(entry, dictionary);
  const timeLabel = formatEntryTime(entry.created_at, language, dictionary);

  return (
    <article class={style.entry}>
      <time class={style.entryTime}>{timeLabel}</time>
      <div class={style.entryRow}>
        <div
          class={style.entryIcon}
          style={{
            backgroundColor: hexToRgba(entryStyle.color, 0.1),
            color: entryStyle.color
          }}
        >
          <i class={`fe fe-${entryStyle.icon}`} />
        </div>
        <div class={style.entryContent}>
          <h3 class={style.entryTitle}>{title}</h3>
          {(entry.room_name || source) && (
            <p class={style.entryMeta}>
              {entry.room_name && <span>{entry.room_name}</span>}
              {entry.room_name && source && <span class={style.entryDot}>•</span>}
              {source && <span>{source}</span>}
            </p>
          )}
        </div>
      </div>
    </article>
  );
};

export default ActivityLogEntry;
