import { Component } from 'preact';
import { Text } from 'preact-i18n';
import get from 'get-value';

import SettingsLayout from '../SettingsLayout';
import SessionDevice from './SessionDevice';
import { describeSession } from './SessionDeviceLabel';
import { RequestStatus } from '../../../utils/consts';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import ConfirmSheet from '../../../components/mobile/ConfirmSheet';

/**
 * @description The sessions of the user as a table. Revoking one is confirmed, with the dialog
 * and the texts of the phone layout (docs/specs/mobile-pages/settings-pages.md, B): a session
 * revoked by a stray click signs a device out, or cuts what uses an API key.
 */
class Sessions extends Component {
  state = {
    // the session waiting for a confirmation; it stays while the dialog closes
    revoking: null,
    revokeOpen: false,
    revokeLoading: false,
    revokeError: false
  };

  componentDidUpdate(prevProps) {
    const requestFinished =
      prevProps.sessionsRevokeStatus === RequestStatus.Getting &&
      this.props.sessionsRevokeStatus !== RequestStatus.Getting;
    if (requestFinished && this.state.revokeLoading) {
      this.onRevokeFinished(this.props.sessionsRevokeStatus === RequestStatus.Success);
    }
  }

  // a failure keeps the dialog open, with its error
  onRevokeFinished = success => {
    this.setState({ revokeLoading: false, revokeOpen: !success, revokeError: !success });
  };

  getCurrentSessionId = () => {
    try {
      return get(this.props.session.getUser(), 'session_id') || null;
    } catch (e) {
      return null;
    }
  };

  askRevoke = session => this.setState({ revoking: session, revokeOpen: true, revokeError: false });

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

  getName = session => {
    const { parts, apiKey } = describeSession(session);
    if (apiKey) {
      return get(this.props.intl.dictionary, 'sessionsSettings.apiKey');
    }
    return parts.length > 0 ? parts.join(' · ') : get(this.props.intl.dictionary, 'sessionsSettings.unknowDevice');
  };

  getRevokeTextId = session => {
    if (session.id === this.getCurrentSessionId()) {
      return 'sessionsSettings.mobile.revokeCurrentText';
    }
    return session.token_type === 'api_key'
      ? 'sessionsSettings.mobile.revokeApiKeyText'
      : 'sessionsSettings.mobile.revokeText';
  };

  render(props, { revoking, revokeOpen, revokeLoading, revokeError }) {
    return (
      <SettingsLayout>
        <div class="card">
          <div>
            <div class="table-responsive">
              <table class="table table-hover table-outline table-vcenter text-nowrap card-table">
                <thead>
                  <tr>
                    <th>
                      <Text id="sessionsSettings.session" />
                    </th>
                    <th class="w-1">
                      <Text id="sessionsSettings.revoke" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {props.sessions &&
                    props.sessions.map(session => (
                      <SessionDevice session={session} user={props.user} askRevoke={this.askRevoke} />
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <ConfirmSheet
          open={revokeOpen}
          title={get(props.intl.dictionary, 'sessionsSettings.mobile.revokeTitle')}
          text={
            revoking && (
              <span>
                <strong>{this.getName(revoking)}</strong>
                {' — '}
                <Text id={this.getRevokeTextId(revoking)} />
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
            <div class="alert alert-danger" role="alert">
              <Text id="sessionsSettings.mobile.revokeError" />
            </div>
          )}
        </ConfirmSheet>
      </SettingsLayout>
    );
  }
}

export default withIntlAsProp(Sessions);
