import { Text, Localizer, MarkupText } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';
import { Component } from 'preact';
import { connect } from 'unistore/preact';

class SetupTab extends Component {
  componentWillMount() {
    this.getTuyaConfiguration();
  }

  async getTuyaConfiguration() {
    let tuyaEndpoint = '';
    let tuyaAccessKey = '';
    let tuyaSecretKey = '';
    let tuyaAppAccountId = '';

    this.setState({
      tuyaGetSettingsStatus: RequestStatus.Getting,
      tuyaEndpoint,
      tuyaAccessKey,
      tuyaSecretKey,
      tuyaAppAccountId
    });
    try {
      const { value: endpoint } = await this.props.httpClient.get('/api/v1/service/tuya/variable/TUYA_ENDPOINT');
      tuyaEndpoint = endpoint;

      const { value: accessKey } = await this.props.httpClient.get('/api/v1/service/tuya/variable/TUYA_ACCESS_KEY');
      tuyaAccessKey = accessKey;

      const { value: secretKey } = await this.props.httpClient.get('/api/v1/service/tuya/variable/TUYA_SECRET_KEY');
      tuyaSecretKey = secretKey;

      const { value: appAccountId } = await this.props.httpClient.get(
        '/api/v1/service/tuya/variable/TUYA_APP_ACCOUNT_UID'
      );
      tuyaAppAccountId = appAccountId;

      this.setState({
        tuyaGetSettingsStatus: RequestStatus.Success,
        tuyaEndpoint,
        tuyaAccessKey,
        tuyaSecretKey,
        tuyaAppAccountId
      });
    } catch (e) {
      this.setState({
        tuyaGetSettingsStatus: RequestStatus.Error
      });
    }
  }

  async saveTuyaConfiguration(e) {
    e.preventDefault();
    this.setState({
      tuyaSaveSettingsStatus: RequestStatus.Getting
    });
    try {
      await this.props.httpClient.post('/api/v1/service/tuya/variable/TUYA_ENDPOINT', {
        value: this.state.tuyaEndpoint
      });

      await this.props.httpClient.post('/api/v1/service/tuya/variable/TUYA_ACCESS_KEY', {
        value: this.state.tuyaAccessKey.trim()
      });

      await this.props.httpClient.post('/api/v1/service/tuya/variable/TUYA_SECRET_KEY', {
        value: this.state.tuyaSecretKey.trim()
      });

      await this.props.httpClient.post('/api/v1/service/tuya/variable/TUYA_APP_ACCOUNT_UID', {
        value: this.state.tuyaAppAccountId.trim()
      });

      // start service
      await this.props.httpClient.post('/api/v1/service/tuya/start');
      this.setState({
        tuyaSaveSettingsStatus: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        tuyaSaveSettingsStatus: RequestStatus.Error
      });
    }
  }

  updateConfiguration(e) {
    this.setState({
      [e.target.name]: e.target.value
    });
  }

  render(props, state) {
    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.tuya.setup.title" />
          </h1>
        </div>
        <div class="card-body">
          <div
            class={cx('dimmer', {
              active: state.tuyaSaveSettingsStatus === RequestStatus.Getting
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              <p>
                <MarkupText id="integration.tuya.setup.description" />
                <MarkupText id="integration.tuya.setup.descriptionCreateAccount" />
                <MarkupText id="integration.tuya.setup.descriptionCreateProject" />
                <MarkupText id="integration.tuya.setup.descriptionGetKeys" />
                <MarkupText id="integration.tuya.setup.descriptionGetAppAccountUid" />
                <MarkupText id="integration.tuya.setup.descriptionGetAppAccountUid2" />
              </p>

              <form>
                <div class="form-group">
                  <label for="tuyaEndpoint" class="form-label">
                    <Text id={`integration.tuya.setup.endpoint`} />
                  </label>
                  <select
                    className="form-control"
                    name="tuyaEndpoint"
                    value={state.tuyaEndpoint}
                    onChange={this.updateConfiguration.bind(this)}
                  >
                    <option value="china">
                      <Text id="integration.tuya.setup.endpoints.china" />
                    </option>
                    <option value="westernAmerica">
                      <Text id="integration.tuya.setup.endpoints.westernAmerica" />
                    </option>
                    <option value="easternAmerica">
                      <Text id="integration.tuya.setup.endpoints.easternAmerica" />
                    </option>
                    <option value="centralEurope">
                      <Text id="integration.tuya.setup.endpoints.centralEurope" />
                    </option>
                    <option value="westernEurope">
                      <Text id="integration.tuya.setup.endpoints.westernEurope" />
                    </option>
                    <option value="india">
                      <Text id="integration.tuya.setup.endpoints.india" />
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="tuyaAccessKey" class="form-label">
                    <Text id={`integration.tuya.setup.accessKey`} />
                  </label>
                  <Localizer>
                    <input
                      name="tuyaAccessKey"
                      type="text"
                      placeholder={<Text id="integration.tuya.setup.accessKeyPlaceholder" />}
                      value={state.tuyaAccessKey}
                      class="form-control"
                      onInput={this.updateConfiguration.bind(this)}
                    />
                  </Localizer>
                </div>

                <div class="form-group">
                  <label htmlFor="tuyaSecretKey" className="form-label">
                    <Text id={`integration.tuya.setup.secretKey`} />
                  </label>
                  <Localizer>
                    <input
                      name="tuyaSecretKey"
                      type="text"
                      placeholder={<Text id="integration.tuya.setup.secretKeyPlaceholder" />}
                      value={state.tuyaSecretKey}
                      className="form-control"
                      onInput={this.updateConfiguration.bind(this)}
                    />
                  </Localizer>
                </div>

                <div class="form-group">
                  <label htmlFor="tuyaAppAccountId" className="form-label">
                    <Text id={`integration.tuya.setup.appAccountId`} />
                  </label>
                  <Localizer>
                    <input
                      name="tuyaAppAccountId"
                      type="text"
                      placeholder={<Text id="integration.tuya.setup.appAccountIdPlaceholder" />}
                      value={state.tuyaAppAccountId}
                      className="form-control"
                      onInput={this.updateConfiguration.bind(this)}
                    />
                  </Localizer>
                </div>

                <div class="row mt-5">
                  <div class="col">
                    <button type="submit" class="btn btn-success" onClick={this.saveTuyaConfiguration.bind(this)}>
                      <Text id="integration.tuya.setup.saveLabel" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(SetupTab);
