import {
  getActivityTitle,
  getActivityValueLabel,
  getActivitySource,
  getEntryStyle,
  formatEntryTimeShort
} from './utils';
import style from './style.css';

const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const ActivityLogEntry = ({ entry, dictionary, language, nested = false }) => {
  const entryStyle = getEntryStyle(entry);
  const title = nested
    ? getActivityValueLabel(entry, dictionary) || getActivityTitle(entry, dictionary)
    : getActivityTitle(entry, dictionary);
  const source = nested ? null : getActivitySource(entry, dictionary);
  const timeLabel = formatEntryTimeShort(entry.created_at, language);

  return (
    <article class={nested ? style.entryNested : style.entry}>
      <div class={style.entryRow}>
        {nested ? (
          <span class={style.entryNestedDot} style={{ color: entryStyle.color }} aria-hidden="true" />
        ) : (
          <div
            class={style.entryIcon}
            style={{
              backgroundColor: hexToRgba(entryStyle.color, 0.1),
              color: entryStyle.color
            }}
          >
            <i class={`fe fe-${entryStyle.icon}`} />
          </div>
        )}
        <div class={style.entryContent}>
          <div class={style.entryMain}>
            <h3 class={nested ? style.entryNestedTitle : style.entryTitle}>{title}</h3>
            {!nested && (entry.room_name || source) && (
              <p class={style.entryMeta}>
                {entry.room_name && <span>{entry.room_name}</span>}
                {entry.room_name && source && <span class={style.entryDot}>•</span>}
                {source && <span>{source}</span>}
              </p>
            )}
          </div>
        </div>
        <time class={style.entryTime}>{timeLabel}</time>
      </div>
    </article>
  );
};

export default ActivityLogEntry;
