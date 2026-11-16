import { Component } from 'preact';
import { Text } from 'preact-i18n';

import { BigButton, kitStyle } from '../mobile';
import style from './mobileHouse.css';

const GEOLOCATION_OPTIONS = { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 };
const PERMISSION_DENIED = 1;

/**
 * @description "Use my current location" (docs/specs/mobile-pages/house-and-rooms.md, C.2): on a
 * phone, the house is usually where the phone is. Asks the browser for the position and gives it
 * to `onLocate(latitude, longitude)`. When the browser cannot give it, says why: a page served
 * without HTTPS never gets a position (a local address typed in the browser), the permission was
 * refused, or the position is not available.
 */
class LocateMeButton extends Component {
  state = {
    locating: false,
    // 'insecure' | 'denied' | 'unavailable'
    error: null
  };

  componentWillUnmount() {
    this.unmounted = true;
  }

  locate = () => {
    if (window.isSecureContext === false) {
      this.setState({ error: 'insecure' });
      return;
    }
    if (!navigator.geolocation) {
      this.setState({ error: 'unavailable' });
      return;
    }
    this.setState({ locating: true, error: null });
    navigator.geolocation.getCurrentPosition(
      position => {
        if (this.unmounted) {
          return;
        }
        this.setState({ locating: false });
        this.props.onLocate(position.coords.latitude, position.coords.longitude);
      },
      error => {
        if (this.unmounted) {
          return;
        }
        this.setState({ locating: false, error: error.code === PERMISSION_DENIED ? 'denied' : 'unavailable' });
      },
      GEOLOCATION_OPTIONS
    );
  };

  render(props, { locating, error }) {
    return (
      <div class={style.locateMe}>
        <BigButton icon="navigation" onClick={this.locate} loading={locating} data-cy="house-locate-me">
          <Text id="housesSettings.mobile.useMyLocation" />
        </BigButton>
        {error && (
          <div class={kitStyle.fieldError} role="alert" data-cy="house-locate-me-error">
            <Text id={`housesSettings.mobile.locationError.${error}`} />
          </div>
        )}
      </div>
    );
  }
}

export default LocateMeButton;
