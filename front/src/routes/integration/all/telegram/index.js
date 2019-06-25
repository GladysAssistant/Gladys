import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import TelegramPage from './Telegram';
import { RequestStatus } from '../../../../utils/consts';

@connect(
  'user,telegramApiKey,telegramCustomLink,telegramGetApiKeyStatus,telegramSaveApiKeyStatus',
  actions
)
class TelegramIntegration extends Component {
  componentWillMount() {
    this.props.getTelegramApiKey();
  }

  render(props, {}) {
    const loading =
      props.telegramGetApiKeyStatus === RequestStatus.Getting ||
      props.telegramSaveApiKeyStatus === RequestStatus.Getting;
    return <TelegramPage {...props} loading={loading} />;
  }
}

export default TelegramIntegration;
