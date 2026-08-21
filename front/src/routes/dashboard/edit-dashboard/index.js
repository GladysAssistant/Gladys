import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';
import update from 'immutability-helper';
import EditDashboardPage from './EditDashboard';
import get from 'get-value';
import {
  DEFAULT_COLUMN_WIDTH,
  MAX_COLUMNS_PER_SECTION,
  WIDE_COLUMN_WIDTH,
  flattenSections,
  buildSections,
  getSectionOffsets,
  findSectionIndex
} from '../../../utils/dashboardSections';

class EditDashboard extends Component {
  getDashboards = async () => {
    try {
      await this.setState({
        getDashboardsError: false,
        loading: true
      });
      const dashboards = await this.props.httpClient.get('/api/v1/dashboard');
      let currentDashboardSelector;
      if (this.props.dashboardSelector) {
        currentDashboardSelector = this.props.dashboardSelector;
      } else if (dashboards.length > 0) {
        currentDashboardSelector = dashboards[0].selector;
      }
      await this.setState({
        dashboards,
        currentDashboardSelector,
        getDashboardsError: false,
        loading: false
      });
    } catch (e) {
      console.error(e);
      this.setState({ loading: false });
      const status = get(e, 'response.status');
      const errorMessage = get(e, 'response.error_message');
      // in case we are on the gateway (Gladys Plus)
      if (status === 404 && errorMessage === 'NO_INSTANCE_FOUND') {
        this.setState({
          gatewayInstanceNotFound: true
        });
      } else {
        this.setState({
          getDashboardsError: true
        });
      }
    }
  };

  getCurrentDashboard = async () => {
    try {
      await this.setState({ loading: true });
      const currentDashboard = await this.props.httpClient.get(
        `/api/v1/dashboard/${this.state.currentDashboardSelector}`
      );
      // The editor works on a flat list of columns so drag & drop coordinates
      // stay global, the section sizes and column widths are kept aside and
      // reassembled on save
      const { columns, sectionSizes, columnWidths } = flattenSections(currentDashboard.boxes);
      this.setState({
        currentDashboard: { ...currentDashboard, boxes: columns },
        sectionSizes,
        columnWidths,
        loading: false,
        hasUnsavedChanges: false
      });
    } catch (e) {
      this.setState({
        loading: false
      });
      console.error(e);
    }
  };

  init = async () => {
    await this.getDashboards();
    if (this.state.currentDashboardSelector) {
      await this.getCurrentDashboard();
    }
  };

  cancelDashboardEdit = async () => {
    route(`/dashboard/${this.state.currentDashboardSelector}`);
  };

  moveCard = async (originalX, originalY, destX, destY) => {
    // incorrect coordinates
    if (destX < 0 || destY < 0) {
      return null;
    }

    if (destX >= this.state.currentDashboard.boxes.length || destY > this.state.currentDashboard.boxes[destX].length) {
      return null;
    }
    const element = this.state.currentDashboard.boxes[originalX][originalY];

    const newStateWithoutElement = update(this.state, {
      currentDashboard: {
        boxes: {
          [originalX]: {
            $splice: [[originalY, 1]]
          }
        }
      }
    });
    const newState = update(newStateWithoutElement, {
      currentDashboard: {
        boxes: {
          [destX]: {
            $splice: [[destY, 0, element]]
          }
        }
      }
    });
    // any structural change closes the edit panel so it never points at a stale position
    await this.setState({ ...newState, boxNotEmptyError: false, editingBoxPosition: null, hasUnsavedChanges: true });
  };

  moveBoxUp = (x, y) => {
    return this.moveCard(x, y, x, y - 1);
  };

  moveBoxDown = (x, y) => {
    return this.moveCard(x, y, x, y + 1);
  };

  openBoxSettings = (x, y) => {
    this.setState({ editingBoxPosition: { x, y }, dashboardSettingsOpen: false, newDashboardOpen: false });
  };

  openDashboardSettings = () => {
    this.setState({ dashboardSettingsOpen: true, editingBoxPosition: null, newDashboardOpen: false });
  };

