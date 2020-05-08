import { Text, Localizer } from 'preact-i18n';
import UserRow from './UserRow';
import Select from '../../../components/form/Select';

const UserList = ({ children, ...props }) => (
  <div class="col-lg-12">
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <Text id="gatewayUsers.managerUsersLabel" />
        </h3>
      </div>

      {props.revokeUserError && (
        <div class="alert alert-danger" role="alert">
          <Text id="gatewayUsers.revokeError" />
        </div>
      )}

      <div class="table-responsive">
        <table class="table card-table table-striped table-vcenter">
          <thead>
            <tr>
              <th />
              <th>
                <Text id="gatewayUsers.columnName" />
              </th>
              <th>
                <Text id="gatewayUsers.columnRole" />
              </th>
              <th>
                <Text id="gatewayUsers.columnStatus" />
              </th>
              <th>
                <Text id="gatewayUsers.columnAddDate" />
              </th>
              <th>
                <Text id="gatewayUsers.columnRevoke" />
              </th>
            </tr>
          </thead>
          <tbody>
            {props.users.map((user, index) => (
              <UserRow user={user} index={index} revokeUser={props.revokeUser} />
            ))}

            <tr>
              <td />
              <td>
                <Localizer>
                  <input
                    onChange={props.updateEmail}
                    value={props.email}
                    type="email"
                    class="form-control"
                    placeholder={<Text id="gatewayUsers.emailPlaceholder" />}
                  />
                </Localizer>
              </td>
              <td>
                <Select
                  onChange={props.updateRole}
                  value={props.role}
                  uniqueKeu="value"
                  options={[
                    {
                      value: 'admin',
                      label: <Text id="gatewayUsers.roleAdmin" />
                    },
                    {
                      value: 'user',
                      label: <Text id="gatewayUsers.roleUser" />
                    }
                  ]}
                />
              </td>
              <td>
                <button onClick={props.inviteUser} class="btn btn-primary ml-auto">
                  <Text id="gatewayUsers.inviteUserButton" />
                </button>
              </td>
              <td />
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default UserList;
