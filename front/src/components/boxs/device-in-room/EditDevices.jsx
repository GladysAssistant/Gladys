import { Component } from 'preact';
import { Localizer, Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import cx from 'classnames';
import get from 'get-value';

import BaseEditBox from '../baseEditBox';
import DeviceFeaturePicker from '../../device/DeviceFeaturePicker';
import DeviceFeatureValueText from '../../device/DeviceFeatureValueText';
import { DeviceFeatureCategoriesIcon } from '../../../utils/consts';
import { getDeviceFeatureName, getDeviceFeatureDescription } from '../../../utils/device';
import { startPointerDrag } from '../../../utils/pointerDrag';
import { computeInsertionIndex, insertionLineRect } from '../../../routes/dashboard/edit-dashboard/widgetDropPlacement';
import { revealAbovePanel } from '../../../utils/revealAbovePanel';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import style from './editDevices.css';

const VIEW_LIST = 'list';
const VIEW_DETAIL = 'detail';
const VIEW_PICKER = 'picker';
const UNDO_DURATION_MS = 6000;
// global class: the row lives in the canvas preview (DeviceCard), outside
// this component's tree
const PREVIEW_ROW_HIGHLIGHT_CLASS = 'gladys-editing-device-row';

// Six-dot grip: the icon set has no grab glyph, and the ≡ "menu" icon reads
// as a menu button, not as something to hold
const GripIcon = () => (
  <svg class={style.gripIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <circle cx="9" cy="6" r="1.6" />
    <circle cx="15" cy="6" r="1.6" />
    <circle cx="9" cy="12" r="1.6" />
    <circle cx="15" cy="12" r="1.6" />
    <circle cx="9" cy="18" r="1.6" />
    <circle cx="15" cy="18" r="1.6" />
  </svg>
);

const getFeatureIcon = feature => get(DeviceFeatureCategoriesIcon, `${feature.category}.${feature.type}`) || 'sliders';

// The panel body (EditPanel) is the scroll container of the form: a view
// change must start at its top, not where the previous view was scrolled
const scrollPanelToTop = element => {
  let node = element ? element.parentElement : null;
  while (node && node !== document.body) {
    const { overflowY } = window.getComputedStyle(node);
    if (overflowY === 'auto' || overflowY === 'scroll') {
      node.scrollTop = 0;
      return;
    }
    node = node.parentElement;
  }
};

// One row of the compact list: no text input (a stray tap must never open
// the keyboard), a tap opens the detail, the handle drags on the editor's
// pointer-events engine
const DeviceListRow = ({ item, index, onOpen, onHandlePointerDown, displayName, moveLabel }) => (
  <div class={style.row} data-device-row data-index={index} data-cy={`devices-row-${index}`}>
    <span class={style.badge} aria-hidden="true">
      <i class={`fe fe-${item.entry ? getFeatureIcon(item.entry.feature) : 'alert-circle'}`} />
    </span>
    <button type="button" class={style.rowMain} onClick={() => onOpen(item.selector)}>
      <span class={style.rowName}>{displayName}</span>
      <span class={style.rowSub}>
        {item.entry ? `${item.entry.device.name} · ${item.description}` : item.missingLabel}
      </span>
    </button>
    {item.entry && (
      <span class={style.rowValue}>
        <DeviceFeatureValueText feature={item.entry.feature} />
      </span>
    )}
    <button
      type="button"
      class={style.handle}
      onPointerDown={event => onHandlePointerDown(event, index, displayName)}
      aria-label={moveLabel}
      data-cy={`devices-row-handle-${index}`}
    >
      <GripIcon />
    </button>
  </div>
);

// Settings form of the "devices" widget, mobile-first (A.3.1 of
// docs/specs/dashboard-flexible-layout-and-widgets.md): a compact list, a
// detail view per feature (rename, move, remove) and a full-height picker,
// replacing each other inside the edit panel. The box config is the only
// state that matters: every change writes device_features and the aligned
// device_feature_names (pre-filled with the generated default name, which
// the viewers treat as "not renamed") straight through updateBoxConfig.
class EditDevices extends Component {
  state = {
    devices: null,
    loading: true,
    loadError: false,
    view: VIEW_LIST,
    detailSelector: null,
    draftName: '',
    undo: null
  };

  getDevices = async () => {
    try {
      const devices = await this.props.httpClient.get('/api/v1/device');
      const featuresBySelector = {};
      devices.forEach(device => {
        (device.features || []).forEach(feature => {
          featuresBySelector[feature.selector] = { device, feature };
        });
      });
      const isNewWidget = (get(this.props, 'box.device_features') || []).length === 0;
      this.setState({
        devices,
        featuresBySelector,
        loading: false,
        // a widget that was just created has nothing to list: straight to the picker
        view: isNewWidget ? VIEW_PICKER : this.state.view
      });
    } catch (e) {
      console.error(e);
      this.setState({ loading: false, loadError: true });
    }
  };

  getDefaultName = (selector, entry) =>
    entry ? getDeviceFeatureName(this.props.intl.dictionary, entry.device, entry.feature) : selector;

  getItems = () => {
    const selectors = get(this.props, 'box.device_features') || [];
    const names = get(this.props, 'box.device_feature_names') || [];
    const featuresBySelector = this.state.featuresBySelector || {};
    return selectors.map((selector, index) => {
      const entry = featuresBySelector[selector];
      const defaultName = this.getDefaultName(selector, entry);
      const storedName = names[index];
      return {
        selector,
        entry,
        defaultName,
        description: entry ? getDeviceFeatureDescription(this.props.intl.dictionary, entry.device, entry.feature) : '',
        // a selector whose device is gone keeps its row (removable), unless
        // the devices could not be loaded at all
        missingLabel: this.state.loadError
          ? ''
          : get(this.props.intl.dictionary, 'dashboard.boxes.devices.deviceNotFound'),
        name: storedName,
        isCustom: Boolean(entry && storedName && storedName !== defaultName)
      };
    });
  };

  getDisplayName = item => item.name || item.defaultName;

  writeItems = items => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      device_features: items.map(item => item.selector),
      device_feature_names: items.map(item => item.name || item.defaultName)
    });
  };

  snapshot = () => ({
    device_features: [...(get(this.props, 'box.device_features') || [])],
    device_feature_names: [...(get(this.props, 'box.device_feature_names') || [])]
  });

  showUndo = (message, previous) => {
    clearTimeout(this.undoTimeout);
    this.setState({ undo: { message, previous } });
    this.undoTimeout = setTimeout(() => this.setState({ undo: null }), UNDO_DURATION_MS);
  };

  undo = () => {
    const { undo } = this.state;
    if (!undo) {
      return;
    }
    clearTimeout(this.undoTimeout);
    this.props.updateBoxConfig(this.props.x, this.props.y, undo.previous);
    this.setState({ undo: null });
  };

  updateWidgetName = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, { name: e.target.value });
  };

  moveItem = (from, to) => {
    const items = this.getItems();
    if (to < 0 || to >= items.length || from === to) {
      return;
    }
    const [item] = items.splice(from, 1);
    items.splice(to, 0, item);
    this.writeItems(items);
  };

  // ------------------------------------------------------------ navigation
  setView = (view, extra = {}) => {
    this.setState({ view, ...extra });
  };

  openDetail = selector => {
    const item = this.getItems().find(i => i.selector === selector);
    this.setView(VIEW_DETAIL, { detailSelector: selector, draftName: item && item.isCustom ? item.name : '' });
  };

  backToList = () => this.setView(VIEW_LIST, { detailSelector: null });

  openPicker = () => this.setView(VIEW_PICKER);

  // ------------------------------------------------------------ detail view
  updateDraftName = e => {
    const draftName = e.target.value;
    this.setState({ draftName });
    const items = this.getItems();
    const item = items.find(i => i.selector === this.state.detailSelector);
    if (!item) {
      return;
    }
    // an empty name means "the default name", written right away: the
    // widget must never keep showing the name that was just erased
    item.name = draftName.trim() ? draftName : item.defaultName;
    this.writeItems(items);
  };

  useDefaultName = () => {
    this.updateDraftName({ target: { value: '' } });
  };

  moveDetail = direction => {
    const index = this.getItems().findIndex(i => i.selector === this.state.detailSelector);
    this.moveItem(index, index + direction);
  };

  moveDetailUp = () => this.moveDetail(-1);

  moveDetailDown = () => this.moveDetail(1);

  removeDetail = () => {
    const previous = this.snapshot();
    const items = this.getItems();
    const item = items.find(i => i.selector === this.state.detailSelector);
    this.writeItems(items.filter(i => i.selector !== this.state.detailSelector));
    this.backToList();
    if (item) {
      this.showUndo(
        <Text id="dashboard.boxes.devices.removedUndo" fields={{ name: this.getDisplayName(item) }} />,
        previous
      );
    }
  };

  // ------------------------------------------------------------ picker
  validatePicker = selectors => {
    const previous = this.snapshot();
    const items = this.getItems();
    const kept = items.filter(item => selectors.includes(item.selector));
    const keptSelectors = kept.map(item => item.selector);
    const featuresBySelector = this.state.featuresBySelector || {};
    const added = selectors
      .filter(selector => !keptSelectors.includes(selector))
      .map(selector => ({
        selector,
        name: null,
        defaultName: this.getDefaultName(selector, featuresBySelector[selector])
      }));
    const removedCount = items.length - kept.length;
    this.backToList();
    if (added.length === 0 && removedCount === 0) {
      return;
    }
    this.writeItems([...kept, ...added]);
    this.showUndo(
      <span>
        {added.length > 0 && (
          <Text id="dashboard.boxes.devices.addedCount" plural={added.length} fields={{ count: added.length }} />
        )}
        {added.length > 0 && removedCount > 0 && ', '}
        {removedCount > 0 && (
          <Text id="dashboard.boxes.devices.removedCount" plural={removedCount} fields={{ count: removedCount }} />
        )}
      </span>,
      previous
    );
  };

  // ------------------------------------------------------------ drag to reorder
  resolveListPlacement = (target, point) => {
    const list = target.hasAttribute('data-device-list') ? target : target.closest('[data-device-list]');
    if (!list) {
      return null;
    }
    const rows = Array.from(list.querySelectorAll('[data-device-row]'));
    return { list, rows, index: computeInsertionIndex(rows, point.y) };
  };

  onHandlePointerDown = (event, index, label) => {
    const source = event.currentTarget.closest('[data-device-row]');
    const isNoop = insertion => insertion === index || insertion === index + 1;
    startPointerDrag(event, {
      source,
      draggingClass: style.rowDragging,
      dropSelector: '[data-device-row], [data-device-list]',
      ghostClass: style.dragGhost,
      ghostIconClass: 'fe fe-menu',
      ghostLabel: label,
      bodyClass: 'gladys-list-dragging',
      indicatorClass: style.dropIndicator,
      resolveHover: (target, point) => {
        const placement = this.resolveListPlacement(target, point);
        if (!placement) {
          return null;
        }
        return {
          area: null,
          indicator: isNoop(placement.index)
            ? null
            : insertionLineRect(placement.list.getBoundingClientRect(), placement.rows, placement.index)
        };
      },
      onDrop: (target, point) => {
        const placement = this.resolveListPlacement(target, point);
        if (!placement || isNoop(placement.index)) {
          return;
        }
        // removal shifts the indices below the source before re-insertion
        this.moveItem(index, placement.index > index ? placement.index - 1 : placement.index);
      }
    });
  };

  // ------------------------------------------------------------ panel header & height
  // The sub-views put their title and a back button in the panel header
  // (EditPanel setPanelHeader) instead of a row of their own, and the picker
  // asks for the expanded sheet
  syncPanel = () => {
    const { setPanelHeader, setPanelExpanded } = this.props;
    const { view } = this.state;
    if (setPanelHeader) {
      if (view === VIEW_DETAIL) {
        setPanelHeader({
          title: <Text id="dashboard.boxes.devices.detailTitle" />,
          backLabel: <Text id="dashboard.boxes.devices.backToList" />,
          onBack: this.backToList
        });
      } else if (view === VIEW_PICKER) {
        setPanelHeader({
          title: <Text id="deviceFeaturePicker.title" />,
          backLabel: <Text id="deviceFeaturePicker.cancel" />,
          onBack: this.backToList
        });
      } else {
        setPanelHeader(null);
      }
    }
    if (setPanelExpanded) {
      setPanelExpanded(view === VIEW_PICKER);
    }
  };

  // ------------------------------------------------------------ live preview highlight
  // In the detail view, the row being edited is outlined in the widget's
  // live preview on the canvas, and scrolled above the mobile sheet
  getPanelElement = () => (this.root && this.root.closest ? this.root.closest('[data-cy="edit-panel"]') : null);

  findPreviewRow = selector => {
    const widget = document.querySelector('[data-widget-wrapper][data-editing]');
    if (!widget || !selector) {
      return null;
    }
    return (
      Array.from(widget.querySelectorAll('[data-feature-selectors]')).find(row =>
        row
          .getAttribute('data-feature-selectors')
          .split(' ')
          .includes(selector)
      ) || null
    );
  };

  clearPreviewHighlight = () => {
    document.querySelectorAll(`.${PREVIEW_ROW_HIGHLIGHT_CLASS}`).forEach(row => {
      row.classList.remove(PREVIEW_ROW_HIGHLIGHT_CLASS);
    });
  };

  // the preview re-renders after the config changes (rename, move): applied
  // a frame later, idempotent, and the reveal only when asked
  schedulePreviewHighlight = reveal => {
    // several updates can land in one frame (the header sync re-renders the
    // panel right after a view change): a reveal asked by any of them stays
    // asked, a later "no reveal" must not cancel it
    this.pendingReveal = this.pendingReveal || reveal;
    cancelAnimationFrame(this.highlightFrame);
    this.highlightFrame = requestAnimationFrame(() => {
      const shouldReveal = this.pendingReveal;
      this.pendingReveal = false;
      const selector = this.state.view === VIEW_DETAIL ? this.state.detailSelector : null;
      const row = this.findPreviewRow(selector);
      if (!row || !row.classList.contains(PREVIEW_ROW_HIGHLIGHT_CLASS)) {
        this.clearPreviewHighlight();
        if (row) {
          row.classList.add(PREVIEW_ROW_HIGHLIGHT_CLASS);
        }
      }
      if (row && shouldReveal) {
        revealAbovePanel(row, this.getPanelElement(), 'center');
      }
    });
  };

  // ------------------------------------------------------------ lifecycle
  setRootRef = element => {
    this.root = element;
  };

  componentDidMount() {
    this.syncedView = this.state.view;
    this.previousSyncedView = this.state.view;
    this.syncedOrder = get(this.props, 'box.device_features');
    this.getDevices();
    this.syncPanel();
  }

  // The view, detail and order last applied to the panel and the preview
  // are tracked here, not read from previousState: a parent re-render
  // triggered from this very hook (setPanelHeader / setPanelExpanded) can
  // hand the next update a stale previousState, which re-synced the panel
  // and undid the user's own height change on the grab handle.
  componentDidUpdate() {
    const { view, detailSelector } = this.state;
    const order = get(this.props, 'box.device_features');
    const viewChanged = view !== this.syncedView;
    if (viewChanged) {
      this.syncedView = view;
      scrollPanelToTop(this.root);
      this.syncPanel();
    }
    const detailChanged = viewChanged || detailSelector !== this.syncedDetailSelector;
    const orderChanged = order !== this.syncedOrder;
    this.syncedDetailSelector = detailSelector;
    this.syncedOrder = order;
    if (view === VIEW_DETAIL || (viewChanged && this.previousSyncedView === VIEW_DETAIL)) {
      this.schedulePreviewHighlight(detailChanged || orderChanged);
    }
    this.previousSyncedView = view;
  }

  componentWillUnmount() {
    clearTimeout(this.undoTimeout);
    cancelAnimationFrame(this.highlightFrame);
    this.clearPreviewHighlight();
    if (this.props.setPanelHeader) {
      this.props.setPanelHeader(null);
    }
    if (this.props.setPanelExpanded) {
      this.props.setPanelExpanded(false);
    }
  }

  // ------------------------------------------------------------ render
  renderUndo() {
    const { undo } = this.state;
    if (!undo) {
      return null;
    }
    return (
      <div class={style.undoBar} role="status" data-cy="devices-undo">
        <span class={style.undoMessage}>{undo.message}</span>
        <button type="button" class={style.undoButton} onClick={this.undo}>
          <Text id="dashboard.boxes.devices.undo" />
        </button>
      </div>
    );
  }

  renderList(props, items) {
    return (
      <div>
        {this.renderUndo()}
        {this.state.loadError && (
          <div class="alert alert-danger">
            <Text id="dashboard.boxes.devices.loadError" />
          </div>
        )}
        <div class={style.sectionLabel}>
          <Text id="dashboard.boxes.devices.listLabel" />
          <span class={style.sectionCount}>{items.length}</span>
        </div>
        {items.length > 0 ? (
          <div class={style.list} data-device-list>
            {items.map((item, index) => (
              <Localizer key={item.selector}>
                <DeviceListRow
                  item={item}
                  index={index}
                  displayName={this.getDisplayName(item)}
                  onOpen={this.openDetail}
                  onHandlePointerDown={this.onHandlePointerDown}
                  moveLabel={
                    <Text id="dashboard.boxes.devices.moveHandle" fields={{ name: this.getDisplayName(item) }} />
                  }
                />
              </Localizer>
            ))}
          </div>
        ) : (
          <div class={style.empty}>
            <Text id="dashboard.boxes.devices.emptyList" />
          </div>
        )}
        {items.length > 1 && (
          <p class={style.hint}>
            <Text id="dashboard.boxes.devices.dragHint" />
          </p>
        )}
        <div class={cx('form-group', style.titleField)}>
          <label class="form-label" for={`devices-widget-name-${props.x}-${props.y}`}>
            <Text id="dashboard.boxes.devices.editNameLabel" />
          </label>
          <Localizer>
            <input
              id={`devices-widget-name-${props.x}-${props.y}`}
              type="text"
              class={cx('form-control', style.input)}
              placeholder={<Text id="dashboard.boxes.devices.editNamePlaceholder" />}
              value={props.box.name}
              onInput={this.updateWidgetName}
            />
          </Localizer>
        </div>
        {/* pinned to the bottom of the panel: reachable whatever the length of the list */}
        <div class={style.stickyFooter}>
          <button
            type="button"
            class={style.primaryButton}
            onClick={this.openPicker}
            disabled={!this.state.devices}
            data-cy="devices-add-button"
          >
            <i class="fe fe-plus" />
            <Text id="dashboard.boxes.devices.addDevicesButton" />
          </button>
        </div>
      </div>
    );
  }

  renderDetail(props, items) {
    const index = items.findIndex(i => i.selector === this.state.detailSelector);
    const item = items[index];
    if (!item) {
      return null;
    }
    const inputId = `devices-feature-name-${props.x}-${props.y}`;
    return (
      <div data-cy="devices-detail">
        {/* inside the edit panel, the back button lives in its header (syncPanel) */}
        {!props.setPanelHeader && (
          <div class={style.backRow}>
            <button type="button" class={style.backButton} onClick={this.backToList}>
              <i class="fe fe-chevron-left" />
              <Text id="dashboard.boxes.devices.backToList" />
            </button>
          </div>
        )}
        <div class={style.deviceCard}>
          <span class={cx(style.badge, style.badgeLarge)} aria-hidden="true">
            <i class={`fe fe-${item.entry ? getFeatureIcon(item.entry.feature) : 'alert-circle'}`} />
          </span>
          <div class={style.deviceCardText}>
            <div class={style.deviceCardName}>{item.entry ? item.entry.device.name : item.selector}</div>
            <div class={style.rowSub}>
              {item.entry
                ? [item.description, get(item, 'entry.device.room.name')].filter(Boolean).join(' · ')
                : item.missingLabel}
            </div>
          </div>
          {item.entry && (
            <span class={style.deviceCardValue}>
              <DeviceFeatureValueText feature={item.entry.feature} />
            </span>
          )}
        </div>
        <div class="form-group">
          <label class="form-label" for={inputId}>
            <Text id="dashboard.boxes.devices.displayNameLabel" />
          </label>
          <input
            id={inputId}
            type="text"
            class={cx('form-control', style.input)}
            value={this.state.draftName}
            placeholder={item.defaultName}
            onInput={this.updateDraftName}
            data-cy="devices-detail-name"
          />
          {this.state.draftName.trim() ? (
            <button type="button" class={style.linkButton} onClick={this.useDefaultName}>
              <i class="fe fe-rotate-ccw" />
              <Text id="dashboard.boxes.devices.useDefaultName" />
            </button>
          ) : (
            <small class={style.hint}>
              <Text id="dashboard.boxes.devices.defaultNameHint" fields={{ name: item.defaultName }} />
            </small>
          )}
        </div>
        <div class={style.sectionLabel}>
          <Text id="dashboard.boxes.devices.position" fields={{ index: index + 1, total: items.length }} />
        </div>
        <div class={style.buttonRow}>
          <button
            type="button"
            class={style.softButton}
            onClick={this.moveDetailUp}
            disabled={index === 0}
            data-cy="devices-detail-up"
          >
            <i class="fe fe-arrow-up" />
            <Text id="dashboard.boxes.devices.moveUp" />
          </button>
          <button
            type="button"
            class={style.softButton}
            onClick={this.moveDetailDown}
            disabled={index === items.length - 1}
            data-cy="devices-detail-down"
          >
            <i class="fe fe-arrow-down" />
            <Text id="dashboard.boxes.devices.moveDown" />
          </button>
        </div>
        <button type="button" class={style.removeButton} onClick={this.removeDetail} data-cy="devices-detail-remove">
          <i class="fe fe-trash-2" />
          <Text id="dashboard.boxes.devices.removeFromWidget" />
        </button>
        <div class={style.stickyFooter}>
          <button type="button" class={style.primaryButton} onClick={this.backToList} data-cy="devices-detail-done">
            <i class="fe fe-check" />
            <Text id="dashboard.boxes.devices.done" />
          </button>
        </div>
      </div>
    );
  }

  render(props, { loading, view, devices }) {
    const items = this.getItems();
    let content;
    if (view === VIEW_PICKER && devices) {
      content = (
        <DeviceFeaturePicker
          devices={devices}
          selected={items.map(item => item.selector)}
          onValidate={this.validatePicker}
          onCancel={this.backToList}
          hideBackButton={Boolean(props.setPanelHeader)}
        />
      );
    } else if (view === VIEW_DETAIL) {
      content = this.renderDetail(props, items) || this.renderList(props, items);
    } else {
      content = this.renderList(props, items);
    }
    return (
      <BaseEditBox {...props} titleKey="dashboard.boxTitle.devices">
        <div class={loading ? 'dimmer active' : 'dimmer'} ref={this.setRootRef}>
          <div class="loader" />
          <div class={cx('dimmer-content', style.editDevices)}>{content}</div>
        </div>
      </BaseEditBox>
    );
  }
}

export default withIntlAsProp(connect('httpClient', {})(EditDevices));
