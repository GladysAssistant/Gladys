import { Component } from 'preact';
import { MarkupText, Text, translate } from 'preact-i18n';

import { WEBSOCKET_MESSAGE_TYPES } from '../../../../../../../server/utils/constants';

import RemoteFeatureEdition from './edition/RemoteFeatureEdition';
import { ACTIONS } from '../../../../../../../server/services/broadlink/lib/utils/broadlink.constants';
import get from 'get-value';
import { MANAGED_FEATURES } from './features';

const renderSelectedAction = (intl, category, selectedFeature, selectedValue) => {
  const action = translate(
    `integration.broadlink.setup.features.${category}.${selectedFeature}`,
    intl && intl.scope,
    intl && intl.dictionary,
    { selectedValue },
    selectedValue,
    `${selectedValue}`
  );

  return (
    <div class="alert alert-info">
      <MarkupText
        id="integration.broadlink.setup.selectedActionInfoLabel"
        fields={{
          feature: <Text id={`deviceFeatureCategory.${category}.${selectedFeature}`} />,
          action
        }}
      />
    </div>
  );
};

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
      const { editedFeatures, selectedFeature, selectedValue, peripheral } = this.props;
      const codes = get(editedFeatures, `${selectedFeature}.codes`, { default: {} });
      const code = get(codes, `${selectedFeature}-${selectedValue}`, { default: codes[selectedFeature] });

      this.props.httpClient.post(`/api/v1/service/broadlink/send`, {
        peripheral,
        code
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
      } else {
        this.props.quitLearnMode();
        this.setState({ timeLeft: 0 });
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
        this.props.setLearning(false);
        break;
      case ACTIONS.LEARN.SUCCESS:
        if (this.props.learning) {
          this.setState({
            errorKey: null
          });

          const learnAllMode = this.props.storeFeatureCode(payload.code);

          if (learnAllMode) {
            await this.enterLearnAllMode(this.props.learnAllMode);
          } else {
            this.props.setLearning(false);
            this.setState({ timeLeft: undefined });
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
    const hasActions = get(MANAGED_FEATURES, `${category}.${selectedFeature}.values`) !== undefined;
    const hasSelectedValue = selectedValue !== undefined;

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
            <div class="alert alert-info">
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
          <div class="text-center">
            {!hasActions && (
              <div class="alert alert-info">
                <MarkupText
                  id="integration.broadlink.setup.selectedFeatureInfoLabel"
                  fields={{ feature: <Text id={`deviceFeatureCategory.${category}.${selectedFeature}`} /> }}
                />
              </div>
            )}
            {hasActions &&
              hasSelectedValue &&
              renderSelectedAction(props.intl, category, selectedFeature, selectedValue)}
            {hasActions && !hasSelectedValue && (
              <div class="alert alert-info">
                <MarkupText
                  id="integration.broadlink.setup.unselectedActionInfoLabel"
                  fields={{ feature: <Text id={`deviceFeatureCategory.${category}.${selectedFeature}`} /> }}
                />
              </div>
            )}
            {!timeLeft && learning && (
              <div class="alert alert-info">
                <Text id="integration.broadlink.setup.learningModeInProgress" />
              </div>
            )}
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
                    disabled={!hasActions ^ !hasSelectedValue}
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
