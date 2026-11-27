import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import get from 'get-value';

import BottomSheet from '../../../components/sheet/BottomSheet';
import MobileToast from '../../../components/mobile/MobileToast';
import { MobileGroup, MobileRow } from '../../../components/mobile/MobileList';
import EditDevices from '../../../components/boxs/device-in-room/EditDevices';
import DeviceFeaturePicker from '../../../components/device/DeviceFeaturePicker';
import AddToDashboardSheet, { getBoxLabel } from '../../../components/dashboard/AddToDashboardSheet';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import { getBoxInSections, removeBoxInSections, replaceBoxInSections } from '../../../utils/dashboardSections';
import { updateDashboardWidgets, restoreDashboardWidgets } from '../../../utils/dashboardQuickSave';
import { getWidgetSuggestions } from '../../../utils/deviceWidgetSuggestions';
import { isLightPanelFeature } from '../../../components/boxs/device-in-room/device-features/light/lightFeatures';
import style from './quickEdit.css';

// A finger kept this long on a widget opens its menu (iOS: ~500ms)
const LONG_PRESS_MS = 500;
// The widget starts sinking a little before, so the user sees something is coming
const PRESS_FEEDBACK_MS = 150;
// Beyond this travel the finger is scrolling (or swiping to another dashboard): no long press
const PRESS_MAX_TRAVEL_PX = 10;
const UNDO_TOAST_MS = 5000;
// A context menu this soon after a touch on a widget is the long press's own (Android)
const CONTEXT_MENU_AFTER_TOUCH_MS = 1500;
const FLASH_MS = 1600;
// Where holding a finger already means something: a slider, a color wheel, a field, a camera
const NO_LONG_PRESS =
  'input, select, textarea, [role="slider"], canvas, video, iframe, [contenteditable="true"], [data-no-long-press]';
const PRESSING_CLASS = 'gladys-widget-pressing';
const MENU_TARGET_CLASS = 'gladys-widget-menu-target';
const ADDED_CLASS = 'gladys-widget-added';

const getSlot = (x, y) => document.querySelector(`[data-box-slot][data-x="${x}"][data-y="${y}"]`);
// the slot is display: contents: what is seen (and measured) is its first child
const getSlotCard = slot => (slot ? slot.firstElementChild : null);

// The long press ends with a click on whatever is under the finger (a device row toggles its
// light on a tap): that one click is swallowed, as the pointer-drag engine and the edit panel do
const suppressNextClick = (releaseX, releaseY) => {
  const suppress = event => {
    if (Math.hypot(event.clientX - releaseX, event.clientY - releaseY) > PRESS_MAX_TRAVEL_PX * 3) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    remove();
  };
  const remove = () => {
    window.removeEventListener('click', suppress, true);
    window.removeEventListener('pointerdown', remove, true);
  };
  window.addEventListener('click', suppress, true);
  setTimeout(() => window.addEventListener('pointerdown', remove, true), 0);
  setTimeout(remove, 600);
};

/**
 * In-place editing of a dashboard (docs/specs/dashboard-flexible-layout-and-widgets.md, A.3.2):
 * the content of a dashboard changes from the dashboard itself, without entering the editor and
 * without a Save button.
 *
 * - A long press on a widget (touch and pen; not in tablet mode) opens its menu: add devices and
 *   rename / reorder them (devices widget, in a sheet over the real dashboard), remove the widget,
 *   or go to the editor on that widget (its settings, "Move to…", the layout).
 * - The "+" of the dock (props.addMenuOpen) adds a device — the picker, then "Where to add it?"
 *   (AddToDashboardSheet) — or opens the editor to add another widget or change the layout.
 *
 * Every change is saved at once (updateDashboardWidgets: re-read, check, PATCH boxes) and shown
 * with a toast whose Undo puts the widgets back as they were.
 */
class QuickEditor extends Component {
  state = {
    menu: null,
    devicesSheet: null,
    draftVersion: 0,
    addStep: null,
    addSelectors: [],
    devices: null,
    toast: null
  };

