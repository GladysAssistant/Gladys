import { Component, Fragment } from 'preact';
import { Text } from 'preact-i18n';
import get from 'get-value';

import withIntlAsProp from '../../utils/withIntlAsProp';
import ConfirmSheet from '../mobile/ConfirmSheet';

// What makes two `device` props the same device: a saved device has an id, a card being filled
// in only has what the integration gave it
const identityOf = device => (device ? device.id || device.selector || device.external_id || null : null);

/**
 * @description The "Delete" button of a device card (docs/specs/mobile-pages/integration-devices.md,
 * D): it asks before it deletes. A device goes with its history, and the scenes and the
 * dashboards that use it stop working with it: one stray click must not be enough.
 *
 * It renders the button of the card (its classes, its label as children) and the confirmation
 * the phone sheet of a device already shows — the same dialog, the same texts. `onDelete` is the
 * delete handler of the card, untouched: it runs once the user confirms, and the card keeps its
 * own loader and its own errors.
 *
 * The question is about one device: if the card is handed another one while the dialog is open
 * (the list was reloaded, a neighbour was deleted), the dialog closes instead of confirming for a
 * device the user never looked at. And one confirmation is one deletion: while the handler runs,
 * the button is disabled and a second click on "Delete the device" does nothing.
 *
 * A device that was never saved (no `created_at`: a card being filled in) has no history and
 * nothing uses it: it is removed without a question.
 */
class DeleteDeviceButton extends Component {
  state = { confirmOpen: false, deleting: false };

  // Not in the state: two clicks can land before the first one is rendered
  deleting = false;
  askedFor = null;

  runDelete = async () => {
    if (this.deleting) {
      return;
    }
    this.deleting = true;
    this.setState({ confirmOpen: false, deleting: true });
    try {
      await this.props.onDelete();
    } finally {
      this.deleting = false;
      if (!this.unmounted) {
        this.setState({ deleting: false });
      }
    }
  };

  ask = () => {
    const { device } = this.props;
    if (this.deleting) {
      return;
    }
    if (!device || !device.created_at) {
      this.runDelete();
      return;
    }
    this.askedFor = identityOf(device);
    this.setState({ confirmOpen: true });
  };

  cancel = () => this.setState({ confirmOpen: false });

  confirm = () => {
    // the card may have been handed another device since the question was asked
    if (!this.state.confirmOpen || identityOf(this.props.device) !== this.askedFor) {
      this.setState({ confirmOpen: false });
      return;
    }
    this.runDelete();
  };

  componentWillReceiveProps(nextProps) {
    if (this.state.confirmOpen && identityOf(nextProps.device) !== this.askedFor) {
      this.setState({ confirmOpen: false });
    }
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  render({ device, onDelete, intl, children, disabled, ...buttonProps }, { confirmOpen, deleting }) {
    const name = (device && device.name) || get(intl.dictionary, 'mobileDeviceList.noName');
    return (
      <Fragment>
        <button data-cy="device-delete" {...buttonProps} disabled={disabled || deleting} onClick={this.ask}>
          {children}
        </button>
        <ConfirmSheet
          open={confirmOpen}
          title={get(intl.dictionary, 'mobileDeviceList.deleteTitle')}
          text={<Text id="mobileDeviceList.deleteText" fields={{ name }} />}
          confirmLabel={<Text id="mobileDeviceList.deleteConfirm" />}
          destructive
          onConfirm={this.confirm}
          onCancel={this.cancel}
          dataCy="device-delete-confirm"
        />
      </Fragment>
    );
  }
}

export default withIntlAsProp(DeleteDeviceButton);
