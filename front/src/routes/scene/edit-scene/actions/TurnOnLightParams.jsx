const TurnOnLight = ({ children, ...props }) => (
  <select class="form-control">
    {props.lightDevices &&
      props.lightDevices.map(lightDevice => <option value={lightDevice.selector}>{lightDevice.name}</option>)}
  </select>
);

export default TurnOnLight;
