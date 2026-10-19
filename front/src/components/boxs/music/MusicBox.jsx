import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import {
  WEBSOCKET_MESSAGE_TYPES,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  MUSIC_PLAYBACK_STATE,
  MUSIC_REPEAT_MODE,
  MUSIC_STRING_FEATURE_TYPES
} from '../../../../../server/utils/constants';
import { resolveFeatureOptions } from '../../../utils/supportedOptions';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import LazyArtwork from './LazyArtwork';
import MediaItemList from './MediaItemList';
import MediaBrowser from './MediaBrowser';
import { musicRoute, getErrorStatus, formatSeconds, QUEUE_PAGE_SIZE, queueOffsetAround } from './musicApi';
import style from './MusicBox.css';

const PANELS = { QUEUE: 'queue', BROWSE: 'browse' };
const REPEAT_CATALOG = [
  { value: MUSIC_REPEAT_MODE.OFF },
  { value: MUSIC_REPEAT_MODE.ALL },
  { value: MUSIC_REPEAT_MODE.ONE }
];
// the "now playing" types: a player exposing none of them keeps the legacy layout
const NOW_PLAYING_TYPES = [
  ...MUSIC_STRING_FEATURE_TYPES,
  DEVICE_FEATURE_TYPES.MUSIC.DURATION,
  DEVICE_FEATURE_TYPES.MUSIC.POSITION
];

const isWritable = feature => Boolean(feature) && feature.read_only === false;
const numberOrNull = value => (value === null || value === undefined ? null : Number(value));

class MusicComponent extends Component {
  state = {
    isPlaying: null,
    playbackState: null,
    capabilities: null,
    panel: null,
    queue: null,
    queueOffset: 0,
    queueCurrentIndex: null,
    queueTotal: null,
    queueUnavailable: false,
    queueError: false,
    // the position sampled by the player and the instant it was true (section 2 of the spec)
    position: null,
    positionChangedAt: null,
    now: Date.now()
  };

  getDevice = async () => {
    try {
      await this.setState({ error: false });
      const musicDevice = await this.props.httpClient.get(`/api/v1/device/${this.props.box.device}`, {});
      const byType = {};
      (musicDevice.features || []).forEach(feature => {
        if (feature.category === DEVICE_FEATURE_CATEGORIES.MUSIC) {
          byType[feature.type] = feature;
        }
      });
      const playBackStateFeature = byType[DEVICE_FEATURE_TYPES.MUSIC.PLAYBACK_STATE];
      const playbackState = playBackStateFeature ? numberOrNull(playBackStateFeature.last_value) : null;
      const positionFeature = byType[DEVICE_FEATURE_TYPES.MUSIC.POSITION];
      const hasNowPlaying = NOW_PLAYING_TYPES.some(type => Boolean(byType[type]));
      this.setState({
        musicDevice,
        features: byType,
        playFeature: byType[DEVICE_FEATURE_TYPES.MUSIC.PLAY],
        pauseFeature: byType[DEVICE_FEATURE_TYPES.MUSIC.PAUSE],
        previousFeature: byType[DEVICE_FEATURE_TYPES.MUSIC.PREVIOUS],
        nextFeature: byType[DEVICE_FEATURE_TYPES.MUSIC.NEXT],
        volumeFeature: byType[DEVICE_FEATURE_TYPES.MUSIC.VOLUME],
        playBackStateFeature,
        playbackState,
        isPlaying: playbackState === MUSIC_PLAYBACK_STATE.PLAYING,
        hasNowPlaying,
        position: positionFeature ? numberOrNull(positionFeature.last_value) : null,
        positionChangedAt:
          positionFeature && positionFeature.last_value_changed
            ? new Date(positionFeature.last_value_changed).getTime()
            : Date.now(),
        now: Date.now()
      });
      this.syncTicker();
    } catch (e) {
      console.error(e);
      this.setState({ error: true });
    }
  };

  // the on-demand operations the player's integration declares; a 404 (an internal service's
  // player, or an older server) means no panel at all
  getCapabilities = async () => {
    try {
      const capabilities = await this.props.httpClient.get(musicRoute(this.props.box.device, 'capabilities'));
      this.setState({ capabilities });
    } catch (e) {
      this.setState({ capabilities: null });
    }
  };

