import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import Layout from './Layout';
import GladysPlusUpsellCard from '../../../../components/gateway/GladysPlusUpsellCard';
import WeeklyDigestSettings from './WeeklyDigestSettings';
import AiChatDebugDownload from './AiChatDebugDownload';
import AiQuotaDisplay from './AiQuotaDisplay';

class OpenAIGateway extends Component {
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

  componentDidMount() {
    this.isGladysPlusConnected();
  }

  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      gladysPlusConnected: null
    };
  }

  render(props, { gladysPlusConnected }) {
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
              <div class="mb-4">
                <GladysPlusUpsellCard
                  icon="fe-cpu"
                  utmCampaign="integration_openai"
                  titleKey="gladysPlusUpsell.openai.title"
                  descriptionKey="gladysPlusUpsell.openai.description"
                  featureKeys={[
                    'gladysPlusUpsell.openai.feature1',
                    'gladysPlusUpsell.openai.feature2',
                    'gladysPlusUpsell.openai.feature3'
                  ]}
                />
              </div>
            )}
            {gladysPlusConnected === true && (
              <p class="text-success mb-4">
                <i class="fe fe-check mr-1" />
                <Text id="integration.openai.chatEnabledByDefault" />
              </p>
            )}
            <p>
              <Text id="integration.openai.firstExplanation" />{' '}
            </p>
            <p>
              <Text id="integration.openai.examplesIntro" />
            </p>
            <p class="mb-1">
              <strong>
                <Text id="integration.openai.examplesChatTitle" />
              </strong>
            </p>
            <p class="text-muted small mb-2">
              <Text id="integration.openai.examplesChatHint" />
            </p>
            <ul>
              <li>
                <Text id="integration.openai.exampleChat1" />
              </li>
              <li>
                <Text id="integration.openai.exampleChat2" />
              </li>
              <li>
                <Text id="integration.openai.exampleChat3" />
              </li>
              <li>
                <Text id="integration.openai.exampleChat4" />
              </li>
            </ul>
            <p class="mb-1 mt-3">
              <strong>
                <Text id="integration.openai.examplesSceneTitle" />
              </strong>
            </p>
            <p class="text-muted small">
              <Text id="integration.openai.examplesSceneIntro" />
            </p>
            <ul>
              <li>
                <Text id="integration.openai.exampleScene1" />
              </li>
              <li>
                <Text id="integration.openai.exampleScene2" />
              </li>
              <li>
                <Text id="integration.openai.exampleScene3" />
              </li>
            </ul>
            {gladysPlusConnected !== true && (
              <p>
                <Text id="integration.openai.rateLimit" />
              </p>
            )}
          </div>
        </div>
        {gladysPlusConnected === true && <AiQuotaDisplay />}
        {gladysPlusConnected === true && <WeeklyDigestSettings />}
        {gladysPlusConnected === true && <AiChatDebugDownload />}
      </Layout>
    );
  }
}

export default connect('user,session,httpClient', {})(OpenAIGateway);
