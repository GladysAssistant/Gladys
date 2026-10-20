import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
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
import MusicSlider from './MusicSlider';
import MusicSheet from './MusicSheet';
import Equalizer from './Equalizer';
import {
  musicRoute,
  getErrorStatus,
  formatSeconds,
  QUEUE_PAGE_SIZE,
  queueOffsetAround,
  COMMAND_ERROR_MS,
  CONFIRMATION_TIMEOUT_MS
} from './musicApi';
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

// a ticking progress moves about one second at a time: anything bigger is a seek or a new sample
const PROGRESS_SMOOTH_STEP_S = 2;

const isWritable = feature => Boolean(feature) && feature.read_only === false;
const numberOrNull = value => (value === null || value === undefined ? null : Number(value));

// an icon-only control of the player: the label is the tooltip and the accessible name
const IconButton = ({ icon, labelKey, onClick, active, pressed, opensDialog, expanded, className, children }) => (
  <Localizer>
    <button
      type="button"
      class={cx(style.iconButton, className, { [style.iconButtonActive]: active })}
      onClick={onClick}
      title={<Text id={labelKey} />}
      aria-label={<Text id={labelKey} />}
      aria-pressed={pressed === undefined ? undefined : String(pressed)}
      aria-haspopup={opensDialog ? 'dialog' : undefined}
      aria-expanded={expanded === undefined ? undefined : String(expanded)}
    >
      <i class={`fe fe-${icon}`} />
      {children}
    </button>
  </Localizer>
);

class MusicComponent extends Component {
  state = {
    // the music features of the player by type, empty until the device is loaded
    features: {},
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
    now: Date.now(),
    // the value under the finger while the progress or the volume is dragged
    scrubPosition: null,
    volumeDraft: null,
    // the notice of a command the player did not take ('commandFailed' / 'noResponse')
    commandError: null
  };

  getDevice = async () => {
    // the device read now is the confirmed state: a confirmation still awaited is void (a websocket
    // reconnection, another player picked in the editor), its deadline must not report anything
    this.clearAllConfirmations();
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

  // The value route answers before the player acts (the action runs in the background), so a
  // refused command or a player that went away never shows up as an HTTP error. A write to a
  // feature with feedback (the player confirms it by publishing its new state) therefore waits
  // for that state: without it in time, the optimistic state is replaced by the confirmed one and
  // a short notice says the player did not respond.
  setValueDevice = async (deviceFeature, value, { expectConfirmation = false } = {}) => {
    try {
      await this.props.httpClient.post(`/api/v1/device_feature/${deviceFeature.selector}/value`, {
        value
      });
    } catch (e) {
      console.error(e);
      this.showCommandError('commandFailed');
      this.getDevice();
      return;
    }
    // the deadline starts once the core took the command
    if (expectConfirmation && deviceFeature.has_feedback) {
      this.awaitConfirmation(deviceFeature.selector);
    }
  };

  awaitConfirmation = selector => {
    this.clearConfirmation(selector);
    this.pendingConfirmations[selector] = setTimeout(() => {
      delete this.pendingConfirmations[selector];
      this.showCommandError('noResponse');
      this.getDevice();
    }, CONFIRMATION_TIMEOUT_MS);
  };

  clearConfirmation = selector => {
    if (this.pendingConfirmations[selector]) {
      clearTimeout(this.pendingConfirmations[selector]);
      delete this.pendingConfirmations[selector];
    }
  };

  clearAllConfirmations = () => Object.keys(this.pendingConfirmations).forEach(this.clearConfirmation);

  pendingConfirmations = {};

  showCommandError = key => {
    clearTimeout(this.commandErrorTimer);
    this.setState({ commandError: key });
    this.commandErrorTimer = setTimeout(() => this.setState({ commandError: null }), COMMAND_ERROR_MS);
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
      await this.setValueDevice(playBackStateFeature, value, { expectConfirmation: true });
    } else if (legacyFeature) {
      await this.setValueDevice(legacyFeature, 1);
    }
  };

