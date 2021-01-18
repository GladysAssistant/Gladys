import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../../actions/map';
import Map from './Map';
import Area from './Area';

@connect('usersWithLocation,housesWithLocation,areasWithLocation', actions)
class MapPage extends Component {
  componentDidMount() {
    this.props.getUsersWithLocation();
    this.props.getHousesWithLocation();
    this.props.getAreasWithLocation();
  }

  render(props, {}) {
    return (
      <div class="page">
        <div class="page-main">
          <div class="my-3 my-md-5">
            <div class="map-header">
              <Map users={props.usersWithLocation} houses={props.housesWithLocation} areas={props.areasWithLocation} />
            </div>
          </div>
        </div>
        <div>
            <Area />
        </div>
      </div>
    );
  }
}

export default MapPage;
