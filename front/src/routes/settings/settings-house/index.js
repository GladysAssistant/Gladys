import { Component } from 'preact';
import { connect } from 'unistore/preact';
import get from 'get-value';

import HousePage from './HousePage';
import actions from '../../../actions/house';
import { RequestStatus } from '../../../utils/consts';

const omitKeys = (object, keys) => {
  const copy = { ...object };
  keys.forEach(key => delete copy[key]);
  return copy;
};

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

  // a delete that fails leaves the house in the list with its error alert
  // inside the open panel, so the row is only closed once the house is gone
  deleteHouse = async houseIndex => {
    const house = this.props.houses && this.props.houses[houseIndex];
    if (house) {
      this.pendingDeletes[house.id] = true;
    }
    await this.props.deleteHouse(houseIndex);
  };

  addHouse = () => {
    // the store unshifts the new house synchronously, so the flag has to be
    // set first (and on the instance, setState wouldn't have landed yet):
    // componentWillReceiveProps opens it, a collapsed empty row would be a
    // dead end
    this.expectNewHouse = true;
    this.props.addHouse();
  };

  constructor(props) {
    super(props);
    // ids of the houses whose save is in flight, waiting for their status
    this.pendingSaves = {};
    // ids of the houses whose deletion is in flight, waiting for their status
    this.pendingDeletes = {};
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

    // A house that saved successfully is in sync with the server again; one
    // that failed keeps its badge, and the panel says why. The pending map is
    // what makes the status readable: the store sets it to Getting when the
    // request starts, so anything else is the outcome of that request.
    const savedHouseIds = this.resolvePending(this.pendingSaves, nextProps);
    if (savedHouseIds.length) {
      this.setState(prevState => ({ dirtyHouses: omitKeys(prevState.dirtyHouses, savedHouseIds) }));
    }

    // same for deletions: the row closes only once the house is really gone
    const deletedHouseIds = this.resolvePending(this.pendingDeletes, nextProps);
    if (deletedHouseIds.length) {
      this.setState(prevState => ({
        dirtyHouses: omitKeys(prevState.dirtyHouses, deletedHouseIds),
        expandedHouseId: deletedHouseIds.includes(prevState.expandedHouseId) ? null : prevState.expandedHouseId
      }));
    }

    // a completed fetch replaces the whole collection with the server one, so
    // the local edits it dropped have no badge to leave behind (a failed one
    // keeps the houses, and their badges, in place)
    if (this.props.housesGetStatus === RequestStatus.Getting && nextProps.housesGetStatus === RequestStatus.Success) {
      this.setState({ dirtyHouses: {} });
    }

    // open the house just created by the "+" button
    if (this.expectNewHouse && houses.length && !houses[0].created_at) {
      this.expectNewHouse = false;
      this.setState({
        autoExpandDone: true,
        expandedHouseId: houses[0].id
      });
    } else if (!this.state.autoExpandDone && houses.length === 1) {
      // with a single house there is nothing to choose between: open it
      this.setState({ autoExpandDone: true, expandedHouseId: houses[0].id });
    }
  }

  // Removes from `pending` every house whose request is over, and returns the
  // ids of those that succeeded.
  resolvePending = (pending, nextProps) =>
    Object.keys(pending).filter(houseId => {
      const status = get(nextProps.houseUpdateStatus, houseId);
      if (status === RequestStatus.Getting) {
        return false;
      }
      delete pending[houseId];
      return status === RequestStatus.Success;
    });

  render(props, { expandedHouseId, dirtyHouses }) {
    return (
      <HousePage
        {...props}
        expandedHouseId={expandedHouseId}
        dirtyHouses={dirtyHouses}
        toggleHouse={this.toggleHouse}
        addHouse={this.addHouse}
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
