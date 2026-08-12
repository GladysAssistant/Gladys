import { connect } from 'unistore/preact';
import DeviceTab from './DeviceTab';
import GoogleCastPage from '../GoogleCastPage';

const DevicePage = props => (
  <GoogleCastPage user={props.user}>
    <DeviceTab {...props} />
  </GoogleCastPage>
);

export default connect('user', {})(DevicePage);
