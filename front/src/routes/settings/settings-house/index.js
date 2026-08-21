import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';

import HousePage from './HousePage';
import actions from '../../../actions/house';
import { RequestStatus } from '../../../utils/consts';

// The page is an accordion: one house open at a time. Editing a house means
// a name, a map, a room list and the alarm settings — rendering that for
// every house at once made the page unreadable as soon as a second house
// existed (and mounted one Leaflet map per house).
class SettingsHouses extends Component {
  toggleHouse = houseId => {
    this.setState(prevState => ({
      expandedHouseId: prevState.expandedHouseId === houseId ? null : houseId,
      // a house the user closed on purpose must not be re-opened by the
      // "single house" convenience below
      autoExpandDone: true
    }));
  };

  markHouseDirty = houseIndex => {
    const house = this.props.houses && this.props.houses[houseIndex];
    if (!house) {
      return;
    }
    this.setState(prevState => ({
      dirtyHouses: { ...prevState.dirtyHouses, [house.id]: true }
    }));
  };

  // Every local edit goes through the store actions; wrapping them here is
  // what lets a collapsed row tell the user it holds unsaved changes.
  updateHouseName = (name, houseIndex) => {
    this.props.updateHouseName(name, houseIndex);
    this.markHouseDirty(houseIndex);
  };

  updateHouseAlarmCode = (code, houseIndex) => {
    this.props.updateHouseAlarmCode(code, houseIndex);
    this.markHouseDirty(houseIndex);
  };

  updateHouseDelayBeforeArming = (delay, houseIndex) => {
    this.props.updateHouseDelayBeforeArming(delay, houseIndex);
    this.markHouseDirty(houseIndex);
  };

  updateHouseLocation = (latitude, longitude, houseIndex) => {
    this.props.updateHouseLocation(latitude, longitude, houseIndex);
    this.markHouseDirty(houseIndex);
  };

  addRoom = (name, houseIndex) => {
    this.props.addRoom(name, houseIndex);
    this.markHouseDirty(houseIndex);
  };

  removeRoom = (houseIndex, roomIndex) => {
    this.props.removeRoom(houseIndex, roomIndex);
    this.markHouseDirty(houseIndex);
  };

  editRoom = (houseIndex, roomIndex, property, value) => {
    this.props.editRoom(houseIndex, roomIndex, property, value);
    this.markHouseDirty(houseIndex);
  };

  // The save is watched through the per-house update status set by the store
  // action: a save that goes through drops the "unsaved changes" badge, one
  // that fails keeps it (the panel shows why).
  saveHouse = async houseIndex => {
    const house = this.props.houses && this.props.houses[houseIndex];
    if (house) {
      this.pendingSaves[house.id] = true;
    }
    await this.props.saveHouse(houseIndex);
  };

  deleteHouse = async houseIndex => {
    const house = this.props.houses && this.props.houses[houseIndex];
    await this.props.deleteHouse(houseIndex);
    if (house) {
      this.setState(prevState => {
        const dirtyHouses = { ...prevState.dirtyHouses };
        delete dirtyHouses[house.id];
        return {
          dirtyHouses,
          expandedHouseId: prevState.expandedHouseId === house.id ? null : prevState.expandedHouseId
        };
      });
    }
  };

  addHouse = () => {
    // the store unshifts the new house synchronously, so the flag has to be
    // set first (and on the instance, setState wouldn't have landed yet):
    // componentWillReceiveProps opens it, a collapsed empty row would be a
    // dead end
    this.expectNewHouse = true;
    this.props.addHouse();
  };

  // a refetch replaces the local houses with the server ones, so pending
  // edits (and the "unsaved" badges announcing them) are gone
  search = e => {
    this.setState({ dirtyHouses: {} });
    this.props.debouncedSearch(e);
  };

  changeOrderDir = e => {
    this.setState({ dirtyHouses: {} });
    this.props.changeOrderDir(e);
  };

  constructor(props) {
    super(props);
    // ids of the houses whose save is in flight, waiting for their status
    this.pendingSaves = {};
    // set when the "+" button was pressed, until the new house shows up
    this.expectNewHouse = false;
    const houses = props.houses || [];
    const singleHouse = houses.length === 1 ? houses[0] : null;
    this.state = {
      expandedHouseId: singleHouse ? singleHouse.id : null,
      dirtyHouses: {},
      autoExpandDone: Boolean(singleHouse)
    };
  }

  componentWillMount() {
    this.props.getHouses();
  }

  // Preact runs this before the render that applies the new props, which is
  // where this page reacts to the store: a house that was just created, the
  // very first house of an install, and the outcome of a save.
  componentWillReceiveProps(nextProps) {
    const houses = nextProps.houses || [];

    // open the house just created by the "+" button
    if (this.expectNewHouse && houses.length && !houses[0].created_at) {
      this.expectNewHouse = false;
      this.setState({
        autoExpandDone: true,
        expandedHouseId: houses[0].id
      });
      return;
    }

    // with a single house there is nothing to choose between: open it
    if (!this.state.autoExpandDone && houses.length === 1) {
      this.setState({ autoExpandDone: true, expandedHouseId: houses[0].id });
      return;
    }

    // a house that saved successfully is in sync with the server again
    const savedHouseIds = Object.keys(this.pendingSaves).filter(houseId => {
      const status = get(nextProps.houseUpdateStatus, houseId);
      if (status === RequestStatus.Getting) {
        return false;
      }
      delete this.pendingSaves[houseId];
      return status === RequestStatus.Success;
    });
    if (savedHouseIds.length) {
      const dirtyHouses = { ...this.state.dirtyHouses };
      savedHouseIds.forEach(houseId => delete dirtyHouses[houseId]);
      this.setState({ dirtyHouses });
    }
  }

  render(props, { expandedHouseId, dirtyHouses }) {
    return (
      <HousePage
        {...props}
        expandedHouseId={expandedHouseId}
        dirtyHouses={dirtyHouses}
        toggleHouse={this.toggleHouse}
        addHouse={this.addHouse}
        debouncedSearch={this.search}
        changeOrderDir={this.changeOrderDir}
        updateHouseName={this.updateHouseName}
        updateHouseAlarmCode={this.updateHouseAlarmCode}
        updateHouseDelayBeforeArming={this.updateHouseDelayBeforeArming}
        updateHouseLocation={this.updateHouseLocation}
        addRoom={this.addRoom}
        removeRoom={this.removeRoom}
        editRoom={this.editRoom}
        saveHouse={this.saveHouse}
        deleteHouse={this.deleteHouse}
      />
    );
  }
}

export default connect(
  'user,houses,housesSearch,housesGetStatus,houseUpdateStatus,getHousesOrderDir',
  actions
)(SettingsHouses);
