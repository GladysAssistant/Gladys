import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import get from 'get-value';

const isNullOrUndefined = variable => variable === null || variable === undefined;

class EcowattCondition extends Component {
  handleNetworkStatusChange = e => {
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'ecowatt_network_status', e.target.value);
  };

  initActionIfNeeded = () => {
    if (isNullOrUndefined(get(this.props, 'action.ecowatt_network_status'))) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'ecowatt_network_status', 'ok');
    }
  };

  componentDidMount() {
    this.initActionIfNeeded();
  }

  render({ action }, {}) {
    return (
      <div>
        <div class="row">
          <div class="col-md-12">
            <p>
              <Text id="editScene.actionsCard.ecowattCondition.description" />{' '}
              <small>
                <a href="https://www.monecowatt.fr/" target="_blank" rel="noopener noreferrer">
                  <Text id="editScene.actionsCard.ecowattCondition.knowMore" />
                </a>
              </small>
            </p>
          </div>
        </div>
        <div class="row">
          <div class="col-12">
            <div class="form-group">
              <div class="form-label">
                <Text id="editScene.actionsCard.ecowattCondition.networkStatusLabel" />
              </div>
              <select
                class="form-control"
                onChange={this.handleNetworkStatusChange}
                value={action.ecowatt_network_status}
              >
                <option value="ok">
                  <Text id="editScene.actionsCard.ecowattCondition.ok" />
                </option>
                <option value="warning">
                  <Text id="editScene.actionsCard.ecowattCondition.warning" />
                </option>
                <option value="critical">
                  <Text id="editScene.actionsCard.ecowattCondition.critical" />
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('user,httpClient', {})(EcowattCondition);
