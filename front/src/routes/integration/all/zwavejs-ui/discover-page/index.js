import { Component } from 'preact';
import { connect } from 'unistore/preact';
import DiscoverTab from './DiscoverTab';
import ZwaveJSUIPage from '../ZwaveJSUIPage';

class ZwaveJSUIDiscoverPage extends Component {
  render(props) {
    return (
      <ZwaveJSUIPage user={props.user}>
        <DiscoverTab {...props} />
      </ZwaveJSUIPage>
    );
  }
}

export default connect('user', {})(ZwaveJSUIDiscoverPage);
