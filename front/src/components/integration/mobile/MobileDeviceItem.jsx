import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import { route } from 'preact-router';
import cx from 'classnames';
import get from 'get-value';

import BottomSheet from '../../sheet/BottomSheet';
import { isSheetEntryOnTop } from '../../sheet/sheetHistory';
import DeviceFeatures from '../../device/view/DeviceFeatures';
import withIntlAsProp from '../../../utils/withIntlAsProp';
import { MobileRow, MobileNotice, MobileField, fieldClass, BigButton, ConfirmSheet, kitStyle } from '../../mobile';
import { MobileIntegrationToastContext } from './MobileIntegrationTab';
import { getDeviceIcon, getRoomLabel } from './utils';
import style from './style.css';

let nextItemId = 0;

// what the user can change in the sheet of a device: its name, its room, and what the
// integration adds to it (`extraSignature`: the features whose history is kept…)
const getSignature = (device, extraSignature) =>
  JSON.stringify([device.name || '', device.room_id || '', extraSignature === undefined ? null : extraSignature]);

/**
 * @description One device of an integration on a phone
 * (docs/specs/mobile-pages/integration-devices.md, C and D): its row in the list, and the sheet
 * the row opens — what the desktop card of the device holds. A presentation only: every change
 * and every request goes through the handlers of the card it replaces.
 *
 * Row — icon, title, subtitle (the room by default), then `status` (a pill: "In Gladys",
 * "Update") and `pills` (battery, disconnected…) on a line under them.
 *
 * Sheet — `notices`, the name and the room (when onNameChange / onRoomChange are given: they get
 * the event of the desktop fields), `children`, the features, `details` ([{ label, value, mono }],
 * behind "Show the details" with `detailsFolded`), then the buttons:
 * - onSave: "Save", disabled while nothing changed (unless `saveAlways`: a device that was
 *   never saved has nothing to differ from); with `guard` (the default with onSave),
 *   closing the sheet with unsaved changes asks first;
 * - primaryAction { label, onClick, icon, disabled, toast, dataCy, confirm }: the action of a
 *   discovered device ("Add to Gladys"); with `confirm` ({ title, text, confirmLabel }) it asks
 *   first, in a sheet over this one (a device added with generic features);
 * - actions [{ label, href | onClick, icon, toast, keepOpen, disabled, dataCy }]: the other ones
 *   ("Edit");
 *   with `keepOpen` a success leaves the sheet open (its result shows in it: a connection test);
 * - onDelete: "Delete", confirmed in a sheet.
 * onSave, primaryAction.onClick and onDelete return a promise of `false` when they failed: the
 * sheet then stays open with `saveError` / `deleteError` (or a default sentence).
 * `deleteScheduled`: the deletion was not refused, Gladys does it in the background (a device
 * with too many states to delete at once). The confirmation closes, `deleteError` — the
 * explanation — is shown in the sheet as a plain notice, and nothing can be saved or deleted
 * again on a device that is going away.
 *
 * `nameHelp` is a footnote under the name (why "Save" is disabled). `onOpen` is called each time
 * the sheet opens: the card forgets the error of a previous visit.
 *
 * A device created in the list itself (a camera): `autoOpen` opens its sheet as soon as it is
 * true, and `onDismiss` is called when the sheet is closed without a request that succeeded —
 * the device that was never saved is then taken out of the list by its card.
 */
class MobileDeviceItem extends Component {
  constructor(props) {
    super(props);
    nextItemId += 1;
    this.fieldId = `mobile-device-${nextItemId}`;
    this.state = {
      open: false,
      // what the device was when its sheet opened: what "Close without saving" goes back to
      snapshot: null,
      detailsOpen: false,
      confirmDelete: false,
      confirmPrimary: false,
      leaveOpen: false,
      // the request running: 'save' | 'primary' | 'delete'
      busy: null,
      // the last request that failed, until the next one
      failed: null
    };
  }

