import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../../server/utils/constants';
import { ACTIONS } from '../../../../../../../../server/services/broadlink/lib/utils/broadlink.constants';

import RemoteControlLayout from '../../../../../../components/remote-control/RemoteControlLayout';
import ButtonBox from '../../../../../../components/remote-control/ButtonBox';

class RemoteButtonEditionPanel extends Component {
  cancelSelection = () => {
    if (this.state.active) {
      this.enterLearnAllMode(false);
    }

    this.props.selectButton(null);

    this.setState({
      errorKey: undefined
    });
  };

  testButton = () => {
    try {
      const { selectedButton, buttons, peripheral } = this.props;
      const button = buttons[selectedButton.key];

      this.props.httpClient.post(`/api/v1/service/broadlink/send`, {
        peripheral,
        code: button
      });

      this.setState({
        errorKey: undefined
      });
    } catch (e) {
      console.error(e);
      this.setState({
        errorKey: 'integration.broadlink.setup.testError'
      });
    }
  };

  activateLearnMode = async () => {
    const { peripheral } = this.props;
    try {
      await this.props.httpClient.post('/api/v1/service/broadlink/learn', {
        peripheral
      });
      this.setState({
        active: true,
        errorKey: undefined
      });
    } catch (e) {
      this.setState({
        active: false,
        errorKey: 'integration.broadlink.setup.learnFailed'
      });
    }
  };

  cancelLearnMode = async () => {
    const { peripheral } = this.props;
    try {
      await this.props.httpClient.post('/api/v1/service/broadlink/learn/cancel', {
        peripheral
      });
    } catch (e) {
      this.setState({
        errorKey: 'integration.broadlink.setup.cancelLearnFailed'
      });
    }
  };

  decrementTimeRemaining = () => {
    const newTimeLeft = this.state.timeLeft - 1;
    if (newTimeLeft > 0) {
      this.setState({
        timeLeft: newTimeLeft
      });
    } else {
      this.activateLearnMode();
      clearInterval(this.timer);
      this.setState({
        timeLeft: undefined
      });
    }
  };

  enterLearnAllMode = start => {
    if (start) {
      if (!this.state.timeLeft) {
        this.setState({ timeLeft: 3 });
        this.timer = setInterval(() => this.decrementTimeRemaining(), 1000);
      }
    } else if (this.timer) {
      clearInterval(this.timer);
      this.props.quitLearnMode();
      this.cancelLearnMode();
    }
  };

  learnModeUpdate = payload => {
    switch (payload.action) {
      case ACTIONS.LEARN.ERROR:
        this.setState({
          errorKey: 'integration.broadlink.setup.peripheralNotLearn',
          active: false
        });
        break;
      case ACTIONS.LEARN.CANCEL_ERROR:
        this.setState({
          errorKey: 'integration.broadlink.setup.cancelLearnFailed'
        });
        break;
      case ACTIONS.LEARN.CANCEL_SUCCESS:
        this.setState({
          errorKey: null,
          active: false
        });
        break;
      case ACTIONS.LEARN.SUCCESS:
        if (this.state.active) {
          this.setState({
            errorKey: null,
            active: false
          });

          this.props.storeButtonCode(payload.code);
          this.enterLearnAllMode(this.props.learnAllMode);
        }
        break;
      case ACTIONS.LEARN.NO_PERIPHERAL:
        this.setState({
          errorKey: 'integration.broadlink.setup.peripheralNotFound',
          active: false
        });
        break;
    }
  };

  componentDidMount() {
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.BROADLINK.LEARN_MODE, this.learnModeUpdate);
    this.enterLearnAllMode(this.props.learnAllMode);
  }

  componentWillReceiveProps(props) {
    const { learnAllMode } = this.props;
    if (learnAllMode !== props.learnAllMode) {
      this.enterLearnAllMode(props.learnAllMode);
    }
  }

  componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.BROADLINK.LEARN_MODE, this.learnModeUpdate);
  }

  render(props, { active, timeLeft, errorKey }) {
    const { selectedButton, learnAllMode, buttons, device } = props;
    const remoteType = device.model;

    return (
      <div class="row">
        <div class="col-sm-4">
          <Localizer>
            <RemoteControlLayout
              remoteType={remoteType}
              remoteName={device.name || <Text id="integration.broadlink.setup.noNameLabel" />}
              onClick={props.selectButton}
              editionMode
              featureByType={buttons}
            />
          </Localizer>
        </div>

        <div class="col-sm-8 mb-5">
          {errorKey && (
            <div class="alert alert-danger">
              <Text id={errorKey} />
            </div>
          )}
          {!selectedButton && (
            <div>
              <div class="alert alert-secondary">
                <Text id="integration.broadlink.setup.selectButtonLabel" />
              </div>
              <div class="d-flex justify-content-center">
                <button class="btn btn-primary" onClick={props.learnAll}>
                  <Text id="integration.broadlink.setup.learnAllLabel" />
                </button>
              </div>
            </div>
          )}
          {selectedButton && (
            <div class="text-center">
              <div class="form-group">
                <label class="form-label" for="remotePeripheral">
                  <Text id="integration.broadlink.setup.selectedButtonLabel" />
                </label>

                <ButtonBox
                  category={remoteType}
                  featureName={selectedButton.type}
                  edited
                  button={selectedButton}
                  value={selectedButton.value}
                />
                <span class="ml-3">
                  {selectedButton.value !== undefined && (
                    <Text
                      id={`deviceFeatureCategory.${remoteType}.${selectedButton.type}-value`}
                      plural={selectedButton.value}
                      fields={{ value: selectedButton.value }}
                    >
                      {selectedButton.type}
                    </Text>
                  )}
                  {selectedButton.value === undefined && (
                    <Text id={`deviceFeatureCategory.${remoteType}.${selectedButton.type}`}>{selectedButton.type}</Text>
                  )}
                </span>
              </div>

              <div class="mt-5">
                <div class="text-center">
                  {active && (
                    <button onClick={this.cancelLearnMode} class="btn btn-outline-secondary btn-sm">
                      <Text id="integration.broadlink.setup.learningModeInProgress" />
                    </button>
                  )}
                  {!timeLeft && !active && (
                    <button onClick={this.activateLearnMode} class="btn btn-outline-primary btn-sm">
                      <Text id="integration.broadlink.setup.learnModeTitle" />
                    </button>
                  )}
                  {timeLeft && !active && (
                    <button disabled class="btn btn-outline-primary btn-sm">
                      <Text id="integration.broadlink.setup.learnAllModeLabel" fields={{ timeLeft }} />
                    </button>
                  )}
                </div>
              </div>

              {learnAllMode && (
                <div class="d-flex justify-content-around mt-3">
                  <button class="btn btn-danger" onClick={this.cancelSelection}>
                    <Text id="integration.broadlink.setup.quitLearnModeLabel" />
                  </button>
                </div>
              )}

              {!learnAllMode && (
                <div class="d-flex justify-content-around mt-3">
                  <button class="btn btn-warning" onClick={this.cancelSelection}>
                    <Text id="integration.broadlink.setup.unselect" />
                  </button>

                  <button class="btn btn-success" onClick={this.testButton} disabled={!buttons[selectedButton.key]}>
                    <Text id="integration.broadlink.setup.testLabel" />
                  </button>

                  <button class="btn btn-danger" onClick={props.deleteButton} disabled={!buttons[selectedButton.key]}>
                    <Text id="integration.broadlink.setup.deleteLabel" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default RemoteButtonEditionPanel;
