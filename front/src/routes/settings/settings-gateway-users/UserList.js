import UserRow from './UserRow';

const UserList = ({ children, ...props }) => (
  <div class="col-lg-12">
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Manage your users</h3>
      </div>

      {props.revokeUserError && (
        <div class="alert alert-danger" role="alert">
          You cannot revoke this user.
        </div>
      )}

      <div class="table-responsive">
        <table class="table card-table table-striped table-vcenter">
          <thead>
            <tr>
              <th />
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Added at</th>
              <th>Revoke</th>
            </tr>
          </thead>
          <tbody>
            {props.users.map((user, index) => (
              <UserRow user={user} index={index} revokeUser={props.revokeUser} />
            ))}

            <tr>
              <td />
              <td>
                <input
                  onChange={props.updateEmail}
                  value={props.email}
                  type="email"
                  class="form-control"
                  placeholder="Email"
                />
              </td>
              <td>
                <select class="form-control custom-select selectized" onChange={props.updateRole} value={props.role}>
                  <option value="admin">Administrator</option>
                  <option value="user">User</option>
                </select>
              </td>
              <td>
                <button onClick={props.inviteUser} class="btn btn-primary ml-auto">
                  Invite User
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
