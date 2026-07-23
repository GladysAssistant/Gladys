import { Component } from 'preact';
import { Text } from 'preact-i18n';

// the GLADYS_TRANSPORT* params are already displayed on the card header
// (transport badge, degraded orange dot + tooltip)
const INTERNAL_PARAMS = ['GLADYS_TRANSPORT', 'GLADYS_TRANSPORT_DEGRADED', 'GLADYS_TRANSPORT_MESSAGE'];

// Collapsible list of the technical params of a device (IP address, protocol
// version...), collapsed by default: they help the user understand what the
// integration sees without cluttering the card
class DeviceParams extends Component {
  toggle = e => {
    e.preventDefault();
    this.setState({ show: !this.state.show });
  };

  render({ device }, { show }) {
    const params = ((device && device.params) || []).filter(param => !INTERNAL_PARAMS.includes(param.name));
    if (params.length === 0) {
      return null;
    }
    return (
      <div class="form-group">
        <a href="#" onClick={this.toggle}>
          <i class={`fe mr-1 ${show ? 'fe-chevron-down' : 'fe-chevron-right'}`} />
          <Text id="integration.externalIntegration.deviceParams.title" /> ({params.length})
        </a>
        {show && (
          <div class="table-responsive mt-2">
            <table class="table table-sm mb-0">
              <tbody>
                {params.map(param => (
                  <tr>
                    <td class="text-muted">{param.name}</td>
                    <td>
                      <code>{param.value}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }
}

export default DeviceParams;
