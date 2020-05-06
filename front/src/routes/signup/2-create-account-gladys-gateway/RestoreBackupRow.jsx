import { Component } from 'preact';
import { Text } from 'preact-i18n';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { bytesFormatter } from '../../../utils/bytesFormat';

dayjs.extend(relativeTime);

class GatewayBackupRow extends Component {
  restoreBackup = () => {
    this.props.restoreBackup(this.props.backup.path);
  };

  askForConfirmation = () => {
    this.setState({
      confirmBackup: true
    });
  };

  cancelConfirmation = () => {
    this.setState({
      confirmBackup: false
    });
  };

  render(props, { confirmBackup }) {
    return (
      <tr>
        <td>
          {dayjs(props.backup.created_at)
            .locale(props.user.language)
            .fromNow()}
        </td>
        <td>{bytesFormatter(props.backup.size)}</td>
        <td class="text-right">
          {!confirmBackup && (
            <button class="btn btn-success" onClick={this.askForConfirmation}>
              <Text id="gatewayBackup.restoreButton" />
            </button>
          )}
          {confirmBackup && (
            <span>
              <button class="btn btn-success" onClick={this.restoreBackup}>
                <Text id="gatewayBackup.confirmRestore" />
              </button>{' '}
              <button class="btn btn-danger" onClick={this.cancelConfirmation}>
                <Text id="gatewayBackup.cancelRestore" />
              </button>
            </span>
          )}
        </td>
      </tr>
    );
  }
}

export default GatewayBackupRow;
