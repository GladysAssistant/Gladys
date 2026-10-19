import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import debounce from 'debounce';

import { MUSIC_PLAY_MODES } from '../../../../../server/utils/constants';
import MediaItemList from './MediaItemList';
import { musicRoute, getErrorStatus, BROWSE_PAGE_SIZE, SEARCH_LIMIT, SEARCH_DEBOUNCE_MS } from './musicApi';
import style from './MusicBox.css';

// The catalog panel of a player: a search field over the root folders of the integration's
// catalog (section 4.3 of the music spec). Used by the music box (a playable item plays) and by
// the "play music" scene action (a playable item is picked), through `onPlay` / `onPick`.
class MediaBrowser extends Component {
  state = {
    query: '',
    // the folders opened so far, the last one being displayed; empty = the root
    path: [],
    items: null,
    total: null,
    loading: false,
    error: null,
    unavailable: false
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

  play = async (item, mode = MUSIC_PLAY_MODES.REPLACE) => {
    if (this.props.onPick) {
      this.props.onPick(item);
      return;
    }
    const { httpClient, deviceSelector } = this.props;
    try {
      this.setState({ error: null, unavailable: false });
      await httpClient.post(musicRoute(deviceSelector, 'play'), {
        media: { id: item.id, type: item.type },
        mode
      });
      if (this.props.onPlayed) {
        this.props.onPlayed(item, mode);
      }
    } catch (e) {
      this.setState({ unavailable: getErrorStatus(e) === 503, error: e });
    }
  };

  enqueue = (item, mode) => this.play(item, mode);

  render(
    { capabilities, httpClient, deviceSelector, onPick, intl },
    { query, path, items, total, loading, error, unavailable }
  ) {
    const canLoadMore = query.length === 0 && total !== null && items && items.length < total;
    const searchPlaceholder =
      (intl && intl.dictionary && intl.dictionary.dashboard.boxes.music.searchPlaceholder) || '';
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
          </div>
        )}
        {path.length > 0 && query.length === 0 && (
          <div class={style.breadcrumb}>
            <button type="button" class="btn btn-secondary btn-sm" onClick={this.back}>
              <i class="fe fe-chevron-left" /> <Text id="dashboard.boxes.music.back" />
            </button>
            <span class={style.breadcrumbTitle}>{path[path.length - 1].title}</span>
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
            pickLabelKey={onPick ? 'dashboard.boxes.music.playItem' : null}
            onArtworkNotFound={this.onArtworkNotFound}
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
