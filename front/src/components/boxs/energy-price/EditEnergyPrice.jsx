import { Component } from 'preact';
import { Localizer, Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import { Link } from 'preact-router/match';

import BaseEditBox from '../baseEditBox';
import EnergyPrice, { CONTRACTS_PAGE } from './EnergyPrice';
import ElectricMeterSelect from '../../energy-contract/ElectricMeterSelect';
import { getElectricMeters, getMeterSelectorOfContract } from '../../energy-contract/electricMeters';

// The box targets a meter, not a contract (docs/specs/energy-contracts.md 8.2):
// it shows the price of the contract active on that meter, the main meter when
// none is picked, so a tariff change needs no reconfiguration
class EditEnergyPrice extends Component {
  state = {
    loading: true,
    error: false,
    contracts: []
  };

  getContracts = async () => {
    try {
      this.setState({ loading: true, error: false });
      const contracts = await this.props.httpClient.get('/api/v1/energy_contract');
      this.setState({ contracts, loading: false });
      this.normalizeLegacyContract(contracts);
    } catch (e) {
      console.error(e);
      this.setState({ loading: false, error: true });
    }
  };

  // A box saved before the meter targeting names a contract: it is read as the
  // meter of that contract, and saved as that meter from now on
  normalizeLegacyContract = contracts => {
    const { box } = this.props;
    if (box.electric_meter || !box.energy_contract) {
      return;
    }
    const meterSelector = getMeterSelectorOfContract(contracts, box.energy_contract);
    if (meterSelector) {
      this.props.updateBoxConfig(this.props.x, this.props.y, {
        electric_meter: meterSelector,
        energy_contract: undefined
      });
    }
  };

  updateBoxName = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      name: e.target.value
    });
  };

  // an empty value is the main meter: the box then stores no meter
  updateMeter = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      electric_meter: e.target.value || undefined,
      energy_contract: undefined
    });
  };

  componentDidMount() {
    this.getContracts();
  }

  render(props, { loading, error, contracts }) {
    const { meters, mainMeter } = getElectricMeters(contracts);
    return (
      <BaseEditBox {...props} titleKey="dashboard.boxTitle.energy-price">
        <div class="form-group">
          <label>
            <Text id="dashboard.boxes.energyPrice.editName" />
          </label>
          <Localizer>
            <input
              type="text"
              value={props.box.name}
              onInput={this.updateBoxName}
              class="form-control"
              placeholder={<Text id="dashboard.boxes.energyPrice.editNamePlaceholder" />}
            />
          </Localizer>
        </div>
        <div class="form-group">
          <label>
            <Text id="dashboard.boxes.energyPrice.editMeter" />
          </label>
          {loading && (
            <div class="text-center">
              <div class="spinner-border" role="status">
                <span class="sr-only">
                  <Text id="global.loading" />
                </span>
              </div>
            </div>
          )}
          {!loading && error && (
            <div class="alert alert-danger">
              <Text id="dashboard.boxes.energyPrice.error" />
            </div>
          )}
          {!loading && !error && meters.length === 0 && (
            <div class="alert alert-secondary">
              <Text id="dashboard.boxes.energyPrice.noContract" />{' '}
              <Link href={CONTRACTS_PAGE}>
                <Text id="dashboard.boxes.energyPrice.noContractLink" />
              </Link>
            </div>
          )}
          {!loading && !error && meters.length > 0 && (
            <div>
              <ElectricMeterSelect
                meters={meters}
                mainMeter={mainMeter}
                value={props.box.electric_meter}
                onChange={this.updateMeter}
                emptyOption="main"
                legacyContract={props.box.energy_contract}
              />
              <small class="form-text text-muted">
                <Text id="dashboard.boxes.energyPrice.editMeterHelp" />
              </small>
            </div>
          )}
        </div>
        {!loading && !error && meters.length > 0 && (
          <div class="form-group">
            <label>
              <Text id="global.preview" />
            </label>
            <EnergyPrice {...props} />
          </div>
        )}
      </BaseEditBox>
    );
  }
}

export default connect('httpClient', {})(EditEnergyPrice);
