import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';

import 'react-datepicker/dist/react-datepicker.css';
import { RequestStatus } from '../../../../utils/consts';

class SunriseSunsetTrigger extends Component {
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

  onOffsetDirectionChange = e => {
    const direction = e.target.value;
    const currentMinutes = Math.abs(this.props.trigger.offset || 0) || 30;
    if (direction === 'exact') {
      this.props.updateTriggerProperty(this.props.index, 'offset', 0);
    } else if (direction === 'before') {
      this.props.updateTriggerProperty(this.props.index, 'offset', -currentMinutes);
    } else {
      this.props.updateTriggerProperty(this.props.index, 'offset', currentMinutes);
    }
  };

  onOffsetMinutesChange = e => {
    const minutes = parseInt(e.target.value, 10) || 0;
    const currentOffset = this.props.trigger.offset || 0;
    const newOffset = currentOffset < 0 ? -minutes : minutes;
    this.props.updateTriggerProperty(this.props.index, 'offset', newOffset);
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
    const offset = this.props.trigger.offset || 0;
    const offsetDirection = offset === 0 ? 'exact' : offset > 0 ? 'after' : 'before';
    const offsetMinutes = Math.abs(offset);
    return (
      <div>
        <div class="row">
          <div class="col-sm-12">
            <SelectSunriseSunset houses={houses} house={this.props.trigger.house} onHouseChange={this.onHouseChange} />
          </div>
        </div>
        <div class="row">
          <div class="col-sm-12">
            <div class="form-group">
              <label class="form-label">
                <Text id="editScene.triggersCard.sunriseSunsetTrigger.offsetLabel" />
              </label>
              <select onChange={this.onOffsetDirectionChange} class="form-control">
                <option value="exact" selected={offsetDirection === 'exact'}>
                  <Text id="editScene.triggersCard.sunriseSunsetTrigger.atExactTime" />
                </option>
                <option value="before" selected={offsetDirection === 'before'}>
                  <Text id="editScene.triggersCard.sunriseSunsetTrigger.before" />
                </option>
                <option value="after" selected={offsetDirection === 'after'}>
                  <Text id="editScene.triggersCard.sunriseSunsetTrigger.after" />
                </option>
              </select>
            </div>
          </div>
        </div>
        {offsetDirection !== 'exact' && (
          <div class="row">
            <div class="col-sm-12">
              <div class="form-group col-sm-8">
                <input
                  type="number"
                  class="form-control"
                  min="1"
                  value={offsetMinutes}
                  onChange={this.onOffsetMinutesChange}
                />
                <small class="form-text text-muted col-sm-4">
                  <Text id="editScene.triggersCard.sunriseSunsetTrigger.minutes" />
                </small>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

class SelectSunriseSunset extends Component {
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

export default connect('httpClient,user', {})(SunriseSunsetTrigger);
