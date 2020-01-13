const GetLastValueSensor = ({ children, ...props }) => (
  <div>
    <select class="custom-select" value={props.action.user}>
      {props.devices && props.rooms.map(house => <option value={user.selector}>{user.firstname}</option>)}
    </select>
  </div>
);

export default GetLastValueSensor;
