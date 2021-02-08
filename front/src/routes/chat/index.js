import { Component } from 'preact';
import { connect } from 'unistore/preact';
import ChatPage from './ChatPage';
import actions from '../../actions/message';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../server/utils/constants';

@connect('session', actions)
class Chat extends Component {
  newChatMessage = payload => this.props.pushMessage(payload);

  componentDidMount() {
    this.props.getMessages();
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.MESSAGE.NEW, this.newChatMessage);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.MESSAGE.NEW, this.newChatMessage);
  }

  render({}, {}) {
    return <ChatPage />;
  }
}

export default Chat;
