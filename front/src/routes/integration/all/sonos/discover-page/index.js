import { Component } from 'preact';
import { connect } from 'unistore/preact';
import DiscoverTab from './DiscoverTab';
import SonosPage from '../SonosPage';

class SonosDiscoverPage extends Component {
  render(props) {
    return (
      <SonosPage user={props.user}>
        <DiscoverTab {...props} />
      </SonosPage>
    );
  }
}

export default connect('user', {})(SonosDiscoverPage);
