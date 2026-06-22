import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import BaseEditBox from '../baseEditBox';
import actions from '../../../actions/dashboard/boxActions';
import { GetWeatherModes } from '../../../utils/consts';

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
      <label>
        <Text id="dashboard.boxes.weatherMeteoFrance.editDeptLabel" />
      </label>
      <Localizer>
        <input
          type="text"
          class="form-control"
          placeholder={<Text id="dashboard.boxes.weatherMeteoFrance.editDeptPlaceholder" />}
          value={props.box.dept || ''}
          onInput={props.updateBoxDept}
          maxLength={3}
        />
      </Localizer>
      <small class="form-text text-muted">
        <Text id="dashboard.boxes.weatherMeteoFrance.editDeptHelp" />
      </small>
    </div>

    <div class="form-group">
      <label>
        <Text id="dashboard.boxes.weather.editModeLabel" />
      </label>
      <div>
        {Object.keys(GetWeatherModes).map(key => {
          const mode = GetWeatherModes[key];
          const label = `dashboard.boxes.weather.displayModes.${mode}`;
          return (
            <div class="form-check">
              <input
                type="checkbox"
                class="form-check-input"
                name={mode}
                checked={props.box.modes !== undefined && props.box.modes[mode]}
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

  updateBoxDept = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      dept: e.target.value
    });
  };

  updateBoxModes = e => {
    const modes = this.props.box.modes || {};
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
        updateBoxDept={this.updateBoxDept}
        updateBoxModes={this.updateBoxModes}
      />
    );
  }
}

export default connect('httpClient', actions)(EditWeatherMeteoFranceBoxComponent);
