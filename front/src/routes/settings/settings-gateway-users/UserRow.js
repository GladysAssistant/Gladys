import { Text } from 'preact-i18n';
const dateDisplayOptions = { year: 'numeric', month: 'long', day: 'numeric' };

const UserRow = ({ children, ...props }) => {
  let revokeUser = e => {
    e.preventDefault();
    props.revokeUser(props.user, props.index);
  };

  // The gateway only allows admins to revoke users, and never lets a user revoke themselves.
  // Hide the button in those cases so users don't get a 403 when clicking on it.
  const isAdmin = props.currentUser && props.currentUser.role === 'admin';
  const isCurrentUser = props.currentUser && props.currentUser.id === props.user.id;
  const canRevoke = isAdmin && !isCurrentUser;

  return (
    <tr>
      <td>
        {props.user.name}
        <div class="small text-muted">{props.user.email}</div>
      </td>
      <td>
        {props.user.role === 'admin' && <Text id="profile.adminRole" />}
        {props.user.role !== 'admin' && <Text id="profile.userRole" />}
      </td>
      <td>
        {props.user.is_invitation === false && <Text id="profile.invitationSuccess" />}
        {props.user.is_invitation !== false && <Text id="profile.invitationPending" />}
      </td>
      <td class="text-nowrap">
        {new Date(props.user.created_at).toLocaleDateString(props.user.language, dateDisplayOptions)}
      </td>
      <td class="w-1">{canRevoke && <i onClick={revokeUser} class="fe fe-trash-2 cursor-pointer" />}</td>
    </tr>
  );
};

export default UserRow;
