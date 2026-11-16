import { Component } from 'preact';
import { Text } from 'preact-i18n';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import get from 'get-value';

import { RequestStatus } from '../../../utils/consts';
import { bytesFormatter } from '../../../utils/bytesFormat';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import {
  MobileGroup,
  MobileRow,
  MobileNotice,
  MobileSectionHeader,
  BigButton,
  ConfirmSheet,
  kitStyle
} from '../../../components/mobile';
import style from '../style.css';

dayjs.extend(relativeTime);

/**
 * @description The backups of a Gladys Plus account on a phone
 * (docs/specs/mobile-pages/onboarding.md, D): one row per backup — when it was made, its exact
 * date and its size — and a confirmation before the restore, which replaces the instance.
 */
class MobileRestoreBackup extends Component {
  state = {
    // the backup of the confirmation: kept while the sheet slides out
    backup: null,
    confirmOpen: false
  };

  askConfirmation = backup => () => this.setState({ backup, confirmOpen: true });
  cancelConfirmation = () => this.setState({ confirmOpen: false });

  restore = () => {
    const { backup } = this.state;
    this.setState({ confirmOpen: false });
    this.props.restoreBackup(backup.path);
  };

  render(props, { backup, confirmOpen }) {
    const language = get(props, 'user.language') || 'en';
    const dictionary = props.intl.dictionary;
    const backups = props.gatewayBackups || [];
    const loading = props.gatewayGetBackupsStatus === RequestStatus.Getting;
    const describe = item => ({
      relative: dayjs(item.created_at)
        .locale(language)
        .fromNow(),
      date: new Date(item.created_at).toLocaleString(language, { dateStyle: 'medium', timeStyle: 'short' }),
      size: bytesFormatter(item.size, language, dictionary)
    });
    return (
      <div data-cy="signup-restore-backups-mobile">
        <h1 class={kitStyle.largeTitle}>
          <Text id="signup.gatewayBackup.title" />
        </h1>
        <p class={kitStyle.lead}>
          <Text id="signup.gatewayBackup.description" />
        </p>
        {loading && (
          <div class={style.mobileSpinner} role="status">
            <div class="loader" />
          </div>
        )}
        {!loading && props.gatewayGetBackupsStatus === RequestStatus.Error && (
          <MobileNotice tone="danger" icon="alert-circle" role="alert">
            <Text id="signup.gatewayBackup.error" />
          </MobileNotice>
        )}
        {!loading && props.gatewayGetBackupsStatus === RequestStatus.Success && backups.length === 0 && (
          <MobileNotice tone="warning" icon="alert-triangle">
            <Text id="signup.gatewayBackup.noBackupsFound" />
          </MobileNotice>
        )}
        {!loading && backups.length > 0 && (
          <div>
            <MobileSectionHeader title={<Text id="gatewayBackup.title" />} />
            <MobileGroup>
              {backups.map(item => {
                const { relative, date, size } = describe(item);
                return (
                  <MobileRow
                    key={item.id}
                    icon="database"
                    title={date}
                    subtitle={`${relative} · ${size}`}
                    onClick={this.askConfirmation(item)}
                    dataCy="signup-restore-backup-row"
                  />
                );
              })}
            </MobileGroup>
          </div>
        )}
        <div class={`${kitStyle.buttons} ${style.mobileActions}`}>
          <BigButton onClick={props.changeStepToUpdateRestoreKey} data-cy="signup-restore-change-key">
            <Text id="signup.gatewayBackup.changeKeyButton" />
          </BigButton>
          <BigButton icon="refresh-cw" onClick={props.getBackups} data-cy="signup-restore-refresh">
            <Text id="signup.gatewayBackup.refreshButton" />
          </BigButton>
        </div>
        <ConfirmSheet
          open={confirmOpen}
          title={get(dictionary, 'signup.mobile.restoreConfirmTitle')}
          text={
            <span>
              {backup && <strong>{`${describe(backup).date} · ${describe(backup).size}`}</strong>}
              {backup && <br />}
              <Text id="signup.mobile.restoreConfirmText" />
            </span>
          }
          confirmLabel={<Text id="gatewayBackup.restoreButton" />}
          // the restore replaces the instance, wherever this page is opened from
          destructive
          onConfirm={this.restore}
          onCancel={this.cancelConfirmation}
          dataCy="signup-restore-confirm"
        />
      </div>
    );
  }
}

export default withIntlAsProp(MobileRestoreBackup);
