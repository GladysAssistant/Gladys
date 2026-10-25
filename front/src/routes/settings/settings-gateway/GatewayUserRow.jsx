import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import style from './style.css';

class GatewayUserRow extends Component {
  switchUserKey = () => {
    this.props.switchUserKey(this.props.userIndex, !this.props.user.accepted);
  };

  render(props, {}) {
    return (
      <tr>
        <td class={style.userNameCell}>
          {props.user.name}
          <div class={cx('small text-muted', style.userKeyFingerprint)}>
            <Text id="gateway.userRsaKey" /> {props.user.rsa_public_key}
          </div>
          <div class={cx('small text-muted', style.userKeyFingerprint)}>
            <Text id="gateway.userEcdsaKey" /> {props.user.ecdsa_public_key}
          </div>
        </td>
        <td class="text-right">
          {props.user.accepted && (
            <span class="badge badge-success mr-2">
              <Text id="gateway.userAccepted" />
            </span>
          )}
          {!props.user.accepted && props.user.keys_changed && (
            <span class="badge badge-warning mr-2">
              <Text id="gateway.userKeysChanged" />
            </span>
          )}
          {!props.user.accepted && !props.user.keys_changed && (
            <span class="badge badge-secondary mr-2">
              <Text id="gateway.userWaitingForAuthorization" />
            </span>
          )}
          <label class="custom-switch">
            <input
              type="radio"
              name={props.user.id}
              value="1"
              class="custom-switch-input"
              checked={props.user.accepted}
              onClick={this.switchUserKey}
            />
            <span class="custom-switch-indicator" />
          </label>
        </td>
      </tr>
    );
  }
}

export default GatewayUserRow;
