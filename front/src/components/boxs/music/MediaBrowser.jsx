import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import debounce from 'debounce';

import { MUSIC_PLAY_MODES } from '../../../../../server/utils/constants';
import MediaItemList from './MediaItemList';
import {
  musicRoute,
  getErrorStatus,
  BROWSE_PAGE_SIZE,
  SEARCH_LIMIT,
  SEARCH_DEBOUNCE_MS,
  ITEM_FEEDBACK_MS
} from './musicApi';
import style from './MusicBox.css';

// The catalog panel of a player: a search field over the root folders of the integration's
// catalog (section 4.3 of the music spec). Used by the music box (a playable item plays) and by
// the "play music" scene action (a playable item is picked), through `onPlay` / `onPick`. An
// opened folder that is itself playable (an album, a playlist) offers to play — or pick — it
// whole.
class MediaBrowser extends Component {
  state = {
    query: '',
    // the folders opened so far, the last one being displayed; empty = the root
    path: [],
    items: null,
    total: null,
    loading: false,
    error: null,
    unavailable: false,
    // the item a play command is in flight for, the one just enqueued, the one just started
    pendingId: null,
    addedId: null,
    startedId: null
  };

  // a request landing after another one was started is ignored
  requestGeneration = 0;

  componentDidMount() {
    if (this.props.capabilities.browse) {
      this.browse([]);
    }
  }

  componentWillUnmount() {
    this.unmounted = true;
    clearTimeout(this.feedbackTimer);
  }

  request = async (fn, onResult) => {
    this.requestGeneration += 1;
    const generation = this.requestGeneration;
    this.setState({ loading: true, error: null, unavailable: false });
    try {
      const result = await fn();
      if (!this.unmounted && generation === this.requestGeneration) {
        onResult(result);
        this.setState({ loading: false });
      }
    } catch (e) {
      if (!this.unmounted && generation === this.requestGeneration) {
        this.setState({ loading: false, unavailable: getErrorStatus(e) === 503, error: e });
      }
    }
  };

  browse = (path, offset = 0) => {
    const { httpClient, deviceSelector } = this.props;
    const parent = path.length > 0 ? path[path.length - 1] : null;
    const query = { offset, limit: BROWSE_PAGE_SIZE };
    if (parent) {
      query.parent_id = parent.id;
    }
    this.setState({ path, query: '' });
    this.request(
      () => httpClient.get(musicRoute(deviceSelector, 'browse'), query),
      ({ items, total }) => {
        this.setState(previous => ({
          items: offset > 0 && previous.items ? [...previous.items, ...items] : items,
          total: total !== undefined ? total : null
        }));
      }
    );
  };

  search = query => {
    const { httpClient, deviceSelector } = this.props;
    if (query.length === 0) {
      if (this.props.capabilities.browse) {
        this.browse([]);
      } else {
        this.setState({ items: null, total: null });
      }
      return;
    }
    this.request(
      () => httpClient.get(musicRoute(deviceSelector, 'search'), { q: query, limit: SEARCH_LIMIT }),
      ({ items }) => this.setState({ items, total: null, path: [] })
    );
  };

  searchDebounced = debounce(this.search, SEARCH_DEBOUNCE_MS);

  updateQuery = e => {
    const query = e.target.value;
    this.setState({ query });
    this.searchDebounced(query.trim());
  };

  open = item => this.browse([...this.state.path, item]);

  back = () => this.browse(this.state.path.slice(0, -1));

  loadMore = () => this.browse(this.state.path, this.state.items.length);

  refetch = () => {
    if (this.state.query.trim().length > 0) {
      this.search(this.state.query.trim());
    } else if (this.props.capabilities.browse) {
      this.browse(this.state.path, 0);
    }
  };

  // an artwork the core no longer serves means the list aged: refetched once per list
  onArtworkNotFound = () => {
    if (this.refetchedForArtwork) {
      return;
    }
    this.refetchedForArtwork = true;
    this.refetch();
  };

  // the list calls onPlay(item, index): the index is the queue's business, a catalog item always
  // replaces the current playback
  play = item => this.start(item, MUSIC_PLAY_MODES.REPLACE);

  enqueue = item => this.start(item, MUSIC_PLAY_MODES.APPEND);

  playOpenedFolder = () => this.play(this.state.path[this.state.path.length - 1]);

