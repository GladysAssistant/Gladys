import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import MerossPage from '../MerossPage';
import SetupPage from './SetupPage';
import { RequestStatus } from '../../../../../utils/consts';

@connect('user,merossKey,merossSaveKeyStatus,merossGetKeyStatus', actions)
class OpenWeatherIntegration extends Component {
  componentWillMount() {
    this.props.getApiKey();
  }

  render(props, {}) {
    const loading =
      props.merossSaveKeyStatus === RequestStatus.Getting ||
      props.merossGetKeyStatus === RequestStatus.Getting;
    return (
      <MerossPage>
        <SetupPage {...props} loading={loading} />
      </MerossPage>
    );
  }
}

export default OpenWeatherIntegration;
