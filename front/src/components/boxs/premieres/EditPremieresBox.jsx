import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { connect } from 'unistore/preact';
import BaseEditBox from '../baseEditBox';
import actions from '../../../actions/dashboard/boxActions';

const DAYS_AHEAD_OPTIONS = [15, 30, 60];
const DEFAULT_DAYS_AHEAD = 30;
const REGION_LENGTH = 2;

const EditPremieresBox = ({ regionInput, updateDaysAhead, updateRegion, updateProvider, providers, ...props }) => (
  <BaseEditBox {...props} titleKey="dashboard.boxTitle.premieres">
    <Text id="dashboard.boxes.premieres.description" />
    <div class="form-group mt-3">
      <label>
        <Text id="dashboard.boxes.premieres.editProviderLabel" />
      </label>
      <select onChange={updateProvider} class="form-control">
        <option value="" selected={!props.box.provider}>
          <Text id="dashboard.boxes.premieres.providerAuto" />
        </option>
        {providers &&
          providers.map(provider => (
            <option selected={provider.service_name === props.box.provider} value={provider.service_name}>
              {provider.service_name === 'tmdb' ? (
                <Text id="dashboard.boxes.premieres.providerInternalTmdb" />
              ) : (
                provider.label || provider.service_name
              )}
            </option>
          ))}
      </select>
    </div>
    <div class="form-group">
      <label>
        <Text id="dashboard.boxes.premieres.daysAheadLabel" />
      </label>
      <select onChange={updateDaysAhead} class="form-control">
        {DAYS_AHEAD_OPTIONS.map(daysAhead => (
          <option
            key={daysAhead}
            value={daysAhead}
            selected={(props.box.days_ahead || DEFAULT_DAYS_AHEAD) === daysAhead}
          >
            <Text id={`dashboard.boxes.premieres.daysAhead${daysAhead}`} />
          </option>
        ))}
      </select>
    </div>
    <div class="form-group">
      <label>
        <Text id="dashboard.boxes.premieres.regionLabel" />
      </label>
      <Localizer>
        <input
          type="text"
          class="form-control"
          maxLength="2"
          placeholder={<Text id="dashboard.boxes.premieres.regionPlaceholder" />}
          value={regionInput}
          onInput={updateRegion}
        />
      </Localizer>
      <small class="form-text text-muted">
        <Text id="dashboard.boxes.premieres.regionHelp" />
      </small>
    </div>
  </BaseEditBox>
);

class EditPremieresBoxComponent extends Component {
  updateDaysAhead = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      days_ahead: Number(e.target.value)
    });
  };

  updateProvider = e => {
    // '' = automatic mode (first available provider, the default)
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      provider: e.target.value
    });
  };

  getProviders = async () => {
    try {
      const providers = await this.props.httpClient.get('/api/v1/premieres/provider');
      this.setState({ providers });
    } catch (e) {
      // without the list the select simply stays on automatic mode
      console.error(e);
    }
  };

  componentDidMount() {
    this.getProviders();
  }

  // Kept in local state, decoupled from box.premieres_region: the server schema
  // only accepts '' (automatic) or a full 2-letter code, so a single
  // mid-typed letter must never be persisted — but the field still has to
  // display what the user is typing before it reaches that state.
  updateRegion = e => {
    const region = e.target.value
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, REGION_LENGTH);
    this.setState({ regionInput: region });
    if (region.length === 0 || region.length === REGION_LENGTH) {
      this.props.updateBoxConfig(this.props.x, this.props.y, {
        premieres_region: region
      });
    }
  };

  constructor(props) {
    super(props);
    this.state = { regionInput: props.box.premieres_region || '' };
  }

  render(props, { regionInput, providers }) {
    return (
      <EditPremieresBox
        {...props}
        regionInput={regionInput}
        providers={providers}
        updateDaysAhead={this.updateDaysAhead}
        updateRegion={this.updateRegion}
        updateProvider={this.updateProvider}
      />
    );
  }
}

export default connect('httpClient', actions)(EditPremieresBoxComponent);
