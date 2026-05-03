import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';

import 'react-datepicker/dist/react-datepicker.css';
import { RequestStatus } from '../../../../utils/consts';
import { EVENTS } from '../../../../../../server/utils/constants';

class HouseEmptyOrNot extends Component {
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
    const selector = e.target.value;
    this.props.updateTriggerProperty(this.props.index, 'house', selector);
    const house = this.state.houses.find(h => h.selector === selector);
    this.props.updateTriggerProperty(this.props.index, 'house_label', house ? house.name : null);
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
        {this.props.trigger.type === EVENTS.HOUSE.EMPTY && (
          <p>
            <Text id="editScene.triggersCard.houseEmptyOrNot.houseEmptyDescription" />
          </p>
        )}
        {this.props.trigger.type === EVENTS.HOUSE.NO_LONGER_EMPTY && (
          <p>
            <Text id="editScene.triggersCard.houseEmptyOrNot.houseNoLongerEmptyDescription" />
          </p>
        )}
        <div className="form-group">
          <div className="form-label">
            <Text id="editScene.triggersCard.houseEmptyOrNot.houseLabel" />
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

export default connect('httpClient,user', {})(HouseEmptyOrNot);
