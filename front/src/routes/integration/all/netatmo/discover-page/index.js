import { Component } from 'preact';
import { connect } from 'unistore/preact';
import DiscoverTab from './DiscoverTab';
import NetatmoPage from '../NetatmoPage';

class NetatmoDiscoverPage extends Component {
  render(props) {
    return (
      <NetatmoPage user={props.user}>
        <DiscoverTab {...props} />
      </NetatmoPage>
    );
  }
}

export default connect('user', {})(NetatmoDiscoverPage);
