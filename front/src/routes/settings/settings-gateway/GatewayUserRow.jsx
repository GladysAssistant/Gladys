import { Component } from 'preact';
import { Text } from 'preact-i18n';
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
          <div class="small text-muted">
            <Text id="gateway.userRsaKey" /> {props.user.rsa_public_key}
          </div>
          <div class="small text-muted">
            <Text id="gateway.userEcdsaKey" /> {props.user.ecdsa_public_key}
          </div>
        </td>
        <td class="text-right">
          {' '}
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
