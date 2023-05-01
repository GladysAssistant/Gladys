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
            <SelectSunriseSunset houses={houses} house={this.props.trigger.house} onHouseChange={this.onHouseChange} />
          </div>
        </div>
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
