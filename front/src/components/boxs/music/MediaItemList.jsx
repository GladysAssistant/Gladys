import { Text } from 'preact-i18n';
import cx from 'classnames';

import { MUSIC_PLAY_MODES } from '../../../../../server/utils/constants';
import LazyArtwork from './LazyArtwork';
import { formatSeconds } from './musicApi';
import style from './MusicBox.css';

// One list for the queue, the catalog and the search results: a MediaItem is
// { id, type, title, subtitle, duration, artwork_key, browsable, playable } (section 4.2 of the
// music spec). A browsable item opens, a playable one plays (or is picked, in a scene editor),
// and a secondary button enqueues it when the player accepts it.
const MediaItemList = ({
  items,
  httpClient,
  deviceSelector,
  currentIndex,
  indexOffset = 0,
  onOpen,
  onPlay,
  onEnqueue,
  canEnqueue,
  pickLabelKey,
  emptyKey,
  onArtworkNotFound
}) => {
  if (!items || items.length === 0) {
    return (
      <p class={cx('text-muted', style.panelMessage)}>
        <Text id={emptyKey || 'dashboard.boxes.music.noResults'} />
      </p>
    );
  }
  return (
    <ul class={style.mediaList}>
      {items.map((item, index) => {
        const absoluteIndex = indexOffset + index;
        const isCurrent = currentIndex !== null && currentIndex !== undefined && absoluteIndex === currentIndex;
        const primaryAction = () => {
          if (item.browsable && onOpen) {
            onOpen(item);
          } else if (item.playable && onPlay) {
            onPlay(item, absoluteIndex);
          }
        };
        const actionable = (item.browsable && onOpen) || (item.playable && onPlay);
        return (
          <li key={`${absoluteIndex}-${item.id}`} class={cx(style.mediaItem, { [style.mediaItemCurrent]: isCurrent })}>
            <button
              type="button"
              class={style.mediaItemMain}
              onClick={primaryAction}
              disabled={!actionable}
              aria-current={isCurrent ? 'true' : undefined}
            >
              <LazyArtwork
                httpClient={httpClient}
                deviceSelector={deviceSelector}
                artworkKey={item.artwork_key}
                className={style.mediaItemArtwork}
                onNotFound={onArtworkNotFound}
              />
              <span class={style.mediaItemText}>
                <span class={style.mediaItemTitle}>{item.title}</span>
                <span class={style.mediaItemSubtitle}>
                  {item.subtitle ? item.subtitle : <Text id={`musicMediaTypes.${item.type}`}>{item.type}</Text>}
                </span>
              </span>
              {item.duration !== null && item.duration !== undefined && item.duration > 0 && (
                <span class={style.mediaItemDuration}>{formatSeconds(item.duration)}</span>
              )}
              {item.browsable && <i class={cx('fe fe-chevron-right', style.mediaItemChevron)} />}
              {!item.browsable && item.playable && pickLabelKey && (
                <span class={style.mediaItemPick}>
                  <Text id={pickLabelKey} />
                </span>
              )}
            </button>
            {canEnqueue && item.playable && onEnqueue && (
              <button
                type="button"
                class={cx('btn btn-secondary btn-sm', style.mediaItemSecondary)}
                onClick={() => onEnqueue(item, MUSIC_PLAY_MODES.APPEND)}
                title={<Text id="dashboard.boxes.music.addToQueue" />}
              >
                <i class="fe fe-plus" />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default MediaItemList;
