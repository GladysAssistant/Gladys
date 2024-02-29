import { connect } from 'unistore/preact';
import DeviceTab from './DeviceTab';
import TuyaPage from '../TuyaPage';

const DevicePage = props => (
  <TuyaPage user={props.user}>
    <DeviceTab {...props} />
  </TuyaPage>
);

export default connect('user', {})(DevicePage);
