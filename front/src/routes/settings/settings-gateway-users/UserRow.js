import { Text } from 'preact-i18n';
const dateDisplayOptions = { year: 'numeric', month: 'long', day: 'numeric' };

const UserRow = ({ children, ...props }) => {
  let revokeUser = e => {
    e.preventDefault();
    props.revokeUser(props.user, props.index);
  };

  return (
    <tr>
      <td class="w-1">
        <span
          class="avatar"
          style={`background-image: url(${props.user.profile_url || '/assets/images/undraw_profile_pic.svg'}')`}
        />
      </td>
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
      <td class="w-1">
        <i style={{ cursor: 'pointer' }} onClick={revokeUser} class="fe fe-trash-2" />
      </td>
    </tr>
  );
};

export default UserRow;
