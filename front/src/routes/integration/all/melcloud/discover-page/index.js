import { Component } from 'preact';
import { connect } from 'unistore/preact';
import DiscoverTab from './DiscoverTab';
import MELCloudPage from '../MELCloudPage';

class MELCloudDiscoverPage extends Component {
  render(props) {
    return (
      <MELCloudPage user={props.user}>
        <DiscoverTab {...props} />
      </MELCloudPage>
    );
  }
}

export default connect('user', {})(MELCloudDiscoverPage);
