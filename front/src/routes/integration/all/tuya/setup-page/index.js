import { Component } from 'preact';
import { connect } from 'unistore/preact';
import SetupTab from './SetupTab';
import TuyaPage from '../TuyaPage';

class TuyaSetupPage extends Component {
  render(props, {}) {
    return (
      <TuyaPage>
        <SetupTab {...props} />
      </TuyaPage>
    );
  }
}

export default connect('user', {})(TuyaSetupPage);
