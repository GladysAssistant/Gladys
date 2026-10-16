import { Component } from 'preact';
import { connect } from 'unistore/preact';

import style from './deviceImage.css';

// The photo of a device (reserved GLADYS_DEVICE_IMAGE param): an image key
// whose bytes the integration serves through the image route of the widgets,
// from the Gladys origin. Fetched on mount: unlike a widget poster grid, a
// Devices page holds a handful of cards, the core caps the integration at 4
// image commands in flight and caches each key for an hour, and an observer
// would need a frame with a reserved size before the bytes arrive. The frame
// disappears when the image cannot be served or displayed — a missing photo
// is not an error worth showing.
class DeviceImage extends Component {
  state = { src: null, error: false };

  componentDidMount() {
    this.load();
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
    if (error || !src) {
      return null;
    }
    return (
      <div class="form-group">
        <img src={src} alt={alt} loading="lazy" class={style.deviceImage} onError={this.hide} />
      </div>
    );
  }
}

export default connect('httpClient')(DeviceImage);
