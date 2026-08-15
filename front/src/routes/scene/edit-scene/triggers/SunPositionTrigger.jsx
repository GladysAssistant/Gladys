import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';

import { RequestStatus } from '../../../../utils/consts';

const SUN_POSITION_OPERATORS = ['>', '<', '='];

class SunPositionTrigger extends Component {
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

  onAltitudeOperatorChange = e => {
    this.props.updateTriggerProperty(this.props.index, 'sun_altitude_operator', e.target.value);
  };

  onAzimuthOperatorChange = e => {
    this.props.updateTriggerProperty(this.props.index, 'sun_azimuth_operator', e.target.value);
  };

  onAltitudeChange = e => {
    this.props.updateTriggerProperty(this.props.index, 'sun_altitude', this.parseDegree(e.target.value));
  };

  onAzimuthChange = e => {
    this.props.updateTriggerProperty(this.props.index, 'sun_azimuth', this.parseDegree(e.target.value));
  };

  // An empty input is saved as null, so that the trigger stays valid while the
  // user is typing, and the condition is simply not checked.
  parseDegree = value => {
    const degree = parseFloat(value);
    return Number.isFinite(degree) ? degree : null;
  };

  houseIsValid(houseSelector) {
    const { houses } = this.state;
    let houseValid = false;
    if (houseSelector === undefined || houseSelector === '') {
      houseValid = true;
    } else if (houses) {
      const selectedHouse = houses.find(house => house.selector === houseSelector);
      if (selectedHouse !== undefined) {
        houseValid = selectedHouse.latitude && selectedHouse.longitude;
      }
    }
    this.setState({ houseValid });
  }

  constructor(props) {
    super(props);
    this.state = {
      houses: [],
      houseValid: true
    };
  }

  componentDidMount() {
    this.getHouses();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.houses !== this.state.houses || prevProps.trigger.house !== this.props.trigger.house) {
      this.houseIsValid(this.props.trigger.house);
    }
  }

  render({ trigger }, { houses, houseValid }) {
    return (
      <div>
        <p>
          <Text id="editScene.triggersCard.sunPosition.description" />
        </p>
        <div className="form-group">
          <div className="form-label">
            <Text id="editScene.triggersCard.sunPosition.houseLabel" />
          </div>
          {!houseValid && (
            <div className="alert alert-danger">
              <Text id="editScene.triggersCard.warning.houseWithoutCoordinate" />
            </div>
          )}
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
            <Text id="editScene.triggersCard.sunPosition.altitudeLabel" />
          </div>
          <div className="row">
            <div className="col-5">
              <select onChange={this.onAltitudeOperatorChange} className="form-control">
                <option value="">
                  <Text id="editScene.triggersCard.sunPosition.noCondition" />
                </option>
                {SUN_POSITION_OPERATORS.map(operator => (
                  <option selected={operator === trigger.sun_altitude_operator} value={operator}>
                    {operator}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-7">
              <div className="input-group">
                <input
                  type="number"
                  className="form-control"
                  min="-90"
                  max="90"
                  step="0.1"
                  disabled={!trigger.sun_altitude_operator}
                  value={
                    trigger.sun_altitude === null || trigger.sun_altitude === undefined ? '' : trigger.sun_altitude
                  }
                  onInput={this.onAltitudeChange}
                />
                <span className="input-group-append">
                  <span className="input-group-text">°</span>
                </span>
              </div>
            </div>
          </div>
          <small className="form-text text-muted">
            <Text id="editScene.triggersCard.sunPosition.altitudeHelp" />
          </small>
        </div>
        <div className="form-group">
          <div className="form-label">
            <Text id="editScene.triggersCard.sunPosition.azimuthLabel" />
          </div>
          <div className="row">
            <div className="col-5">
              <select onChange={this.onAzimuthOperatorChange} className="form-control">
                <option value="">
                  <Text id="editScene.triggersCard.sunPosition.noCondition" />
                </option>
                {SUN_POSITION_OPERATORS.map(operator => (
                  <option selected={operator === trigger.sun_azimuth_operator} value={operator}>
                    {operator}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-7">
              <div className="input-group">
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  max="360"
                  step="0.1"
                  disabled={!trigger.sun_azimuth_operator}
                  value={trigger.sun_azimuth === null || trigger.sun_azimuth === undefined ? '' : trigger.sun_azimuth}
                  onInput={this.onAzimuthChange}
                />
                <span className="input-group-append">
                  <span className="input-group-text">°</span>
                </span>
              </div>
            </div>
          </div>
          <small className="form-text text-muted">
            <Text id="editScene.triggersCard.sunPosition.azimuthHelp" />
          </small>
        </div>
      </div>
    );
  }
}

export default connect('httpClient,user', {})(SunPositionTrigger);
