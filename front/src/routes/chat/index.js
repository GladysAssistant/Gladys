import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../server/utils/constants';
import ChatPage from './ChatPage';
import actions from '../../actions/message';

class Chat extends Component {
  newChatMessage = payload => this.props.pushMessage(payload);
  syncChatMessage = payload => this.props.syncMessage(payload);
  aiThinkingStatus = payload => this.props.setGladysTypingStatus(payload);

  componentDidMount() {
    this.props.getMessages();
    this.props.session.dispatcher.addListener('message.new', this.newChatMessage);
    this.props.session.dispatcher.addListener('message.sent', this.syncChatMessage);
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.MESSAGE.AI_THINKING, this.aiThinkingStatus);
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener('message.new', this.newChatMessage);
    this.props.session.dispatcher.removeListener('message.sent', this.syncChatMessage);
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.MESSAGE.AI_THINKING, this.aiThinkingStatus);
  }

  render({}, {}) {
    return <ChatPage />;
  }
}

export default connect('session', actions)(Chat);
