import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import { MobileSectionHeader, MobileGroup, MobileRow, MobileNotice, ConfirmSheet } from '../../../../components/mobile';
import CalendarsSection from './contracts/Calendars';
import style from './mobile.css';

// The two recalculations of the Settings tab: what starts them, and how they are told
const CALCULATIONS = {
  consumption: {
    icon: 'activity',
    titleId: 'integration.energyMonitoring.calculateConsumptionFromIndexFromBeginning',
    descriptionId: 'integration.energyMonitoring.calculateConsumptionFromIndexDescription',
    errorId: 'integration.energyMonitoring.calculateConsumptionFromBeginningError',
    dataCy: 'energy-calculate-consumption'
  },
  cost: {
    icon: 'dollar-sign',
    titleId: 'integration.energyMonitoring.calculateCostFromBeginning',
    descriptionId: 'integration.energyMonitoring.calculateCostFromBeginningDescription',
    errorId: 'integration.energyMonitoring.calculateFromBeginningError',
    dataCy: 'energy-calculate-cost'
  }
};

/**
 * @description The Settings tab on a phone (docs/specs/mobile-pages/energy.md, E): the two
 * recalculations as rows — each one explained and confirmed in a sheet before it starts, since
 * it reprices the whole history — then the tariff calendars. A presentation only: the requests
 * are the ones of EnergyMonitoring.jsx.
 */
class MobileEnergySettings extends Component {
  state = {
    // the calculation of the confirmation sheet: kept while the sheet slides out
    calculation: 'consumption',
    confirmOpen: false
  };

  componentWillUnmount() {
    this.unmounted = true;
  }

  ask = calculation => () => this.setState({ calculation, confirmOpen: true });
  closeConfirm = () => this.setState({ confirmOpen: false });

  // a calculation that starts leaves for the background jobs; one that fails comes back here,
  // where its error is shown
  start = async () => {
    if (this.state.calculation === 'consumption') {
      await this.props.calculateConsumptionFromIndexFromBeginning();
    } else {
      await this.props.calculateFromBeginning();
    }
    if (!this.unmounted) {
      this.setState({ confirmOpen: false });
    }
  };

  render(props, { calculation, confirmOpen }) {
    const { intl } = props;
    const errors = {
      consumption: props.consumptionSettingsError,
      cost: props.settingsError
    };
    const starting = props.calculatingFromBeginning || props.calculatingConsumptionFromBeginning;
    const current = CALCULATIONS[calculation];
    return (
      <div class={cx(style.list, style.listNoFab)} data-cy="energy-settings-mobile">
        <MobileSectionHeader title={<Text id="integration.energyMonitoring.mobile.recalculations" />} />
        {Object.keys(CALCULATIONS).map(
          key =>
            errors[key] && (
              <MobileNotice key={key} tone="danger" icon="alert-circle">
                <Text id={CALCULATIONS[key].errorId} />
              </MobileNotice>
            )
        )}
        <MobileGroup>
          {Object.keys(CALCULATIONS).map(key => (
            <MobileRow
              key={key}
              icon={CALCULATIONS[key].icon}
              title={<Text id={CALCULATIONS[key].titleId} />}
              onClick={this.ask(key)}
              disabled={starting}
              dataCy={CALCULATIONS[key].dataCy}
            />
          ))}
        </MobileGroup>

        <CalendarsSection httpClient={props.httpClient} />

        <ConfirmSheet
          open={confirmOpen}
          title={get(intl.dictionary, current.titleId)}
          text={<Text id={current.descriptionId} />}
          confirmLabel={<Text id="integration.energyMonitoring.mobile.startCalculation" />}
          loading={starting}
          onConfirm={this.start}
          onCancel={this.closeConfirm}
          dataCy="energy-calculate-confirm"
        />
      </div>
    );
  }
}

export default MobileEnergySettings;
