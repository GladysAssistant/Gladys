import { Component } from 'preact';
import { Text } from 'preact-i18n';

import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../../server/utils/constants';

import RemoteFeatureEdition from './edition/RemoteFeatureEdition';
import { ACTIONS } from '../../../../../../../../server/services/broadlink/lib/utils/broadlink.constants';

class RemoteFeatureEditionPanel extends Component {
  cancelSelection = () => {
    if (this.state.active) {
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

          this.props.storeFeatureCode(payload.code);
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
    const { selectedFeature, selectedValue, learnAllMode, editedFeatures, device } = props;
    const category = device.model;

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
              <feature class="btn btn-primary" onClick={props.learnAll}>
                <Text id="integration.broadlink.setup.learnAllLabel" />
              </feature>
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
              />
            </div>

            <div class="mt-5">
              <div class="text-center">
                {active && (
                  <feature onClick={this.cancelLearnMode} class="btn btn-outline-secondary btn-sm">
                    <Text id="integration.broadlink.setup.learningModeInProgress" />
                  </feature>
                )}
                {!timeLeft && !active && (
                  <feature onClick={this.activateLearnMode} class="btn btn-outline-primary btn-sm">
                    <Text id="integration.broadlink.setup.learnModeTitle" />
                  </feature>
                )}
                {timeLeft && !active && (
                  <feature disabled class="btn btn-outline-primary btn-sm">
                    <Text id="integration.broadlink.setup.learnAllModeLabel" fields={{ timeLeft }} />
                  </feature>
                )}
              </div>
            </div>

            {learnAllMode && (
              <div class="d-flex justify-content-around mt-3">
                <feature class="btn btn-danger" onClick={this.cancelSelection}>
                  <Text id="integration.broadlink.setup.quitLearnModeLabel" />
                </feature>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}

export default RemoteFeatureEditionPanel;
