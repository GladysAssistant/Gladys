import { connect } from 'unistore/preact';
import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { SYSTEM_VARIABLE_NAMES } from '../../../../../server/utils/constants';

const DEFAULT_MDNS_HOSTNAME = 'gladysassistant';
const MDNS_HOSTNAME_REGEX = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

class SettingsSystemMdns extends Component {
  getMdnsHostname = async () => {
    try {
      const { value } = await this.props.httpClient.get(`/api/v1/variable/${SYSTEM_VARIABLE_NAMES.MDNS_HOSTNAME}`);
      if (value) {
        this.setState({
          mdnsHostname: value
        });
      }
    } catch (e) {
      // variable doesn't exist yet, keep the default hostname
      console.error(e);
    }
  };

  updateMdnsHostname = e => {
    this.setState({
      mdnsHostname: e.target.value.trim().toLowerCase(),
      invalidName: false,
      saved: false,
      error: false
    });
  };

  saveMdnsHostname = async e => {
    e.preventDefault();
    const { mdnsHostname } = this.state;
    if (!MDNS_HOSTNAME_REGEX.test(mdnsHostname)) {
      this.setState({
        invalidName: true,
        saved: false
      });
      return;
    }
    this.setState({
      saving: true,
      invalidName: false,
      saved: false,
      error: false
    });
    try {
      await this.props.httpClient.post(`/api/v1/variable/${SYSTEM_VARIABLE_NAMES.MDNS_HOSTNAME}`, {
        value: mdnsHostname
      });
      this.setState({
        saved: true
      });
    } catch (e) {
      console.error(e);
      this.setState({
        error: true
      });
    }
    this.setState({
      saving: false
    });
  };

  constructor(props) {
    super(props);
    this.state = {
      mdnsHostname: DEFAULT_MDNS_HOSTNAME
    };
  }

  componentDidMount() {
    this.getMdnsHostname();
  }

  render({ systemInfos }, { mdnsHostname, saving, saved, error, invalidName }) {
    const serverPort = systemInfos && systemInfos.server_port;
    const portSuffix = serverPort && serverPort !== 80 ? `:${serverPort}` : '';
    const mdnsUrl = `http://${mdnsHostname}.local${portSuffix}`;
    return (
      <div class="card">
        <h4 class="card-header">
          <Text id="systemSettings.mdns" />
        </h4>

        <div class="card-body">
          <form onSubmit={this.saveMdnsHostname}>
            <p>
              <Text id="systemSettings.mdnsText" />
            </p>
            {invalidName && (
              <div class="alert alert-warning">
                <Text id="systemSettings.mdnsInvalidName" />
              </div>
            )}
            {error && (
              <div class="alert alert-warning">
                <Text id="systemSettings.mdnsError" />
              </div>
            )}
            <div class="input-group">
              <div class="input-group-prepend">
                <span class="input-group-text">http://</span>
              </div>
              <input class="form-control" type="text" value={mdnsHostname} onInput={this.updateMdnsHostname} />
              <div class="input-group-append">
                <span class="input-group-text">.local</span>
              </div>
              <div class="input-group-append">
                <button type="submit" class="btn btn-primary" disabled={saving}>
                  <Text id="global.save" />
                </button>
              </div>
            </div>
            {saved && (
              <div class="text-success mt-2">
                <Text id="systemSettings.mdnsSaved" />
              </div>
            )}
            <p class="mt-2 mb-0">
              <Text id="systemSettings.mdnsCurrentUrl" />{' '}
              <a href={mdnsUrl} target="_blank" rel="noopener noreferrer">
                {mdnsUrl}
              </a>
            </p>
          </form>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', null)(SettingsSystemMdns);
