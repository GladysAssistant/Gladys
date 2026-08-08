import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import BaseEditBox from '../baseEditBox';
import actions from '../../../actions/dashboard/boxActions';
import { GetWeatherModes, DEFAULT_ON_WEATHER_MODES } from '../../../utils/consts';

const EditWeatherBox = ({ children, ...props }) => (
  <BaseEditBox {...props} titleKey="dashboard.boxTitle.weather">
    <div class="form-group">
      <label>
        <Text id="dashboard.boxes.weather.editHouseLabel" />
      </label>
      <select onChange={props.updateBoxHouse} class="form-control">
        <option>
          <Text id="global.emptySelectOption" />
        </option>
        {props.houses &&
          props.houses.map(house => (
            <option selected={house.selector === props.box.house} value={house.selector}>
              {house.name}
            </option>
          ))}
      </select>
    </div>
    <div class="form-group">
      <label>
        <Text id="dashboard.boxes.weather.editProviderLabel" />
      </label>
      <select onChange={props.updateBoxProvider} class="form-control">
        <option value="" selected={!props.box.provider}>
          <Text id="dashboard.boxes.weather.providerAuto" />
        </option>
        {props.providers &&
          props.providers.map(provider => (
            <option selected={provider.service_name === props.box.provider} value={provider.service_name}>
              {provider.service_name === 'openweather' ? (
                <Text id="dashboard.boxes.weather.providerInternalOpenWeather" />
              ) : (
                provider.label || provider.service_name
              )}
            </option>
          ))}
      </select>
    </div>
    <div className="form-group">
      <div>
        <label>
          <Text id="dashboard.boxes.weather.editModeLabel" />
        </label>
      </div>
      <div>
        {Object.keys(GetWeatherModes).map(key => {
          const mode = GetWeatherModes[key];
          const label = `dashboard.boxes.weather.displayModes.${mode}`;
          const modes = props.box.modes || {};
          // modes on by default stay checked until explicitly unchecked,
          // so widgets saved before they existed keep their current look
          const checked = DEFAULT_ON_WEATHER_MODES.includes(mode) ? modes[mode] !== false : Boolean(modes[mode]);
          return (
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                name={mode}
                checked={checked}
                onChange={props.updateBoxModes}
              />
              <label className="form-check-label">
                <Text id={label} />
              </label>
            </div>
          );
        })}
      </div>
    </div>
  </BaseEditBox>
);

class EditWeatherBoxComponent extends Component {
  updateBoxHouse = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      house: e.target.value
    });
  };

  updateBoxModes = e => {
    // clone the modes object: mutating it in place would prevent
    // componentDidUpdate from detecting the change in the widget
    const modes = { ...(this.props.box.modes || {}) };
    modes[e.target.name] = e.target.checked;
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      modes
    });
  };

  updateBoxProvider = e => {
    // '' = automatic mode (first available provider, the default)
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      provider: e.target.value
    });
  };

  getProviders = async () => {
    try {
      const providers = await this.props.httpClient.get('/api/v1/weather/provider');
      this.setState({ providers });
    } catch (e) {
      // without the list the select simply stays on automatic mode
      console.error(e);
    }
  };

  getHouses = async () => {
    try {
      await this.setState({
        error: false,
        pending: true
      });
      const houses = await this.props.httpClient.get('/api/v1/house');
      this.setState({
        houses,
        pending: false
      });
    } catch (e) {
      console.error(e);
      this.setState({
        error: true,
        pending: false
      });
    }
  };

  componentDidMount() {
    this.getHouses();
    this.getProviders();
  }

  render(props, { houses, providers }) {
    return (
      <EditWeatherBox
        {...props}
        houses={houses}
        providers={providers}
        updateBoxHouse={this.updateBoxHouse}
        updateBoxModes={this.updateBoxModes}
        updateBoxProvider={this.updateBoxProvider}
      />
    );
  }
}

export default connect('httpClient', actions)(EditWeatherBoxComponent);