  // ------------------------------------------------------------ long press
  onPointerDown = event => {
    if (event.pointerType === 'mouse' || !event.isPrimary || this.props.tabletMode) {
      return;
    }
    const slot = event.target.closest ? event.target.closest('[data-box-slot]') : null;
    if (!slot) {
      return;
    }
    // a finger on a widget: the context menu the system may open for it is ours to prevent
    this.lastTouchPressAt = Date.now();
    if (event.target.closest(NO_LONG_PRESS) || this.isBusy()) {
      return;
    }
    this.cancelPress();
    this.press = {
      slot,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY
    };
    this.feedbackTimer = setTimeout(() => {
      const card = getSlotCard(slot);
      if (card) {
        card.classList.add(PRESSING_CLASS);
      }
    }, PRESS_FEEDBACK_MS);
    this.pressTimer = setTimeout(this.firePress, LONG_PRESS_MS);
  };

  onPointerMove = event => {
    const { press } = this;
    if (!press || event.pointerId !== press.pointerId) {
      return;
    }
    press.lastX = event.clientX;
    press.lastY = event.clientY;
    if (Math.hypot(event.clientX - press.startX, event.clientY - press.startY) > PRESS_MAX_TRAVEL_PX) {
      this.cancelPress();
    }
  };

  onPointerEnd = event => {
    if (this.press && event.pointerId === this.press.pointerId) {
      this.cancelPress();
    }
  };

  // Android opens its own context menu on a long press: not on a widget. Only after a finger (or
  // a pen) went down on it: a right click on a computer keeps the browser's menu
  onContextMenu = event => {
    const touchPress = this.press || Date.now() - (this.lastTouchPressAt || 0) < CONTEXT_MENU_AFTER_TOUCH_MS;
    if (touchPress && event.target.closest && event.target.closest('[data-box-slot]') && !this.props.tabletMode) {
      event.preventDefault();
    }
  };

  cancelPress = () => {
    clearTimeout(this.pressTimer);
    clearTimeout(this.feedbackTimer);
    if (this.press) {
      const card = getSlotCard(this.press.slot);
      if (card) {
        card.classList.remove(PRESSING_CLASS);
      }
    }
    this.press = null;
  };

  firePress = () => {
    const { press } = this;
    if (!press) {
      return;
    }
    this.cancelPress();
    suppressNextClick(press.lastX, press.lastY);
    if (navigator.vibrate) {
      try {
        navigator.vibrate(10);
      } catch (e) {} // eslint-disable-line no-empty
    }
    this.openMenu(Number(press.slot.getAttribute('data-x')), Number(press.slot.getAttribute('data-y')));
  };

  isBusy = () => Boolean(this.state.menu || this.state.devicesSheet || this.state.addStep || this.props.addMenuOpen);

  // ------------------------------------------------------------ widget menu
  getBox = (x, y) => getBoxInSections(get(this.props, 'currentDashboard.boxes'), x, y);

  markMenuTarget = position => {
    document.querySelectorAll(`.${MENU_TARGET_CLASS}`).forEach(element => element.classList.remove(MENU_TARGET_CLASS));
    const card = position ? getSlotCard(getSlot(position.x, position.y)) : null;
    if (card) {
      card.classList.add(MENU_TARGET_CLASS);
    }
  };

  openMenu = (x, y) => {
    if (!this.getBox(x, y)) {
      return;
    }
    this.markMenuTarget({ x, y });
    this.setState({ menu: { x, y } });
  };

  closeMenu = () => {
    this.markMenuTarget(null);
    this.setState({ menu: null });
  };

  // the editor opens on this widget, doing what was asked (dashboardAnchor intents)
  openEditorOn = intent => {
    const { menu } = this.state;
    this.closeMenu();
    this.props.openEditor(menu ? { x: menu.x, y: menu.y, intent } : { intent });
  };

  removeWidget = async () => {
    const { menu } = this.state;
    const box = this.getBox(menu.x, menu.y);
    this.closeMenu();
    await this.save(
      sections => removeBoxInSections(sections, menu.x, menu.y),
      [{ x: menu.x, y: menu.y, box }],
      <Text id="quickEdit.widgetRemoved" fields={{ name: getBoxLabel(this.props.intl.dictionary, box) }} />,
      null
    );
  };

