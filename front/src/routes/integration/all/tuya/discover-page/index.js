import { Component } from 'preact';
import { connect } from 'unistore/preact';
import DiscoverTab from './DiscoverTab';
import TuyaPage from '../TuyaPage';

class TuyaDiscoverPage extends Component {
  render(props) {
    return (
      <TuyaPage user={props.user}>
        <DiscoverTab {...props} />
      </TuyaPage>
    );
  }
}

export default connect('user', {})(TuyaDiscoverPage);
