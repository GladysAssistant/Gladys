import { connect } from 'unistore/preact';
import DeviceTab from './DeviceTab';
import SonosPage from '../SonosPage';

const DevicePage = props => (
  <SonosPage user={props.user}>
    <DeviceTab {...props} />
  </SonosPage>
);

export default connect('user', {})(DevicePage);
