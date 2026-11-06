import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { MUSIC_MEDIA_TYPES } from '../../../../../server/utils/constants';
import LazyArtwork from './LazyArtwork';
import Equalizer from './Equalizer';
import { formatSeconds } from './musicApi';
import style from './MusicBox.css';

// the line under the title: the artist of a track; for a container, its type then its subtitle
// ("Album · Miles Davis"), so a search mixing albums, playlists and tracks stays readable
const renderSubtitle = item => {
  const typeLabel = <Text id={`musicMediaTypes.${item.type}`}>{item.type}</Text>;
  if (item.type === MUSIC_MEDIA_TYPES.TRACK) {
    return item.subtitle || typeLabel;
  }
  if (!item.subtitle) {
    // a folder is named by its title alone
    return item.type === MUSIC_MEDIA_TYPES.FOLDER ? null : typeLabel;
  }
  return (
    <span>
      {typeLabel}
      {' · '}
      {item.subtitle}
    </span>
  );
};

// One list for the queue, the catalog and the search results: a MediaItem is
// { id, type, title, subtitle, duration, artwork_key, browsable, playable } (section 4.2 of the
// music spec). A browsable item opens, a playable one plays (or is picked, in a scene editor),
// and a secondary button enqueues it when the player accepts it. The item being started shows a
// spinner, the one just enqueued a check, and the current item of a queue is marked and scrolled
// into view.
class MediaItemList extends Component {
  componentDidMount() {
    this.scrollToCurrent();
  }

  componentDidUpdate() {
    this.scrollToCurrent();
  }

  // the playing item of a long queue is brought into view, a row above it left visible; done once
  // per (page, current item) so the user's own scrolling is never fought
  scrollToCurrent() {
    const { scrollToCurrent, currentIndex, indexOffset = 0, items } = this.props;
    if (!scrollToCurrent || !this.list || currentIndex === null || currentIndex === undefined) {
      return;
    }
    const scrollKey = `${indexOffset}:${currentIndex}:${items.length}`;
    if (this.scrolledFor === scrollKey) {
      return;
    }
    const current = this.list.querySelector('[aria-current="true"]');
    if (!current) {
      return;
    }
    this.scrolledFor = scrollKey;
    const row = current.closest('li') || current;
    this.list.scrollTop = Math.max(0, row.offsetTop - row.offsetHeight);
  }

  render({
    items,
    httpClient,
    deviceSelector,
    currentIndex,
    indexOffset = 0,
    isPlaying,
    onOpen,
    onPlay,
    onEnqueue,
    canEnqueue,
    pickLabelKey,
    emptyKey,
    onArtworkNotFound,
    pendingId,
    addedId,
    startedId
  }) {
    if (!items || items.length === 0) {
      return (
        <p class={cx('text-muted', style.panelMessage)}>
          <Text id={emptyKey || 'dashboard.boxes.music.noResults'} />
        </p>
      );
    }
    return (
      <ul
        class={style.mediaList}
        ref={element => {
          this.list = element;
        }}
      >
        {items.map((item, index) => {
          const absoluteIndex = indexOffset + index;
          const isCurrent = currentIndex !== null && currentIndex !== undefined && absoluteIndex === currentIndex;
          const isPending = pendingId !== null && pendingId !== undefined && pendingId === item.id;
          const isAdded = addedId !== null && addedId !== undefined && addedId === item.id;
          const isStarted = startedId !== null && startedId !== undefined && startedId === item.id;
          const primaryAction = () => {
            if (item.browsable && onOpen) {
              onOpen(item);
            } else if (item.playable && onPlay) {
              onPlay(item, absoluteIndex);
            }
          };
          const actionable = (item.browsable && onOpen) || (item.playable && onPlay);
          const subtitle = renderSubtitle(item);
          const hasDuration = item.duration !== null && item.duration !== undefined && item.duration > 0;
          return (
            <li
              key={`${absoluteIndex}-${item.id}`}
              class={cx(style.mediaItem, {
                [style.mediaItemCurrent]: isCurrent,
                [style.mediaItemStarted]: isStarted
              })}
            >
              <button
                type="button"
                class={style.mediaItemMain}
                onClick={primaryAction}
                disabled={!actionable}
                aria-current={isCurrent ? 'true' : undefined}
              >
                <span class={style.mediaItemArtworkWrap}>
                  <LazyArtwork
                    httpClient={httpClient}
                    deviceSelector={deviceSelector}
                    artworkKey={item.artwork_key}
                    mediaType={item.type}
                    className={style.mediaItemArtwork}
                    onNotFound={onArtworkNotFound}
                  />
                  {(isCurrent || isStarted) && (
                    <span class={style.mediaItemNowPlaying}>
                      <Equalizer animated={isStarted || Boolean(isPlaying)} />
                    </span>
                  )}
                </span>
                <span class={style.mediaItemText}>
                  <span class={style.mediaItemTitle} title={item.title}>
                    {item.title}
                  </span>
                  {subtitle && <span class={style.mediaItemSubtitle}>{subtitle}</span>}
                </span>
                {isPending && <span class={cx(style.spinner, style.mediaItemSpinner)} />}
                {!isPending && hasDuration && (
                  <span class={style.mediaItemDuration}>{formatSeconds(item.duration)}</span>
                )}
                {!isPending && item.browsable && <i class={cx('fe fe-chevron-right', style.mediaItemChevron)} />}
                {!isPending && !item.browsable && item.playable && pickLabelKey && (
                  <span class={style.mediaItemPick}>
                    <Text id={pickLabelKey} />
                  </span>
                )}
              </button>
              {canEnqueue && item.playable && onEnqueue && (
                <Localizer>
                  <button
                    type="button"
                    class={cx(style.iconButton, style.mediaItemSecondary, { [style.iconButtonActive]: isAdded })}
                    onClick={() => onEnqueue(item)}
                    title={<Text id={isAdded ? 'dashboard.boxes.music.added' : 'dashboard.boxes.music.addToQueue'} />}
                    aria-label={
                      <Text id={isAdded ? 'dashboard.boxes.music.added' : 'dashboard.boxes.music.addToQueue'} />
                    }
                  >
                    <i class={`fe fe-${isAdded ? 'check' : 'plus'}`} />
                  </button>
                </Localizer>
              )}
            </li>
          );
        })}
      </ul>
    );
  }
}

export default MediaItemList;
