import { Text, Localizer } from 'preact-i18n';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import SessionDeviceLabel from './SessionDeviceLabel';

dayjs.extend(relativeTime);

const SessionDevice = ({ children, ...props }) => {
  // the revocation is confirmed by the page (docs/specs/mobile-pages/settings-pages.md, B)
  const askRevoke = () => props.askRevoke(props.session);

  return (
    <tr>
      <td>
        <div style="max-width: 400px; overflow: hidden">
          {props.session.token_type === 'refresh_token' && <SessionDeviceLabel session={props.session} />}
          {props.session.token_type === 'api_key' && <Text id="sessionsSettings.apiKey" />}
        </div>
        <div class="small text-muted">
          <Text id="sessionsSettings.registered" />{' '}
          {dayjs(props.session.created_at)
            .locale(props.user.language)
            .fromNow()}
        </div>
      </td>
      <td>
        {/* a real button: the keyboard reaches it, and a screen reader names it */}
        <Localizer>
          <button
            type="button"
            class="btn btn-link p-0 text-reset"
            onClick={askRevoke}
            aria-label={<Text id="sessionsSettings.revoke" />}
            title={<Text id="sessionsSettings.revoke" />}
            data-cy="session-revoke"
          >
            <i class="fe fe-trash-2" />
          </button>
        </Localizer>
      </td>
    </tr>
  );
};

export default SessionDevice;
