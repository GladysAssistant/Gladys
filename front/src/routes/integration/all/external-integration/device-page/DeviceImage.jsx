import { Component } from 'preact';
import { connect } from 'unistore/preact';

import style from './deviceImage.css';

// The photo of a device (reserved GLADYS_DEVICE_IMAGE param): an image key
// whose bytes the integration serves through the image route of the widgets,
// from the Gladys origin. Fetched once the frame enters the viewport, like the
// widget images; the frame disappears when the image cannot be served or
// displayed — a missing photo is not an error worth showing.
class DeviceImage extends Component {
  state = { src: null, error: false };

  componentDidMount() {
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

  // another key (the integration republished the device): the answer of the
  // previous key, if still pending, is ignored
  imageGeneration = 0;

  reload = () => {
    this.setState({ src: null, error: false });
    this.load();
  };

  componentDidUpdate(previousProps) {
    if (previousProps.imageKey !== this.props.imageKey || previousProps.selector !== this.props.selector) {
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

  load = async () => {
    const { httpClient, selector, imageKey } = this.props;
    this.imageGeneration += 1;
    const generation = this.imageGeneration;
    try {
      const { image } = await httpClient.get(
        `/api/v1/external_integration/${encodeURIComponent(selector)}/image/${encodeURIComponent(imageKey)}`
      );
      if (!this.unmounted && generation === this.imageGeneration) {
        this.setState({ src: image, error: false });
      }
    } catch (e) {
      if (!this.unmounted && generation === this.imageGeneration) {
        this.setState({ error: true });
      }
    }
  };

  hide = () => {
    this.setState({ error: true });
  };

  render({ alt }, { src, error }) {
    if (error) {
      return null;
    }
    return (
      <div
        class="form-group"
        ref={element => {
          this.frame = element;
        }}
      >
        {src && <img src={src} alt={alt} loading="lazy" class={style.deviceImage} onError={this.hide} />}
      </div>
    );
  }
}

export default connect('httpClient')(DeviceImage);
