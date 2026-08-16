import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';

import { RequestStatus } from '../../../../utils/consts';
import {
  WEATHER_TRIGGER_FIELDS,
  DEVICE_FEATURE_UNITS,
  MEASUREMENT_UNITS
} from '../../../../../../server/utils/constants';
import { celsiusToFahrenheit, fahrenheitToCelsius } from '../../../../../../server/utils/units';

// the generic condition enum of the weather pivot format (B.18). 'night'
// and 'unknown' are left out on purpose: they are not weather situations
// a user would build a scene on.
const WEATHER_CONDITIONS = [
  'clear',
  'partly-cloudy',
  'cloud',
  'fog',
  'drizzle',
  'rain',
  'pouring',
  'sleet',
  'hail',
  'snow',
  'thunderstorm',
  'wind'
];

const NUMERIC_OPERATORS = ['>', '>=', '<', '<=', '=', '!='];
const CONDITION_OPERATORS = ['=', '!='];

const OPERATOR_LABELS = {
  '=': 'editScene.triggersCard.newState.equal',
  '>': 'editScene.triggersCard.newState.superior',
  '>=': 'editScene.triggersCard.newState.superiorOrEqual',
  '<': 'editScene.triggersCard.newState.less',
  '<=': 'editScene.triggersCard.newState.lessOrEqual',
  '!=': 'editScene.triggersCard.newState.different'
};

// the core polls the provider in metric and compares in °C / km/h / %, so
// a trigger always *stores* a metric value. The editor displays and reads
// it in the unit system of the user (same preferences as the weather
// widget and EditRoomTemperatureBox), otherwise a user on Fahrenheit would
// copy a threshold from their dashboard and save a rule meaning something
// else.
const KM_PER_MILE = 1.60934;

const isImperialTemperature = user => !!user && user.temperature_unit_preference === DEVICE_FEATURE_UNITS.FAHRENHEIT;
const isImperialWindSpeed = user => !!user && user.distance_unit_preference === MEASUREMENT_UNITS.US;

const roundValue = value => Math.round(value * 10) / 10;

const toDisplayValue = (value, field, user) => {
  if (typeof value !== 'number') {
    return value;
  }
  if (field === WEATHER_TRIGGER_FIELDS.TEMPERATURE && isImperialTemperature(user)) {
    return roundValue(celsiusToFahrenheit(value));
  }
  if (field === WEATHER_TRIGGER_FIELDS.WIND_SPEED && isImperialWindSpeed(user)) {
    return roundValue(value / KM_PER_MILE);
  }
  return value;
};

const toStoredValue = (value, field, user) => {
  if (field === WEATHER_TRIGGER_FIELDS.TEMPERATURE && isImperialTemperature(user)) {
    return fahrenheitToCelsius(value);
  }
  if (field === WEATHER_TRIGGER_FIELDS.WIND_SPEED && isImperialWindSpeed(user)) {
    return value * KM_PER_MILE;
  }
  return value;
};

const getUnitLabel = (field, user) => {
  if (field === WEATHER_TRIGGER_FIELDS.TEMPERATURE) {
    return isImperialTemperature(user)
      ? 'editScene.triggersCard.weather.unitTemperatureImperial'
      : 'editScene.triggersCard.weather.unitTemperature';
  }
  if (field === WEATHER_TRIGGER_FIELDS.WIND_SPEED) {
    return isImperialWindSpeed(user)
      ? 'editScene.triggersCard.weather.unitWindSpeedImperial'
      : 'editScene.triggersCard.weather.unitWindSpeed';
  }
  return 'editScene.triggersCard.weather.unitHumidity';
};

// the wind speed rule of the original request, so a freshly added trigger
// is already meaningful. Metric, like every stored value: an imperial user
// sees it converted (20 km/h -> 12.4 mph)
const DEFAULT_FIELD = WEATHER_TRIGGER_FIELDS.WIND_SPEED;
const DEFAULT_OPERATOR = '>';
const DEFAULT_VALUE = 20;

class WeatherTrigger extends Component {
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

  onFieldChange = e => {
    const field = e.target.value;
    this.props.updateTriggerProperty(this.props.index, 'weather_field', field);
    // the operator and the value vocabularies differ between a condition
    // (a string of the pivot enum) and a measure (a number): switching
    // field resets both, so the trigger is never left in a mixed state
    if (field === WEATHER_TRIGGER_FIELDS.CONDITION) {
      this.props.updateTriggerProperty(this.props.index, 'operator', '=');
      this.props.updateTriggerProperty(this.props.index, 'value', WEATHER_CONDITIONS[0]);
    } else {
      this.setState({ valueInput: String(toDisplayValue(DEFAULT_VALUE, field, this.props.user)) });
      this.props.updateTriggerProperty(this.props.index, 'operator', DEFAULT_OPERATOR);
      this.props.updateTriggerProperty(this.props.index, 'value', DEFAULT_VALUE);
    }
  };

