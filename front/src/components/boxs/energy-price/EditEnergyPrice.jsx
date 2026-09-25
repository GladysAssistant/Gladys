import { Component } from 'preact';
import { Localizer, Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import { Link } from 'preact-router/match';

import BaseEditBox from '../baseEditBox';
import EnergyPrice from './EnergyPrice';

const CONTRACTS_PAGE = '/dashboard/integration/device/energy-monitoring/contracts';

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
    } catch (e) {
      console.error(e);
      this.setState({ loading: false, error: true });
    }
  };

  updateBoxName = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      name: e.target.value
    });
  };

  updateContract = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      energy_contract: e.target.value
    });
  };

  componentDidMount() {
    this.getContracts();
  }

  render(props, { loading, error, contracts }) {
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
            <Text id="dashboard.boxes.energyPrice.editContract" />
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
          {!loading && !error && contracts.length === 0 && (
            <div class="alert alert-secondary">
              <Text id="dashboard.boxes.energyPrice.noContract" />{' '}
              <Link href={CONTRACTS_PAGE}>
                <Text id="dashboard.boxes.energyPrice.noContractLink" />
              </Link>
            </div>
          )}
          {!loading && !error && contracts.length > 0 && (
            <select class="form-control" value={props.box.energy_contract || ''} onChange={this.updateContract}>
              <option value="" disabled>
                ---------------
              </option>
              {contracts.map(contract => (
                <option key={contract.selector} value={contract.selector}>
                  {contract.name} ({contract.status})
                </option>
              ))}
            </select>
          )}
        </div>
        {props.box.energy_contract && (
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