  // buffering is a play that has not started yet: the button pauses it
  togglePlayPause = () =>
    this.state.isPlaying || this.state.playbackState === MUSIC_PLAYBACK_STATE.BUFFERING ? this.pause() : this.play();

  next = async () => {
    await this.setValueDevice(this.state.nextFeature, 1);
  };

  previous = async () => {
    await this.setValueDevice(this.state.previousFeature, 1);
  };

  draftVolume = e => this.setState({ volumeDraft: Number(e.target.value) });

  changeVolume = async e => {
    const volume = parseInt(e.target.value, 10);
    // released where it started: nothing to send, nothing the player would confirm
    const unchanged = numberOrNull(this.state.volumeFeature.last_value) === volume;
    const newVolumeFeature = { ...this.state.volumeFeature, last_value: volume };
    await this.setState({ volumeFeature: newVolumeFeature, volumeDraft: null });
    if (!unchanged) {
      await this.setValueDevice(this.state.volumeFeature, volume, { expectConfirmation: true });
    }
  };

  toggleBinary = async type => {
    const feature = this.state.features[type];
    const value = Number(feature.last_value) === 1 ? 0 : 1;
    this.updateFeatureValue(type, value);
    await this.setValueDevice(feature, value, { expectConfirmation: true });
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
    await this.setValueDevice(feature, value, { expectConfirmation: true });
  };

  // dragging the progress shows the time under the finger, releasing it seeks (a click or an
  // arrow key is a drag of one step)
  scrub = e => this.setState({ scrubPosition: Number(e.target.value) });