  setValueDevice = async (deviceFeature, value) => {
    try {
      await this.setState({ error: false });
      await this.props.httpClient.post(`/api/v1/device_feature/${deviceFeature.selector}/value`, {
        value
      });
    } catch (e) {
      console.error(e);
      this.setState({ error: true });
    }
  };

  // --- transport ---------------------------------------------------------

  play = async () => {
    await this.setPlaybackState(MUSIC_PLAYBACK_STATE.PLAYING, this.state.playFeature);
  };

  pause = async () => {
    await this.setPlaybackState(MUSIC_PLAYBACK_STATE.PAUSED, this.state.pauseFeature);
  };

  // a writable playback_state is the Gladys idiom (the feature is both the state and the
  // command); the one-shot play / pause features are the fallback of older players
  setPlaybackState = async (value, legacyFeature) => {
    const { playBackStateFeature } = this.state;
    this.applyPlaybackState(value);
    if (isWritable(playBackStateFeature)) {
      await this.setValueDevice(playBackStateFeature, value);
    } else if (legacyFeature) {
      await this.setValueDevice(legacyFeature, 1);
    }
  };

  next = async () => {
    await this.setValueDevice(this.state.nextFeature, 1);
  };

  previous = async () => {
    await this.setValueDevice(this.state.previousFeature, 1);
  };

  changeVolume = async e => {
    const volume = parseInt(e.target.value, 10);
    const newVolumeFeature = { ...this.state.volumeFeature, last_value: volume };
    await this.setState({ volumeFeature: newVolumeFeature });
    await this.setValueDevice(this.state.volumeFeature, volume);
  };

  toggleBinary = async type => {
    const feature = this.state.features[type];
    const value = Number(feature.last_value) === 1 ? 0 : 1;
    this.updateFeatureValue(type, value);
    await this.setValueDevice(feature, value);
  };

  toggleShuffle = () => this.toggleBinary(DEVICE_FEATURE_TYPES.MUSIC.SHUFFLE);

  toggleMute = () => this.toggleBinary(DEVICE_FEATURE_TYPES.MUSIC.MUTE);

  // cycles through the repeat modes the player declared (its supported_options), or the three
  // generic ones
  cycleRepeat = async () => {
    const feature = this.state.features[DEVICE_FEATURE_TYPES.MUSIC.REPEAT];
    const options = resolveFeatureOptions(feature, REPEAT_CATALOG).map(option => Number(option.value));
    if (options.length === 0) {
      return;
    }
    const current = options.indexOf(Number(feature.last_value));
    const value = options[(current + 1) % options.length];
    this.updateFeatureValue(DEVICE_FEATURE_TYPES.MUSIC.REPEAT, value);
    await this.setValueDevice(feature, value);
  };