  start = async (item, mode) => {
    if (this.props.onPick) {
      this.props.onPick(item);
      return;
    }
    const { httpClient, deviceSelector } = this.props;
    try {
      this.setState({ error: null, unavailable: false, pendingId: item.id });
      await httpClient.post(musicRoute(deviceSelector, 'play'), {
        media: { id: item.id, type: item.type },
        mode
      });
      if (!this.unmounted) {
        // a short confirmation on the row: started (replace) or added to the queue (append)
        clearTimeout(this.feedbackTimer);
        this.setState(
          mode === MUSIC_PLAY_MODES.REPLACE
            ? { pendingId: null, startedId: item.id, addedId: null }
            : { pendingId: null, addedId: item.id, startedId: null }
        );
        this.feedbackTimer = setTimeout(() => this.setState({ addedId: null, startedId: null }), ITEM_FEEDBACK_MS);
      }
      if (this.props.onPlayed) {
        this.props.onPlayed(item, mode);
      }
    } catch (e) {
      if (!this.unmounted) {
        this.setState({ pendingId: null, unavailable: getErrorStatus(e) === 503, error: e });
      }
    }
  };

  render(
    { capabilities, httpClient, deviceSelector, onPick, intl },
    { query, path, items, total, loading, error, unavailable, pendingId, addedId, startedId }
  ) {
    const canLoadMore = query.length === 0 && total !== null && items && items.length < total;
    const searchPlaceholder =
      (intl && intl.dictionary && intl.dictionary.dashboard.boxes.music.searchPlaceholder) || '';
    const openedFolder = path.length > 0 && query.length === 0 ? path[path.length - 1] : null;
    return (
      <div class={style.panel}>
        {capabilities.search && (
          <div class={cx('input-icon', style.searchField)}>
            <span class="input-icon-addon">
              <i class="fe fe-search" />
            </span>
            <Localizer>
              <input
                type="search"
                class="form-control"
                value={query}
                onInput={this.updateQuery}
                placeholder={searchPlaceholder}
                aria-label={<Text id="dashboard.boxes.music.search" />}
              />
            </Localizer>
            {loading && query.length > 0 && <span class={cx(style.spinner, style.searchSpinner)} />}
          </div>
        )}
        {openedFolder && (
          <div class={style.breadcrumb}>
            <Localizer>
              <button
                type="button"
                class={style.iconButton}
                onClick={this.back}
                title={<Text id="dashboard.boxes.music.back" />}
                aria-label={<Text id="dashboard.boxes.music.back" />}
              >
                <i class="fe fe-chevron-left" />
              </button>
            </Localizer>
            <span class={style.breadcrumbTitle} title={openedFolder.title}>
              {openedFolder.title}
            </span>
            {openedFolder.playable && (
              <button
                type="button"
                class={cx('btn btn-sm btn-primary', style.playAllButton)}
                onClick={this.playOpenedFolder}
                disabled={pendingId === openedFolder.id}
              >
                {pendingId === openedFolder.id ? (
                  <span class={cx(style.spinner, style.playAllSpinner)} />
                ) : (
                  <i class={`fe fe-${startedId === openedFolder.id ? 'check' : 'play'}`} />
                )}
                <Text id={onPick ? 'dashboard.boxes.music.pickThis' : 'dashboard.boxes.music.playAll'} />
              </button>
            )}
          </div>
        )}
        {unavailable && (
          <p class={cx('text-muted', style.panelMessage)}>
            <Text id="dashboard.boxes.music.unavailable" />
          </p>
        )}
        {!unavailable && error && (
          <p class={cx('text-danger', style.panelMessage)}>
            <Text id="dashboard.boxes.music.error" />
          </p>
        )}
        {loading && items === null && (
          <p class={cx('text-muted', style.panelMessage)}>
            <Text id="dashboard.boxes.music.loading" />
          </p>
        )}
        {items !== null && (
          <MediaItemList
            items={items}
            httpClient={httpClient}
            deviceSelector={deviceSelector}
            onOpen={this.open}
            onPlay={this.play}
            onEnqueue={onPick ? null : this.enqueue}
            canEnqueue={!onPick && Boolean(capabilities.append)}
            pickLabelKey={onPick ? 'dashboard.boxes.music.pickThis' : null}
            onArtworkNotFound={this.onArtworkNotFound}
            pendingId={pendingId}
            addedId={addedId}
            startedId={startedId}
          />
        )}
        {canLoadMore && (
          <button
            type="button"
            class={cx('btn btn-secondary btn-sm btn-block', style.loadMore)}
            onClick={this.loadMore}
          >
            <Text id="dashboard.boxes.music.loadMore" />
          </button>
        )}
      </div>
    );
  }
}

export default MediaBrowser;
