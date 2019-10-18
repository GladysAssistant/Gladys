import { Component } from 'preact';
import { connect } from 'unistore/preact';
import ChatPage from './ChatPage';
import actions from '../../actions/message';

@connect(
  'session',
  actions
)
class Chat extends Component {
  newChatMessage = payload => this.props.pushMessage(payload);

  componentDidMount() {
    this.props.getMessages();
    this.props.session.dispatcher.addListener('message.new', this.newChatMessage);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener('message.new', this.newChatMessage);
  }

  render({}, {}) {
    return <ChatPage />;
  }
}

export default Chat;
