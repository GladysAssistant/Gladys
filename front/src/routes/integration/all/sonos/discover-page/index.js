import { connect } from 'unistore/preact';
import DiscoverTab from './DiscoverTab';
import SonosPage from '../SonosPage';

const SonosDiscoverPage = props => (
  <SonosPage user={props.user}>
    <DiscoverTab {...props} />
  </SonosPage>
);

export default connect('user', {})(SonosDiscoverPage);
