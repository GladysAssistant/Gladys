import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import get from 'get-value';

import { RequestStatus } from '../../../../utils/consts';
import withIntlAsProp from '../../../../utils/withIntlAsProp';

const VARIABLE_NAMES = ['description', 'temp_min', 'temp_max', 'rain', 'uv', 'summary'];
const DAYS_OPTIONS = [1, 2, 3, 4, 5];

class MeteoFranceGetForecastParams extends Component {
  getHouses = async () => {
    this.setState({
      sceneGetHouses: RequestStatus.Getting
    });
    try {
      const houses = await this.props.httpClient.get('/api/v1/house');
      this.setState({
        houses,
        sceneGetHouses: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        sceneGetHouses: RequestStatus.Error
      });
    }
  };

  onHouseChange = e => {
    this.props.updateActionProperty(this.props.path, 'house', e.target.value);
  };

  onDaysChange = e => {
    this.props.updateActionProperty(this.props.path, 'days', parseInt(e.target.value, 10));
  };

  setVariables = () => {
    this.props.setVariables(
      this.props.path,
      VARIABLE_NAMES.map(name => ({
        name,
        ready: true,
        label: get(this.props.intl.dictionary, `editScene.variables.meteofrance.get-forecast.${name}`, {
          default: name
        })
      }))
    );
  };

  constructor(props) {
    super(props);
    this.state = {
      houses: []
    };
  }

  componentDidMount() {
    this.getHouses();
    this.setVariables();
    // Default summary length: today only
    if (!this.props.action.days) {
      this.props.updateActionProperty(this.props.path, 'days', 1);
    }
  }

  render({ action }, { houses }) {
    return (
      <div>
        <p>
          <Text id="editScene.actionsCard.meteoFranceGetForecast.description" />
        </p>
        <div className="form-group">
          <div className="form-label">
            <Text id="editScene.actionsCard.meteoFranceGetForecast.houseLabel" />
          </div>
          <select onChange={this.onHouseChange} className="form-control">
            <option value="">
              <Text id="global.emptySelectOption" />
            </option>
            {houses &&
              houses.map(house => (
                <option selected={house.selector === action.house} value={house.selector}>
                  {house.name}
                </option>
              ))}
          </select>
        </div>
        <div className="form-group">
          <div className="form-label">
            <Text id="editScene.actionsCard.meteoFranceGetForecast.daysLabel" />
          </div>
          <select onChange={this.onDaysChange} className="form-control">
            {DAYS_OPTIONS.map(days => (
              <option selected={(action.days || 1) === days} value={days}>
                <Text id={`editScene.actionsCard.meteoFranceGetForecast.daysOptions.${days}`} />
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }
}

export default withIntlAsProp(connect('httpClient', {})(MeteoFranceGetForecastParams));
