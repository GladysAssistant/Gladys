import { Component } from 'preact';
import { Text } from 'preact-i18n';

class InstallationCard extends Component {
  selectMode = () => {
    this.props.selectMode(this.props.setupModeComponent);
  };

  render({ titleId, children, disabled }) {
    return (
      <div class="card bg-light">
        <div class="card-body d-flex flex-column">
          <div class="card-title">
            <Text id={titleId} />
          </div>
          <div class="card-text">{children}</div>
          <div class="mt-auto">
            <button class="btn btn-primary btn-sm float-right" disabled={disabled} onClick={this.selectMode}>
              <Text id="integration.zigbee2mqtt.setup.selectInstallationMode" />
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default InstallationCard;
