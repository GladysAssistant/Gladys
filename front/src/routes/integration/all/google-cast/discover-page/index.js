import { connect } from 'unistore/preact';
import DiscoverTab from './DiscoverTab';
import GoogleCastPage from '../GoogleCastPage';

const GoogleCastDiscoverPage = props => (
  <GoogleCastPage user={props.user}>
    <DiscoverTab {...props} />
  </GoogleCastPage>
);

export default connect('user', {})(GoogleCastDiscoverPage);
