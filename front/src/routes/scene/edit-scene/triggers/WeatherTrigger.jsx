import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';

import { RequestStatus } from '../../../../utils/consts';
import { WEATHER_TRIGGER_FIELDS } from '../../../../../../server/utils/constants';

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

const UNIT_LABELS = {
  [WEATHER_TRIGGER_FIELDS.TEMPERATURE]: 'editScene.triggersCard.weather.unitTemperature',
  [WEATHER_TRIGGER_FIELDS.WIND_SPEED]: 'editScene.triggersCard.weather.unitWindSpeed',
  [WEATHER_TRIGGER_FIELDS.HUMIDITY]: 'editScene.triggersCard.weather.unitHumidity'
};

// the wind speed rule of the original request, so a freshly added trigger
// is already meaningful
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
      this.setState({ valueInput: String(DEFAULT_VALUE) });
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
    // an empty or unparseable input leaves no `value` at all on the trigger:
    // the scene stays saveable, and a rule without a value never matches
    this.props.updateTriggerProperty(this.props.index, 'value', Number.isNaN(value) ? undefined : value);
  };

  constructor(props) {
    super(props);
    const isFreshTrigger = !props.trigger.weather_field;
    const isCondition = props.trigger.weather_field === WEATHER_TRIGGER_FIELDS.CONDITION;
    let valueInput = '';
    if (isFreshTrigger) {
      valueInput = String(DEFAULT_VALUE);
    } else if (!isCondition && props.trigger.value !== undefined) {
      valueInput = String(props.trigger.value);
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

  render({ trigger }, { houses, valueInput }) {
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
                      <Text id={UNIT_LABELS[field]} />
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
