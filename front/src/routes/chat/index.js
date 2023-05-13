import { Component } from 'preact';
import { connect } from 'unistore/preact';
import ChatPage from './ChatPage';
import actions from '../../actions/message';

class Chat extends Component {
  newChatMessage = payload => this.props.pushMessage(payload);
  syncChatMessage = payload => this.props.syncMessage(payload);

  componentDidMount() {
    this.props.getMessages();
    this.props.session.dispatcher.addListener('message.new', this.newChatMessage);
    this.props.session.dispatcher.addListener('message.sent', this.syncChatMessage);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener('message.new', this.newChatMessage);
    this.props.session.dispatcher.removeListener('message.sent', this.syncChatMessage);
  }

  render({}, {}) {
    return <ChatPage />;
  }
}

export default connect('session', actions)(Chat);