  // a seek waits for no confirmation: a player republishes its position only when it deviates
  // noticeably from the extrapolated one (section 5 of the spec)
  seek = async e => {
    const feature = this.state.features[DEVICE_FEATURE_TYPES.MUSIC.POSITION];
    const value = Number(e.target.value);
    this.setState({ scrubPosition: null, position: value, positionChangedAt: Date.now(), now: Date.now() });
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
    // the player answered: whatever the value, it is the truth now
    this.clearConfirmation(payload.device_feature_selector);
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

  // the queue and the catalog open in a sheet over the dashboard (MusicSheet), never inside the
  // card: the card keeps its height and no widget under it moves
  selectPanel = panel => {
    this.setState({ panel });
    if (panel === PANELS.QUEUE) {
      this.queueRefetchedForArtwork = false;
      this.loadQueue();
    }
  };

  openQueue = () => this.selectPanel(PANELS.QUEUE);

  openBrowse = () => this.selectPanel(PANELS.BROWSE);

  closePanel = () => this.setState({ panel: null });

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
    clearTimeout(this.commandErrorTimer);
    this.clearAllConfirmations();
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

  // the state of the player next to its name: moving bars while it plays, a word otherwise
  // (paused, buffering, or stopped with a track still loaded)
  renderStatus(hasTrack) {
    const { playbackState } = this.state;
    if (playbackState === MUSIC_PLAYBACK_STATE.PLAYING) {
      return (
        <Localizer>
          <span
            class={style.headerStatus}
            role="img"
            aria-label={<Text id="deviceFeatureValue.category.music.playback_state.1" />}
            title={<Text id="deviceFeatureValue.category.music.playback_state.1" />}
          >
            <Equalizer animated />
          </span>
        </Localizer>
      );
    }
    if (playbackState === null || (playbackState === MUSIC_PLAYBACK_STATE.IDLE && !hasTrack)) {
      return null;
    }
    return (
      <span class={style.headerStatus}>
        <Text id={`deviceFeatureValue.category.music.playback_state.${playbackState}`} />
      </span>
    );
  }

  renderPlayButton(className) {
    const { isPlaying, playbackState } = this.state;
    const buffering = playbackState === MUSIC_PLAYBACK_STATE.BUFFERING;
    const showPause = isPlaying || buffering;
    const playLabel = `dashboard.boxes.music.${showPause ? 'pause' : 'play'}`;
    return (
      <Localizer>
        <button
          type="button"
          class={cx(style.playButton, className)}
          onClick={this.togglePlayPause}
          title={<Text id={playLabel} />}
          aria-label={<Text id={playLabel} />}
        >
          {buffering && <span class={style.spinner} />}
          {!buffering && <i class={cx(`fe fe-${showPause ? 'pause' : 'play'}`, { [style.playIcon]: !showPause })} />}
        </button>
      </Localizer>
    );
  }

  renderTransport() {
    const { previousFeature, nextFeature, features, playBackStateFeature, playFeature, pauseFeature } = this.state;
    const shuffleFeature = features[DEVICE_FEATURE_TYPES.MUSIC.SHUFFLE];
    const repeatFeature = features[DEVICE_FEATURE_TYPES.MUSIC.REPEAT];
    const canPlayPause = isWritable(playBackStateFeature) || Boolean(playFeature) || Boolean(pauseFeature);
    const shuffleOn = Boolean(shuffleFeature) && Number(shuffleFeature.last_value) === 1;
    const repeatValue = repeatFeature ? Number(repeatFeature.last_value) : null;
    const repeatOn = repeatValue !== null && repeatValue !== MUSIC_REPEAT_MODE.OFF;
    // a narrow card on a touch screen puts the modes (shuffle, repeat) on a second line under
    // previous / play / next, through the break element (MusicBox.css)
    return (
      <div class={style.transportFrame}>
        <div class={style.transport}>
          {shuffleFeature && isWritable(shuffleFeature) && (
            <IconButton
              icon="shuffle"
              labelKey="dashboard.boxes.music.shuffle"
              onClick={this.toggleShuffle}
              active={shuffleOn}
              pressed={shuffleOn}
              className={style.transportMode}
            />
          )}
          {previousFeature && (
            <IconButton icon="skip-back" labelKey="dashboard.boxes.music.previous" onClick={this.previous} />
          )}
          {canPlayPause && this.renderPlayButton()}
          {nextFeature && <IconButton icon="skip-forward" labelKey="dashboard.boxes.music.next" onClick={this.next} />}
          {repeatFeature && isWritable(repeatFeature) && (
            <IconButton
              icon="repeat"
              labelKey="dashboard.boxes.music.repeat"
              onClick={this.cycleRepeat}
              active={repeatOn}
              pressed={repeatOn}
              className={style.transportMode}
            >
              {repeatValue === MUSIC_REPEAT_MODE.ONE && <span class={style.repeatOne}>1</span>}
            </IconButton>
          )}
          <span class={style.transportBreak} />
        </div>
      </div>
    );
  }

  renderVolume() {
    const { volumeFeature, volumeDraft, features } = this.state;
    const muteFeature = features[DEVICE_FEATURE_TYPES.MUSIC.MUTE];
    const panelTabs = this.getPanelTabs();
    if (!volumeFeature && !muteFeature && panelTabs.length === 0) {
      return null;
    }
    const muted = Boolean(muteFeature) && Number(muteFeature.last_value) === 1;
    const volume = volumeDraft !== null ? volumeDraft : numberOrNull(volumeFeature && volumeFeature.last_value);
    let icon = 'volume-2';
    if (muted || volume === 0) {
      icon = 'volume-x';
    } else if (volume !== null && volume < 50) {
      icon = 'volume-1';
    }
    return (
      <div class={style.volumeRow}>
        {(volumeFeature || muteFeature) && (
          <div class={style.volumeControl}>
            {muteFeature && isWritable(muteFeature) ? (
              <IconButton icon={icon} labelKey="dashboard.boxes.music.mute" onClick={this.toggleMute} pressed={muted} />
            ) : (
              <span class={style.volumeIcon}>
                <i class={`fe fe-${icon}`} />
              </span>
            )}
            {volumeFeature && (
              <MusicSlider
                value={volume || 0}
                max={100}
                onInput={this.draftVolume}
                onChange={this.changeVolume}
                disabled={volumeFeature.read_only === true}
                muted={muted}
                label={<Text id="dashboard.boxes.music.volume" />}
                valueText={`${volume || 0} %`}
              />
            )}
          </div>
        )}
        {panelTabs.length > 0 && this.renderPanelButtons(panelTabs)}
      </div>
    );
  }

  renderNowPlaying({ title, artist, album, artworkKey }) {
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
          {title ? (
            <span class={style.title} title={title}>
              {title}
            </span>
          ) : (
            <span class={cx(style.title, style.titleIdle)}>
              <Text id="dashboard.boxes.music.nothingPlaying" />
            </span>
          )}
          {artist && (
            <span class={style.subtitle} title={artist}>
              {artist}
            </span>
          )}
          {album && (
            <span class={style.album} title={album}>
              {album}
            </span>
          )}
        </div>
      </div>
    );
  }

