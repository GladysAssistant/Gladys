import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import get from 'get-value';

import { RequestStatus } from '../../../../utils/consts';
import withIntlAsProp from '../../../../utils/withIntlAsProp';

const VARIABLE_NAMES = ['color', 'color_name', 'phenomena', 'text', 'bulletin', 'dept'];

class MeteoFranceGetVigilanceParams extends Component {
  getHouses = async () => {
    this.setState({
      sceneGetHouses: RequestStatus.Getting
    });
    try {
      const houses = await this.props.httpClient.get('/api/v1/house');
      this.setState({
        houses,
        sceneGetHouses: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        sceneGetHouses: RequestStatus.Error
      });
    }
  };

  onHouseChange = e => {
    this.props.updateActionProperty(this.props.path, 'house', e.target.value);
  };

  setVariables = () => {
    this.props.setVariables(
      this.props.path,
      VARIABLE_NAMES.map(name => ({
        name,
        ready: true,
        label: get(this.props.intl.dictionary, `editScene.variables.meteofrance.get-vigilance.${name}`, {
          default: name
        })
      }))
    );
  };

  constructor(props) {
    super(props);
    this.state = {
      houses: []
    };
  }

  componentDidMount() {
    this.getHouses();
    this.setVariables();
  }

  render({ action }, { houses }) {
    return (
      <div>
        <p>
          <Text id="editScene.actionsCard.meteoFranceGetVigilance.description" />
        </p>
        <div className="form-group">
          <div className="form-label">
            <Text id="editScene.actionsCard.meteoFranceGetVigilance.houseLabel" />
          </div>
          <select onChange={this.onHouseChange} className="form-control">
            <option value="">
              <Text id="global.emptySelectOption" />
            </option>
            {houses &&
              houses.map(house => (
                <option selected={house.selector === action.house} value={house.selector}>
                  {house.name}
                </option>
              ))}
          </select>
        </div>
      </div>
    );
  }
}

export default withIntlAsProp(connect('httpClient', {})(MeteoFranceGetVigilanceParams));
