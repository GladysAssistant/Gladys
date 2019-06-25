import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import DarkSkyPage from './DarkSky';
import { RequestStatus } from '../../../../utils/consts';

@connect(
  'user,darkSkyApiKey,darkskySaveApiKeyStatus,darkskyGetApiKeyStatus',
  actions
)
class TelegramIntegration extends Component {
  componentWillMount() {
    this.props.getApiKey();
  }

  render(props, {}) {
    const loading =
      props.darkskySaveApiKeyStatus === RequestStatus.Getting || props.darkskyGetApiKeyStatus === RequestStatus.Getting;
    return <DarkSkyPage {...props} loading={loading} />;
  }
}

export default TelegramIntegration;
