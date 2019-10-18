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
          style={'background-image: url(' + (props.user.profile_url || '/assets/images/undraw_profile_pic.svg') + ')'}
        />
      </td>
      <td>
        {props.user.name}
        <div class="small text-muted">{props.user.email}</div>
      </td>
      <td>{props.user.role === 'admin' ? 'Administrator' : 'User'}</td>
      <td>{props.user.is_invitation === false ? 'Accepted' : 'Pending'}</td>
      <td class="text-nowrap">{new Date(props.user.created_at).toLocaleDateString('en-US', dateDisplayOptions)}</td>
      <td class="w-1">
        <i style={{ cursor: 'pointer' }} onClick={revokeUser} class="fe fe-trash-2" />
      </td>
    </tr>
  );
};

export default UserRow;