  onOperatorChange = e => {
    this.props.updateTriggerProperty(this.props.index, 'operator', e.target.value);
  };

  onConditionChange = e => {
    this.props.updateTriggerProperty(this.props.index, 'value', e.target.value);
  };

  onValueChange = e => {
    const raw = e.target.value;
    this.setState({ valueInput: raw });
    const value = parseFloat(raw.replace(',', '.'));
    const field = this.props.trigger.weather_field || DEFAULT_FIELD;
    // an empty or unparseable input leaves no `value` at all on the trigger:
    // the scene stays saveable, and a rule without a value never matches.
    // What the user types is in their own unit system, what is stored is
    // metric
    this.props.updateTriggerProperty(
      this.props.index,
      'value',
      Number.isNaN(value) ? undefined : toStoredValue(value, field, this.props.user)
    );
  };

  constructor(props) {
    super(props);
    const isFreshTrigger = !props.trigger.weather_field;
    const isCondition = props.trigger.weather_field === WEATHER_TRIGGER_FIELDS.CONDITION;
    let valueInput = '';
    if (isFreshTrigger) {
      valueInput = String(toDisplayValue(DEFAULT_VALUE, DEFAULT_FIELD, props.user));
    } else if (!isCondition && props.trigger.value !== undefined) {
      valueInput = String(toDisplayValue(props.trigger.value, props.trigger.weather_field, props.user));
    }
    this.state = {
      houses: [],
      valueInput
    };
  }

  componentDidMount() {
    this.getHouses();
    // defaults, so a freshly added trigger is valid without touching the selects
    if (!this.props.trigger.weather_field) {
      this.props.updateTriggerProperty(this.props.index, 'weather_field', DEFAULT_FIELD);
      this.props.updateTriggerProperty(this.props.index, 'operator', DEFAULT_OPERATOR);
      this.props.updateTriggerProperty(this.props.index, 'value', DEFAULT_VALUE);
    }
  }

  render({ trigger, user }, { houses, valueInput }) {
    const field = trigger.weather_field || DEFAULT_FIELD;
    const isCondition = field === WEATHER_TRIGGER_FIELDS.CONDITION;
    const operators = isCondition ? CONDITION_OPERATORS : NUMERIC_OPERATORS;
    return (
      <div>
        <p>
          <Text id="editScene.triggersCard.weather.description" />
        </p>
        <div className="form-group">
          <div className="form-label">
            <Text id="editScene.triggersCard.weather.houseLabel" />
          </div>
          <select onChange={this.onHouseChange} className="form-control">
            <option value="">
              <Text id="global.emptySelectOption" />
            </option>
            {houses &&
              houses.map(house => (
                <option selected={house.selector === trigger.house} value={house.selector}>
                  {house.name}
                </option>
              ))}
          </select>
        </div>
        <div className="form-group">
          <div className="form-label">
            <Text id="editScene.triggersCard.weather.fieldLabel" />
          </div>
          <select onChange={this.onFieldChange} className="form-control">
            {Object.values(WEATHER_TRIGGER_FIELDS).map(weatherField => (
              <option selected={weatherField === field} value={weatherField}>
                <Text id={`editScene.triggersCard.weather.fields.${weatherField}`} />
              </option>
            ))}
          </select>
        </div>
        <div className="row">
          <div className="col-md-6">
            <div className="form-group">
              <div className="form-label">
                <Text id="editScene.triggersCard.weather.operatorLabel" />
              </div>
              <select onChange={this.onOperatorChange} className="form-control">
                {operators.map(operator => (
                  <option selected={operator === trigger.operator} value={operator}>
                    <Text id={OPERATOR_LABELS[operator]} />
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-group">
              <div className="form-label">
                <Text id="editScene.triggersCard.weather.valueLabel" />
              </div>
              {isCondition ? (
                <select onChange={this.onConditionChange} className="form-control">
                  {WEATHER_CONDITIONS.map(condition => (
                    <option selected={condition === trigger.value} value={condition}>
                      <Text id={`dashboard.boxes.weather.conditions.${condition}`} />
                    </option>
                  ))}
                </select>
              ) : (
                <div className="input-group">
                  <input type="text" className="form-control" value={valueInput} onInput={this.onValueChange} />
                  <span className="input-group-append">
                    <span className="input-group-text">
                      <Text id={getUnitLabel(field, user)} />
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient,user', {})(WeatherTrigger);
