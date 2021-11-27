import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import NextcloudTalkPage from './NextcloudTalk';
import { RequestStatus } from '../../../../utils/consts';

@connect(
  'user,nextcloudUrl,nextcloudBotUsername,nextcloudBotPassword,nextcloudBotToken,nextcloudTalkSaveSettingsStatus,nextcloudTalkGetSettingsStatus',
  actions
)
class NextcloudTalkIntegration extends Component {
  componentWillMount() {
    this.props.getNextcloudTalkSetting();
  }

  render(props, {}) {
    const loading =
      props.nextcloudTalkSaveSettingsStatus === RequestStatus.Getting ||
      props.nextcloudTalkGetSettingsStatus === RequestStatus.Getting;
    return <NextcloudTalkPage {...props} loading={loading} />;
  }
}

export default NextcloudTalkIntegration;
