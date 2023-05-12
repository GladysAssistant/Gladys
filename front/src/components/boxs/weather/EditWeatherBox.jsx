import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import BaseEditBox from '../baseEditBox';
import actions from '../../../actions/dashboard/boxActions';
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
          const label = `dashboard.boxes.weather.displayModes.${mode}`;
          return (
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                name={mode}
                checked={props.box.modes !== undefined && props.box.modes[mode]}
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
    const modes = this.props.box.modes || {};
    modes[e.target.name] = e.target.checked;
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      modes
    });
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
  }

  render(props, { houses }) {
    return (
      <EditWeatherBox
        {...props}
        houses={houses}
        updateBoxHouse={this.updateBoxHouse}
        updateBoxModes={this.updateBoxModes}
      />
    );
  }
}

export default connect('httpClient', actions)(EditWeatherBoxComponent);
