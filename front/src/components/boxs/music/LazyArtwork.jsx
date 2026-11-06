import { Component } from 'preact';
import cx from 'classnames';

import { MUSIC_MEDIA_TYPES } from '../../../../../server/utils/constants';
import { musicRoute, getErrorStatus } from './musicApi';
import style from './MusicBox.css';

// The placeholder of an item without artwork tells what it is, like a player app does
const PLACEHOLDER_ICONS = {
  [MUSIC_MEDIA_TYPES.FOLDER]: 'folder',
  [MUSIC_MEDIA_TYPES.RADIO]: 'radio',
  [MUSIC_MEDIA_TYPES.PLAYLIST]: 'list',
  [MUSIC_MEDIA_TYPES.ALBUM]: 'disc',
  [MUSIC_MEDIA_TYPES.ARTIST]: 'user'
};

// An artwork served by the proxy route of the player's integration (section 3 of the music
// spec): the browser never loads a third-party URL. Loaded lazily, the bytes are requested once
// the frame enters the viewport, so a long queue or a browse grid costs nothing below the fold.
// A missing key, a refused image or a stale key shows a neutral placeholder. On a key change the
// current image stays until the next one is loaded, then the next one fades in over it: a track
// change never flashes the placeholder.
class LazyArtwork extends Component {
  state = { src: null, previousSrc: null, error: false };

  // another key: the answer of a previous key, if still pending, is ignored
  imageGeneration = 0;

  componentDidMount() {
    if (!this.props.artworkKey) {
      return;
    }
    if (typeof IntersectionObserver === 'undefined') {
      this.load();
      return;
    }
    // guarded just above: a browser without the observer loads at once
    // eslint-disable-next-line compat/compat
    this.observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        this.disconnect();
        this.load();
      }
    });
    if (this.frame) {
      this.observer.observe(this.frame);
    }
  }

  componentDidUpdate(previousProps) {
    if (
      previousProps.artworkKey !== this.props.artworkKey ||
      previousProps.deviceSelector !== this.props.deviceSelector
    ) {
      this.disconnect();
      this.reload();
    }
  }

  componentWillUnmount() {
    this.unmounted = true;
    this.disconnect();
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  // an empty key shows the placeholder at once; another key keeps the current image on screen
  // until the new one is there
  reload = () => {
    this.imageGeneration += 1;
    if (!this.props.artworkKey) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ src: null, previousSrc: null, error: false });
      return;
    }
    this.load();
  };

  load = async () => {
    const { httpClient, deviceSelector, artworkKey, onNotFound } = this.props;
    this.imageGeneration += 1;
    const generation = this.imageGeneration;
    try {
      const { image } = await httpClient.get(musicRoute(deviceSelector, `artwork/${encodeURIComponent(artworkKey)}`));
      if (!this.unmounted && generation === this.imageGeneration) {
        this.setState(previous => ({
          src: image,
          previousSrc: previous.src && previous.src !== image ? previous.src : null,
          error: false
        }));
      }
    } catch (e) {
      if (!this.unmounted && generation === this.imageGeneration) {
        this.setState({ src: null, previousSrc: null, error: true });
        // a key the core no longer allows: the list that carried it is stale
        if (getErrorStatus(e) === 404 && onNotFound) {
          onNotFound();
        }
      }
    }
  };

  // the new image has faded in: the one underneath can go
  dropPreviousImage = () => {
    if (this.state.previousSrc) {
      this.setState({ previousSrc: null });
    }
  };

  render({ className, alt, mediaType }, { src, previousSrc }) {
    return (
      <div
        class={cx(style.artworkFrame, className)}
        ref={element => {
          this.frame = element;
        }}
      >
        {previousSrc && <img src={previousSrc} alt="" class={style.artworkImage} />}
        {src && (
          <img
            key={src}
            src={src}
            alt={alt || ''}
            class={cx(style.artworkImage, { [style.artworkImageFadeIn]: Boolean(previousSrc) })}
            onAnimationEnd={this.dropPreviousImage}
          />
        )}
        {!src && (
          <div class={style.artworkPlaceholder}>
            <i class={`fe fe-${PLACEHOLDER_ICONS[mediaType] || 'music'}`} />
          </div>
        )}
      </div>
    );
  }
}

export default LazyArtwork;
