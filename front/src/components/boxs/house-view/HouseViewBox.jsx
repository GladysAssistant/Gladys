import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import get from 'get-value';

import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../server/utils/constants';
import { DeviceFeatureCategoriesIcon } from '../../../utils/consts';
import DeviceFeatureValueText from '../../device/DeviceFeatureValueText';
import { getGalleryRatio, getGalleryUrl } from './gallery';
import style from './style.css';

export const resolveHouseViewImage = async (httpClient, imageRef) => {
  if (!imageRef) {
    return null;
  }
  const [kind, id] = imageRef.split(':');
  if (kind === 'gallery') {
    return getGalleryUrl(id) || null;
  }
  if (kind === 'asset') {
    const asset = await httpClient.get(`/api/v1/dashboard_asset/${id}`);
    return `data:${asset}`;
  }
  return null;
};

export const getPinIcon = (pin, feature) => {
  if (pin.icon) {
    return pin.icon;
  }
  if (feature) {
    const icon = get(DeviceFeatureCategoriesIcon, `${feature.category}.${feature.type}`);
    if (icon) {
      return icon;
    }
  }
  return 'activity';
};

class HouseViewBox extends Component {
  refreshData = async () => {
    try {
      const imageRef = this.props.box.image;
      const imageUrl = await resolveHouseViewImage(this.props.httpClient, imageRef);
      // The image width/height ratio drives the stretched-tile sizing (see
      // style.css). Gallery illustrations are viewBox-only SVGs — an <img>
      // reports no natural size for them — so their ratio is declared in
      // gallery.js; an uploaded photo's ratio is measured on load instead.
      const [kind, id] = (imageRef || '').split(':');
      const imageRatio = kind === 'gallery' ? getGalleryRatio(id) : null;
      this.setState({ imageUrl, imageRatio, error: false });
    } catch (e) {
      console.error(e);
      this.setState({ error: true });
    }
    await this.getPinFeatures();
  };

  handleImageLoad = event => {
    const { naturalWidth, naturalHeight } = event.target;
    if (!this.state.imageRatio && naturalWidth > 0 && naturalHeight > 0) {
      this.setState({ imageRatio: naturalWidth / naturalHeight });
    }
  };

  getPinFeatures = async () => {
    const pins = this.props.box.pins || [];
    if (pins.length === 0) {
      return;
    }
    try {
      const devices = await this.props.httpClient.get('/api/v1/device', {
        device_feature_selectors: pins.map(pin => pin.device_feature).join(',')
      });
      const featuresBySelector = {};
      devices.forEach(device => {
        device.features.forEach(feature => {
          featuresBySelector[feature.selector] = feature;
        });
      });
      this.setState({ featuresBySelector });
    } catch (e) {
      console.error(e);
    }
  };

  updateDeviceStateWebsocket = payload => {
    const { featuresBySelector } = this.state;
    if (!featuresBySelector || !featuresBySelector[payload.device_feature_selector]) {
      return;
    }
    this.setState({
      featuresBySelector: {
        ...featuresBySelector,
        [payload.device_feature_selector]: {
          ...featuresBySelector[payload.device_feature_selector],
          last_value: payload.last_value,
          last_value_changed: payload.last_value_changed
        }
      }
    });
  };

  componentDidMount() {
    this.refreshData();
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
      this.updateDeviceStateWebsocket
    );
  }

  componentDidUpdate(previousProps) {
    if (previousProps.box.image !== this.props.box.image || previousProps.box.pins !== this.props.box.pins) {
      this.refreshData();
    }
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
      this.updateDeviceStateWebsocket
    );
  }

  render(props, { imageUrl, imageRatio, featuresBySelector, error }) {
    const boxTitle = props.box.name;
    const pins = props.box.pins || [];
    return (
      <div class="card">
        {boxTitle && (
          <div class="card-header">
            <h3 class="card-title">{boxTitle}</h3>
          </div>
        )}
        <div class={`card-body p-3 ${style.cardBody}`}>
          {error && (
            <div class="alert alert-warning mb-0">
              <Text id="dashboard.boxes.house-view.error" />
            </div>
          )}
          {!error && !imageUrl && (
            <div class="text-muted text-center py-4">
              <Text id="dashboard.boxes.house-view.noImage" />
            </div>
          )}
          {!error && imageUrl && (
            <div class={style.imageWrapper} style={imageRatio ? `--hv-ratio: ${imageRatio}` : undefined}>
              <img class={style.image} src={imageUrl} alt={boxTitle || ''} onLoad={this.handleImageLoad} />
              {pins.map(pin => {
                const feature = featuresBySelector && featuresBySelector[pin.device_feature];
                return (
                  <div class={style.pin} style={`left: ${pin.x_pct}%; top: ${pin.y_pct}%;`}>
                    <span class={style.pinIcon}>
                      <i class={`fe fe-${getPinIcon(pin, feature)}`} />
                    </span>
                    {pin.label && <span class={style.pinLabel}>{pin.label}</span>}
                    <span class={style.pinValue}>
                      <DeviceFeatureValueText feature={feature} />
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default connect('httpClient,session', {})(HouseViewBox);
