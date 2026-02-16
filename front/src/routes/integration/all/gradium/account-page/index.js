import { Component } from 'preact';
import { connect } from 'unistore/preact';
import GradiumPage from '../Gradium';
import AccountTab from './AccountTab';
import { RequestStatus } from '../../../../../utils/consts';
import withIntlAsProp from '../../../../../utils/withIntlAsProp';

class AccountPage extends Component {
  updateGradiumEndpoint = e => {
    this.setState({
      gradiumEndpoint: e.target.value
    });
  };

  updateGradiumApiKey = e => {
    this.setState({
      gradiumApiKey: e.target.value
    });
  };

  getGradiumSetting = async () => {
    this.setState({
      gradiumGetSettingsStatus: RequestStatus.Getting
    });

    let gradiumEndpoint = 'eu';
    let gradiumApiKey = '';

    this.setState({
      gradiumEndpoint,
      gradiumApiKey
    });

    try {
      const { value: endpoint } = await this.props.httpClient.get('/api/v1/service/gradium/variable/GRADIUM_ENDPOINT');
      gradiumEndpoint = endpoint;

      const { value: apiKey } = await this.props.httpClient.get('/api/v1/service/gradium/variable/GRADIUM_API_KEY');
      gradiumApiKey = apiKey;

      this.setState({
        gradiumGetSettingsStatus: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        gradiumGetSettingsStatus: RequestStatus.Error
      });
    }

    this.setState({
      gradiumEndpoint,
      gradiumApiKey
    });
  };

  saveGradiumSettings = async () => {
    this.setState({
      gradiumSaveSettingsStatus: RequestStatus.Getting
    });
    try {
      await this.props.httpClient.post('/api/v1/service/gradium/variable/GRADIUM_ENDPOINT', {
        value: this.state.gradiumEndpoint
      });
      await this.props.httpClient.post('/api/v1/service/gradium/variable/GRADIUM_API_KEY', {
        value: this.state.gradiumApiKey
      });
      await this.props.httpClient.post('/api/v1/service/gradium/start');

      this.setState({
        gradiumSaveSettingsStatus: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        gradiumSaveSettingsStatus: RequestStatus.Error
      });
    }
  };

  componentWillMount() {
    this.getGradiumSetting();
  }

  render(props, state) {
    const loading =
      state.gradiumSaveSettingsStatus === RequestStatus.Getting ||
      state.gradiumGetSettingsStatus === RequestStatus.Getting;
    return (
      <GradiumPage user={props.user}>
        <AccountTab
          gradiumEndpoint={state.gradiumEndpoint}
          gradiumApiKey={state.gradiumApiKey}
          gradiumSaveSettingsStatus={state.gradiumSaveSettingsStatus}
          gradiumGetSettingsStatus={state.gradiumGetSettingsStatus}
          updateGradiumEndpoint={this.updateGradiumEndpoint}
          updateGradiumApiKey={this.updateGradiumApiKey}
          saveGradiumSettings={this.saveGradiumSettings}
          loading={loading}
        />
      </GradiumPage>
    );
  }
}

export default withIntlAsProp(connect('user,httpClient')(AccountPage));
