import { connect } from 'unistore/preact';
import { Component } from 'preact';
import { Text } from 'preact-i18n';
import get from 'get-value';
import { SYSTEM_VARIABLE_NAMES } from '../../../../../server/utils/constants';
import MessageServiceSelector from '../../scene/edit-scene/actions/MessageServiceSelector';

class SettingsSystemMessageService extends Component {
  getSystemMessageService = async () => {
    try {
      const { value } = await this.props.httpClient.get(
        `/api/v1/variable/${SYSTEM_VARIABLE_NAMES.SYSTEM_MESSAGE_SERVICE}`
      );
      this.setState({ systemMessageService: value });
    } catch (e) {
      // never set (or reset to "all channels"): the server answers 404
      if (get(e, 'response.status') !== 404) {
        console.error(e);
      }
    }
  };

  updateSystemMessageService = async service => {
    this.setState({ systemMessageService: service });
    try {
      // a variable value cannot be null: "all channels" is saved as an empty string
      await this.props.httpClient.post(`/api/v1/variable/${SYSTEM_VARIABLE_NAMES.SYSTEM_MESSAGE_SERVICE}`, {
        value: service || ''
      });
    } catch (e) {
      console.error(e);
    }
  };

  componentDidMount() {
    this.getSystemMessageService();
  }

  render({}, { systemMessageService }) {
    return (
      <div class="card">
        <h4 class="card-header">
          <Text id="systemSettings.systemMessageService" />
        </h4>
        <div class="card-body">
          <p>
            <Text id="systemSettings.systemMessageServiceDescription" />
          </p>
          <MessageServiceSelector value={systemMessageService} onChange={this.updateSystemMessageService} />
        </div>
      </div>
    );
  }
}

export default connect('httpClient', null)(SettingsSystemMessageService);
