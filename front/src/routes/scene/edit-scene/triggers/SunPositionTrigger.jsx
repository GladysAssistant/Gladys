import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';

import { RequestStatus } from '../../../../utils/consts';

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

  onHouseChange = houseSelector => {
    this.props.updateTriggerProperty(this.props.index, 'house', houseSelector);
  };

  onAltitudeChange = e => {
    const altitude = parseFloat(e.target.value);
    if (!Number.isFinite(altitude) || altitude < -90 || altitude > 90) {
      return;
    }
    this.props.updateTriggerProperty(this.props.index, 'altitude', altitude);
  };

  onAzimuthChange = e => {
    const azimuth = parseFloat(e.target.value);
    if (!Number.isFinite(azimuth) || azimuth < 0 || azimuth >= 360) {
      return;
    }
    this.props.updateTriggerProperty(this.props.index, 'azimuth', azimuth);
  };

  constructor(props) {
    super(props);
    this.state = {
      houses: []
    };
  }

  componentDidMount() {
    this.getHouses();
  }

  render({}, { houses }) {
    return (
      <div>
        <div class="row">
          <div class="col-sm-12">
            <SelectHouse houses={houses} house={this.props.trigger.house} onHouseChange={this.onHouseChange} />
          </div>
        </div>
        <div class="row">
          <div class="col-sm-6">
            <div class="form-group">
              <label class="form-label">
                <Text id="editScene.triggersCard.sunPositionTrigger.altitudeLabel" />
              </label>
              <input
                type="number"
                class="form-control"
                min="-90"
                max="90"
                step="0.1"
                value={this.props.trigger.altitude ?? ''}
                onInput={this.onAltitudeChange}
                placeholder="31"
              />
            </div>
          </div>
          <div class="col-sm-6">
            <div class="form-group">
              <label class="form-label">
                <Text id="editScene.triggersCard.sunPositionTrigger.azimuthLabel" />
              </label>
              <input
                type="number"
                class="form-control"
                min="0"
                max="359.9"
                step="0.1"
                value={this.props.trigger.azimuth ?? ''}
                onInput={this.onAzimuthChange}
                placeholder="160"
              />
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-sm-12">
            <p class="text-muted mb-0">
              <Text id="editScene.triggersCard.sunPositionTrigger.description" />
            </p>
          </div>
        </div>
      </div>
    );
  }
}

class SelectHouse extends Component {
  handleHouseChange = e => {
    this.props.onHouseChange(e.target.value);
  };

  houseIsValid(houseSelector) {
    const houses = this.props.houses;
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
      houseValid: true
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.houses !== this.props.houses || prevProps.house !== this.props.house) {
      this.houseIsValid(this.props.house);
    }
  }

  render({}, { houseValid }) {
    return (
      <div className="form-group">
        <div className="form-label">
          <Text id="editScene.triggersCard.scheduledTrigger.house" />
        </div>
        {!houseValid && (
          <div className="alert alert-danger">
            <Text id="editScene.triggersCard.warning.houseWithoutCoordinate" />
          </div>
        )}
        <select onChange={this.handleHouseChange} className="form-control">
          <option value="">
            <Text id="global.emptySelectOption" />
          </option>
          {this.props.houses &&
            this.props.houses.map(house => (
              <option selected={house.selector === this.props.house} value={house.selector}>
                {house.name}
              </option>
            ))}
        </select>
      </div>
    );
  }
}

export default connect('httpClient,user', {})(SunPositionTrigger);
