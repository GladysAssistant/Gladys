import { Component, Fragment } from 'preact';
import { Text } from 'preact-i18n';
import get from 'get-value';

import withIntlAsProp from '../../utils/withIntlAsProp';
import ConfirmSheet from '../mobile/ConfirmSheet';

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
 * A device that was never saved (no `created_at`: a card being filled in) has no history and
 * nothing uses it: it is removed without a question.
 */
class DeleteDeviceButton extends Component {
  state = { confirmOpen: false };

  ask = () => {
    const { device, onDelete } = this.props;
    if (!device || !device.created_at) {
      onDelete();
      return;
    }
    this.setState({ confirmOpen: true });
  };

  cancel = () => this.setState({ confirmOpen: false });

  confirm = () => {
    this.setState({ confirmOpen: false });
    this.props.onDelete();
  };

  render({ device, onDelete, intl, children, ...buttonProps }, { confirmOpen }) {
    const name = (device && device.name) || get(intl.dictionary, 'mobileDeviceList.noName');
    return (
      <Fragment>
        <button data-cy="device-delete" {...buttonProps} onClick={this.ask}>
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
