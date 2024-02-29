import { connect } from 'unistore/preact';
import DiscoverTab from './DiscoverTab';
import MELCloudPage from '../MELCloudPage';

const MELCloudDiscoverPage = props => (
  <MELCloudPage user={props.user}>
    <DiscoverTab {...props} />
  </MELCloudPage>
);

export default connect('user', {})(MELCloudDiscoverPage);
