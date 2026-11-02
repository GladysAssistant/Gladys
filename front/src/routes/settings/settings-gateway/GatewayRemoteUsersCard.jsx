import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';

import { RequestStatus } from '../../../utils/consts';
import style from './style.css';

// The "remote users" list used to live here, next to the Gladys Plus users list
// of the Plus app and the Gladys users of the instance: three pages for one
// question. It now lives on the Users page; this card only says so, with the
// one thing worth surfacing on the Gladys Plus page: whether someone waits for
// an authorization.
const GatewayRemoteUsersCard = ({ gatewayUsersKeys, gatewayGetKeysStatus }) => {
  const pending = (gatewayUsersKeys || []).filter(user => !user.accepted).length;
  const authorized = (gatewayUsersKeys || []).filter(user => user.accepted).length;
  return (
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <Text id="gateway.remoteUsersTitle" />
        </h3>
      </div>
      <div class="card-body">
        <p>
          <Text id="gateway.remoteUsersDescription" />
        </p>
        {gatewayGetKeysStatus === RequestStatus.NetworkError && (
          <div class="alert alert-warning">
            <Text id="gateway.yourGatewayIsNotConnected" />
          </div>
        )}
        {gatewayGetKeysStatus === RequestStatus.Success && (
          <div class={style.remoteUsersSummary}>
            <span class="badge badge-success">
              <Text
                id={authorized === 1 ? 'gateway.remoteUsersAuthorizedOne' : 'gateway.remoteUsersAuthorized'}
                fields={{ count: authorized }}
              />
            </span>
            {pending > 0 && (
              <span class="badge badge-warning">
                <Text
                  id={pending === 1 ? 'gateway.remoteUsersPendingOne' : 'gateway.remoteUsersPending'}
                  fields={{ count: pending }}
                />
              </span>
            )}
          </div>
        )}
        <Link
          href="/dashboard/settings/user"
          class={cx('btn', pending > 0 ? 'btn-primary' : 'btn-outline-primary')}
          data-cy="gateway-manage-users"
        >
          <i class="fe fe-users" /> <Text id="gateway.remoteUsersManageButton" />
        </Link>
      </div>
    </div>
  );
};

export default GatewayRemoteUsersCard;
