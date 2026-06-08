import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';

import GladysPlusUpsell from '../../components/gateway/GladysPlusUpsell';

class ChatSidebar extends Component {
  state = {
    gladysPlusConfigured: null
  };

  fetchStatus = async () => {
    try {
      const gatewayStatus = await this.props.httpClient.get('/api/v1/gateway/status');
      this.setState({
        gladysPlusConfigured: gatewayStatus.configured === true
      });
    } catch (e) {
      console.error(e);
      this.setState({
        gladysPlusConfigured: false
      });
    }
  };

  componentDidMount() {
    this.fetchStatus();
  }

  render({}, { gladysPlusConfigured }) {
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

            {gladysPlusConfigured ? (
              <p class="small mb-0">
                <i class="fe fe-check text-success mr-1" />
                <Text id="chat.sidebar.plusActive" />
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
