import { Component } from 'preact';
import { Text } from 'preact-i18n';

class InstallationCard extends Component {
  selectSetupMode = () => {
    this.props.selectSetupMode(this.props.setupMode);
  };

  render({ dataCy, title, children, disabled }) {
    return (
      <div class="card bg-light" data-cy={dataCy}>
        <div class="card-body d-flex flex-column">
          <h3 class="card-title">{title}</h3>
          <div class="card-text">{children}</div>
          <div class="mt-auto">
            <button class="btn btn-primary btn-sm float-right mt-3" disabled={disabled} onClick={this.selectSetupMode}>
              <Text id="integration.zigbee2mqtt.setup.selectInstallationMode" />
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default InstallationCard;
