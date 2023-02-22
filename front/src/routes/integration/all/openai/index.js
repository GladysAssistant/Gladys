import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';
import uuid from 'uuid';
import update from 'immutability-helper';
import { Text, Localizer, MarkupText } from 'preact-i18n';
import ChatItems from '../../../chat/ChatItems';
import EmptyChat from '../../../chat/EmptyChat';
import Layout from './Layout';

class OpenAIGateway extends Component {
  scrollToBottom = () => {
    setTimeout(() => {
      const chatWindow = document.getElementById('chat-window');
      if (chatWindow) {
        chatWindow.scrollTo(0, chatWindow.scrollHeight);
      }
    }, 20);
  };
  sendMessage = async () => {
    const { messages, currentMessageTextInput } = this.state;
    const newMessages = update(messages, {
      $push: [
        {
          id: uuid.v4(),
          text: currentMessageTextInput,
          sender_id: this.props.user.id,
          receiver_id: null,
          created_at: new Date().toISOString()
        }
      ]
    });
    await this.setState({
      messages: newMessages,
      currentMessageTextInput: '',
      error: null,
      accountLicenseShouldBeActive: null,
      gladysIsTyping: true
    });
    this.scrollToBottom();
    try {
      const body = {
        question: currentMessageTextInput
      };
      const lastUserQuestion = messages.findLast(msg => msg.sender_id !== null);
      const lastGladysAnswer = messages.findLast(msg => msg.sender_id === null);
      if (lastUserQuestion && lastGladysAnswer) {
        body.previous_questions = [
          {
            question: lastUserQuestion.text,
            answer: lastGladysAnswer.text
          }
        ];
      }
      const response = await this.props.httpClient.post('/api/v1/gateway/openai/ask', body);
      const newState = update(this.state, {
        messages: {
          $push: [
            {
              id: uuid.v4(),
              text: response.answer,
              sender_id: null,
              receiver_id: this.props.user.id,
              created_at: new Date().toISOString()
            }
          ]
        },
        gladysIsTyping: {
          $set: false
        }
      });
      await this.setState(newState);
      this.scrollToBottom();
    } catch (e) {
      console.error(e);
      const errorMessage = get(e, 'response.data.message');
      if (errorMessage === 'Account license should be active') {
        this.setState({
          accountLicenseShouldBeActive: true,
          gladysIsTyping: false
        });
      } else {
        let message = `${e.message},  ${errorMessage}`;
        this.setState({
          error: message,
          gladysIsTyping: false
        });
      }
    }
  };

  updateMessageTextInput = e => {
    this.setState({
      currentMessageTextInput: e.target.value
    });
  };

  onKeyPress = e => {
    if (e.key === 'Enter') {
      this.sendMessage();
    }
  };

  getOpenAiEnabledStatus = async () => {
    try {
      const response = await this.props.httpClient.get('/api/v1/variable/GLADYS_GATEWAY_OPEN_AI_ENABLED');
      this.setState({
        openAIActiveInChat: response.value === 'true'
      });
    } catch (e) {
      console.error(e);
      this.setState({
        openAIActiveInChat: false
      });
    }
  };

  toggleOpenAI = async () => {
    const { openAIActiveInChat } = this.state;
    try {
      const newOpenAIActiveInChat = !openAIActiveInChat;
      await this.props.httpClient.post('/api/v1/variable/GLADYS_GATEWAY_OPEN_AI_ENABLED', {
        value: newOpenAIActiveInChat.toString()
      });
      this.setState({
        openAIActiveInChat: newOpenAIActiveInChat
      });
    } catch (e) {
      console.error(e);
    }
  };

  componentDidMount() {
    this.getOpenAiEnabledStatus();
  }

  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      messages: [],
      currentMessageTextInput: '',
      gladysIsTyping: false,
      openAIActiveInChat: null
    };
  }

  render(
    props,
    { messages, gladysIsTyping, currentMessageTextInput, error, accountLicenseShouldBeActive, openAIActiveInChat }
  ) {
    const notOnGladysPlus = props.session && props.session.getGatewayUser === undefined;
    return (
      <Layout>
        <div class="container mt-4">
          <div class="row">
            <div class="col-md-4">
              <div class="card">
                <div class="card-body">
                  <p>
                    <Text id="integration.openai.firstExplanation" />{' '}
                    <b>
                      <Text id="integration.openai.itDoesNothing" />
                    </b>
                  </p>
                  <p>
                    <Text id="integration.openai.aFewExamples" />
                  </p>
                  <ul>
                    <li>
                      <Text id="integration.openai.sizeOfEiffelTower" />
                    </li>
                    <li>
                      <Text id="integration.openai.whoIsJulesVerne" />
                    </li>
                    <li>
                      <Text id="integration.openai.eggDuration" />
                    </li>
                    <li>
                      <Text id="integration.openai.turnOnTheLight" />
                    </li>
                  </ul>
                  <p>
                    <Text id="integration.openai.rateLimit" />
                  </p>
                </div>
                <div class="card-footer d-flex justify-content-between align-items-center">
                  <div>
                    <Text id="integration.openai.activateOpenAiChat" />
                  </div>

                  {openAIActiveInChat !== null && (
                    <label class="custom-switch">
                      <input
                        type="radio"
                        name="open-ai-on-off"
                        value="1"
                        class="custom-switch-input"
                        checked={openAIActiveInChat}
                        onClick={this.toggleOpenAI}
                      />
                      <span class="custom-switch-indicator" />
                    </label>
                  )}
                </div>
              </div>
            </div>
            <div class="col-md-8">
              <div class="card">
                {error && <div class="alert alert-danger">{error}</div>}
                {accountLicenseShouldBeActive && (
                  <div class="alert alert-warning">
                    <Text id="integration.openai.licenseShouldBeActive" />
                  </div>
                )}
                {notOnGladysPlus && (
                  <div class="alert alert-warning">
                    <Text id="integration.openai.notOnGladysPlus" />
                    <br />
                    <MarkupText id="integration.openai.subscribeToGladysPlus" />
                  </div>
                )}
                {messages && messages.length > 0 && (
                  <ChatItems user={props.user} messages={messages} gladysIsTyping={gladysIsTyping} />
                )}
                {messages && messages.length === 0 && <EmptyChat />}
                <div class="card-footer">
                  <div class="input-group">
                    <Localizer>
                      <input
                        type="text"
                        class="form-control"
                        placeholder={<Text id="chat.messagePlaceholder" />}
                        disabled={notOnGladysPlus}
                        value={currentMessageTextInput}
                        onInput={this.updateMessageTextInput}
                        onKeyPress={this.onKeyPress}
                      />
                    </Localizer>
                    <div class="input-group-append">
                      <button
                        type="button"
                        class="btn btn-secondary"
                        onClick={this.sendMessage}
                        disabled={!currentMessageTextInput || currentMessageTextInput.length === 0}
                      >
                        <i class="fe fe-send" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
}

export default connect('user,session,httpClient', {})(OpenAIGateway);
