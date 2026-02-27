import { Component } from 'preact';
import { connect } from 'unistore/preact';
import NukiPage from '../NukiPage';
import DiscoverTab from './DiscoverTab';

class NukiIntegration extends Component {
  render(props) {
    return (
      <NukiPage user={props.user}>
        <DiscoverTab {...props} />
      </NukiPage>
    );
  }
}

export default connect('user', {})(NukiIntegration);