  openNewDashboard = () => {
    this.setState({ newDashboardOpen: true, editingBoxPosition: null, dashboardSettingsOpen: false });
  };

  closeEditPanel = () => {
    this.setState({ editingBoxPosition: null, dashboardSettingsOpen: false, newDashboardOpen: false });
  };

  addBoxAndEdit = x => {
    // the new box lands at the end of column x: open its settings right away
    const y = this.state.currentDashboard.boxes[x].length;
    this.addBox(x);
    this.setState({ editingBoxPosition: { x, y }, dashboardSettingsOpen: false, newDashboardOpen: false });
  };

  addBoxAtPositionAndEdit = (x, y) => {
    // addBoxAtPosition inserts after the box at y
    this.addBoxAtPosition(x, y);
    this.setState({ editingBoxPosition: { x, y: y + 1 }, dashboardSettingsOpen: false, newDashboardOpen: false });
  };

  addBox = x => {
    const newState = update(this.state, {
      currentDashboard: {
        boxes: {
          [x]: {
            $push: [{}]
          }
        }
      }
    });
    this.setState({ ...newState, hasUnsavedChanges: true });
  };

  addBoxAtPosition = (x, y) => {
    const newState = update(this.state, {
      currentDashboard: {
        boxes: {
          [x]: {
            $splice: [[y + 1, 0, {}]]
          }
        }
      }
    });
    this.setState({ ...newState, hasUnsavedChanges: true });
  };

  removeBox = async (x, y) => {
    const newState = update(this.state, {
      currentDashboard: {
        boxes: {
          [x]: {
            $splice: [[y, 1]]
          }
        }
      }
    });
    await this.setState({ ...newState, boxNotEmptyError: false, editingBoxPosition: null, hasUnsavedChanges: true });
  };

  updateCurrentDashboardName = e => {
    const newState = update(this.state, {
      currentDashboard: {
        name: {
          $set: e.target.value
        }
      }
    });
    this.setState({ ...newState, hasUnsavedChanges: true });
  };

  updateCurrentDashboardVisibility = e => {
    const newState = update(this.state, {
      currentDashboard: {
        visibility: {
          $set: e.target.value
        }
      }
    });
    this.setState({ ...newState, hasUnsavedChanges: true });
  };

  updateCurrentDashboardProperty = (property, value) => {
    const newState = update(this.state, {
      currentDashboard: {
        [property]: {
          $set: value
        }
      }
    });
    this.setState({ ...newState, hasUnsavedChanges: true });
  };

  updateBoxConfig = (x, y, data) => {
    this.setState(prevState => {
      const newState = update(prevState, {
        currentDashboard: {
          boxes: {
            [x]: {
              [y]: {
                $merge: data
              }
            }
          }
        }
      });
      return { ...newState, boxNotEmptyError: false, hasUnsavedChanges: true };
    });
  };

  updateNewSelectedBox = (x, y, type) => {
    const defaultBoxData = { type: { $set: type } };

    if (type === 'photo') {
      defaultBoxData.photos = { $set: [{ url: '', caption: '' }] };
      defaultBoxData.photo_fit = { $set: 'cover' };
      defaultBoxData.photo_slideshow_interval = { $set: 10 };
      defaultBoxData.photo_show_caption = { $set: true };
    }

    const newState = update(this.state, {
      currentDashboard: {
        boxes: {
          [x]: {
            [y]: defaultBoxData
          }
        }
      }
    });
    this.setState({ ...newState, hasUnsavedChanges: true });
  };

