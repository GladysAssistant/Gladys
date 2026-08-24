import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';

import DeviceExportCsvModal from './DeviceExportCsvModal';
import { getExportableFeatures } from './helpers';

class DeviceExportCsvButton extends Component {
  openModal = e => {
    // The mobile list item is wrapped in a link to the integration: exporting
    // must not navigate away.
    e.preventDefault();
    e.stopPropagation();
    this.setState({ modalOpened: true });
  };

  closeModal = () => {
    this.setState({ modalOpened: false });
  };

  render({ device, iconOnly }, { modalOpened }) {
    // A device with no feature keeping its history has nothing to export.
    if (getExportableFeatures(device).length === 0) {
      return null;
    }
    return (
      <span>
        <Localizer>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            onClick={this.openModal}
            title={<Text id="devicesList.exportCsv" />}
            aria-label={<Text id="devicesList.exportCsv" />}
          >
            <i class="fe fe-download" />
            {!iconOnly && (
              <span class="ml-1">
                <Text id="devicesList.exportCsv" />
              </span>
            )}
          </button>
        </Localizer>
        {modalOpened && <DeviceExportCsvModal device={device} onClose={this.closeModal} />}
      </span>
    );
  }
}

export default DeviceExportCsvButton;
