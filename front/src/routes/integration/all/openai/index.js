import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import get from 'get-value';
import { USER_ROLE } from '../../../../../../server/utils/constants';
import Layout from './Layout';
import GladysPlusUpsellCard from '../../../../components/gateway/GladysPlusUpsellCard';
import WeeklyDigestSettings from './WeeklyDigestSettings';
import AiChatDebugDownload from './AiChatDebugDownload';
import AiProviderSettings from './AiProviderSettings';
import AiQuotaDisplay from './AiQuotaDisplay';
import TtsProviderSettings from './TtsProviderSettings';

// display name of the selected external AI provider, or null
const getProviderName = (providers, selector) => {
  const provider = (providers || []).find(candidate => candidate.selector === selector);
  return provider ? provider.name : null;
};

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

  // with an external AI provider selected, the assistant already works
  // without Gladys Plus: the Plus upsell would be misleading as the hero
  // of this page. null = unknown (request pending or failed): the Plus
  // messages only render once the absence of a provider is confirmed
  getAiProvider = async () => {
    const generation = this.providerSelectionGeneration;
    try {
      const response = await this.props.httpClient.get('/api/v1/ai_provider');
      // a selection saved while this request was in flight is newer than
      // its answer: the stale selector must not overwrite it
      if (generation !== this.providerSelectionGeneration) {
        return;
      }
      this.setState({
        externalProviderActive: Boolean(response.selector),
        externalProviderName: getProviderName(response.providers, response.selector)
      });
    } catch (e) {
      console.error(e);
    }
  };

  // AiProviderSettings saves the selection itself: this callback keeps the
  // upsell/rate-limit messaging of this page in sync without a reload
  onProviderChange = (selector, providers) => {
    this.providerSelectionGeneration += 1;
    this.setState({
      externalProviderActive: Boolean(selector),
      externalProviderName: getProviderName(providers, selector)
    });
  };

  componentDidMount() {
    this.isGladysPlusConnected();
    this.getAiProvider();
  }

  constructor(props) {
    super(props);
    this.props = props;
    // bumped on every selection change, to discard older provider answers
    this.providerSelectionGeneration = 0;
    this.state = {
      gladysPlusConnected: null,
      externalProviderActive: null,
      externalProviderName: null
    };
  }

  render(props, { gladysPlusConnected, externalProviderActive, externalProviderName }) {
    const isAdmin = get(props, 'user.role') === USER_ROLE.ADMIN;
    const aiBackendAvailable = gladysPlusConnected === true || externalProviderActive === true;
    return (
      <Layout user={props.user}>
        <div class="card">
          <div class="card-header">
            <h1 class="card-title">
              <Text id="integration.openai.title" />
            </h1>
          </div>
          <div class="card-body">
            {gladysPlusConnected === false && externalProviderActive === false && (
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
            {gladysPlusConnected === true && externalProviderActive === false && (
              <p class="text-success mb-4">
                <i class="fe fe-check mr-1" />
                <Text id="integration.openai.chatEnabledByDefault" />
              </p>
            )}
            {/* with an external provider the intro names it, for everyone:
                a non-admin has no provider card below, this is where they
                learn where their conversations go */}
            <p>
              {externalProviderActive === true ? (
                <Text
                  id="integration.openai.firstExplanationExternalProvider"
                  fields={{ name: externalProviderName }}
                />
              ) : (
                <Text id="integration.openai.firstExplanation" />
              )}{' '}
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
              <li>
                <Text id="integration.openai.exampleChat5" />
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
            {gladysPlusConnected !== true && externalProviderActive === false && (
              <p>
                <Text id="integration.openai.rateLimit" />
              </p>
            )}
          </div>
        </div>
        {isAdmin && <AiProviderSettings onProviderChange={this.onProviderChange} />}
        {/* the Plus quota is meaningless once the AI traffic goes through an
        external provider; the weekly digest and the debug context download
        follow the selected provider through gateway.aiChat, so they are
        offered as soon as the assistant has a backend, Plus or external —
        to admins only, their routes are admin-only */}
        {/* the voice does not need Gladys Plus (an installed TTS provider
            integration works locally) but it is an instance-wide, admin-only
            setting: the server rejects the write for non-admins */}
        {isAdmin && <TtsProviderSettings gladysPlusConnected={gladysPlusConnected} />}
        {gladysPlusConnected === true && externalProviderActive === false && <AiQuotaDisplay />}
        {isAdmin && aiBackendAvailable && <WeeklyDigestSettings />}
        {isAdmin && aiBackendAvailable && <AiChatDebugDownload />}
      </Layout>
    );
  }
}

export default connect('user,session,httpClient', {})(OpenAIGateway);
