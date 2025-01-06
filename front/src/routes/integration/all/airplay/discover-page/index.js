import { connect } from 'unistore/preact';
import DiscoverTab from './DiscoverTab';
import AirplayPage from '../AirplayPage';

const AirplayDiscoverPage = props => (
  <AirplayPage user={props.user}>
    <DiscoverTab {...props} />
  </AirplayPage>
);

export default connect('user', {})(AirplayDiscoverPage);
