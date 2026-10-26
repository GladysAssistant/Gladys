import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';

import GladysPlusUpsellCard from '../../components/gateway/GladysPlusUpsellCard';
import style from './style.css';

const CHAT_UPSELL_FEATURES = [
  'gladysPlusUpsell.chat.feature1',
  'gladysPlusUpsell.chat.feature2',
  'gladysPlusUpsell.chat.feature3',
  'gladysPlusUpsell.chat.feature4'
];

class EmptyChat extends Component {
  state = {
    gladysPlusConfigured: null,
    externalProviderActive: null
  };

  // with an external AI provider selected (capabilities/ai-type.md) the chat
  // answers without Gladys Plus: the upsell only shows once the absence of
  // a provider is confirmed (null = unknown)
  fetchAiProvider = async () => {
    try {
      const response = await this.props.httpClient.get('/api/v1/ai_provider');
      this.setState({ externalProviderActive: Boolean(response.selector) });
    } catch (e) {
      console.error(e);
    }
  };

  fetchStatus = async () => {
    try {
      const gatewayStatus = await this.props.httpClient.get('/api/v1/gateway/status');
      this.setState({
        gladysPlusConfigured: gatewayStatus.configured === true
      });
    } catch (e) {
      // A failed call doesn't mean the instance has no Gladys Plus: it can
      // simply be a network error. Staying unknown keeps the regular empty
      // state instead of upselling a subscription the instance may already have.
      console.error(e);
    }
  };

  componentDidMount() {
    this.fetchStatus();
    this.fetchAiProvider();
  }

  render({}, { gladysPlusConfigured, externalProviderActive }) {
    // Without Gladys Plus nor an external AI provider the chat can't answer
    // at all: instead of a dead end, show what the AI chat makes possible and
    // how to unlock it.
    if (gladysPlusConfigured === false && externalProviderActive === false) {
      return (
        <div class={style.emptyChatUpsellScroll}>
          <div class={style.emptyChatUpsell}>
            <GladysPlusUpsellCard
              icon="fe-message-circle"
              utmCampaign="chat_empty_state"
              titleKey="gladysPlusUpsell.chat.title"
              descriptionKey="gladysPlusUpsell.chat.description"
              featureKeys={CHAT_UPSELL_FEATURES}
            />
          </div>
        </div>
      );
    }

    return (
      <div class={style.emptyChatState}>
        <img src="/assets/images/undraw_typing.svg" class={style.emptyChatImage} />
        <p class={style.emptyChatText}>
          <Text id="chat.emptyStateMessage" />
        </p>
      </div>
    );
  }
}

export default connect('httpClient', {})(EmptyChat);
