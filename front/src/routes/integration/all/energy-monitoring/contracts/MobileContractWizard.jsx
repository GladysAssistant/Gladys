import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import {
  FocusPage,
  MobileNavBar,
  MobileSteps,
  MobileBottomBar,
  BigButton,
  ConfirmSheet,
  SystemBackGuard,
  kitStyle
} from '../../../../../components/mobile';
import { MeterStep, TemplateStep, ParametersStep, PreviewStep } from './MobileWizardSteps';
import { WIZARD_STEPS, CREATE_NEW_METER } from './contractUtils';
import style from '../mobile.css';

const STEP_METER = 0;
const STEP_TEMPLATE = 1;
const STEP_PARAMETERS = 2;
const STEP_PREVIEW = 3;

/**
 * @description The contract wizard on a phone (docs/specs/mobile-pages/energy.md, D): a focus
 * page showing one step at a time, the way forward in the bottom bar. A presentation only: it
 * renders the view of ContractWizard.jsx (state and actions), like the desktop card does.
 */
class MobileContractWizard extends Component {
  state = {
    leaveOpen: false,
    creatingMeter: false
  };

  componentDidMount() {
    window.addEventListener('beforeunload', this.onBeforeUnload);
  }

  // a new step starts at its top
  componentDidUpdate(prevProps) {
    if (prevProps.step !== this.props.step) {
      window.scrollTo(0, 0);
    }
  }

  componentWillUnmount() {
    this.unmounted = true;
    window.removeEventListener('beforeunload', this.onBeforeUnload);
  }

  onBeforeUnload = event => {
    if (this.props.isDirty()) {
      event.preventDefault();
      event.returnValue = '';
    }
  };

  onBack = () => {
    if (this.props.isDirty()) {
      this.setState({ leaveOpen: true });
    } else {
      this.props.cancel();
    }
  };

  // the system "back" with unsaved changes (SystemBackGuard): the same sheet as the back control
  openLeave = () => this.setState({ leaveOpen: true });

  closeLeave = () => this.setState({ leaveOpen: false });

  leaveWithoutSaving = () => {
    this.setState({ leaveOpen: false });
    this.props.cancel();
  };

  createMeter = async () => {
    this.setState({ creatingMeter: true });
    await this.props.chooseMeter(CREATE_NEW_METER);
    if (!this.unmounted) {
      this.setState({ creatingMeter: false });
    }
  };

  goTo = step => () => this.props.setStep(step);

  // the error of the step, shown above the buttons of the bottom bar
  getError() {
    const { step, templatesError, previewError, saveError } = this.props;
    if (step === STEP_TEMPLATE && templatesError) {
      return {
        message: (
          <span>
            <Text id="integration.energyMonitoring.errorLoadingContracts" /> {templatesError}
          </span>
        ),
        close: this.props.dismissTemplatesError
      };
    }
    if (step === STEP_PREVIEW && previewError) {
      return {
        message: <span data-cy="energy-contract-preview-error">{previewError}</span>,
        close: this.props.dismissPreviewError
      };
    }
    if (saveError) {
      return {
        message: <span data-cy="energy-contract-save-error">{saveError}</span>,
        close: this.props.dismissSaveError
      };
    }
    return null;
  }

  renderButtons() {
    const { step, form, selector, saving, preview, loadingPreview } = this.props;
    const delegated = form.pricing_mode === 'delegated';
    const back = target => (
      <BigButton fit icon="arrow-left" onClick={this.goTo(target)} data-cy="energy-contract-back">
        <Text id="global.back" />
      </BigButton>
    );
    if (step === STEP_METER) {
      return (
        <BigButton
          variant="primary"
          disabled={!form.electric_meter_device_id}
          onClick={this.goTo(STEP_TEMPLATE)}
          data-cy="energy-contract-next"
        >
          <Text id="global.next" />
        </BigButton>
      );
    }
    if (step === STEP_TEMPLATE) {
      return (
        <BigButton icon="arrow-left" onClick={this.goTo(STEP_METER)} data-cy="energy-contract-back">
          <Text id="global.back" />
        </BigButton>
      );
    }
    if (step === STEP_PARAMETERS) {
      return [
        // an edited contract keeps its meter and its template
        !selector && back(STEP_TEMPLATE),
        delegated ? (
          <BigButton
            variant="primary"
            disabled={!this.props.canGoToPreview()}
            loading={saving}
            onClick={this.props.save}
            data-cy="energy-contract-save"
          >
            <Text id="global.save" />
          </BigButton>
        ) : (
          <BigButton
            variant="primary"
            disabled={!this.props.canGoToPreview()}
            onClick={this.props.runPreview}
            data-cy="energy-contract-preview"
          >
            <Text id="integration.energyMonitoring.contracts.wizard.preview" />
          </BigButton>
        )
      ];
    }
    return [
      back(STEP_PARAMETERS),
      <BigButton
        variant="primary"
        disabled={!preview || loadingPreview}
        loading={saving}
        onClick={this.props.save}
        data-cy="energy-contract-save"
      >
        <Text id="global.save" />
      </BigButton>
    ];
  }

  render(props, { leaveOpen, creatingMeter }) {
    const { step, selector, loadingContract, intl } = props;
    const error = this.getError();
    return (
      <FocusPage>
        <div class={kitStyle.page} data-cy="energy-contract-wizard-mobile">
          <SystemBackGuard dirty={props.isDirty()} onBack={this.openLeave} />
          <MobileNavBar
            title={
              <Text
                id={
                  selector
                    ? 'integration.energyMonitoring.contracts.editTitle'
                    : 'integration.energyMonitoring.contracts.createTitle'
                }
              />
            }
            onBack={this.onBack}
            backLabel={<Text id="integration.energyMonitoring.contracts.tab" />}
          />
          <div class={cx(kitStyle.content, kitStyle.contentWithBottomBar)}>
            {loadingContract && (
              <div class="dimmer active">
                <div class="loader" />
                <div class={cx('dimmer-content', style.loading)} />
              </div>
            )}
            {!loadingContract && (
              <div>
                <MobileSteps
                  current={step + 1}
                  total={WIZARD_STEPS.length}
                  label={<Text id={`integration.energyMonitoring.contracts.wizard.${WIZARD_STEPS[step]}`} />}
                />
                {step === STEP_METER && (
                  <MeterStep {...props} creatingMeter={creatingMeter} createMeter={this.createMeter} />
                )}
                {step === STEP_TEMPLATE && <TemplateStep {...props} />}
                {step === STEP_PARAMETERS && <ParametersStep {...props} />}
                {step === STEP_PREVIEW && <PreviewStep {...props} />}
              </div>
            )}
          </div>

          {!loadingContract && (
            <MobileBottomBar
              error={error && error.message}
              onCloseError={error && error.close}
              dataCy="energy-contract-bottom-bar"
            >
              {this.renderButtons()}
            </MobileBottomBar>
          )}

          <ConfirmSheet
            open={leaveOpen}
            title={get(intl.dictionary, 'integration.energyMonitoring.mobile.leaveTitle')}
            text={<Text id="integration.energyMonitoring.mobile.leaveText" />}
            confirmLabel={<Text id="mobileKit.leaveWithoutSaving" />}
            cancelLabel={<Text id="mobileKit.keepEditing" />}
            destructive
            onConfirm={this.leaveWithoutSaving}
            onCancel={this.closeLeave}
            dataCy="energy-contract-leave-confirm"
          />
        </div>
      </FocusPage>
    );
  }
}

export default MobileContractWizard;