  renderProgress(hasTrack) {
    const { playbackState, scrubPosition } = this.state;
    const duration = this.getDuration();
    // no duration while something is loaded: a stream (a radio), nothing to seek
    if (!duration) {
      if (!hasTrack || playbackState === null || playbackState === MUSIC_PLAYBACK_STATE.IDLE) {
        return null;
      }
      return (
        <div class={style.liveRow}>
          <span class={style.liveBadge}>
            <span class={style.liveDot} />
            <Text id="dashboard.boxes.music.live" />
          </span>
        </div>
      );
    }
    const position = this.computePosition();
    if (position === null) {
      return null;
    }
    const positionFeature = this.state.features[DEVICE_FEATURE_TYPES.MUSIC.POSITION];
    const shown = scrubPosition !== null ? scrubPosition : Math.min(position, duration);
    const smooth = scrubPosition === null && playbackState === MUSIC_PLAYBACK_STATE.PLAYING;
    return (
      <div class={style.progress}>
        <MusicSlider
          value={shown}
          max={duration}
          onInput={this.scrub}
          onChange={this.seek}
          disabled={!isWritable(positionFeature)}
          label={<Text id="deviceFeatureCategory.music.position" />}
          valueText={`${formatSeconds(shown)} / ${formatSeconds(duration)}`}
          smoothStep={smooth ? PROGRESS_SMOOTH_STEP_S : 0}
        />
        <div class={style.progressTimes}>
          <span>{formatSeconds(shown)}</span>
          <span>{formatSeconds(duration)}</span>
        </div>
      </div>
    );
  }

