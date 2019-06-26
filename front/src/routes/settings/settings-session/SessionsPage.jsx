import { Text } from 'preact-i18n';

import SettingsLayout from '../SettingsLayout';
import SessionDevice from './SessionDevice';

const Sessions = ({ children, ...props }) => (
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
                props.sessions.map((session, index) => (
                  <SessionDevice
                    session={session}
                    user={props.user}
                    revokeSession={props.revokeSession}
                    index={index}
                  />
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </SettingsLayout>
);

export default Sessions;
