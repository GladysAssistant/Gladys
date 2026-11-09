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
import { DASHBOARD_SECTION_MOBILE_ORDER } from '../../../../../server/utils/constants';

const UNDO_REMOVAL_MS = 6000;
// pseudo destination of a leave confirmation asked by the browser's back
// gesture / button (see armHistoryGuard)
const HISTORY_BACK = '__history_back__';

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
      const { columns, sectionSizes, columnWidths, sectionMobileOrders } = flattenSections(currentDashboard.boxes);
      this.setState({
        currentDashboard: { ...currentDashboard, boxes: columns },
        sectionSizes,
        columnWidths,
        sectionMobileOrders,
        undoRemoval: null,
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
    this.requestNavigation(`/dashboard/${this.state.currentDashboardSelector}`);
  };

  // ------------------------------------------------------------ leaving with unsaved changes
  // Every way out of the editor goes through requestNavigation: Cancel, the
  // dashboard pills, dashboard creation, any in-app link (captured on the
  // document), the browser's back gesture (history guard) — and a reload or
  // a closed tab (beforeunload). With unsaved changes it asks first.
  requestNavigation = url => {
    if (this.state.hasUnsavedChanges) {
      this.setState({ leaveConfirm: url });
      return;
    }
    this.navigateAway(url);
  };

  // While the history guard is armed, the current history entry is the
  // guard's copy of the editor URL: leaving replaces it, so the history
  // keeps a single editor entry
  navigateAway = url => {
    if (this.historyGuardArmed) {
      this.historyGuardArmed = false;
      route(url, true);
      return;
    }
    route(url);
  };

  confirmLeave = () => {
    const url = this.state.leaveConfirm;
    this.setState({ leaveConfirm: null, hasUnsavedChanges: false });
    if (url === HISTORY_BACK) {
      window.history.back();
      return;
    }
    this.navigateAway(url);
  };

  cancelLeave = () => {
    const fromHistory = this.state.leaveConfirm === HISTORY_BACK;
    this.setState({ leaveConfirm: null });
    if (fromHistory) {
      this.armHistoryGuard();
    }
  };

  // The back gesture of iOS Safari (and the back button) cannot be cancelled,
  // so the editor keeps a spare copy of its own URL on top of the history
  // once something changed: going back pops that copy (same URL, nothing
  // re-renders) and the editor asks before really leaving
  armHistoryGuard = () => {
    if (this.historyGuardArmed) {
      return;
    }
    window.history.pushState({ gladysEditorGuard: true }, '', window.location.href);
    this.historyGuardArmed = true;
  };

  handlePopState = () => {
    if (!this.historyGuardArmed) {
      return;
    }
    this.historyGuardArmed = false;
    if (this.state.hasUnsavedChanges) {
      this.setState({ leaveConfirm: HISTORY_BACK });
    } else {
      window.history.back();
    }
  };

  handleBeforeUnload = event => {
    if (this.state.hasUnsavedChanges) {
      event.preventDefault();
      event.returnValue = '';
    }
  };

  // in-app links (navigation rail, mobile menu…) are caught before their own
  // handler while something is pending
  handleDocumentClick = event => {
    if (!this.state.hasUnsavedChanges && !this.historyGuardArmed) {
      return;
    }
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) {
      return;
    }
    const link = event.target.closest ? event.target.closest('a[href]') : null;
    if (!link || link.target === '_blank' || link.hasAttribute('download')) {
      return;
    }
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) {
      return;
    }
    const path = `${url.pathname}${url.search}${url.hash}`;
    if (path === `${window.location.pathname}${window.location.search}`) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.requestNavigation(path);
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
    await this.setState({
      ...newState,
      boxNotEmptyError: false,
      editingBoxPosition: null,
      movingBoxPosition: null,
      hasUnsavedChanges: true
    });
  };

  // "Move to…": the touch alternative to dragging a widget to another column
  // or section — it lands at the end of the chosen column
  openMoveBox = (x, y) => {
    this.setState({
      movingBoxPosition: { x, y },
      editingBoxPosition: null,
      dashboardSettingsOpen: false,
      newDashboardOpen: false
    });
  };

  moveBoxTo = async (x, y, destX) => {
    if (destX === x) {
      this.closeEditPanel();
      return;
    }
    const destY = this.state.currentDashboard.boxes[destX].length;
    await this.moveCard(x, y, destX, destY);
    this.flashWidget(destX, destY);
  };

  // bring a widget that just moved into view and mark it for a moment, so
  // the user sees where it went
  flashWidget = (x, y) => {
    requestAnimationFrame(() => {
      const widget = document.querySelector(`[data-widget-wrapper][data-x="${x}"][data-y="${y}"]`);
      if (!widget) {
        return;
      }
      const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      widget.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
      widget.classList.add('gladys-widget-flash');
      setTimeout(() => widget.classList.remove('gladys-widget-flash'), 1600);
    });
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
    this.setState({
      dashboardSettingsOpen: true,
      editingBoxPosition: null,
      movingBoxPosition: null,
      newDashboardOpen: false
    });
  };

  openNewDashboard = () => {
    this.setState({
      newDashboardOpen: true,
      editingBoxPosition: null,
      movingBoxPosition: null,
      dashboardSettingsOpen: false
    });
  };

  closeEditPanel = () => {
    this.setState({
      editingBoxPosition: null,
      movingBoxPosition: null,
      dashboardSettingsOpen: false,
      newDashboardOpen: false
    });
  };

  toggleReorganize = () => {
    this.setState(prevState => ({
      reorganizing: !prevState.reorganizing,
      editingBoxPosition: null,
      movingBoxPosition: null
    }));
  };

  // Sections whose columns stack on a phone: column by column, or row by row
  toggleSectionMobileOrder = sectionIndex => {
    const current = this.state.sectionMobileOrders[sectionIndex];
    const next =
      current === DASHBOARD_SECTION_MOBILE_ORDER.ROWS
        ? DASHBOARD_SECTION_MOBILE_ORDER.COLUMNS
        : DASHBOARD_SECTION_MOBILE_ORDER.ROWS;
    const newState = update(this.state, {
      sectionMobileOrders: {
        [sectionIndex]: { $set: next }
      }
    });
    this.setState({ ...newState, hasUnsavedChanges: true });
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
    const removedBox = this.state.currentDashboard.boxes[x][y];
    const snapshot = {
      boxes: this.state.currentDashboard.boxes,
      sectionSizes: this.state.sectionSizes,
      columnWidths: this.state.columnWidths,
      sectionMobileOrders: this.state.sectionMobileOrders
    };
    const newState = update(this.state, {
      currentDashboard: {
        boxes: {
          [x]: {
            $splice: [[y, 1]]
          }
        }
      }
    });
    // removing asks nothing: an "Undo" toast restores the widget, as long as
    // nothing else changed the canvas meanwhile (componentDidUpdate)
    clearTimeout(this.undoRemovalTimeout);
    await this.setState({
      ...newState,
      boxNotEmptyError: false,
      editingBoxPosition: null,
      movingBoxPosition: null,
      hasUnsavedChanges: true,
      undoRemoval:
        removedBox && removedBox.type
          ? { snapshot, type: removedBox.type, boxesRef: newState.currentDashboard.boxes }
          : null
    });
    this.undoRemovalTimeout = setTimeout(() => this.setState({ undoRemoval: null }), UNDO_REMOVAL_MS);
  };

  // The toast restores a snapshot of the canvas: it only stands while the
  // canvas is still the one the removal left — any other change to it
  // (move, add, column…) withdraws the offer, or Undo would revert that too
  getPendingUndoRemoval = () => {
    const { undoRemoval, currentDashboard } = this.state;
    return undoRemoval && currentDashboard && currentDashboard.boxes === undoRemoval.boxesRef ? undoRemoval : null;
  };

  undoRemoveBox = () => {
    const undoRemoval = this.getPendingUndoRemoval();
    const { currentDashboard } = this.state;
    if (!undoRemoval) {
      return;
    }
    clearTimeout(this.undoRemovalTimeout);
    const { snapshot } = undoRemoval;
    this.setState({
      currentDashboard: { ...currentDashboard, boxes: snapshot.boxes },
      sectionSizes: snapshot.sectionSizes,
      columnWidths: snapshot.columnWidths,
      sectionMobileOrders: snapshot.sectionMobileOrders,
      undoRemoval: null,
      hasUnsavedChanges: true
    });
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

  updateNewSelectedBox = (x, y, type, initialConfig = {}) => {
    const defaultBoxData = { type: { $set: type } };
    // an integration widget tile carries the integration and the widget key
    // it stands for, on top of the box type
    Object.keys(initialConfig).forEach(key => {
      defaultBoxData[key] = { $set: initialConfig[key] };
    });

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

      const {
        currentDashboard: selectedDashboard,
        dashboards,
        sectionSizes,
        columnWidths,
        sectionMobileOrders
      } = this.state;
      const { selector } = selectedDashboard;

      const currentDashboard = await this.props.httpClient.patch(`/api/v1/dashboard/${selector}`, {
        ...selectedDashboard,
        boxes: buildSections(selectedDashboard.boxes, sectionSizes, columnWidths, sectionMobileOrders)
      });

      const currentDashboardIndex = dashboards.findIndex(d => d.selector === selector);
      const updatedDashboards = update(dashboards, {
        [currentDashboardIndex]: {
          $set: currentDashboard
        }
      });

      const {
        columns,
        sectionSizes: newSectionSizes,
        columnWidths: newColumnWidths,
        sectionMobileOrders: newSectionMobileOrders
      } = flattenSections(currentDashboard.boxes);
      await this.setState({
        currentDashboard: { ...currentDashboard, boxes: columns },
        sectionSizes: newSectionSizes,
        columnWidths: newColumnWidths,
        sectionMobileOrders: newSectionMobileOrders,
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
      // the dimmer must come back down whatever happened: left active, it
      // makes the whole editor transparent AND pointer-events: none, so a
      // failed save looked like Gladys had stopped responding
      if (e.response && e.response.status === 422) {
        this.setState({
          loading: false,
          dashboardValidationError: true
        });
      } else if (e.response && e.response.status === 409) {
        this.setState({
          loading: false,
          dashboardAlreadyExistError: true
        });
      } else {
        this.setState({
          loading: false,
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
    // global column coordinates shifted: never point the panel at a stale box
    this.setState({
      ...newState,
      boxNotEmptyError: false,
      editingBoxPosition: null,
      movingBoxPosition: null,
      hasUnsavedChanges: true
    });
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
    const { sectionSizes, columnWidths, sectionMobileOrders, currentDashboard } = this.state;
    const target = sectionIndex + direction;
    if (target < 0 || target >= sectionSizes.length) {
      return;
    }
    const sections = buildSections(currentDashboard.boxes, sectionSizes, columnWidths, sectionMobileOrders);
    [sections[sectionIndex], sections[target]] = [sections[target], sections[sectionIndex]];
    const {
      columns,
      sectionSizes: newSectionSizes,
      columnWidths: newColumnWidths,
      sectionMobileOrders: newSectionMobileOrders
    } = flattenSections(sections);
    this.setState({
      currentDashboard: { ...currentDashboard, boxes: columns },
      sectionSizes: newSectionSizes,
      columnWidths: newColumnWidths,
      sectionMobileOrders: newSectionMobileOrders,
      boxNotEmptyError: false,
      // global column coordinates shifted: never point the panel at a stale box
      editingBoxPosition: null,
      movingBoxPosition: null,
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
      },
      sectionMobileOrders: {
        $push: [DASHBOARD_SECTION_MOBILE_ORDER.COLUMNS]
      }
    });
    this.setState({
      ...newState,
      boxNotEmptyError: false,
      editingBoxPosition: null,
      movingBoxPosition: null,
      hasUnsavedChanges: true
    });
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
        },
        sectionMobileOrders: newSectionSize === 0 ? { $splice: [[sectionIndex, 1]] } : {}
      });
      await this.setState({
        ...newState,
        boxNotEmptyError: false,
        editingBoxPosition: null,
        movingBoxPosition: null,
        hasUnsavedChanges: true
      });
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
      // the dashboard is gone: nothing left to protect
      this.setState({ hasUnsavedChanges: false });
      if (currentDashboard === null) {
        this.navigateAway('/dashboard');
      } else {
        this.navigateAway(`/dashboard/${currentDashboard.selector}/edit`);
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

  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      dashboards: [],
      sectionSizes: [],
      columnWidths: [],
      sectionMobileOrders: [],
      undoRemoval: null,
      reorganizing: false,
      leaveConfirm: null,
      newSelectedBoxType: {},
      askDeleteDashboard: false,
      boxNotEmptyError: false,
      columnBoxNotEmptyError: null,
      editingBoxPosition: null,
      movingBoxPosition: null,
      dashboardSettingsOpen: false,
      newDashboardOpen: false,
      justSaved: false,
      hasUnsavedChanges: false
    };
  }

  componentDidMount() {
    this.init();
    window.addEventListener('beforeunload', this.handleBeforeUnload);
    window.addEventListener('popstate', this.handlePopState);
    document.addEventListener('click', this.handleDocumentClick, true);
  }

  componentWillUnmount() {
    clearTimeout(this.justSavedTimeout);
    clearTimeout(this.undoRemovalTimeout);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    window.removeEventListener('popstate', this.handlePopState);
    document.removeEventListener('click', this.handleDocumentClick, true);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.currentUrl !== this.props.currentUrl) {
      this.init();
    }
    if (this.state.hasUnsavedChanges && !prevState.hasUnsavedChanges) {
      this.armHistoryGuard();
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
      editingBoxPosition,
      movingBoxPosition,
      dashboardSettingsOpen,
      newDashboardOpen,
      justSaved,
      hasUnsavedChanges,
      sectionMobileOrders,
      reorganizing,
      leaveConfirm
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
        movingBoxPosition={movingBoxPosition}
        openMoveBox={this.openMoveBox}
        moveBoxTo={this.moveBoxTo}
        sectionMobileOrders={sectionMobileOrders}
        toggleSectionMobileOrder={this.toggleSectionMobileOrder}
        undoRemoval={this.getPendingUndoRemoval()}
        undoRemoveBox={this.undoRemoveBox}
        reorganizing={reorganizing}
        toggleReorganize={this.toggleReorganize}
        leaveConfirm={leaveConfirm}
        confirmLeave={this.confirmLeave}
        cancelLeave={this.cancelLeave}
        requestNavigation={this.requestNavigation}
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
