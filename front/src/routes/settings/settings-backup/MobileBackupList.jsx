import { Component } from 'preact';
import { Text } from 'preact-i18n';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import get from 'get-value';

import { RequestStatus } from '../../../utils/consts';
import { bytesFormatter } from '../../../utils/bytesFormat';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import {
  MobileSectionHeader,
  MobileGroup,
  MobileRow,
  MobileNotice,
  MobileEmptyState,
  BigButton,
  ConfirmSheet,
  kitStyle
} from '../../../components/mobile';
import GatewayBackupHealth from './GatewayBackupHealth';
import style from '../mobileSettings.css';

dayjs.extend(relativeTime);

const formatDate = (isoDate, language) =>
  new Date(isoDate).toLocaleString(language, { dateStyle: 'medium', timeStyle: 'short' });

/**
 * @description The Gladys Plus backups on a phone (docs/specs/mobile-pages/settings-pages.md, E):
 * "Back up now" first, then one row per backup — its date and its size — and a restoration that
 * is confirmed in a sheet. Same store actions as the desktop table.
 */
class MobileBackupList extends Component {
  state = {
    // the backup waiting for a confirmation; it stays while the sheet slides out
    restoring: null,
    restoreOpen: false
  };

  askRestore = backup => () => {
    // a new confirmation starts clean: the failure of an earlier restoration is not its own
    this.restoreAsked = false;
    this.setState({ restoring: backup, restoreOpen: true });
  };

  cancelRestore = () => {
    if (this.props.gatewayRestoreBackupStatus !== RequestStatus.Getting) {
      this.setState({ restoreOpen: false });
    }
  };

  confirmRestore = () => {
    // one restoration at a time
    if (this.props.gatewayRestoreBackupStatus === RequestStatus.Getting) {
      return;
    }
    this.restoreAsked = true;
    this.props.restoreBackup(this.state.restoring.path);
  };

  render(props, { restoring, restoreOpen }) {
    const { intl } = props;
    const language = get(props, 'user.language') || 'en';
    const backups = props.gatewayBackups || [];
    const backupStarting = props.gatewayCreateBackupStatus === RequestStatus.Getting;
    const backupStarted = props.gatewayCreateBackupStatus === RequestStatus.Success;
    const restoreInFlight = props.gatewayRestoreBackupStatus === RequestStatus.Getting;
    const restoreFailed = this.restoreAsked && props.gatewayRestoreBackupStatus === RequestStatus.Error;
    return (
      <div class={style.page} data-cy="backups-mobile">
        <p class={style.lead}>
          <Text id="gatewayBackup.description" />
        </p>
        {props.gatewayRestoreErrored && (
          <MobileNotice tone="danger" icon="alert-circle">
            <Text id="gatewayBackup.restoreFailed" />
          </MobileNotice>
        )}
        <GatewayBackupHealth backupHealth={get(props, 'gatewayStatus.backup_health')} user={props.user} />
        {props.gatewayCreateBackupStatus === RequestStatus.Error && (
          <MobileNotice tone="danger" icon="alert-circle">
            <Text id="gatewayBackup.mobile.backupError" />
          </MobileNotice>
        )}
        <div class={style.block}>
          {backupStarted ? (
            <MobileNotice tone="success" icon="check" data-cy="backup-started">
              <Text id="gatewayBackup.backupStarted" />
            </MobileNotice>
          ) : (
            <BigButton
              variant="primary"
              icon="save"
              onClick={props.createBackup}
              loading={backupStarting}
              data-cy="backup-now"
            >
              <Text id="gatewayBackup.backupNowButton" />
            </BigButton>
          )}
        </div>

        {props.gatewayGetBackupsStatus === RequestStatus.Error && (
          <MobileNotice tone="danger" icon="alert-circle">
            <Text id="gatewayBackup.mobile.loadError" />
          </MobileNotice>
        )}
        {backups.length > 0 && (
          <div>
            <MobileSectionHeader
              title={
                <Text
                  id="gatewayBackup.mobile.backupsTitle"
                  plural={backups.length}
                  fields={{ count: backups.length }}
                />
              }
            />
            <MobileGroup>
              {backups.map(backup => (
                <MobileRow
                  key={backup.path}
                  icon="database"
                  title={formatDate(backup.created_at, language)}
                  subtitle={
                    <span>
                      {dayjs(backup.created_at)
                        .locale(language)
                        .fromNow()}
                      {' · '}
                      {bytesFormatter(backup.size, language, intl.dictionary)}
                    </span>
                  }
                  onClick={this.askRestore(backup)}
                  dataCy="backup-row"
                />
              ))}
            </MobileGroup>
            <p class={kitStyle.footnote}>
              <Text id="gatewayBackup.mobile.restoreHint" />
            </p>
          </div>
        )}
        {props.gatewayBackups && backups.length === 0 && (
          <MobileEmptyState icon="database" text={<Text id="gatewayBackup.mobile.empty" />} />
        )}

        <ConfirmSheet
          open={restoreOpen}
          title={get(intl.dictionary, 'gatewayBackup.mobile.restoreTitle')}
          text={
            restoring && (
              <Text
                id="gatewayBackup.mobile.restoreText"
                fields={{ date: formatDate(restoring.created_at, language) }}
              />
            )
          }
          confirmLabel={<Text id="gatewayBackup.restoreButton" />}
          destructive
          loading={restoreInFlight}
          onConfirm={this.confirmRestore}
          onCancel={this.cancelRestore}
          dataCy="backup-restore-confirm"
        >
          {restoreFailed && (
            <MobileNotice tone="danger" icon="alert-circle">
              <Text id="gatewayBackup.mobile.restoreError" />
            </MobileNotice>
          )}
        </ConfirmSheet>
      </div>
    );
  }
}

export default withIntlAsProp(MobileBackupList);