  removeEmptyBoxes = async () => {
    const { currentDashboard } = this.state;
    // new boxes without empty boxes
    const newBoxes = currentDashboard.boxes.map(column => {
      return column
        .filter(box => {
          return box.type !== undefined;
        })
        .map(box => {
          // A photo box can contain rows the user started but never filled in, we don't save them
          if (box.type === 'photo' && Array.isArray(box.photos)) {
            return { ...box, photos: box.photos.filter(photo => photo && photo.url) };
          }
          // Same for chips the user added but never gave a type
          if (box.type === 'chips' && Array.isArray(box.chips)) {
            return { ...box, chips: box.chips.filter(chip => chip && chip.chip_type) };
          }
          // Same for house-view pins the user placed but never assigned a feature
          if (box.type === 'house-view' && Array.isArray(box.pins)) {
            return { ...box, pins: box.pins.filter(pin => pin && pin.device_feature) };
          }
          // Same for quick actions the user added but never gave a target
          if (box.type === 'actions' && Array.isArray(box.actions)) {
            return {
              ...box,
              actions: box.actions.filter(
                action => action && (action.action_type === 'scene' ? action.scene : action.device_feature)
              )
            };
          }
          return box;
        });
    });
    const newDashboard = update(currentDashboard, {
      boxes: {
        $set: newBoxes
      }
    });
    await this.setState({
      currentDashboard: newDashboard
    });
  };

  saveDashboard = async () => {
    this.setState({
      loading: true,
      dashboardValidationError: false,
      dashboardAlreadyExistError: false,
      unknownError: false
    });
    try {
      // We purge all empty boxes
      await this.removeEmptyBoxes();

      const { currentDashboard: selectedDashboard, dashboards, sectionSizes, columnWidths } = this.state;
      const { selector } = selectedDashboard;

      const currentDashboard = await this.props.httpClient.patch(`/api/v1/dashboard/${selector}`, {
        ...selectedDashboard,
        boxes: buildSections(selectedDashboard.boxes, sectionSizes, columnWidths)
      });

      const currentDashboardIndex = dashboards.findIndex(d => d.selector === selector);
      const updatedDashboards = update(dashboards, {
        [currentDashboardIndex]: {
          $set: currentDashboard
        }
      });

      const { columns, sectionSizes: newSectionSizes, columnWidths: newColumnWidths } = flattenSections(
        currentDashboard.boxes
      );
      await this.setState({
        currentDashboard: { ...currentDashboard, boxes: columns },
        sectionSizes: newSectionSizes,
        columnWidths: newColumnWidths,
        loading: false,
        dashboards: updatedDashboards,
        justSaved: true,
        hasUnsavedChanges: false
      });
      // stay in the editor so the user can chain edits: the save button
      // briefly turns into a confirmation instead of routing away
      clearTimeout(this.justSavedTimeout);
      this.justSavedTimeout = setTimeout(() => this.setState({ justSaved: false }), 2500);
    } catch (e) {
      console.error(e);
      if (e.response && e.response.status === 422) {
        this.setState({
          dashboardValidationError: true
        });
      } else if (e.response && e.response.status === 409) {
        this.setState({
          dashboardAlreadyExistError: true
        });
      } else {
        this.setState({
          unknownError: true
        });
      }
    }
  };

  addColumn = sectionIndex => {
    const { sectionSizes } = this.state;
    if (sectionSizes[sectionIndex] >= MAX_COLUMNS_PER_SECTION) {
      return;
    }
    // the new column goes at the end of its section, in the flat column list
    const insertAt = getSectionOffsets(sectionSizes)[sectionIndex] + sectionSizes[sectionIndex];
    const newState = update(this.state, {
      currentDashboard: {
        boxes: {
          $splice: [[insertAt, 0, []]]
        }
      },
      sectionSizes: {
        [sectionIndex]: {
          $set: sectionSizes[sectionIndex] + 1
        }
      },
      columnWidths: {
        $splice: [[insertAt, 0, DEFAULT_COLUMN_WIDTH]]
      }
    });
    this.setState({ ...newState, boxNotEmptyError: false, hasUnsavedChanges: true });
  };

  // A column is either normal (1) or wide (2): one toggle, no free resize
  toggleColumnWidth = x => {
    const isWide = this.state.columnWidths[x] === WIDE_COLUMN_WIDTH;
    const newState = update(this.state, {
      columnWidths: {
        [x]: {
          $set: isWide ? DEFAULT_COLUMN_WIDTH : WIDE_COLUMN_WIDTH
        }
      }
    });
    this.setState({ ...newState, hasUnsavedChanges: true });
  };

