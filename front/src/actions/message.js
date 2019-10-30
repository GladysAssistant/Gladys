import { RequestStatus } from '../utils/consts';
import update from 'immutability-helper';
import uuid from 'uuid';

const TYPING_MIN_TIME = 400;
const TYPING_MAX_TIME = 600;

const sortMessages = messages =>
  messages.sort((a, b) => {
    if (a.created_at < b.created_at) {
      return -1;
    }
    if (a.created_at > b.created_at) {
      return 1;
    }
    return 0;
  });

function createActions(store) {
  const actions = {
    scrollToBottom() {
      setTimeout(() => {
        const chatWindow = document.getElementById('chat-window');
        if (chatWindow) {
          chatWindow.scrollTo(0, chatWindow.scrollHeight);
        }
      }, 20);
    },
    async getMessages(state) {
      store.setState({
        MessageGetStatus: RequestStatus.Getting
      });
      try {
        let messages = await state.httpClient.get('/api/v1/message');
        messages = sortMessages(messages);
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
        let newMessages = update(store.getState().messages, {
          $push: [message]
        });
        newMessages = sortMessages(newMessages);
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
      if (!state.currentMessageTextInput || state.currentMessageTextInput.length === 0) {
        return;
      }
      store.setState({
        MessageSendStatus: RequestStatus.Getting
      });
      const messageText = state.currentMessageTextInput;
      try {
        const newMessage = {
          text: messageText,
          created_at: new Date()
        };
        const tempId = uuid.v4();
        // we first push the message
        const newState = update(state, {
          messages: {
            $push: [Object.assign({}, newMessage, { tempId })]
          },
          MessageSendStatus: {
            $set: RequestStatus.Getting
          },
          currentMessageTextInput: {
            $set: ''
          }
        });
        newState.messages = sortMessages(newState.messages);
        store.setState(newState);
        actions.scrollToBottom();
        // then we send the message
        const createdMessage = await state.httpClient.post('/api/v1/message', newMessage);
        const messagesWithoutTempMessage = store.getState().messages.filter(message => message.tempId !== tempId);
        messagesWithoutTempMessage.push(createdMessage);
        // then we remove the message loading
        const finalState = update(state, {
          messages: {
            $set: sortMessages(messagesWithoutTempMessage)
          },
          MessageSendStatus: {
            $set: RequestStatus.Success
          },
          currentMessageTextInput: {
            $set: ''
          }
        });
        store.setState(finalState);
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
