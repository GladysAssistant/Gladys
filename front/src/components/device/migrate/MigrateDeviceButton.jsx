import { Component } from 'preact';
import { Text } from 'preact-i18n';

import MigrateDeviceModal from './MigrateDeviceModal';

class MigrateDeviceButton extends Component {
  openModal = () => {
    this.setState({ modalOpened: true });
  };

  closeModal = () => {
    this.setState({ modalOpened: false });
  };

  render({ device, onMigrated }, { modalOpened }) {
    return (
      <span>
        <button onClick={this.openModal} class="btn btn-primary mr-2">
          <i class="fe fe-shuffle mr-1" />
          <Text id="device.migrate.button" />
        </button>
        {modalOpened && <MigrateDeviceModal device={device} onMigrated={onMigrated} onClose={this.closeModal} />}
      </span>
    );
  }
}

export default MigrateDeviceButton;
