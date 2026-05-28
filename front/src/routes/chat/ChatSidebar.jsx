import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import { Link } from 'preact-router/match';

import GladysPlusUpsell from '../../components/gateway/GladysPlusUpsell';

class ChatSidebar extends Component {
  state = {
    gladysPlusConfigured: null,
    openAiEnabled: null
  };

  fetchStatus = async () => {
    try {
      const [gatewayStatus, openAiVariable] = await Promise.all([
        this.props.httpClient.get('/api/v1/gateway/status'),
        this.props.httpClient.get('/api/v1/variable/GLADYS_GATEWAY_OPEN_AI_ENABLED').catch(() => ({ value: 'false' }))
      ]);
      this.setState({
        gladysPlusConfigured: gatewayStatus.configured === true,
        openAiEnabled: openAiVariable.value === 'true'
      });
    } catch (e) {
      console.error(e);
      this.setState({
        gladysPlusConfigured: false,
        openAiEnabled: false
      });
    }
  };

  componentDidMount() {
    this.fetchStatus();
  }

  render({}, { gladysPlusConfigured, openAiEnabled }) {
    const plusAiActive = gladysPlusConfigured && openAiEnabled;

    return (
      <div>
        <div class="card mb-3">
          <div class="card-header">
            <h3 class="card-title mb-0">
              <Text id="chat.sidebar.title" />
            </h3>
          </div>
          <div class="card-body">
            <p class="text-muted small mb-3">
              <Text id="chat.sidebar.intro" />
            </p>

            <h4 class="mb-2">
              <span class="badge badge-secondary mr-2">
                <Text id="chat.sidebar.localBadge" />
              </span>
              <Text id="chat.sidebar.localTitle" />
            </h4>
            <p class="small mb-2">
              <Text id="chat.sidebar.localDescription" />
            </p>
            <p class="small text-muted mb-1">
              <Text id="chat.sidebar.localHint" />
            </p>
            <ul class="small mb-4 pl-3">
              <li>
                <Text id="chat.sidebar.localExample1" />
              </li>
              <li>
                <Text id="chat.sidebar.localExample2" />
              </li>
              <li>
                <Text id="chat.sidebar.localExample3" />
              </li>
              <li>
                <Text id="chat.sidebar.localExample4" />
              </li>
            </ul>

            <h4 class="mb-2">
              <span class="badge badge-info mr-2">Plus</span>
              <Text id="chat.sidebar.plusTitle" />
            </h4>
            <p class="small mb-2">
              <Text id="chat.sidebar.plusDescription" />
            </p>
            {plusAiActive ? (
              <p class="small mb-0">
                <i class="fe fe-check text-success mr-1" />
                <Text id="chat.sidebar.plusActive" />
              </p>
            ) : gladysPlusConfigured ? (
              <p class="small mb-0">
                <Text id="chat.sidebar.plusConfiguredNotEnabled" />{' '}
                <Link href="/dashboard/integration/communication/openai">
                  <Text id="chat.sidebar.plusConfigureLink" />
                </Link>
              </p>
            ) : (
              <p class="small mb-0 text-muted">
                <Text id="chat.sidebar.plusNotConfigured" />
              </p>
            )}
          </div>
        </div>

        {!gladysPlusConfigured && (
          <GladysPlusUpsell
            compact
            icon="fe-cpu"
            utmCampaign="chat_sidebar"
            titleKey="chat.sidebar.upsellTitle"
            descriptionKey="chat.sidebar.upsellCompactDescription"
          />
        )}
      </div>
    );
  }
}

export default connect('httpClient', {})(ChatSidebar);
