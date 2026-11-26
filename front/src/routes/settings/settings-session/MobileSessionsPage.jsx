import { Component } from 'preact';
import { Text } from 'preact-i18n';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import get from 'get-value';

import SettingsLayout from '../SettingsLayout';
import { describeSession } from './SessionDeviceLabel';
import { RequestStatus } from '../../../utils/consts';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import {
  MobileSectionHeader,
  MobileGroup,
  MobileRow,
  MobilePill,
  MobileRowButton,
  MobileNotice,
  MobileToast,
  ConfirmSheet,
  kitStyle
} from '../../../components/mobile';
import style from '../mobileSettings.css';

dayjs.extend(relativeTime);

/**
 * @description The sessions of the user on a phone (docs/specs/mobile-pages/settings-pages.md,
 * B): one row per session — the session of this device first, the other devices, then the API
 * keys — and a revocation that is confirmed. Same store actions as the desktop table.
 */
class MobileSessionsPage extends Component {
  state = {
    // the session waiting for a confirmation; it stays while the sheet slides out
    revoking: null,
    revokeOpen: false,
    revokeLoading: false,
    revokeError: false,
    toastKey: 0,
    toastVisible: false
  };

  componentDidUpdate(prevProps) {
    const requestFinished =
      prevProps.sessionsRevokeStatus === RequestStatus.Getting &&
      this.props.sessionsRevokeStatus !== RequestStatus.Getting;
    if (requestFinished && this.state.revokeLoading) {
      this.onRevokeFinished(this.props.sessionsRevokeStatus === RequestStatus.Success);
    }
  }

  onRevokeFinished = success => {
    if (success) {
      this.setState(prevState => ({
        revokeOpen: false,
        revokeLoading: false,
        toastVisible: true,
        toastKey: prevState.toastKey + 1
      }));
    } else {
      this.setState({ revokeLoading: false, revokeError: true });
    }
  };

  getCurrentSessionId = () => {
    try {
      return get(this.props.session.getUser(), 'session_id') || null;
    } catch (e) {
      return null;
    }
  };

  askRevoke = session => () => this.setState({ revoking: session, revokeOpen: true, revokeError: false });

  cancelRevoke = () => {
    if (!this.state.revokeLoading) {
      this.setState({ revokeOpen: false });
    }
  };

  confirmRevoke = () => {
    const { revoking } = this.state;
    const index = (this.props.sessions || []).findIndex(session => session.id === revoking.id);
    if (index === -1) {
      this.setState({ revokeOpen: false });
      return;
    }
    this.setState({ revokeLoading: true, revokeError: false });
    this.props.revokeSession(revoking.id, index);
  };

  closeToast = () => this.setState({ toastVisible: false });

  getName = session => {
    const { parts, apiKey } = describeSession(session);
    if (apiKey) {
      return get(this.props.intl.dictionary, 'sessionsSettings.apiKey');
    }
    return parts.length > 0 ? parts.join(' · ') : get(this.props.intl.dictionary, 'sessionsSettings.unknowDevice');
  };

  renderRow = (session, isCurrent) => {
    const { icon } = describeSession(session);
    const name = this.getName(session);
    const language = get(this.props, 'user.language') || 'en';
    return (
      <MobileRow
        key={session.id}
        icon={icon}
        iconTone={isCurrent ? undefined : 'neutral'}
        title={name}
        subtitle={
          <span class={style.inlineMeta}>
            {isCurrent && (
              <MobilePill tone="accent" data-cy="session-current-pill">
                <Text id="sessionsSettings.mobile.thisDevice" />
              </MobilePill>
            )}
            <span>
              <Text id="sessionsSettings.registered" />{' '}
              {dayjs(session.created_at)
                .locale(language)
                .fromNow()}
            </span>
          </span>
        }
        trailing={
          <MobileRowButton
            icon="trash-2"
            danger
            label={get(this.props.intl.dictionary, 'sessionsSettings.revoke')}
            onClick={this.askRevoke(session)}
            data-cy="session-revoke"
          />
        }
        dataCy="session-row"
      />
    );
  };

