import { useState } from 'preact/hooks';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import ActivityLogEntry from './ActivityLogEntry';
import { getActivityValueLabel, getActivitySource, getEntryStyle, formatGroupTimeRange } from './utils';
import style from './style.css';

const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const ActivityLogEntryGroup = ({ entries, dictionary, language }) => {
  const [expanded, setExpanded] = useState(false);
  const latestEntry = entries[0];
  const entryStyle = getEntryStyle(latestEntry);
  const source = getActivitySource(latestEntry, dictionary);
  const latestValue = getActivityValueLabel(latestEntry, dictionary);
  const timeRange = formatGroupTimeRange(entries, language);

  return (
    <article class={style.entryGroup}>
      <button
        type="button"
        class={style.entryGroupHeader}
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
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
            <div class={style.entryMain}>
              <h3 class={style.entryTitle}>{latestEntry.device_name}</h3>
              <p class={style.entryMeta}>
                <span class={style.entryGroupBadge}>
                  <Text id="activityLog.groupChanges" fields={{ count: entries.length }} />
                </span>
                {latestValue && (
                  <span class={style.entryGroupLatest}>
                    <Text id="activityLog.groupLastChange" fields={{ value: latestValue }} />
                  </span>
                )}
                {latestEntry.room_name && (
                  <span>
                    <span class={style.entryDot}>•</span>
                    {latestEntry.room_name}
                  </span>
                )}
                {source && (
                  <span>
                    <span class={style.entryDot}>•</span>
                    {source}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div class={style.entryGroupAside}>
            <time class={style.entryTime}>{timeRange}</time>
            <i class={cx('fe', expanded ? 'fe-chevron-up' : 'fe-chevron-down', style.entryGroupChevron)} />
          </div>
        </div>
      </button>

      {expanded && (
        <div class={style.entryGroupBody}>
          {entries.map((entry, index) => (
            <ActivityLogEntry
              key={`${entry.device_feature_selector}-${entry.created_at}-${index}`}
              entry={entry}
              dictionary={dictionary}
              language={language}
              nested
            />
          ))}
        </div>
      )}
    </article>
  );
};

export default ActivityLogEntryGroup;