  seek = async e => {
    const feature = this.state.features[DEVICE_FEATURE_TYPES.MUSIC.POSITION];
    const duration = this.getDuration();
    if (!isWritable(feature) || !duration) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = rect.width > 0 ? Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)) : 0;
    const value = Math.round(ratio * duration);
    this.setState({ position: value, positionChangedAt: Date.now(), now: Date.now() });
    await this.setValueDevice(feature, value);
  };

  // --- local state helpers ------------------------------------------------

  updateFeatureValue = (type, value, lastValueChanged) => {
    this.setState(previous => {
      const feature = previous.features[type];
      if (!feature) {
        return null;
      }
      return {
        features: {
          ...previous.features,
          [type]: { ...feature, last_value: value, last_value_changed: lastValueChanged || feature.last_value_changed }
        }
      };
    });
  };

  updateFeatureStringValue = (type, value, lastValueChanged) => {
    this.setState(previous => {
      const feature = previous.features[type];
      if (!feature) {
        return null;
      }
      return {
        features: {
          ...previous.features,
          [type]: { ...feature, last_value_string: value, last_value_changed: lastValueChanged }
        }
      };
    });
  };

  // a transition out of PLAYING freezes the extrapolated position where it was, so a player that
  // publishes its pause before its position never jumps back to the last sample
  applyPlaybackState = value => {
    this.setState(previous => {
      const wasPlaying = previous.playbackState === MUSIC_PLAYBACK_STATE.PLAYING;
      const nowPlaying = value === MUSIC_PLAYBACK_STATE.PLAYING;
      const update = { playbackState: value, isPlaying: nowPlaying, now: Date.now() };
      if (wasPlaying && !nowPlaying) {
        update.position = this.computePosition(previous);
        update.positionChangedAt = Date.now();
      }
      if (value === MUSIC_PLAYBACK_STATE.IDLE) {
        update.position = 0;
        update.positionChangedAt = Date.now();
      }
      return update;
    }, this.syncTicker);
  };

  getDuration = () => {
    const feature = this.state.features && this.state.features[DEVICE_FEATURE_TYPES.MUSIC.DURATION];
    const duration = feature ? numberOrNull(feature.last_value) : null;
    return duration && duration > 0 ? duration : 0;
  };

  // shown = position + (now - last_value_changed) while playing, clamped to the duration
  computePosition = (state = this.state) => {
    if (state.position === null) {
      return null;
    }
    if (state.playbackState !== MUSIC_PLAYBACK_STATE.PLAYING) {
      return state.position;
    }
    const elapsed = Math.max(0, (state.now - state.positionChangedAt) / 1000);
    const duration = this.getDuration();
    const shown = state.position + elapsed;
    return duration ? Math.min(duration, shown) : shown;
  };

  syncTicker = () => {
    const shouldTick = this.state.isPlaying && this.state.position !== null;
    if (shouldTick && !this.ticker) {
      this.ticker = setInterval(() => this.setState({ now: Date.now() }), 1000);
    } else if (!shouldTick && this.ticker) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
  };

  // --- websocket --------------------------------------------------------

  updateDeviceStateWebsocket = payload => {
    const { features } = this.state;
    if (!features) {
      return;
    }
    const type = Object.keys(features).find(key => features[key].selector === payload.device_feature_selector);
    if (!type) {
      return;
    }
    const value = numberOrNull(payload.last_value);
    this.updateFeatureValue(type, value, payload.last_value_changed);
    if (type === DEVICE_FEATURE_TYPES.MUSIC.PLAYBACK_STATE) {
      this.applyPlaybackState(value);
    } else if (type === DEVICE_FEATURE_TYPES.MUSIC.VOLUME) {
      this.setState({ volumeFeature: { ...this.state.volumeFeature, last_value: value } });
    } else if (type === DEVICE_FEATURE_TYPES.MUSIC.POSITION) {
      const changedAt = payload.last_value_changed ? new Date(payload.last_value_changed).getTime() : Date.now();
      this.setState({ position: value, positionChangedAt: changedAt, now: Date.now() }, this.syncTicker);
    }
  };

  updateDeviceStringStateWebsocket = payload => {
    const { features } = this.state;
    if (!features) {
      return;
    }
    const type = Object.keys(features).find(key => features[key].selector === payload.device_feature);
    if (!type) {
      return;
    }
    this.updateFeatureStringValue(type, payload.last_value_string, payload.last_value_changed);
    // a new track: the queue moved
    if (type === DEVICE_FEATURE_TYPES.MUSIC.TITLE && this.state.panel === PANELS.QUEUE) {
      this.loadQueue();
    }
  };

  handleWebsocketConnected = ({ connected }) => {
    // When the websocket is disconnected, we refresh the data when the websocket is reconnected
    if (!connected) {
      this.wasDisconnected = true;
    } else if (this.wasDisconnected) {
      this.getDevice();
      this.wasDisconnected = false;
    }
  };

  // --- panels -----------------------------------------------------------

  togglePanel = panel => {
    const next = this.state.panel === panel ? null : panel;
    this.setState({ panel: next });
    if (next === PANELS.QUEUE) {
      this.loadQueue();
    }
  };

  toggleQueue = () => this.togglePanel(PANELS.QUEUE);

  toggleBrowse = () => this.togglePanel(PANELS.BROWSE);

  loadQueue = async (offset = 0, followCurrent = true) => {
    const { httpClient } = this.props;
    try {
      this.setState({ queueUnavailable: false, queueError: false });
      const { items, current_index: currentIndex, total } = await httpClient.get(
        musicRoute(this.props.box.device, 'queue'),
        { offset, limit: QUEUE_PAGE_SIZE }
      );
      const current = currentIndex === undefined ? null : currentIndex;
      // the playing item is outside this page: show the page around it instead
      if (followCurrent && current !== null && (current < offset || current >= offset + items.length)) {
        const around = queueOffsetAround(current);
        if (around !== offset) {
          await this.loadQueue(around, false);
          return;
        }
      }
      this.setState({ queue: items, queueOffset: offset, queueCurrentIndex: current, queueTotal: total });
    } catch (e) {
      this.setState({ queueUnavailable: getErrorStatus(e) === 503, queueError: getErrorStatus(e) !== 503 });
    }
  };

  playQueueItem = async (item, index) => {
    try {
      await this.props.httpClient.post(musicRoute(this.props.box.device, 'queue/play'), { index });
      this.setState({ queueCurrentIndex: index });
    } catch (e) {
      this.setState({ queueUnavailable: getErrorStatus(e) === 503, queueError: getErrorStatus(e) !== 503 });
    }
  };

  // an artwork the core no longer serves means the queue aged: refetched once per panel opening
  onQueueArtworkNotFound = () => {
    if (this.queueRefetchedForArtwork) {
      return;
    }
    this.queueRefetchedForArtwork = true;
    this.loadQueue(this.state.queueOffset, false);
  };

  // --- lifecycle --------------------------------------------------------

  // another player was picked in the box editor: the panels close and everything reloads
  switchDevice = () => {
    this.setState({ panel: null, queue: null, capabilities: null });
    this.getDevice();
    this.getCapabilities();
  };

  componentDidMount() {
    this.getDevice();
    this.getCapabilities();
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
      this.updateDeviceStateWebsocket
    );
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STRING_STATE,
      this.updateDeviceStringStateWebsocket
    );
    this.props.session.dispatcher.addListener('websocket.connected', this.handleWebsocketConnected);
  }

  componentDidUpdate(previousProps) {
    if (previousProps.box.device !== this.props.box.device) {
      this.switchDevice();
    }
  }

  componentWillUnmount() {
    if (this.ticker) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
      this.updateDeviceStateWebsocket
    );
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STRING_STATE,
      this.updateDeviceStringStateWebsocket
    );
    this.props.session.dispatcher.removeListener('websocket.connected', this.handleWebsocketConnected);
  }

  // --- render -----------------------------------------------------------

  renderTransport() {
    const {
      isPlaying,
      previousFeature,
      nextFeature,
      features,
      playBackStateFeature,
      playFeature,
      pauseFeature
    } = this.state;
    const shuffleFeature = features[DEVICE_FEATURE_TYPES.MUSIC.SHUFFLE];
    const repeatFeature = features[DEVICE_FEATURE_TYPES.MUSIC.REPEAT];
    const canPlayPause = isWritable(playBackStateFeature) || Boolean(playFeature) || Boolean(pauseFeature);
    const repeatValue = repeatFeature ? Number(repeatFeature.last_value) : null;
    return (
      <div class={style.transport}>
        {shuffleFeature && isWritable(shuffleFeature) && (
          <button
            type="button"
            class={cx('btn btn-secondary', style.transportButton, {
              [style.transportActive]: Number(shuffleFeature.last_value) === 1
            })}
            onClick={this.toggleShuffle}
            title={<Text id="dashboard.boxes.music.shuffle" />}
          >
            <i class="fe fe-shuffle" />
          </button>
        )}
        {previousFeature && (
          <button
            type="button"
            class={cx('btn btn-secondary', style.transportButton)}
            onClick={this.previous}
            title={<Text id="dashboard.boxes.music.previous" />}
          >
            <i class="fe fe-skip-back" />
          </button>
        )}
        {canPlayPause && !isPlaying && (
          <button
            type="button"
            class={cx('btn btn-secondary', style.transportButton)}
            onClick={this.play}
            title={<Text id="dashboard.boxes.music.play" />}
          >
            <i class="fe fe-play" />
          </button>
        )}
        {canPlayPause && isPlaying && (
          <button
            type="button"
            class={cx('btn btn-secondary', style.transportButton)}
            onClick={this.pause}
            title={<Text id="dashboard.boxes.music.pause" />}
          >
            <i class="fe fe-pause" />
          </button>
        )}
        {nextFeature && (
          <button
            type="button"
            class={cx('btn btn-secondary', style.transportButton)}
            onClick={this.next}
            title={<Text id="dashboard.boxes.music.next" />}
          >
            <i class="fe fe-skip-forward" />
          </button>
        )}
        {repeatFeature && isWritable(repeatFeature) && (
          <button
            type="button"
            class={cx('btn btn-secondary', style.transportButton, {
              [style.transportActive]: repeatValue !== null && repeatValue !== MUSIC_REPEAT_MODE.OFF
            })}
            onClick={this.cycleRepeat}
            title={<Text id="dashboard.boxes.music.repeat" />}
          >
            <i class="fe fe-repeat" />
            {repeatValue === MUSIC_REPEAT_MODE.ONE && <small>1</small>}
          </button>
        )}
      </div>
    );
  }

  renderVolume() {
    const { volumeFeature, features } = this.state;
    const muteFeature = features[DEVICE_FEATURE_TYPES.MUSIC.MUTE];
    if (!volumeFeature && !muteFeature) {
      return null;
    }
    return (
      <div class={style.volumeRow}>
        {muteFeature && isWritable(muteFeature) && (
          <button
            type="button"
            class={cx('btn btn-secondary', style.transportButton, {
              [style.transportActive]: Number(muteFeature.last_value) === 1
            })}
            onClick={this.toggleMute}
            title={<Text id="dashboard.boxes.music.mute" />}
          >
            <i class={`fe fe-${Number(muteFeature.last_value) === 1 ? 'volume-x' : 'volume-2'}`} />
          </button>
        )}
        {volumeFeature && (
          <input
            type="range"
            value={volumeFeature.last_value}
            onChange={this.changeVolume}
            class="form-control"
            step="1"
            min="0"
            max="100"
            aria-label={<Text id="dashboard.boxes.music.volume" />}
          />
        )}
      </div>
    );
  }

  renderNowPlaying() {
    const { features, playbackState } = this.state;
    const text = type => {
      const feature = features[type];
      return feature && feature.last_value_string ? feature.last_value_string : '';
    };
    const title = text(DEVICE_FEATURE_TYPES.MUSIC.TITLE);
    const artist = text(DEVICE_FEATURE_TYPES.MUSIC.ARTIST);
    const album = text(DEVICE_FEATURE_TYPES.MUSIC.ALBUM);
    const artworkKey = text(DEVICE_FEATURE_TYPES.MUSIC.ARTWORK);
    const idle = playbackState === MUSIC_PLAYBACK_STATE.IDLE || (!title && !artist && !album);
    const subtitle = [artist, album].filter(Boolean).join(' · ');
    return (
      <div class={style.nowPlaying}>
        <LazyArtwork
          httpClient={this.props.httpClient}
          deviceSelector={this.props.box.device}
          artworkKey={artworkKey}
          className={style.nowPlayingArtwork}
          alt={title}
        />
        <div class={style.nowPlayingText}>
          <span class={style.title}>
            {idle && !title && <Text id="dashboard.boxes.music.nothingPlaying" />}
            {title}
          </span>
          {subtitle && <span class={style.subtitle}>{subtitle}</span>}
          {playbackState !== null && (
            <span class={style.stateLabel}>
              <Text id={`deviceFeatureValue.category.music.playback_state.${playbackState}`} />
            </span>
          )}
        </div>
      </div>
    );
  }

  renderProgress() {
    const duration = this.getDuration();
    const position = this.computePosition();
    if (!duration || position === null) {
      return null;
    }
    const positionFeature = this.state.features[DEVICE_FEATURE_TYPES.MUSIC.POSITION];
    const seekable = isWritable(positionFeature);
    const ratio = Math.min(100, Math.max(0, (position / duration) * 100));
    return (
      <div class={style.progress}>
        <button
          type="button"
          class={cx(style.progressTrack, { [style.progressTrackSeekable]: seekable })}
          onClick={seekable ? this.seek : undefined}
          disabled={!seekable}
          aria-label={<Text id="deviceFeatureCategory.music.position" />}
        >
          <div class={style.progressFill} style={{ width: `${ratio}%` }} />
        </button>
        <div class={style.progressTimes}>
          <span>{formatSeconds(position)}</span>
          <span>{formatSeconds(duration)}</span>
        </div>
      </div>
    );
  }

  renderQueue() {
    const { queue, queueOffset, queueCurrentIndex, queueUnavailable, queueError } = this.state;
    return (
      <div class={style.panel}>
        {queueUnavailable && (
          <p class={cx('text-muted', style.panelMessage)}>
            <Text id="dashboard.boxes.music.unavailable" />
          </p>
        )}
        {queueError && (
          <p class={cx('text-danger', style.panelMessage)}>
            <Text id="dashboard.boxes.music.error" />
          </p>
        )}
        {!queueUnavailable && !queueError && queue === null && (
          <p class={cx('text-muted', style.panelMessage)}>
            <Text id="dashboard.boxes.music.loading" />
          </p>
        )}
        {queue !== null && (
          <MediaItemList
            items={queue}
            httpClient={this.props.httpClient}
            deviceSelector={this.props.box.device}
            currentIndex={queueCurrentIndex}
            indexOffset={queueOffset}
            onPlay={this.playQueueItem}
            emptyKey="dashboard.boxes.music.emptyQueue"
            onArtworkNotFound={this.onQueueArtworkNotFound}
          />
        )}
      </div>
    );
  }

  renderPanels() {
    const { capabilities, panel } = this.state;
    if (!capabilities) {
      return null;
    }
    const hasBrowse = Boolean(capabilities.browse || capabilities.search);
    if (!capabilities.queue && !hasBrowse) {
      return null;
    }
    return (
      <div>
        <div class={style.panelTabs}>
          {capabilities.queue && (
            <button
              type="button"
              class={cx('btn btn-sm', panel === PANELS.QUEUE ? 'btn-primary' : 'btn-secondary')}
              onClick={this.toggleQueue}
            >
              <i class="fe fe-list mr-1" />
              <Text id="dashboard.boxes.music.queue" />
            </button>
          )}
          {hasBrowse && (
            <button
              type="button"
              class={cx('btn btn-sm', panel === PANELS.BROWSE ? 'btn-primary' : 'btn-secondary')}
              onClick={this.toggleBrowse}
            >
              <i class={`fe fe-${capabilities.search ? 'search' : 'folder'} mr-1`} />
              <Text id={`dashboard.boxes.music.${capabilities.search ? 'search' : 'browse'}`} />
            </button>
          )}
        </div>
        {panel === PANELS.QUEUE && this.renderQueue()}
        {panel === PANELS.BROWSE && (
          <MediaBrowser
            httpClient={this.props.httpClient}
            deviceSelector={this.props.box.device}
            capabilities={capabilities}
            intl={this.props.intl}
          />
        )}
      </div>
    );
  }

  // the box as it always rendered for a player without "now playing" metadata
  renderLegacy(props, { isPlaying, musicDevice, previousFeature, nextFeature, volumeFeature }) {
    return (
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">{musicDevice && musicDevice.name}</h3>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col">
              {previousFeature && (
                <button class="btn btn-block btn-secondary" onClick={this.previous}>
                  <i class="fe fe-skip-back" />
                </button>
              )}
            </div>
            <div class="col">
              {!isPlaying && (
                <button class="btn btn-block btn-secondary" onClick={this.play}>
                  <i class="fe fe-play" />
                </button>
              )}
              {isPlaying && (
                <button class="btn btn-block btn-secondary" onClick={this.pause}>
                  <i class="fe fe-pause" />
                </button>
              )}
            </div>
            <div class="col">
              {nextFeature && (
                <button class="btn btn-block btn-secondary" onClick={this.next}>
                  <i class="fe fe-skip-forward" />
                </button>
              )}
            </div>
          </div>
          {volumeFeature && (
            <div class="row mt-4">
              <div class="col">
                <input
                  type="range"
                  value={volumeFeature.last_value}
                  onChange={this.changeVolume}
                  class="form-control"
                  step="1"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          )}
          {this.renderPanels()}
        </div>
      </div>
    );
  }

  render(props, state) {
    const { musicDevice, hasNowPlaying } = state;
    if (!musicDevice || !hasNowPlaying) {
      return this.renderLegacy(props, state);
    }
    const title = get(props, 'box.name') || musicDevice.name;
    return (
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">{title}</h3>
        </div>
        <div class="card-body">
          {this.renderNowPlaying()}
          {this.renderProgress()}
          {this.renderTransport()}
          {this.renderVolume()}
          {this.renderPanels()}
        </div>
      </div>
    );
  }
}

export default connect('httpClient,session', {})(withIntlAsProp(MusicComponent));