  renderCommandError() {
    const { commandError } = this.state;
    if (!commandError) {
      return null;
    }
    return (
      <p class={cx('text-danger', style.commandNotice)} role="status">
        <Text id={`dashboard.boxes.music.${commandError}`} />
      </p>
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
            isPlaying={this.state.isPlaying}
            scrollToCurrent
            onPlay={this.playQueueItem}
            emptyKey="dashboard.boxes.music.emptyQueue"
            onArtworkNotFound={this.onQueueArtworkNotFound}
          />
        )}
      </div>
    );
  }

  // the catalog operations the integration declares, as the tabs of the sheet
  getPanelTabs() {
    const { capabilities } = this.state;
    const tabs = [];
    if (!capabilities) {
      return tabs;
    }
    if (capabilities.queue) {
      tabs.push({ key: PANELS.QUEUE, icon: 'list', labelKey: 'dashboard.boxes.music.queue' });
    }
    if (capabilities.browse || capabilities.search) {
      tabs.push({
        key: PANELS.BROWSE,
        icon: capabilities.search ? 'search' : 'folder',
        labelKey: `dashboard.boxes.music.${capabilities.search ? 'search' : 'browse'}`
      });
    }
    return tabs;
  }

  // the queue and the catalog are opened from two quiet icons at the end of the volume row (where a
  // player app puts its queue button), never from labelled pills under the card
  renderPanelButtons(tabs) {
    return (
      <div class={style.panelButtons}>
        {tabs.map(tab => (
          <IconButton
            key={tab.key}
            icon={tab.icon}
            labelKey={tab.labelKey}
            onClick={tab.key === PANELS.QUEUE ? this.openQueue : this.openBrowse}
            opensDialog
            expanded={this.state.panel === tab.key}
          />
        ))}
      </div>
    );
  }

  // what plays, at the bottom of the sheet: the effect of a tap in the list shows right there, the
  // card itself being under the backdrop
  renderMiniPlayer(track) {
    const { playBackStateFeature, playFeature, pauseFeature } = this.state;
    const duration = this.getDuration();
    const position = this.computePosition();
    const ratio = duration && position !== null ? Math.min(100, Math.max(0, (position / duration) * 100)) : 0;
    const canPlayPause = isWritable(playBackStateFeature) || Boolean(playFeature) || Boolean(pauseFeature);
    return (
      <div class={style.miniPlayer}>
        <LazyArtwork
          httpClient={this.props.httpClient}
          deviceSelector={this.props.box.device}
          artworkKey={track.artworkKey}
          className={style.miniPlayerArtwork}
          alt={track.title}
        />
        <div class={style.miniPlayerText}>
          <span class={cx(style.miniPlayerTitle, { [style.titleIdle]: !track.title })}>
            {track.title || <Text id="dashboard.boxes.music.nothingPlaying" />}
          </span>
          {track.artist && <span class={style.miniPlayerSubtitle}>{track.artist}</span>}
        </div>
        {canPlayPause && this.renderPlayButton(style.miniPlayButton)}
        {ratio > 0 && <div class={style.miniPlayerProgress} style={{ width: `${ratio}%` }} />}
      </div>
    );
  }

  renderSheet(title, track) {
    const { capabilities, panel } = this.state;
    const tabs = this.getPanelTabs();
    if (!panel || tabs.length === 0) {
      return null;
    }
    return (
      <MusicSheet
        title={title}
        tabs={tabs}
        activeTab={panel}
        onSelectTab={this.selectPanel}
        onClose={this.closePanel}
        footer={
          <div class={style.sheetFooter}>
            {this.renderCommandError()}
            {track && this.renderMiniPlayer(track)}
          </div>
        }
      >
        {panel === PANELS.QUEUE && this.renderQueue()}
        {panel === PANELS.BROWSE && (
          <MediaBrowser
            httpClient={this.props.httpClient}
            deviceSelector={this.props.box.device}
            capabilities={capabilities}
            intl={this.props.intl}
            autoFocusSearch
          />
        )}
      </MusicSheet>
    );
  }

  // One layout for every player: each block renders only when the player has its features. A player
  // without any "now playing" type (a frozen internal Sonos, a bare MQTT player) gets the same
  // transport and volume in the same style, with no artwork, title or progress block: the box shows
  // nothing it has no data for.
  render(props, state) {
    const { musicDevice, hasNowPlaying } = state;
    const boxTitle = get(props, 'box.name') || (musicDevice && musicDevice.name);
    const text = type => {
      const feature = state.features[type];
      return feature && feature.last_value_string ? feature.last_value_string : '';
    };
    const track = {
      title: text(DEVICE_FEATURE_TYPES.MUSIC.TITLE),
      artist: text(DEVICE_FEATURE_TYPES.MUSIC.ARTIST),
      album: text(DEVICE_FEATURE_TYPES.MUSIC.ALBUM),
      artworkKey: text(DEVICE_FEATURE_TYPES.MUSIC.ARTWORK)
    };
    const hasTrack = Boolean(track.title || track.artist || track.album);
    return (
      <div class="card">
        <div class={cx('card-header', style.header)}>
          <h3 class="card-title">{boxTitle}</h3>
          {musicDevice && this.renderStatus(hasTrack)}
        </div>
        <div class="card-body">
          {hasNowPlaying && this.renderNowPlaying(track)}
          {hasNowPlaying && this.renderProgress(hasTrack)}
          {this.renderTransport()}
          {this.renderVolume()}
          {!state.panel && this.renderCommandError()}
          {this.renderSheet(boxTitle, hasNowPlaying ? track : null)}
        </div>
      </div>
    );
  }
}

export default connect('httpClient,session', {})(withIntlAsProp(MusicComponent));
