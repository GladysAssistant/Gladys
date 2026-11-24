import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import style from './dashboard.css';

const T = 'integration.zigbee2mqtt.setup.dashboard.advanced.interface';

// The password of the interface of Zigbee2mqtt, for an interface opened outside Gladys: revealed for 5 s, copied in one
// click
class InterfacePassword extends Component {
  toggleReveal = () => {
    clearTimeout(this.revealTimer);
    const revealed = !this.state.revealed;
    this.setState({ revealed });
    if (revealed) {
      this.revealTimer = setTimeout(() => this.setState({ revealed: false }), 5000);
    }
  };

  copy = async () => {
    try {
      await navigator.clipboard.writeText(this.props.password);
    } catch (e) {
      // Refused by the browser: the password can be revealed for the user to copy it
      console.error('Failed to copy the password of the interface', e);
      return;
    }
    clearTimeout(this.copyTimer);
    this.setState({ copied: true });
    this.copyTimer = setTimeout(() => this.setState({ copied: false }), 2000);
  };

  componentWillUnmount() {
    clearTimeout(this.revealTimer);
    clearTimeout(this.copyTimer);
  }

  render({ password, linked }, { revealed, copied }) {
    const canCopy = typeof window !== 'undefined' && window.isSecureContext && Boolean(navigator.clipboard);
    return (
      <div class="mt-3" data-cy="z2m-dashboard-interface-password">
        <div class="form-label">
          <Text id={`${T}.password`} />
        </div>
        <div class={style.passwordRow}>
          <code class={cx('text-break mr-auto', style.passwordValue)} data-cy="z2m-dashboard-interface-password-value">
            {revealed ? password : '••••••••••••••••••••'}
          </code>
          <Localizer>
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary py-0 px-2 flex-shrink-0"
              aria-label={<Text id="mobileKit.togglePassword" />}
              aria-pressed={revealed ? 'true' : 'false'}
              onClick={this.toggleReveal}
              data-cy="z2m-dashboard-interface-password-reveal"
            >
              <i class={cx('fe', { 'fe-eye': !revealed, 'fe-eye-off': revealed })} aria-hidden="true" />
            </button>
          </Localizer>
          {canCopy && (
            <Localizer>
              <button
                type="button"
                class="btn btn-sm btn-outline-secondary py-0 px-2 flex-shrink-0"
                aria-label={<Text id="integration.zigbee2mqtt.setup.dashboard.mobile.copy" />}
                onClick={this.copy}
                data-cy="z2m-dashboard-interface-password-copy"
              >
                <i class="fe fe-copy" aria-hidden="true" />
              </button>
            </Localizer>
          )}
          {copied && (
            <small class="text-success flex-shrink-0">
              <Text id="integration.zigbee2mqtt.setup.modes.local.externalMqtt.copied" />
            </small>
          )}
        </div>
        <small class="form-text text-muted">
          <Text id={linked ? `${T}.passwordHelp` : `${T}.passwordHelpNoLink`} />
        </small>
      </div>
    );
  }
}

export default InterfacePassword;