  // ------------------------------------------------------------ devices widget sheet
  openDevicesSheet = mode => {
    const { menu } = this.state;
    const box = this.getBox(menu.x, menu.y);
    this.closeMenu();
    this.draft = box;
    this.setState({ devicesSheet: { x: menu.x, y: menu.y, mode, original: box } });
  };

  // EditDevices writes through updateBoxConfig: the draft is kept on the instance, so a
  // validation that writes and closes in the same tick saves what was just written
  updateDraft = (x, y, data) => {
    this.draft = { ...this.draft, ...data };
    this.setState(prevState => ({ draftVersion: prevState.draftVersion + 1 }));
  };

  closeDevicesSheet = () => {
    const sheet = this.state.devicesSheet;
    this.setState({ devicesSheet: null });
    if (!sheet || JSON.stringify(this.draft) === JSON.stringify(sheet.original)) {
      return;
    }
    const box = this.draft;
    this.save(
      sections => replaceBoxInSections(sections, sheet.x, sheet.y, box),
      [{ x: sheet.x, y: sheet.y, box: sheet.original }],
      this.describeDevicesChange(sheet.original, box),
      { x: sheet.x, y: sheet.y },
      (box.device_features || []).filter(selector => !(sheet.original.device_features || []).includes(selector))
    );
  };

  onPickerDone = () => {
    this.closeDevicesSheet();
  };

  // "Bathroom added to Temperatures", "3 devices added to Lights", "Temperatures updated"
  describeDevicesChange = (original, box) => {
    const before = original.device_features || [];
    const after = box.device_features || [];
    const names = box.device_feature_names || [];
    const added = after.filter(selector => !before.includes(selector));
    const widget = getBoxLabel(this.props.intl.dictionary, box);
    if (added.length > 0 && after.length >= before.length) {
      // counted in rows: the features of a light share their name (the device's)
      const addedNames = added.map(selector => names[after.indexOf(selector)]);
      return this.describeAdded(new Set(addedNames).size, addedNames[0], widget);
    }
    return <Text id="quickEdit.widgetUpdated" fields={{ name: widget }} />;
  };

  describeAdded = (count, firstName, widget) =>
    count === 1 ? (
      <Text id="quickEdit.addedOne" fields={{ name: firstName, widget }} />
    ) : (
      <Text id="quickEdit.addedMany" plural={count} fields={{ count, widget }} />
    );

  // ------------------------------------------------------------ "+" of the dock: add a device
  startAddDevice = async () => {
    this.props.closeAddMenu();
    this.setState({ addStep: 'pick', addSelectors: [] });
    if (!this.state.devices) {
      try {
        const devices = await this.props.httpClient.get('/api/v1/device');
        this.setState({ devices });
      } catch (e) {
        console.error(e);
        this.setState({ addStep: null });
        this.showToast(<Text id="quickEdit.loadError" />);
      }
    }
  };

  onDevicesPicked = selectors => {
    if (selectors.length === 0) {
      this.setState({ addStep: null });
      return;
    }
    this.setState({ addStep: 'where', addSelectors: selectors });
  };

  closeAdd = () => this.setState({ addStep: null });

  backToPicker = () => this.setState({ addStep: 'pick' });

  // count in rows, the way the widget shows them: a light is one row
  onAdded = ({ before, after, position, added, newWidget, widgetName }) => {
    this.setState({ addStep: null });
    this.props.onDashboardSaved(after);
    const rowKeys = new Set(
      added.map(item =>
        item.entry && isLightPanelFeature(item.entry.feature) ? `light:${item.entry.device.selector}` : item.selector
      )
    );
    const count = rowKeys.size;
    const firstName = added[0] ? added[0].name : '';
    this.showToast(
      newWidget ? (
        <Text id="quickEdit.addedNewWidget" plural={count} fields={{ count, name: firstName }} />
      ) : (
        this.describeAdded(count, firstName, widgetName)
      ),
      { selector: after.selector, boxes: before.boxes, savedBoxes: after.boxes }
    );
    this.flashWidget(
      position,
      added.map(item => item.selector)
    );
  };

