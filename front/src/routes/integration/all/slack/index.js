import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import SlackPage from './Slack';
import { RequestStatus } from '../../../../utils/consts';

@connect('user,slackApiKey,slackCustomLink,slackGetApiKeyStatus,slackSaveApiKeyStatus', actions)
class SlackIntegration extends Component {
  componentWillMount() {
    this.props.getSlackApiKey();
  }

  render(props, {}) {
    const loading =
      props.slackGetApiKeyStatus === RequestStatus.Getting || props.slackSaveApiKeyStatus === RequestStatus.Getting;
    return <SlackPage {...props} loading={loading} />;
  }
}

export default SlackIntegration;
