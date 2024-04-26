import { connect } from 'unistore/preact';
import DeviceTab from './DeviceTab';
import MELCloudPage from '../MELCloudPage';

const DevicePage = props => (
  <MELCloudPage user={props.user}>
    <DeviceTab {...props} />
  </MELCloudPage>
);

export default connect('user', {})(DevicePage);
