import { connect } from 'unistore/preact';
import DiscoverTab from './DiscoverTab';
import MELCloudHomePage from '../MELCloudHomePage';

const MELCloudHomeDiscoverPage = props => (
  <MELCloudHomePage user={props.user}>
    <DiscoverTab {...props} />
  </MELCloudHomePage>
);

export default connect('user', {})(MELCloudHomeDiscoverPage);
