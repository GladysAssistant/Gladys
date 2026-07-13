import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import style from './style.css';

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
    const messageKey = gladysPlusConfigured === false ? 'chat.emptyStateMessageNoPlus' : 'chat.emptyStateMessage';

    return (
      <div class={style.emptyChatState}>
        <img src="/assets/images/undraw_typing.svg" class={style.emptyChatImage} />
        <p class={style.emptyChatText}>
          <Text id={messageKey} />
        </p>
      </div>
    );
  }
}

export default connect('httpClient', {})(EmptyChat);
