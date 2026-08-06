import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';

import { RequestStatus } from '../../../../utils/consts';

const VIGILANCE_LEVELS = [2, 3, 4];

class MeteoFranceVigilanceTrigger extends Component {
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

  onLevelChange = e => {
    this.props.updateTriggerProperty(this.props.index, 'color', parseInt(e.target.value, 10));
  };

  constructor(props) {
    super(props);
    this.state = {
      houses: []
    };
  }

  componentDidMount() {
    this.getHouses();
    // Default minimum level: orange
    if (!this.props.trigger.color) {
      this.props.updateTriggerProperty(this.props.index, 'color', 3);
    }
  }

  render({ trigger }, { houses }) {
    return (
      <div>
        <p>
          <Text id="editScene.triggersCard.meteoFranceVigilance.description" />
        </p>
        <div className="form-group">
          <div className="form-label">
            <Text id="editScene.triggersCard.meteoFranceVigilance.houseLabel" />
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
            <Text id="editScene.triggersCard.meteoFranceVigilance.levelLabel" />
          </div>
          <select onChange={this.onLevelChange} className="form-control">
            {VIGILANCE_LEVELS.map(level => (
              <option selected={(trigger.color || 3) === level} value={level}>
                <Text id={`editScene.triggersCard.meteoFranceVigilance.levels.${level}`} />
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(MeteoFranceVigilanceTrigger);
