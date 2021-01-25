import { Component } from 'preact';
import { connect } from 'unistore/preact';
import ChatPage from './ChatPage';
import actions from '../../actions/message';

@connect('session', actions)
class Chat extends Component {
  newChatMessage = payload => this.props.pushMessage(payload);

  componentDidMount() {
    this.props.getMessages();
    this.props.session.dispatcher.addListener('message.new', this.newChatMessage);
    this.props.session.dispatcher.addListener('message.sent', this.newChatMessage);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener('message.new', this.newChatMessage);
    this.props.session.dispatcher.removeListener('message.sent', this.newChatMessage);
  }

  render({}, {}) {
    return <ChatPage />;
  }
}

export default Chat;
