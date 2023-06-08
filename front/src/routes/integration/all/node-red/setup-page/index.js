import { Component } from 'preact';
import { connect } from 'unistore/preact';
import NodeRedPage from '../NodeRedPage';
import SetupTab from './SetupTab';

class NodeRedSetupPage extends Component {
  render(props, {}) {
    return (
      <NodeRedPage user={props.user}>
        <SetupTab {...props} />
      </NodeRedPage>
    );
  }
}

export default connect('user,session,httpClient', {})(NodeRedSetupPage);
