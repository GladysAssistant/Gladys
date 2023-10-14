import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../../../../utils/consts';

import ApplicationSetup from './ApplicationSetup';
import SetupSummary from './SetupSummary';

class SetupTab extends Component {
  enableEditionMode = () => {
    this.setState({ editionMode: true });
  };

  resetConfiguration = () => {
    const { ewelinkStatus = {} } = this.props;
    const { configured = false } = ewelinkStatus;
    this.setState({
      editionMode: !configured
    });
  };

  constructor(props) {
    super(props);

    const { ewelinkStatus = {} } = props;
    const { configured = false } = ewelinkStatus;
    this.state = {
      editionMode: !configured
    };
  }

  componentWillReceiveProps(nextProps) {
    const { ewelinkStatus = {} } = nextProps;

    if (ewelinkStatus.configured && this.state.editionMode) {
      this.setState({ editionMode: false });
    }
  }

  render(
    {
      ewelinkStatus,
      loadEwelinkStatus = RequestStatus.Getting,
      ewelinkConfig,
      loadEwelinkConfig = RequestStatus.Getting,
      saveEwelinkConfig,
      saveConfiguration,
      connectUser,
      loadConnectUser,
      disconnectUser,
      loadDisconnectUser
    },
    { editionMode }
  ) {
    const formDisabled =
      saveEwelinkConfig === RequestStatus.Getting ||
      loadConnectUser === RequestStatus.Getting ||
      loadDisconnectUser === RequestStatus.Getting;

    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.eWeLink.setup.title" />
          </h1>
        </div>
        <div class="card-body">
          <p>
            <Text id="integration.eWeLink.setup.eweLinkDescription" />
          </p>
          <div
            class={cx('dimmer', {
              active: loadEwelinkStatus === RequestStatus.Getting || loadEwelinkConfig === RequestStatus.Getting
            })}
          >
            <div class="loader" />
            <div class="dimmer-content">
              {loadEwelinkStatus === RequestStatus.Error && (
                <p class="alert alert-danger">
                  <Text id="integration.eWeLink.setup.loadStatusError" />
                </p>
              )}
              {saveEwelinkConfig === RequestStatus.Error && (
                <p class="alert alert-danger">
                  <Text id="integration.eWeLink.setup.saveConfigError" />
                </p>
              )}
              {editionMode && (
                <ApplicationSetup
                  disabled={formDisabled}
                  ewelinkConfig={ewelinkConfig}
                  saveEwelinkConfig={saveEwelinkConfig}
                  saveConfiguration={saveConfiguration}
                  resetConfiguration={this.resetConfiguration}
                />
              )}
              {!editionMode && (
                <SetupSummary
                  ewelinkStatus={ewelinkStatus}
                  enableEditionMode={this.enableEditionMode}
                  connectUser={connectUser}
                  disconnectUser={disconnectUser}
                  disabled={formDisabled}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default SetupTab;
