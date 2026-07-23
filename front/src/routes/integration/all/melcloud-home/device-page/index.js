import { connect } from 'unistore/preact';
import DeviceTab from './DeviceTab';
import MELCloudHomePage from '../MELCloudHomePage';

const DevicePage = props => (
  <MELCloudHomePage user={props.user}>
    <DeviceTab {...props} />
  </MELCloudHomePage>
);

export default connect('user', {})(DevicePage);
