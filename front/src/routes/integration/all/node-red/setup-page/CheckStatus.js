import { Component } from 'preact';
import { Link } from 'preact-router/match';
import { connect } from 'unistore/preact';
import actions from './actions';
import { Text } from 'preact-i18n';

class CheckStatus extends Component {
  componentWillMount() {
    this.props.checkStatus();
  }

  renderError(messageKey) {
    return (
      <div class="alert alert-warning">
        <Text id={messageKey} />
      </div>
    )
  }

  render(props, {}) {
    console.log('CheckStatus', props);

    if(props.nodeRedEnabled) {
      if (!props.nodeRedExist) {
        return this.renderError('integration.node-red.status.notInstalled');
      } else if (!props.nodeRedRunning) {
        return this.renderError('integration.node-red.status.notRunning');
      }
        return (
          <p class="alert alert-success">
            <Text id="integration.node-red.status.running" />
          </p>
        )
    }
    return null;
  }
}

export default connect(
  'user,session,nodeRedExist,nodeRedRunning,nodeRedEnabled',
  actions
)(CheckStatus);
