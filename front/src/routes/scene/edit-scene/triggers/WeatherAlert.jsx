import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';

import { RequestStatus } from '../../../../utils/consts';
import { EVENTS } from '../../../../../../server/utils/constants';

// the generic alert phenomenon types of the weather pivot format (B.18)
const WEATHER_ALERT_TYPES = [
  'wind',
  'rain',
  'flood',
  'thunderstorm',
  'snow',
  'heat',
  'cold',
  'avalanche',
  'coastal',
  'fog'
];

const WEATHER_ALERT_SEVERITIES = ['minor', 'moderate', 'severe', 'extreme'];

class WeatherAlert extends Component {
  getHouses = async () => {
    this.setState({
      SceneGetHouses: RequestStatus.Getting
    });
    try {
      const houses = await this.props.httpClient.get('/api/v1/house');
      this.setState({
        houses,
        SceneGetHouses: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        SceneGetHouses: RequestStatus.Error
      });
    }
  };

  onHouseChange = e => {
    this.props.updateTriggerProperty(this.props.index, 'house', e.target.value);
  };

  onTypeChange = e => {
    this.props.updateTriggerProperty(this.props.index, 'weather_alert_type', e.target.value);
  };

  onSeverityChange = e => {
    this.props.updateTriggerProperty(this.props.index, 'weather_alert_severity', e.target.value);
  };

  constructor(props) {
    super(props);
    this.state = {
      houses: []
    };
  }

  componentDidMount() {
    this.getHouses();
    // defaults, so a freshly added trigger is valid without touching the selects
    if (!this.props.trigger.weather_alert_type) {
      this.props.updateTriggerProperty(this.props.index, 'weather_alert_type', 'any');
    }
    if (!this.props.trigger.weather_alert_severity) {
      this.props.updateTriggerProperty(this.props.index, 'weather_alert_severity', 'minor');
    }
  }

  render({}, { houses }) {
    return (
      <div>
        <p>
          {this.props.trigger.type === EVENTS.WEATHER.ALERT_RAISED && (
            <Text id="editScene.triggersCard.weatherAlert.alertRaisedDescription" />
          )}
          {this.props.trigger.type === EVENTS.WEATHER.ALERT_ENDED && (
            <Text id="editScene.triggersCard.weatherAlert.alertEndedDescription" />
          )}
        </p>
        <div className="form-group">
          <div className="form-label">
            <Text id="editScene.triggersCard.weatherAlert.houseLabel" />
          </div>
          <select onChange={this.onHouseChange} className="form-control">
            <option value="">
              <Text id="global.emptySelectOption" />
            </option>
            {houses &&
              houses.map(house => (
                <option selected={house.selector === this.props.trigger.house} value={house.selector}>
                  {house.name}
                </option>
              ))}
          </select>
        </div>
        <div className="form-group">
          <div className="form-label">
            <Text id="editScene.triggersCard.weatherAlert.typeLabel" />
          </div>
          <select onChange={this.onTypeChange} className="form-control">
            <option selected={(this.props.trigger.weather_alert_type || 'any') === 'any'} value="any">
              <Text id="editScene.triggersCard.weatherAlert.anyType" />
            </option>
            {WEATHER_ALERT_TYPES.map(type => (
              <option selected={type === this.props.trigger.weather_alert_type} value={type}>
                <Text id={`dashboard.boxes.weather.alertTypes.${type}`} />
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <div className="form-label">
            <Text id="editScene.triggersCard.weatherAlert.severityLabel" />
          </div>
          <select onChange={this.onSeverityChange} className="form-control">
            {WEATHER_ALERT_SEVERITIES.map(severity => (
              <option selected={severity === (this.props.trigger.weather_alert_severity || 'minor')} value={severity}>
                <Text id={`editScene.triggersCard.weatherAlert.severities.${severity}`} />
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }
}

export default connect('httpClient,user', {})(WeatherAlert);
