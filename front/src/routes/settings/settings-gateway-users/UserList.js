import { Text, Localizer } from 'preact-i18n';
import UserRow from './UserRow';

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
                <select class="form-control custom-select selectized" onChange={props.updateRole} value={props.role}>
                  <option value="admin">
                    <Text id="gatewayUsers.roleAdmin" />
                  </option>
                  <option value="user">
                    <Text id="gatewayUsers.roleUser" />
                  </option>
                </select>
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
