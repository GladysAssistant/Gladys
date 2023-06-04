---
to: ../front/src/routes/integration/all/<%= module %>/index.js
---
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import <%= className %>Page from './<%= className %>Page';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../server/utils/constants';

class <%= className %>Integration extends Component {
  componentWillMount() {
    this.props.getIntegrationByName('<%= module %>');
    this.props.loadProps();
    this.props.session.dispatcher.addListener(
      WEBSOCKET_MESSAGE_TYPES.<%= constName %>.CONNECTED,
      this.props.displayConnectedMessage
    );
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.<%= constName %>.ERROR, this.props.display<%= className %>Error);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(
      WEBSOCKET_MESSAGE_TYPES.<%= constName %>.CONNECTED,
      this.props.displayConnectedMessage
    );
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.<%= constName %>.ERROR, this.props.display<%= className %>Error);
  }

  render(props, {}) {
    return (
      <<%= className %>Page>
        <div>Hey</div>
      </<%= className %>Page>
    );
  }
}

export default connect(
  'user,session,<%= attributeName %>Username,<%= attributeName %>Password,<%= attributeName %>ConnectionStatus,<%= attributeName %>Connected,<%= attributeName %>ConnectionError',
  actions
)(<%= className %>Integration);