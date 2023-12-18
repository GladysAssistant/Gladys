import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { MarkupText, Text } from 'preact-i18n';
import Layout from './Layout';

class OpenAIGateway extends Component {
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

  isGladysPlusConnected = async () => {
    try {
      const response = await this.props.httpClient.get('/api/v1/gateway/status');
      this.setState({
        gladysPlusConnected: response.configured
      });
    } catch (e) {
      console.error(e);
      this.setState({
        gladysPlusConnected: false
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
    this.isGladysPlusConnected();
  }

  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      openAIActiveInChat: null,
      gladysPlusConnected: null
    };
  }

  render(props, { openAIActiveInChat, gladysPlusConnected }) {
    return (
      <Layout user={props.user}>
        <div class="card">
          <div class="card-header">
            <h1 class="card-title">
              <Text id="integration.openai.title" />
            </h1>
          </div>
          <div class="card-body">
            {gladysPlusConnected === false && (
              <div class="alert alert-warning">
                <Text id="integration.openai.notOnGladysPlus" />{' '}
                <MarkupText id="integration.openai.subscribeToGladysPlus" />
              </div>
            )}
            <p>
              <Text id="integration.openai.firstExplanation" />{' '}
            </p>
            <p>
              <Text id="integration.openai.aFewExamples" />
            </p>
            <ul>
              <li>
                <Text id="integration.openai.turnOnTheLight" />
              </li>
              <li>
                <Text id="integration.openai.showMeTheCameraInTheKitchen" />
              </li>
              <li>
                <Text id="integration.openai.sizeOfEiffelTower" />
              </li>
              <li>
                <Text id="integration.openai.eggDuration" />
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

            {openAIActiveInChat !== null && gladysPlusConnected === true && (
              <label class="custom-switch">
                <input
                  type="radio"
                  name="open-ai-on-off"
                  value="1"
                  class="custom-switch-input"
                  checked={openAIActiveInChat}
                  disabled={!gladysPlusConnected}
                  onClick={this.toggleOpenAI}
                />
                <span class="custom-switch-indicator" />
              </label>
            )}
          </div>
        </div>
      </Layout>
    );
  }
}

export default connect('user,session,httpClient', {})(OpenAIGateway);
