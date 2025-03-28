import { Text } from 'preact-i18n';
import { Component } from 'preact';
import { RequestStatus } from '../../../../utils/consts';
import { connect } from 'unistore/preact';
import MatterPage from './MatterPage';

class MatterSettingsPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      matterEnabled: false,
      saving: false,
      error: null
    };
  }

  componentDidMount() {
    this.loadConfiguration();
  }

  loadConfiguration = async () => {
    try {
      const config = await this.props.getMatterConfiguration();
      this.setState({
        matterEnabled: config.enabled
      });
    } catch (e) {
      console.error(e);
      this.setState({ error: RequestStatus.Error });
    }
  };

  saveConfiguration = async () => {
    this.setState({ saving: true });
    try {
      await this.props.saveMatterConfiguration({
        enabled: this.state.matterEnabled
      });
      this.setState({ saving: false, error: null });
    } catch (e) {
      console.error(e);
      this.setState({ saving: false, error: RequestStatus.Error });
    }
  };

  render() {
    return (
      <MatterPage user={this.props.user}>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <Text id="integration.matter.settings.title" />
            </h3>
          </div>
          <div class="card-body">
            <div class="alert alert-info">
              <Text id="integration.matter.settings.description" />
            </div>

            <div class="form-group">
              <label class="custom-switch">
                <input
                  type="checkbox"
                  class="custom-switch-input"
                  checked={this.state.matterEnabled}
                  onChange={e => this.setState({ matterEnabled: e.target.checked })}
                  disabled={this.state.saving}
                />
                <span class="custom-switch-indicator" />
                <span class="custom-switch-description">
                  <Text id="integration.matter.settings.enableIntegration" />
                </span>
              </label>
            </div>

            <div class="form-group">
              <button onClick={this.saveConfiguration} class="btn btn-success" disabled={this.state.saving}>
                <Text id="integration.matter.settings.saveButton" />
              </button>
            </div>

            {this.state.error === RequestStatus.Error && (
              <div class="alert alert-danger">
                <Text id="integration.matter.settings.error" />
              </div>
            )}
          </div>
        </div>
      </MatterPage>
    );
  }
}

export default connect('httpClient,user', {})(MatterSettingsPage);
