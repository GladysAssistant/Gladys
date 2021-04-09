import { Component } from 'preact';
import { Text } from 'preact-i18n';

import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

import RemoteFeatureEdition from './edition/RemoteFeatureEdition';
import { ACTIONS } from '../../../../../../../server/services/broadlink/lib/utils/broadlink.constants';

class RemoteFeatureEditionPanel extends Component {
  cancelSelection = () => {
    if (this.props.learning) {
      this.enterLearnAllMode(false);
    }

    this.props.selectFeature(null);

    this.setState({
      errorKey: undefined
    });
  };

  testFeature = () => {
    try {
      const { selectedFeature, features, peripheral } = this.props;
      const feature = features[selectedFeature.key];

      this.props.httpClient.post(`/api/v1/service/broadlink/send`, {
        peripheral,
        code: feature
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
        errorKey: undefined
      });
      this.props.setLearning(true);
    } catch (e) {
      this.setState({
        errorKey: 'integration.broadlink.setup.learnFailed'
      });
    }
  };

  skipButton = async () => {
    this.props.storeFeatureCode(undefined);
    await this.enterLearnAllMode(this.props.learnAllMode);
    await this.cancelLearnMode();
  };

  cancelLearnMode = async () => {
    const { peripheral, learning } = this.props;

    if (!learning) {
      return;
    }

    try {
      await this.props.httpClient.post('/api/v1/service/broadlink/learn/cancel', {
        peripheral
      });
      this.setState({
        errorKey: undefined
      });
      this.props.setLearning(false);
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

  enterLearnAllMode = async start => {
    if (start) {
      if (!this.state.timeLeft) {
        this.setState({ timeLeft: 3 });
        this.timer = setInterval(this.decrementTimeRemaining, 1000);
      }
    } else {
      clearInterval(this.timer);
      this.props.quitLearnMode();
      await this.cancelLearnMode();
    }
  };

  learnModeUpdate = async payload => {
    switch (payload.action) {
      case ACTIONS.LEARN.ERROR:
        this.setState({
          errorKey: 'integration.broadlink.setup.peripheralNotLearn'
        });
        break;
      case ACTIONS.LEARN.CANCEL_ERROR:
        this.setState({
          errorKey: 'integration.broadlink.setup.cancelLearnFailed'
        });
        break;
      case ACTIONS.LEARN.CANCEL_SUCCESS:
        this.setState({
          errorKey: null
        });
        break;
      case ACTIONS.LEARN.SUCCESS:
        if (this.props.learning) {
          this.setState({
            errorKey: null
          });

          this.props.storeFeatureCode(payload.code);

          if (this.props.learnAllMode) {
            await this.enterLearnAllMode(this.props.learnAllMode);
          } else {
            this.props.setLearning(false);
          }
        }
        break;
      case ACTIONS.LEARN.NO_PERIPHERAL:
        this.setState({
          errorKey: 'integration.broadlink.setup.peripheralNotFound'
        });
        break;
    }
  };

  componentDidMount() {
    this.props.session.dispatcher.addListener(WEBSOCKET_MESSAGE_TYPES.BROADLINK.LEARN_MODE, this.learnModeUpdate);
  }

  componentWillReceiveProps(props) {
    const { learnAllMode } = this.props;
    if (learnAllMode !== props.learnAllMode) {
      this.enterLearnAllMode(props.learnAllMode);
    }
  }

  async componentWillUnmount() {
    this.props.session.dispatcher.removeListener(WEBSOCKET_MESSAGE_TYPES.BROADLINK.LEARN_MODE, this.learnModeUpdate);
    await this.cancelLearnMode();
  }

  render(
    { selectedFeature, selectedValue, learnAllMode, editedFeatures, device, learning, ...props },
    { timeLeft, errorKey }
  ) {
    const { model: category } = device;

    return (
      <div>
        <hr />

        {errorKey && (
          <div class="alert alert-danger">
            <Text id={errorKey} />
          </div>
        )}
        {!selectedFeature && (
          <div>
            <div class="alert alert-secondary">
              <Text id="integration.broadlink.setup.selectFeatureLabel" />
            </div>
            <div class="d-flex justify-content-center">
              <button class="btn btn-primary" onClick={props.learnAll}>
                <Text id="integration.broadlink.setup.learnAllLabel" />
              </button>
            </div>
          </div>
        )}
        {selectedFeature && (
          <div>
            <div class="form-group">
              <label class="form-label">
                <Text id="integration.broadlink.setup.selectedFeatureLabel" />
              </label>

              <RemoteFeatureEdition
                category={category}
                type={selectedFeature}
                selectedValue={selectedValue}
                featureWithCodes={editedFeatures[selectedFeature]}
                testFeature={this.testFeature}
                updateFeature={props.updateFeature}
                deleteFeature={props.deleteFeature}
                selectValue={props.selectValue}
                disabled={learning || learnAllMode}
                displayAction={!learnAllMode}
              />
            </div>

            <div class="mt-5">
              <div class="text-center">
                {!timeLeft && learning && (
                  <div class="alert alert-info">
                    <Text id="integration.broadlink.setup.learningModeInProgress" />
                  </div>
                )}
                {!timeLeft && learning && !learnAllMode && (
                  <button onClick={this.cancelLearnMode} class="btn btn-outline-secondary btn-sm">
                    <Text id="integration.broadlink.setup.cancelLearnModeButton" />
                  </button>
                )}
                {!timeLeft && learning && learnAllMode && (
                  <button onClick={this.skipButton} class="btn btn-outline-secondary btn-sm">
                    <Text id="integration.broadlink.setup.skipLearningButton" />
                  </button>
                )}
                {!timeLeft && !(learning || learnAllMode) && (
                  <button
                    onClick={this.activateLearnMode}
                    class="btn btn-outline-primary btn-sm"
                    disabled={selectedValue === undefined}
                  >
                    <Text id="integration.broadlink.setup.learnModeTitle" />
                  </button>
                )}
                {timeLeft && (
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
          </div>
        )}
      </div>
    );
  }
}

export default RemoteFeatureEditionPanel;
