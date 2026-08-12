import { Text, Localizer, MarkupText } from 'preact-i18n';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { RequestStatus } from '../../../../../utils/consts';
import cx from 'classnames';

class SetupTab extends Component {
  constructor(props) {
    super(props);
    this.state = {
      apiKey: '',
      messagingService: 'whatsapp',
      phoneNumber: '',
      getSettingsStatus: RequestStatus.Getting,
      saveStatus: null
    };
  }

  componentWillMount() {
    this.getConfiguration();
  }

  async getConfiguration() {
    this.setState({
      getSettingsStatus: RequestStatus.Getting
    });

    try {
      const [{ value: apiKey }, { value: messagingService }, { value: phoneNumber }] = await Promise.all([
        this.props.httpClient.get('/api/v1/service/callmebot/variable/CALLMEBOT_API_KEY', {
          userRelated: true
        }),
        this.props.httpClient.get('/api/v1/service/callmebot/variable/CALLMEBOT_MESSAGING_SERVICE', {
          userRelated: true
        }),
        this.props.httpClient.get('/api/v1/service/callmebot/variable/CALLMEBOT_PHONE_NUMBER', {
          userRelated: true
        })
      ]);

      this.setState({
        apiKey: apiKey || '',
        messagingService: messagingService || 'whatsapp',
        phoneNumber: phoneNumber || '',
        getSettingsStatus: RequestStatus.Success
      });
    } catch (e) {
      console.error(e);
      this.setState({
        getSettingsStatus: RequestStatus.Error
      });
    }
  }

  async saveConfiguration() {
    this.setState({
      saveStatus: RequestStatus.Getting
    });

    try {
      await Promise.all([
        this.props.httpClient.post('/api/v1/service/callmebot/variable/CALLMEBOT_API_KEY', {
          value: this.state.apiKey,
          userRelated: true
        }),
        this.props.httpClient.post('/api/v1/service/callmebot/variable/CALLMEBOT_MESSAGING_SERVICE', {
          value: this.state.messagingService,
          userRelated: true
        }),
        this.props.httpClient.post('/api/v1/service/callmebot/variable/CALLMEBOT_PHONE_NUMBER', {
          value: this.state.phoneNumber,
          userRelated: true
        })
      ]);

      this.setState({
        saveStatus: RequestStatus.Success
      });

      // Reset status after 2 seconds
      setTimeout(() => {
        this.setState({
          saveStatus: null
        });
      }, 2000);
    } catch (e) {
      console.error(e);
      this.setState({
        saveStatus: RequestStatus.Error
      });
    }
  }

  render(props, { apiKey, messagingService, phoneNumber, getSettingsStatus, saveStatus }) {
    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.callmebot.setup.title" />
          </h1>
        </div>
        <div class="card-body">
          <div class="alert alert-info">
            <MarkupText id="integration.callmebot.setup.description" />
          </div>

          <div class="form-group">
            <label class="form-label">
              <Text id="integration.callmebot.setup.messagingServiceLabel" />
            </label>
            <select
              class="form-control"
              value={messagingService}
              onChange={e => this.setState({ messagingService: e.target.value })}
              disabled={getSettingsStatus === RequestStatus.Getting}
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="signal">Signal</option>
            </select>
            <div class="help-block">
              <Text id="integration.callmebot.setup.messagingServiceHelp" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              <Text id="integration.callmebot.setup.phoneNumberLabel" />
            </label>
            <Localizer>
              <input
                type="text"
                class="form-control"
                placeholder={<Text id="integration.callmebot.setup.phoneNumberPlaceholder" />}
                value={phoneNumber}
                onChange={e => this.setState({ phoneNumber: e.target.value })}
                disabled={getSettingsStatus === RequestStatus.Getting}
              />
            </Localizer>
            <div class="help-block">
              {messagingService === 'signal' ? (
                <Text id="integration.callmebot.setup.phoneNumberHelpSignal" />
              ) : (
                <Text id="integration.callmebot.setup.phoneNumberHelp" />
              )}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              <Text id="integration.callmebot.setup.apiKeyLabel" />
            </label>
            <Localizer>
              <input
                type="text"
                class="form-control"
                placeholder={<Text id="integration.callmebot.setup.apiKeyPlaceholder" />}
                value={apiKey}
                onChange={e => this.setState({ apiKey: e.target.value })}
                disabled={getSettingsStatus === RequestStatus.Getting}
              />
            </Localizer>
            <div class="help-block">
              <Text id="integration.callmebot.setup.apiKeyHelp" />
            </div>
          </div>

          <div class="form-group">
            <button
              onClick={() => this.saveConfiguration()}
              class={cx('btn btn-success', {
                'btn-loading': saveStatus === RequestStatus.Getting
              })}
              disabled={saveStatus === RequestStatus.Getting}
            >
              <Text id="integration.callmebot.setup.saveButton" />
            </button>
            {saveStatus === RequestStatus.Success && (
              <span class="text-success ml-2">
                <i class="fe fe-check" />
                <Text id="integration.callmebot.setup.saved" />
              </span>
            )}
            {saveStatus === RequestStatus.Error && (
              <span class="text-danger ml-2">
                <i class="fe fe-alert-triangle" />
                <Text id="integration.callmebot.setup.error" />
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient')(SetupTab);
