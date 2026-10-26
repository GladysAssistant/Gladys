import { connect } from 'unistore/preact';
import { Component } from 'preact';
import { Text } from 'preact-i18n';
import get from 'get-value';
import { SYSTEM_VARIABLE_NAMES } from '../../../../../server/utils/constants';
import MessageServiceSelector from '../../scene/edit-scene/actions/MessageServiceSelector';

class SettingsSystemMessageService extends Component {
  // the channel the server is known to hold, shown again when a save fails
  savedService = null;
  // saves run one after the other, so the last choice is the one persisted
  saveQueue = Promise.resolve();
  hasLocalChange = false;
  hasSaved = false;

  getSystemMessageService = async () => {
    try {
      const { value } = await this.props.httpClient.get(
        `/api/v1/variable/${SYSTEM_VARIABLE_NAMES.SYSTEM_MESSAGE_SERVICE}`
      );
      // what the server holds, unless one of our saves already replaced it
      if (!this.hasSaved) {
        this.savedService = value;
      }
      // a choice made while the setting was loading must not be overwritten
      if (!this.hasLocalChange) {
        this.setState({ systemMessageService: value });
      }
    } catch (e) {
      // never set (or reset to "all channels"): the server answers 404
      if (get(e, 'response.status') !== 404) {
        console.error(e);
      }
    }
  };

  saveSystemMessageService = async (previousSave, service) => {
    // never rejects: every save handles its own failure
    await previousSave;
    try {
      // a variable value cannot be null: "all channels" is saved as an empty string
      await this.props.httpClient.post(`/api/v1/variable/${SYSTEM_VARIABLE_NAMES.SYSTEM_MESSAGE_SERVICE}`, {
        value: service || ''
      });
      this.savedService = service;
      this.hasSaved = true;
    } catch (e) {
      console.error(e);
      // the server kept the previous channel: show it rather than a choice
      // that was not saved, unless a newer choice is already on its way
      if (this.state.systemMessageService === service) {
        this.setState({ systemMessageService: this.savedService });
      }
    }
  };

  updateSystemMessageService = service => {
    this.hasLocalChange = true;
    this.setState({ systemMessageService: service });
    this.saveQueue = this.saveSystemMessageService(this.saveQueue, service);
    return this.saveQueue;
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
