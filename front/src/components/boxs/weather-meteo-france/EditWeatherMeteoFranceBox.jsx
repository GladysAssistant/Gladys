import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import BaseEditBox from '../baseEditBox';
import actions from '../../../actions/dashboard/boxActions';
import { GetWeatherModes } from '../../../utils/consts';

// Widget-specific display modes, not part of the shared GetWeatherModes
const CURRENT_WEATHER_MODE = 'currentWeather';
const DATE_LOCATION_MODE = 'dateLocation';
const VIGILANCE_MAP_MODE = 'vigilanceMap';

// Modes enabled by default for widgets saved before they existed
const DEFAULT_ON_MODES = [DATE_LOCATION_MODE, CURRENT_WEATHER_MODE];

const DISPLAY_MODES = [
  DATE_LOCATION_MODE,
  CURRENT_WEATHER_MODE,
  GetWeatherModes.AdvancedWeather,
  GetWeatherModes.HourlyForecast,
  GetWeatherModes.DailyForecast,
  VIGILANCE_MAP_MODE
];

const EditWeatherMeteoFranceBox = ({ children, ...props }) => (
  <BaseEditBox {...props} titleKey="dashboard.boxTitle.weather-meteo-france">
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
      <div class="form-check">
        <input
          type="checkbox"
          class="form-check-input"
          checked={props.box.vigilance}
          onChange={props.updateBoxVigilance}
        />
        <label class="form-check-label">
          <Text id="dashboard.boxes.weatherMeteoFrance.editVigilanceLabel" />
        </label>
      </div>
      <small class="form-text text-muted">
        <Text id="dashboard.boxes.weatherMeteoFrance.editVigilanceHelp" />
      </small>
    </div>

    <div class="form-group">
      <label>
        <Text id="dashboard.boxes.weather.editModeLabel" />
      </label>
      <div>
        {DISPLAY_MODES.map(mode => {
          const label = `dashboard.boxes.weatherMeteoFrance.displayModes.${mode}`;
          const modes = props.box.modes || {};
          const checked = DEFAULT_ON_MODES.includes(mode) ? modes[mode] !== false : Boolean(modes[mode]);
          return (
            <div class="form-check">
              <input
                type="checkbox"
                class="form-check-input"
                name={mode}
                checked={checked}
                onChange={props.updateBoxModes}
              />
              <label class="form-check-label">
                <Text id={label} />
              </label>
            </div>
          );
        })}
      </div>
    </div>
  </BaseEditBox>
);

class EditWeatherMeteoFranceBoxComponent extends Component {
  updateBoxHouse = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      house: e.target.value
    });
  };

  updateBoxVigilance = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      vigilance: e.target.checked
    });
  };

  updateBoxModes = e => {
    // Clone the modes object: mutating it in place would prevent
    // componentDidUpdate from detecting the change in the widget
    const modes = { ...(this.props.box.modes || {}) };
    modes[e.target.name] = e.target.checked;
    this.props.updateBoxConfig(this.props.x, this.props.y, { modes });
  };

  getHouses = async () => {
    try {
      await this.setState({ error: false, pending: true });
      const houses = await this.props.httpClient.get('/api/v1/house');
      this.setState({ houses, pending: false });
    } catch (e) {
      console.error(e);
      this.setState({ error: true, pending: false });
    }
  };

  componentDidMount() {
    this.getHouses();
  }

  render(props, { houses }) {
    return (
      <EditWeatherMeteoFranceBox
        {...props}
        houses={houses}
        updateBoxHouse={this.updateBoxHouse}
        updateBoxVigilance={this.updateBoxVigilance}
        updateBoxModes={this.updateBoxModes}
      />
    );
  }
}

export default connect('httpClient', actions)(EditWeatherMeteoFranceBoxComponent);
