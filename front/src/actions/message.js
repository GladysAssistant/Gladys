import { RequestStatus } from '../utils/consts';
import update from 'immutability-helper';

const TYPING_MIN_TIME = 300;
const TYPING_MAX_TIME = 600;

function createActions(store) {
  const actions = {
    scrollToBottom() {
      const chatWindow = document.getElementById('chat-window');
      setTimeout(() => chatWindow.scrollTo(0, chatWindow.scrollHeight), 10);
    },
    async getMessages(state) {
      store.setState({
        MessageGetStatus: RequestStatus.Getting
      });
      try {
        const messages = await state.httpClient.get('/api/v1/message');
        messages.reverse();
        store.setState({
          messages,
          MessageGetStatus: RequestStatus.Success
        });
        actions.scrollToBottom();
      } catch (e) {
        store.setState({
          MessageGetStatus: RequestStatus.Error
        });
      }
    },
    updateMessageTextInput(state, e) {
      store.setState({
        currentMessageTextInput: e.target.value
      });
    },
    pushMessage(state, message) {
      store.setState({
        gladysIsTyping: true
      });
      actions.scrollToBottom();
      const randomWait = Math.floor(Math.random() * TYPING_MAX_TIME) + TYPING_MIN_TIME;
      setTimeout(() => {
        const newMessages = update(store.getState().messages, {
          $push: [message]
        });
        store.setState({
          gladysIsTyping: false,
          messages: newMessages
        });
        actions.scrollToBottom();
      }, randomWait);
    },
    onKeyPress(state, e) {
      if (e.key === 'Enter') {
        actions.sendMessage(state);
      }
    },
    async sendMessage(state) {
      store.setState({
        MessageSendStatus: RequestStatus.Getting
      });
      try {
        const message = await state.httpClient.post('/api/v1/message', {
          text: state.currentMessageTextInput
        });
        const newState = update(state, {
          messages: {
            $push: [message]
          },
          MessageSendStatus: {
            $set: RequestStatus.Success
          },
          currentMessageTextInput: {
            $set: ''
          }
        });
        store.setState(newState);
        actions.scrollToBottom();
      } catch (e) {
        store.setState({
          MessageSendStatus: RequestStatus.Error
        });
      }
    }
  };
  return actions;
}

export default createActions;