  componentDidMount() {
    if (this.props.autoOpen) {
      this.open();
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.autoOpen && !prevProps.autoOpen && !this.state.open) {
      this.open();
    }
    // the notice takes the place of the confirmation that just closed: it must be on screen,
    // wherever the sheet was scrolled to
    if (this.props.deleteScheduled && !prevProps.deleteScheduled && this.deleteScheduledNotice) {
      this.deleteScheduledNotice.scrollIntoView({ block: 'nearest' });
    }
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  setDeleteScheduledNotice = element => {
    this.deleteScheduledNotice = element;
  };

  isDirty = () => {
    const { snapshot } = this.state;
    return Boolean(snapshot) && getSignature(this.props.device, this.props.extraSignature) !== snapshot.signature;
  };

  hasGuard = () => (this.props.guard === undefined ? Boolean(this.props.onSave) : this.props.guard);

  open = () => {
    const { device, extraSignature } = this.props;
    this.setState({
      open: true,
      snapshot: { device, signature: getSignature(device, extraSignature) },
      detailsOpen: false,
      confirmDelete: false,
      confirmPrimary: false,
      leaveOpen: false,
      failed: null
    });
    if (this.props.onOpen) {
      this.props.onOpen();
    }
  };

  // closed without a request that succeeded (`run` closes the sheet itself after one)
  close = () => {
    this.setState({ open: false, confirmDelete: false, confirmPrimary: false, leaveOpen: false });
    if (this.props.onDismiss) {
      this.props.onDismiss();
    }
  };

  // where an action of the sheet ("Edit") was leading when it met unsaved changes
  leaveToPendingHref = () => {
    const href = this.pendingHref;
    this.pendingHref = null;
    if (href) {
      // the entry of the sheets is on top of the history: the navigation replaces it, so "back"
      // from the next page lands on the list once
      route(href, isSheetEntryOnTop());
    }
  };

  // the header button, the backdrop, a drag and the system "back" all come here
  requestClose = () => {
    if (this.state.busy) {
      return;
    }
    this.pendingHref = null;
    if (this.hasGuard() && this.isDirty()) {
      // a device that is going away has nothing left to save: its changes are dropped, without
      // offering "Save and close"
      if (this.props.deleteScheduled) {
        this.closeWithoutSaving();
        return;
      }
      this.setState({ leaveOpen: true });
      return;
    }
    this.close();
  };

  /**
   * @description Runs a request of the card and reports it where the user is.
   * @param {string} kind - 'save' | 'primary' | 'delete' | 'action-<index>'.
   * @param {Function} handler - The handler of the desktop card; resolves to false on a failure.
   * @param {object} toast - The message of the toast on a success.
   * @param {boolean} keepOpen - A success leaves the sheet open.
   * @returns {Promise<boolean>} True when the request went through.
   * @example
   * this.run('save', this.props.onSave, <Text id="mobileKit.saved" />);
   */
  run = async (kind, handler, toast, keepOpen) => {
    if (this.state.busy) {
      return false;
    }
    this.setState({ busy: kind, failed: null });
    let succeeded = false;
    try {
      succeeded = (await handler()) !== false;
    } catch (e) {
      console.error(e);
    }
    if (succeeded && toast) {
      this.context(toast);
    }
    // a device deleted or added is gone from the list, and its row with it
    if (!this.unmounted) {
      this.setState({
        busy: null,
        failed: succeeded ? null : kind,
        ...(succeeded && !keepOpen ? { open: false, confirmDelete: false, leaveOpen: false } : {}),
        // a confirmation answered: its outcome shows in the sheet
        ...(kind === 'primary' ? { confirmPrimary: false } : {})
      });
    }
    return succeeded;
  };

  save = () => this.run('save', this.props.onSave, this.props.savedToast || <Text id="mobileKit.saved" />);

  runPrimary = () => {
    const { primaryAction } = this.props;
    if (primaryAction.confirm && !this.state.confirmPrimary) {
      this.setState({ confirmPrimary: true, failed: null });
      return Promise.resolve(false);
    }
    return this.run('primary', primaryAction.onClick, primaryAction.toast);
  };

  cancelPrimary = () => {
    if (this.state.busy !== 'primary') {
      this.setState({ confirmPrimary: false });
    }
  };

  // another request of the card ("Update" a meter): same feedback as the primary one
  runAction = (action, index) => () => this.run(`action-${index}`, action.onClick, action.toast, action.keepOpen);

  askDelete = () => this.setState({ confirmDelete: true, failed: null });
  cancelDelete = () => {
    if (this.state.busy !== 'delete') {
      this.setState({ confirmDelete: false });
    }
  };
  confirmDelete = () =>
    this.run('delete', this.props.onDelete, this.props.deletedToast || <Text id="mobileDeviceList.deleted" />);

  // ---------- leaving the sheet with unsaved changes ----------

  keepEditing = () => {
    this.pendingHref = null;
    this.setState({ leaveOpen: false });
  };

  saveAndClose = async () => {
    this.setState({ leaveOpen: false });
    if (await this.save()) {
      this.leaveToPendingHref();
    } else {
      this.pendingHref = null;
    }
  };

  closeWithoutSaving = () => {
    const { device, onNameChange, onRoomChange, onRevert } = this.props;
    const saved = this.state.snapshot.device;
    // the changes live in the state of the card, as on a wider screen: they are undone through
    // the handlers that made them
    if (onNameChange && (device.name || '') !== (saved.name || '')) {
      onNameChange({ target: { value: saved.name || '' } });
    }
    if (onRoomChange && (device.room_id || '') !== (saved.room_id || '')) {
      onRoomChange({ target: { value: saved.room_id || '' } });
    }
    if (onRevert) {
      onRevert(saved);
    }
    this.close();
    this.leaveToPendingHref();
  };

  // an action leading to another page ("Edit"): with unsaved changes it asks first, like closing
  // the sheet, then leads where it pointed
  goTo = href => () => {
    this.pendingHref = href;
    if (this.hasGuard() && this.isDirty()) {
      this.setState({ leaveOpen: true });
      return;
    }
    this.leaveToPendingHref();
  };

  toggleDetails = () => this.setState(prevState => ({ detailsOpen: !prevState.detailsOpen }));

  renderDetails = () => {
    const { detailsFolded } = this.props;
    const details = (this.props.details || []).filter(
      detail => detail && detail.value !== undefined && detail.value !== null && detail.value !== ''
    );
    if (details.length === 0) {
      return null;
    }
    const shown = !detailsFolded || this.state.detailsOpen;
    return (
      <div class={style.sheetSection}>
        {detailsFolded && (
          <button
            type="button"
            class={style.detailsToggle}
            onClick={this.toggleDetails}
            aria-expanded={shown ? 'true' : 'false'}
            data-cy="integration-device-details-toggle"
          >
            <i class={`fe fe-chevron-${shown ? 'up' : 'down'}`} aria-hidden="true" />
            <Text
              id={shown ? 'mobileDeviceList.hideDetails' : 'mobileDeviceList.showDetails'}
              fields={{ count: details.length }}
            />
          </button>
        )}
        {shown && (
          <dl class={style.details} data-cy="integration-device-details">
            {details.map(detail => (
              <div class={style.detail}>
                <dt class={style.detailLabel}>{detail.label}</dt>
                <dd class={cx(style.detailValue, { [style.detailValueMono]: detail.mono })}>{detail.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    );
  };

  renderSheet = () => {
    const {
      device,
      houses,
      intl,
      pills,
      notices,
      onNameChange,
      onRoomChange,
      nameInvalid,
      fieldsDisabled,
      namePlaceholderId = 'editDeviceForm.namePlaceholder',
      showFeatures = true,
      children,
      onSave,
      saveLabel,
      saveDisabled,
      saveError,
      primaryAction,
      actions = [],
      onDelete
    } = this.props;
    const { busy, failed } = this.state;
    const { deleteScheduled } = this.props;
    const features = device.features || [];
    const failedSave = Boolean(failed) && failed !== 'delete';
    // the pills of the row head the sheet too, unless the sheet says it another way (`sheetPills`)
    const sheetPills = this.props.sheetPills === undefined ? pills : this.props.sheetPills;
    return (
      <div>
        {sheetPills && <div class={style.sheetPills}>{sheetPills}</div>}
        {notices}
        {/* Nothing is edited while a request runs: what is typed after "Save" would not be in
            the request, and would be taken for saved when the sheet opens again. The fieldset
            covers what the integration adds to the sheet too (its switches). */}
        <fieldset
          class={style.sheetFields}
          disabled={Boolean(busy) || deleteScheduled}
          data-cy="integration-device-fields"
        >
          {onNameChange && (
            <MobileField
              label={<Text id="editDeviceForm.nameLabel" />}
              htmlFor={`${this.fieldId}-name`}
              help={this.props.nameHelp}
            >
              <Localizer>
                <input
                  id={`${this.fieldId}-name`}
                  type="text"
                  class={cx(fieldClass.input, { [fieldClass.invalid]: nameInvalid })}
                  value={device.name}
                  onInput={onNameChange}
                  placeholder={<Text id={namePlaceholderId} />}
                  disabled={fieldsDisabled}
                  autocomplete="off"
                  autocapitalize="sentences"
                  enterkeyhint="done"
                  data-cy="integration-device-name"
                />
              </Localizer>
            </MobileField>
          )}
          {onRoomChange && houses && (
            <MobileField label={<Text id="editDeviceForm.roomLabel" />} htmlFor={`${this.fieldId}-room`}>
              <select
                id={`${this.fieldId}-room`}
                class={fieldClass.select}
                onChange={onRoomChange}
                disabled={fieldsDisabled}
                data-cy="integration-device-room"
              >
                <option value="">{get(intl.dictionary, 'device.noRoom')}</option>
                {houses.map(house => (
                  <optgroup label={house.name}>
                    {(house.rooms || []).map(room => (
                      <option selected={room.id === device.room_id} value={room.id}>
                        {room.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </MobileField>
          )}
          {children}
        </fieldset>
        {showFeatures && (
          <div class={cx(style.sheetSection, style.features)} data-cy="integration-device-features">
            <div class={style.sheetLabel}>
              <Text id="editDeviceForm.featuresLabel" />
            </div>
            <DeviceFeatures features={features} />
          </div>
        )}
        {this.renderDetails()}
        {(saveError || failedSave) && (
          <MobileNotice tone="danger" icon="alert-circle" role="alert" data-cy="integration-device-error">
            {saveError || <Text id="mobileDeviceList.saveError" />}
          </MobileNotice>
        )}
        {deleteScheduled && (
          <div ref={this.setDeleteScheduledNotice}>
            <MobileNotice icon="clock" role="status" data-cy="integration-device-delete-scheduled">
              {this.props.deleteError}
            </MobileNotice>
          </div>
        )}
        <div class={cx(kitStyle.buttons, style.sheetButtons)}>
          {onSave && (
            <BigButton
              variant="primary"
              onClick={this.save}
              loading={busy === 'save'}
              disabled={Boolean(busy) || deleteScheduled || saveDisabled || !(this.props.saveAlways || this.isDirty())}
              data-cy="integration-device-save"
            >
              {saveLabel || <Text id="global.save" />}
            </BigButton>
          )}
          {primaryAction && (
            <BigButton
              variant={primaryAction.disabled ? undefined : 'primary'}
              icon={primaryAction.icon}
              onClick={primaryAction.href ? this.goTo(primaryAction.href) : this.runPrimary}
              loading={busy === 'primary'}
              disabled={Boolean(busy) || deleteScheduled || primaryAction.disabled}
              data-cy={primaryAction.dataCy || 'integration-device-primary'}
            >
              {primaryAction.label}
            </BigButton>
          )}
          {actions.map((action, index) => (
            <BigButton
              icon={action.icon}
              onClick={action.href ? this.goTo(action.href) : this.runAction(action, index)}
              loading={busy === `action-${index}`}
              disabled={Boolean(busy) || deleteScheduled || action.disabled}
              data-cy={action.dataCy}
            >
              {action.label}
            </BigButton>
          ))}
          {onDelete && (
            <BigButton
              variant="dangerSoft"
              icon="trash-2"
              onClick={this.askDelete}
              disabled={Boolean(busy) || deleteScheduled}
              data-cy="integration-device-delete"
            >
              <Text id="mobileDeviceList.delete" />
            </BigButton>
          )}
        </div>
      </div>
    );
  };

  render(props, { open, confirmDelete, confirmPrimary, leaveOpen, busy, failed }) {
    const { device, houses, intl, dataCy } = props;
    const name = device.name || get(intl.dictionary, 'mobileDeviceList.noName');
    const subtitle = props.subtitle === undefined ? getRoomLabel(houses, device, intl) : props.subtitle;
    return [
      <MobileRow
        icon={props.icon || getDeviceIcon(device)}
        iconTone={props.iconTone}
        title={props.title || name}
        subtitle={subtitle}
        // under the name, not beside it: a long name keeps the width of the row
        meta={
          props.status || props.pills ? (
            <span class={style.pillLine}>
              {props.status}
              {props.pills}
            </span>
          ) : null
        }
        chevron
        onClick={this.open}
        dataCy={dataCy || 'integration-device-row'}
      />,
      <BottomSheet
        open={open}
        title={props.sheetTitle || name}
        onClose={this.requestClose}
        dataCy={props.sheetDataCy || 'integration-device-sheet'}
      >
        {this.renderSheet()}
      </BottomSheet>,
      props.primaryAction && props.primaryAction.confirm && (
        <ConfirmSheet
          open={open && confirmPrimary}
          depth={1}
          title={props.primaryAction.confirm.title}
          text={props.primaryAction.confirm.text}
          confirmLabel={props.primaryAction.confirm.confirmLabel}
          loading={busy === 'primary'}
          onConfirm={this.runPrimary}
          onCancel={this.cancelPrimary}
          dataCy="integration-device-primary-confirm"
        />
      ),
      props.onDelete && (
        <ConfirmSheet
          open={open && confirmDelete && !props.deleteScheduled}
          depth={1}
          title={get(intl.dictionary, 'mobileDeviceList.deleteTitle')}
          text={props.deleteText || <Text id="mobileDeviceList.deleteText" fields={{ name }} />}
          confirmLabel={<Text id="mobileDeviceList.deleteConfirm" />}
          destructive
          loading={busy === 'delete'}
          onConfirm={this.confirmDelete}
          onCancel={this.cancelDelete}
          dataCy="integration-device-delete-sheet"
        >
          {(props.deleteError || failed === 'delete') && (
            <MobileNotice tone="danger" icon="alert-circle" role="alert" data-cy="integration-device-delete-error">
              {props.deleteError || <Text id="mobileDeviceList.deleteError" />}
            </MobileNotice>
          )}
        </ConfirmSheet>
      ),
      this.hasGuard() && (
        <BottomSheet
          open={open && leaveOpen}
          depth={1}
          title={get(intl.dictionary, 'mobileKit.leaveTitle')}
          onClose={this.keepEditing}
          dataCy="integration-device-leave-sheet"
        >
          <p class={kitStyle.sheetText}>
            <Text id="mobileKit.leaveText" />
          </p>
          <div class={kitStyle.buttons}>
            <BigButton
              variant="primary"
              onClick={this.saveAndClose}
              disabled={props.saveDisabled}
              data-cy="integration-device-leave-save"
            >
              <Text id="mobileDeviceList.saveAndClose" />
            </BigButton>
            <BigButton
              variant="dangerSoft"
              onClick={this.closeWithoutSaving}
              data-cy="integration-device-leave-discard"
            >
              <Text id="mobileDeviceList.closeWithoutSaving" />
            </BigButton>
            <BigButton variant="ghost" onClick={this.keepEditing} data-cy="integration-device-leave-keep">
              <Text id="mobileKit.keepEditing" />
            </BigButton>
          </div>
        </BottomSheet>
      )
    ];
  }
}

MobileDeviceItem.contextType = MobileIntegrationToastContext;

export default withIntlAsProp(MobileDeviceItem);