  render(props, { revoking, revokeOpen, revokeLoading, revokeError, toastVisible, toastKey }) {
    const { intl } = props;
    const sessions = props.sessions || [];
    const currentSessionId = this.getCurrentSessionId();
    const current = sessions.filter(session => session.id === currentSessionId);
    const apiKeys = sessions.filter(session => session.token_type === 'api_key' && session.id !== currentSessionId);
    const others = sessions.filter(session => session.token_type !== 'api_key' && session.id !== currentSessionId);
    const loading = props.sessionsGetStatus === RequestStatus.Getting && sessions.length === 0;
    const revokingCurrent = revoking && revoking.id === currentSessionId;
    let revokeTextId = 'sessionsSettings.mobile.revokeText';
    if (revokingCurrent) {
      revokeTextId = 'sessionsSettings.mobile.revokeCurrentText';
    } else if (revoking && revoking.token_type === 'api_key') {
      revokeTextId = 'sessionsSettings.mobile.revokeApiKeyText';
    }
    return (
      <SettingsLayout>
        <div class={style.page} data-cy="sessions-mobile">
          {loading && (
            <div class="dimmer active">
              <div class="loader" />
              <div class={`dimmer-content ${style.loading}`} />
            </div>
          )}
          {props.sessionsGetStatus === RequestStatus.Error && (
            <MobileNotice tone="danger" icon="alert-circle">
              <Text id="sessionsSettings.mobile.loadError" />
            </MobileNotice>
          )}
          {current.length > 0 && (
            <div>
              <MobileSectionHeader title={<Text id="sessionsSettings.mobile.thisDeviceTitle" />} />
              <MobileGroup>{current.map(session => this.renderRow(session, true))}</MobileGroup>
            </div>
          )}
          {(others.length > 0 || current.length > 0) && (
            <div>
              <MobileSectionHeader title={<Text id="sessionsSettings.mobile.otherDevicesTitle" />} />
              {others.length > 0 ? (
                <MobileGroup>{others.map(session => this.renderRow(session, false))}</MobileGroup>
              ) : (
                <p class={kitStyle.footnote} data-cy="sessions-no-other">
                  <Text id="sessionsSettings.mobile.noOtherDevice" />
                </p>
              )}
            </div>
          )}
          {apiKeys.length > 0 && (
            <div>
              <MobileSectionHeader title={<Text id="sessionsSettings.mobile.apiKeysTitle" />} />
              <MobileGroup>{apiKeys.map(session => this.renderRow(session, false))}</MobileGroup>
            </div>
          )}
          {sessions.length > 0 && (
            <p class={kitStyle.footnote}>
              <Text id="sessionsSettings.mobile.hint" />
            </p>
          )}
        </div>

        <ConfirmSheet
          open={revokeOpen}
          title={get(intl.dictionary, 'sessionsSettings.mobile.revokeTitle')}
          text={
            revoking && (
              <span>
                <strong>{this.getName(revoking)}</strong>
                {' — '}
                <Text id={revokeTextId} />
              </span>
            )
          }
          confirmLabel={<Text id="sessionsSettings.revoke" />}
          destructive
          loading={revokeLoading}
          onConfirm={this.confirmRevoke}
          onCancel={this.cancelRevoke}
          dataCy="session-revoke-confirm"
        >
          {revokeError && (
            <MobileNotice tone="danger" icon="alert-circle">
              <Text id="sessionsSettings.mobile.revokeError" />
            </MobileNotice>
          )}
        </ConfirmSheet>

        <MobileToast
          message={toastVisible ? get(intl.dictionary, 'sessionsSettings.mobile.revoked') : null}
          toastKey={toastKey}
          onClose={this.closeToast}
          dataCy="session-revoked-toast"
        />
      </SettingsLayout>
    );
  }
}

export default withIntlAsProp(MobileSessionsPage);
