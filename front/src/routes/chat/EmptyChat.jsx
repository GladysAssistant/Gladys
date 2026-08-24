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
    // Without Gladys Plus the chat can't answer at all: instead of a dead end,
    // show what the AI chat makes possible and how to unlock it.
    if (gladysPlusConfigured === false) {
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