  // ------------------------------------------------------------ saving
  // One save at a time: each one reads the dashboard again, so a save started while another is
  // still writing would build its change on the boxes before it, and drop it
  saveQueue = Promise.resolve();

  enqueueSave = task => {
    const previous = this.saveQueue;
    const run = (async () => {
      // the queue never rejects (below): the previous save is only waited for
      await previous;
      return task();
    })();
    this.saveQueue = (async () => {
      try {
        await run;
      } catch (e) {} // eslint-disable-line no-empty
    })();
    return run;
  };

  // The dashboard is the one shown when the change is made, not the one shown when its turn comes
  // in the queue: the user may have switched to another dashboard meanwhile
  save = (change, expected, message, flashPosition, flashSelectors) => {
    const selector = this.props.currentDashboard.selector;
    return this.enqueueSave(() => this.runSave(selector, change, expected, message, flashPosition, flashSelectors));
  };

  runSave = async (selector, change, expected, message, flashPosition, flashSelectors) => {
    try {
      const { before, after } = await updateDashboardWidgets(this.props.httpClient, selector, change, expected);
      this.props.onDashboardSaved(after);
      this.showToast(message, { selector, boxes: before.boxes, savedBoxes: after.boxes });
      // the position is one of the saved dashboard: nothing to mark on another one
      if (flashPosition && get(this.props, 'currentDashboard.selector') === selector) {
        this.flashWidget(flashPosition, flashSelectors);
      }
    } catch (e) {
      console.error(e);
      this.showToast(
        <Text id={e.name === 'DashboardChangedError' ? 'quickEdit.changedError' : 'quickEdit.saveError'} />
      );
    }
  };

  // Undo puts the widgets back as they were, unless the dashboard changed since the change it
  // undoes (restoreDashboardWidgets checks): it would erase that later change too
  undo = () => {
    const { toast } = this.state;
    if (!toast || !toast.undo) {
      return null;
    }
    const { selector, boxes, savedBoxes } = toast.undo;
    return this.enqueueSave(async () => {
      try {
        const restored = await restoreDashboardWidgets(this.props.httpClient, selector, boxes, savedBoxes);
        this.props.onDashboardSaved(restored);
      } catch (e) {
        console.error(e);
        this.showToast(
          <Text id={e.name === 'DashboardChangedError' ? 'quickEdit.changedError' : 'quickEdit.saveError'} />
        );
      }
    });
  };

  showToast = (message, undo) => {
    this.setState(prevState => ({
      toast: { message, undo: undo || null, key: ((prevState.toast && prevState.toast.key) || 0) + 1 }
    }));
  };

  closeToast = () => this.setState({ toast: null });

