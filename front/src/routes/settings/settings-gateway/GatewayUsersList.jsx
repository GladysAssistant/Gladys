import { Text } from 'preact-i18n';
import cx from 'classnames';
import GatewayUserRow from './GatewayUserRow';
import { RequestStatus } from '../../../utils/consts';

const GatewayUsersList = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <Text id="gateway.usersListTitle" />
      </h3>
    </div>
    <div
      class={cx('dimmer', {
        active: props.gatewayGetKeysStatus === RequestStatus.Getting
      })}
    >
      <div class="loader" />
      <div class="dimmer-content">
        <div class="card-body">
          {props.gatewayGetKeysStatus === RequestStatus.NetworkError && (
            <div class="alert alert-warning">
              <Text id="gateway.yourGatewayIsNotConnected" />
            </div>
          )}
          <p>
            <Text id="gateway.usersListDescription" />
          </p>
        </div>
        <div class="table-responsive-lg">
          <table class="table table-hover table-outline table-vcenter text-nowrap card-table">
            <thead>
              <tr>
                <th>
                  <Text id="gateway.userColumn" />
                </th>
                <th class="text-right">
                  <Text id="gateway.statusColumn" />
                </th>
              </tr>
            </thead>
            <tbody>
              {props.gatewayUsersKeys &&
                props.gatewayUsersKeys.map((user, userIndex) => (
                  <GatewayUserRow user={user} userIndex={userIndex} switchUserKey={props.switchUserKey} />
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);

export default GatewayUsersList;
