import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import actions from '../../../actions/dashboard/edit-boxes/editWeather';
import BaseEditBox from '../baseEditBox';

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
  componentDidMount() {
    this.props.getHouses();
  }

  render(props, {}) {
    return <EditWeatherBox {...props} updateBoxHouse={this.updateBoxHouse} />;
  }
}

export default EditWeatherBoxComponent;