  // The widget that just changed is brought into view and marked a moment — the rows just added
  // to it, when the widget tags its rows (DeviceCard: data-feature-selectors), rather than the
  // whole card: in a long widget they are at the bottom, under the toast
  flashWidget = (position, selectors = []) => {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const card = getSlotCard(getSlot(position.x, position.y));
        if (!card) {
          return;
        }
        const rows = Array.from(card.querySelectorAll('[data-feature-selectors]')).filter(row =>
          row
            .getAttribute('data-feature-selectors')
            .split(' ')
            .some(selector => selectors.includes(selector))
        );
        const target = rows[0] || card;
        const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({
          block: rows.length > 0 ? 'center' : 'nearest',
          behavior: reduceMotion ? 'auto' : 'smooth'
        });
        const marked = rows.length > 0 ? rows : [card];
        marked.forEach(element => element.classList.add(ADDED_CLASS));
        setTimeout(() => marked.forEach(element => element.classList.remove(ADDED_CLASS)), FLASH_MS);
      })
    );
  };

  // ------------------------------------------------------------ lifecycle
  componentDidMount() {
    document.addEventListener('pointerdown', this.onPointerDown, true);
    document.addEventListener('pointermove', this.onPointerMove, true);
    document.addEventListener('pointerup', this.onPointerEnd, true);
    document.addEventListener('pointercancel', this.onPointerEnd, true);
    document.addEventListener('contextmenu', this.onContextMenu);
  }

  componentWillUnmount() {
    this.cancelPress();
    this.markMenuTarget(null);
    document.removeEventListener('pointerdown', this.onPointerDown, true);
    document.removeEventListener('pointermove', this.onPointerMove, true);
    document.removeEventListener('pointerup', this.onPointerEnd, true);
    document.removeEventListener('pointercancel', this.onPointerEnd, true);
    document.removeEventListener('contextmenu', this.onContextMenu);
  }

  // another dashboard (the pager, a pill of the dock): nothing open can still be about this one —
  // the widget menu, the devices sheet, the "+" menu and the add flow, whose "Where to add it?"
  // holds the dashboard it loaded
  componentWillReceiveProps(nextProps) {
    const selector = get(nextProps, 'currentDashboard.selector');
    if (selector === get(this.props, 'currentDashboard.selector')) {
      return;
    }
    if (this.state.menu || this.state.devicesSheet || this.state.addStep) {
      this.markMenuTarget(null);
      this.setState({ menu: null, devicesSheet: null, addStep: null });
    }
    if (nextProps.addMenuOpen) {
      nextProps.closeAddMenu();
    }
  }

  // ------------------------------------------------------------ render
  renderMenu(dictionary) {
    const { menu } = this.state;
    const box = menu ? this.getBox(menu.x, menu.y) : null;
    const isDevices = box && box.type === 'devices';
    return (
      <BottomSheet
        open={Boolean(box)}
        title={box ? getBoxLabel(dictionary, box) : ''}
        onClose={this.closeMenu}
        dataCy="widget-menu"
      >
        {box && (
          <div class={style.menuBody}>
            <MobileGroup>
              {isDevices && (
                <MobileRow
                  icon="plus"
                  title={<Text id="quickEdit.addDevices" />}
                  onClick={() => this.openDevicesSheet('add')}
                  dataCy="widget-menu-add-devices"
                />
              )}
              {isDevices && (
                <MobileRow
                  icon="edit-2"
                  title={<Text id="quickEdit.editDevices" />}
                  subtitle={<Text id="quickEdit.editDevicesHint" />}
                  onClick={() => this.openDevicesSheet('edit')}
                  dataCy="widget-menu-edit-devices"
                />
              )}
              {!isDevices && (
                <MobileRow
                  icon="settings"
                  title={<Text id="quickEdit.widgetSettings" />}
                  onClick={() => this.openEditorOn('settings')}
                  dataCy="widget-menu-settings"
                />
              )}
              <MobileRow
                icon="corner-down-right"
                title={<Text id="quickEdit.moveWidget" />}
                onClick={() => this.openEditorOn('move')}
                dataCy="widget-menu-move"
              />
              <MobileRow
                icon="trash-2"
                tone="danger"
                title={<Text id="quickEdit.removeWidget" />}
                onClick={this.removeWidget}
                chevron={false}
                dataCy="widget-menu-remove"
              />
            </MobileGroup>
            <MobileGroup>
              <MobileRow
                icon="layout"
                title={<Text id="quickEdit.editLayout" />}
                subtitle={<Text id="quickEdit.editLayoutHint" />}
                onClick={() => this.openEditorOn('select')}
                dataCy="widget-menu-layout"
              />
            </MobileGroup>
          </div>
        )}
      </BottomSheet>
    );
  }

  renderDevicesSheet(dictionary) {
    const sheet = this.state.devicesSheet;
    const add = sheet && sheet.mode === 'add';
    return (
      <BottomSheet
        open={Boolean(sheet)}
        size="full"
        title={
          sheet
            ? add
              ? get(dictionary, 'quickEdit.addDevicesTo').replace('{{name}}', getBoxLabel(dictionary, sheet.original))
              : getBoxLabel(dictionary, sheet.original)
            : ''
        }
        onClose={this.closeDevicesSheet}
        dataCy="widget-devices-sheet"
      >
        {sheet && (
          <div class={style.pickerHost}>
            <EditDevices
              box={this.draft}
              x={sheet.x}
              y={sheet.y}
              updateBoxConfig={this.updateDraft}
              initialView={add ? 'picker' : undefined}
              onPickerDone={add ? this.onPickerDone : undefined}
              pickerValidateLabel={add ? <Text id="quickEdit.add" /> : undefined}
              draftVersion={this.state.draftVersion}
            />
          </div>
        )}
      </BottomSheet>
    );
  }

  renderAddMenu() {
    return (
      <BottomSheet
        open={Boolean(this.props.addMenuOpen)}
        title={get(this.props.intl.dictionary, 'quickEdit.addMenuTitle')}
        onClose={this.props.closeAddMenu}
        dataCy="dashboard-add-menu"
      >
        <div class={style.menuBody}>
          <MobileGroup>
            <MobileRow
              icon="plus-circle"
              title={<Text id="quickEdit.addDevice" />}
              subtitle={<Text id="quickEdit.addDeviceHint" />}
              onClick={this.startAddDevice}
              dataCy="dashboard-add-device"
            />
            <MobileRow
              icon="grid"
              title={<Text id="quickEdit.addWidget" />}
              subtitle={<Text id="quickEdit.addWidgetHint" />}
              onClick={() => {
                this.props.closeAddMenu();
                this.props.openEditor({ x: 0, y: 0, intent: 'add-top' });
              }}
              dataCy="dashboard-add-widget"
            />
          </MobileGroup>
          <MobileGroup>
            <MobileRow
              icon="layout"
              title={<Text id="quickEdit.editLayout" />}
              subtitle={<Text id="quickEdit.editLayoutHint" />}
              onClick={() => {
                this.props.closeAddMenu();
                this.props.openEditor(null);
              }}
              dataCy="dashboard-edit-layout"
            />
          </MobileGroup>
        </div>
      </BottomSheet>
    );
  }

  renderAddDevice(dictionary) {
    const { addStep, devices, addSelectors } = this.state;
    return (
      <div>
        <BottomSheet
          open={addStep === 'pick'}
          size="full"
          title={get(dictionary, 'quickEdit.addDevice')}
          onClose={this.closeAdd}
          dataCy="dashboard-add-device-sheet"
        >
          {addStep === 'pick' && (
            <div class={style.pickerHost}>
              {devices ? (
                <DeviceFeaturePicker
                  devices={devices}
                  selected={addSelectors}
                  onValidate={this.onDevicesPicked}
                  onCancel={this.closeAdd}
                  hideBackButton
                  groupLights
                  suggestions={getWidgetSuggestions(devices, [])}
                  validateLabel={<Text id="quickEdit.next" />}
                />
              ) : (
                <div class={style.loader} aria-hidden="true" />
              )}
            </div>
          )}
        </BottomSheet>
        <AddToDashboardSheet
          open={addStep === 'where'}
          selectors={addSelectors}
          devices={devices}
          dashboardSelector={get(this.props, 'currentDashboard.selector')}
          onClose={this.closeAdd}
          onBack={this.backToPicker}
          onAdded={this.onAdded}
          enqueueSave={this.enqueueSave}
        />
      </div>
    );
  }

  render(props, { toast }) {
    const dictionary = props.intl.dictionary;
    if (!props.currentDashboard) {
      return null;
    }
    return (
      <div>
        {this.renderMenu(dictionary)}
        {this.renderDevicesSheet(dictionary)}
        {this.renderAddMenu()}
        {this.renderAddDevice(dictionary)}
        <MobileToast
          message={toast && toast.message}
          toastKey={toast && toast.key}
          actionLabel={toast && toast.undo ? <Text id="quickEdit.undo" /> : null}
          onAction={this.undo}
          onClose={this.closeToast}
          duration={UNDO_TOAST_MS}
          aboveDock
          dataCy="quick-edit-toast"
        />
      </div>
    );
  }
}

export default withIntlAsProp(connect('httpClient', {})(QuickEditor));
