import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';

import 'react-datepicker/dist/react-datepicker.css';
import { RequestStatus } from '../../../../utils/consts';

class AlarmModeTrigger extends Component {
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
        <p>
          <Text id={`editScene.triggersCard.alarmMode.${this.props.trigger.type}`} />
        </p>
        <div className="form-group">
          <div className="form-label">
            <Text id="editScene.triggersCard.alarmMode.houseLabel" />
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
      </div>
    );
  }
}

export default connect('httpClient,user', {})(AlarmModeTrigger);
