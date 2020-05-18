import { Text } from 'preact-i18n';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import SessionDeviceLabel from './SessionDeviceLabel';

dayjs.extend(relativeTime);

const SessionDevice = ({ children, ...props }) => {
  let revokeSession = e => {
    e.preventDefault();
    props.revokeSession(props.session.id, props.index);
  };

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
        <i
          style={{
            cursor: 'pointer'
          }}
          onClick={revokeSession}
          class="fe fe-trash-2"
        />
      </td>
    </tr>
  );
};

export default SessionDevice;