  // Sections reorder with one-step arrows — dragging a whole section
  // across the canvas would be miserable, especially on mobile
  moveSection = (sectionIndex, direction) => {
    const { sectionSizes, columnWidths, currentDashboard } = this.state;
    const target = sectionIndex + direction;
    if (target < 0 || target >= sectionSizes.length) {
      return;
    }
    const sections = buildSections(currentDashboard.boxes, sectionSizes, columnWidths);
    [sections[sectionIndex], sections[target]] = [sections[target], sections[sectionIndex]];
    const { columns, sectionSizes: newSectionSizes, columnWidths: newColumnWidths } = flattenSections(sections);
    this.setState({
      currentDashboard: { ...currentDashboard, boxes: columns },
      sectionSizes: newSectionSizes,
      columnWidths: newColumnWidths,
      boxNotEmptyError: false,
      // global column coordinates shifted: never point the panel at a stale box
      editingBoxPosition: null,
      hasUnsavedChanges: true
    });
  };

  addSection = () => {
    const newState = update(this.state, {
      currentDashboard: {
        boxes: {
          $push: [[]]
        }
      },
      sectionSizes: {
        $push: [1]
      },
      columnWidths: {
        $push: [DEFAULT_COLUMN_WIDTH]
      }
    });
    this.setState({ ...newState, boxNotEmptyError: false, editingBoxPosition: null, hasUnsavedChanges: true });
  };

  deleteCurrentColumn = async x => {
    const { boxes } = this.state.currentDashboard;
    if (boxes[x].length === 0) {
      const sectionIndex = findSectionIndex(this.state.sectionSizes, x);
      const newSectionSize = this.state.sectionSizes[sectionIndex] - 1;
      const newState = update(this.state, {
        currentDashboard: {
          boxes: {
            $splice: [[x, 1]]
          }
        },
        // a section left without any column disappears
        sectionSizes:
          newSectionSize === 0
            ? { $splice: [[sectionIndex, 1]] }
            : {
                [sectionIndex]: {
                  $set: newSectionSize
                }
              },
        columnWidths: {
          $splice: [[x, 1]]
        }
      });
      await this.setState({ ...newState, boxNotEmptyError: false, editingBoxPosition: null, hasUnsavedChanges: true });
    } else {
      this.setState({
        boxNotEmptyError: true,
        columnBoxNotEmptyError: x
      });
    }
  };

  askDeleteCurrentDashboard = async () => {
    await this.setState({
      askDeleteDashboard: true
    });
  };

  cancelDeleteCurrentDashboard = async () => {
    await this.setState({
      askDeleteDashboard: false
    });
  };

