import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import actions from '../../../actions/dashboard/edit-boxes/editWeather';
import BaseEditBox from '../baseEditBox';
import { GetWeatherModes } from '../../../utils/consts';

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
    <div className="form-group">
      <div>
        <label>
          <Text id="dashboard.boxes.weather.editModeLabel" />
        </label>
      </div>
      <div>
        {Object.keys(GetWeatherModes).map(key => {
          const mode = GetWeatherModes[key];
          const label = 'dashboard.boxes.weather.displayModes.' + mode;
          return (
            <label>
              <input
                type="checkbox"
                name={mode}
                checked={props.box.modes !== undefined && props.box.modes[mode]}
                onChange={props.updateBoxModes}
              />
              &nbsp; <Text id={label} />
            </label>
          );
        })}
      </div>
    </div>
  </BaseEditBox>
);

@connect('houses', actions)
class EditWeatherBoxComponent extends Component {
  updateBoxHouse = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      house: e.target.value
    });
  };

  updateBoxModes = e => {
    const modes = this.props.box.modes || {};
    modes[e.target.name] = e.target.checked;
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      modes
    });
  };

  componentDidMount() {
    this.props.getHouses();
  }

  render(props, {}) {
    return <EditWeatherBox {...props} updateBoxHouse={this.updateBoxHouse} updateBoxModes={this.updateBoxModes} />;
  }
}

export default EditWeatherBoxComponent;
