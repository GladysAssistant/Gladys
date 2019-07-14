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
    <div class="form-group">
      <div>
        <label>
          <Text id="dashboard.boxes.weather.editModeLabel" />
        </label>
      </div>
      <div>
        {GetWeatherModes.map(mode => {
          const label = 'dashboard.boxes.weather.displayModes.' + mode;
          return (
            <label>
              <input
                type="radio"
                name="mode"
                value={mode}
                checked={mode === props.box.mode}
                onChange={props.updateBoxMode}
              />
              &nbsp; <Text id={label} />
            </label>
          );
        })}
      </div>
    </div>
  </BaseEditBox>
);

@connect(
  'houses',
  actions
)
class EditWeatherBoxComponent extends Component {
  updateBoxHouse = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      house: e.target.value
    });
  };

  updateBoxMode = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      mode: e.target.value
    });
  };

  componentDidMount() {
    this.props.getHouses();
  }

  render(props, {}) {
    return <EditWeatherBox {...props} updateBoxHouse={this.updateBoxHouse} updateBoxMode={this.updateBoxMode} />;
  }
}

export default EditWeatherBoxComponent;
