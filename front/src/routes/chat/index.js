import { Component } from 'preact';
import { connect } from 'unistore/preact';
import ChatPage from './ChatPage';
import actions from '../../actions/message';

@connect(
  'session',
  actions
)
class Chat extends Component {
  componentWillMount() {
    this.props.getMessages();
    this.props.session.dispatcher.addListener('message.new', payload => this.props.pushMessage(payload));
  }

  render({}, {}) {
    return <ChatPage />;
  }
}

export default Chat;
