import { connect } from 'unistore/preact';
import DiscoverTab from './DiscoverTab';
import TuyaPage from '../TuyaPage';

const TuyaDiscoverPage = props => (
  <TuyaPage user={props.user}>
    <DiscoverTab {...props} />
  </TuyaPage>
);

export default connect('user', {})(TuyaDiscoverPage);
