import { Component } from 'preact';
import cx from 'classnames';

import { musicRoute, getErrorStatus } from './musicApi';
import style from './MusicBox.css';

// An artwork served by the proxy route of the player's integration (section 3 of the music
// spec): the browser never loads a third-party URL. Loaded lazily, the bytes are requested once
// the frame enters the viewport, so a long queue or a browse grid costs nothing below the fold.
// A missing key, a refused image or a stale key shows a neutral placeholder.
class LazyArtwork extends Component {
  state = { src: null, error: false };

  // another key: the frame empties and the new image loads; the answer of a previous key, if
  // still pending, is ignored
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
      // the frame empties and the new key loads (the pending answer of the old key is ignored
      // through imageGeneration); an empty key keeps the placeholder
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

  reload = () => {
    this.imageGeneration += 1;
    // eslint-disable-next-line react/no-did-update-set-state
    this.setState({ src: null, error: false });
    if (this.props.artworkKey) {
      this.load();
    }
  };

  load = async () => {
    const { httpClient, deviceSelector, artworkKey, onNotFound } = this.props;
    this.imageGeneration += 1;
    const generation = this.imageGeneration;
    try {
      const { image } = await httpClient.get(musicRoute(deviceSelector, `artwork/${encodeURIComponent(artworkKey)}`));
      if (!this.unmounted && generation === this.imageGeneration) {
        this.setState({ src: image, error: false });
      }
    } catch (e) {
      if (!this.unmounted && generation === this.imageGeneration) {
        this.setState({ error: true });
        // a key the core no longer allows: the list that carried it is stale
        if (getErrorStatus(e) === 404 && onNotFound) {
          onNotFound();
        }
      }
    }
  };

  render({ className, alt }, { src }) {
    return (
      <div
        class={cx(style.artworkFrame, className)}
        ref={element => {
          this.frame = element;
        }}
      >
        {src && <img src={src} alt={alt || ''} class={style.artworkImage} />}
        {!src && (
          <div class={style.artworkPlaceholder}>
            <i class="fe fe-music" />
          </div>
        )}
      </div>
    );
  }
}

export default LazyArtwork;