  deleteCurrentDashboard = async () => {
    try {
      await this.props.httpClient.delete(`/api/v1/dashboard/${this.state.currentDashboard.selector}`);
      const dashboardIndex = this.state.dashboards.findIndex(d => d.id === this.state.currentDashboard.id);
      const dashboards = update(this.state.dashboards, {
        $splice: [[dashboardIndex, 1]]
      });
      const currentDashboard = dashboards.length > 0 ? dashboards[0] : null;
      await this.setState({
        askDeleteDashboard: false
      });
      if (currentDashboard === null) {
        route('/dashboard');
      } else {
        route(`/dashboard/${currentDashboard.selector}/edit`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  updateDashboardList = async newDashboards => {
    await this.setState({
      savingNewDashboardList: true,
      dashboards: newDashboards
    });
    try {
      const dashboardSelectors = this.state.dashboards.map(d => d.selector);
      await this.props.httpClient.post('/api/v1/dashboard/order', dashboardSelectors);
    } catch (e) {
      console.error(e);
    }
    this.setState({
      savingNewDashboardList: false
    });
  };

  toggleMobileReorder = () => {
    this.setState(prevState => ({ ...prevState, isMobileReordering: !prevState.isMobileReordering }));
  };

  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      dashboards: [],
      sectionSizes: [],
      columnWidths: [],
      newSelectedBoxType: {},
      askDeleteDashboard: false,
      boxNotEmptyError: false,
      columnBoxNotEmptyError: null,
      isMobileReordering: false,
      editingBoxPosition: null,
      dashboardSettingsOpen: false,
      newDashboardOpen: false,
      justSaved: false,
      hasUnsavedChanges: false
    };
  }

  componentDidMount() {
    this.init();
  }

  componentWillUnmount() {
    clearTimeout(this.justSavedTimeout);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.currentUrl !== this.props.currentUrl) {
      this.init();
    }
  }

  render(
    props,
    {
      dashboards,
      currentDashboard,
      sectionSizes,
      columnWidths,
      loading,
      dashboardValidationError,
      dashboardAlreadyExistError,
      unknownError,
      askDeleteDashboard,
      boxNotEmptyError,
      columnBoxNotEmptyError,
      savingNewDashboardList,
      isMobileReordering,
      editingBoxPosition,
      dashboardSettingsOpen,
      newDashboardOpen,
      justSaved,
      hasUnsavedChanges
    }
  ) {
    return (
      <EditDashboardPage
        user={props.user}
        dashboards={dashboards}
        currentDashboard={currentDashboard}
        loading={loading}
        dashboardValidationError={dashboardValidationError}
        dashboardAlreadyExistError={dashboardAlreadyExistError}
        unknownError={unknownError}
        toggleDashboardDropdown={this.toggleDashboardDropdown}
        redirectToDashboard={this.redirectToDashboard}
        editDashboard={this.editDashboard}
        cancelDashboardEdit={this.cancelDashboardEdit}
        moveBoxDown={this.moveBoxDown}
        moveBoxUp={this.moveBoxUp}
        moveCard={this.moveCard}
        openBoxSettings={this.openBoxSettings}
        openDashboardSettings={this.openDashboardSettings}
        openNewDashboard={this.openNewDashboard}
        closeEditPanel={this.closeEditPanel}
        addBoxAndEdit={this.addBoxAndEdit}
        addBoxAtPositionAndEdit={this.addBoxAtPositionAndEdit}
        editingBoxPosition={editingBoxPosition}
        dashboardSettingsOpen={dashboardSettingsOpen}
        newDashboardOpen={newDashboardOpen}
        addBox={this.addBox}
        addBoxAtPosition={this.addBoxAtPosition}
        removeBox={this.removeBox}
        updateNewSelectedBox={this.updateNewSelectedBox}
        saveDashboard={this.saveDashboard}
        justSaved={justSaved}
        hasUnsavedChanges={hasUnsavedChanges}
        updateBoxConfig={this.updateBoxConfig}
        updateCurrentDashboardName={this.updateCurrentDashboardName}
        updateCurrentDashboardVisibility={this.updateCurrentDashboardVisibility}
        updateCurrentDashboardProperty={this.updateCurrentDashboardProperty}
        askDeleteCurrentDashboard={this.askDeleteCurrentDashboard}
        cancelDeleteCurrentDashboard={this.cancelDeleteCurrentDashboard}
        deleteCurrentDashboard={this.deleteCurrentDashboard}
        askDeleteDashboard={askDeleteDashboard}
        updateDashboardList={this.updateDashboardList}
        savingNewDashboardList={savingNewDashboardList}
        toggleMobileReorder={this.toggleMobileReorder}
        isMobileReordering={isMobileReordering}
        addColumn={this.addColumn}
        addSection={this.addSection}
        moveSection={this.moveSection}
        sectionSizes={sectionSizes}
        columnWidths={columnWidths}
        toggleColumnWidth={this.toggleColumnWidth}
        deleteCurrentColumn={this.deleteCurrentColumn}
        boxNotEmptyError={boxNotEmptyError}
        columnBoxNotEmptyError={columnBoxNotEmptyError}
      />
    );
  }
}

export default connect('user,fullScreen,currentUrl,httpClient,gatewayAccountExpired', {})(EditDashboard);
