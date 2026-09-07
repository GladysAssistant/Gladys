import { Component } from 'preact';
import { Text } from 'preact-i18n';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { bytesFormatter } from '../../../utils/bytesFormat';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import style from '../style.css';

dayjs.extend(relativeTime);

class RestoreBackupRow extends Component {
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
      <div class={style.backupRow}>
        <span class={style.backupIcon}>
          <i class="fe fe-archive" />
        </span>
        <div class={style.backupInfo}>
          <div class={style.backupDate}>
            {dayjs(props.backup.created_at)
              .locale(props.user.language)
              .fromNow()}
          </div>
          <div class={style.backupSize}>
            {bytesFormatter(props.backup.size, props.user.language, this.props.intl.dictionary)}
          </div>
        </div>
        <div class={style.backupActions}>
          {!confirmBackup && (
            <button class="btn btn-success btn-sm" onClick={this.askForConfirmation}>
              <Text id="gatewayBackup.restoreButton" />
            </button>
          )}
          {confirmBackup && (
            <button class="btn btn-success btn-sm" onClick={this.restoreBackup}>
              <Text id="gatewayBackup.confirmRestore" />
            </button>
          )}
          {confirmBackup && (
            <button class="btn btn-danger btn-sm" onClick={this.cancelConfirmation}>
              <Text id="gatewayBackup.cancelRestore" />
            </button>
          )}
        </div>
      </div>
    );
  }
}

export default withIntlAsProp(RestoreBackupRow);
