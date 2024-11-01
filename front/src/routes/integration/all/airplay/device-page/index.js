import { connect } from 'unistore/preact';
import DeviceTab from './DeviceTab';
import AirplayPage from '../AirplayPage';

const DevicePage = props => (
  <AirplayPage user={props.user}>
    <DeviceTab {...props} />
  </AirplayPage>
);

export default connect('user', {})(DevicePage);
