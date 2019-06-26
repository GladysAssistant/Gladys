import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../../actions/map';
import Map from './Map';

@connect(
  'usersWithLocation,housesWithLocation',
  actions
)
class MapPage extends Component {
  componentDidMount() {
    this.props.getUsersWithLocation();
    this.props.getHousesWithLocation();
  }

  render(props, {}) {
    return (
      <div class="page">
        <div class="page-main">
          <div class="my-3 my-md-5">
            <div class="map-header">
              <Map users={props.usersWithLocation} houses={props.housesWithLocation} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default MapPage;
