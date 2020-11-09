import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { Network } from 'vis-network';
import { RequestStatus } from '../../../../../utils/consts';

class NetworkTab extends Component {
  setNetworkInput(input) {
    this.networkInput = input;
  }

  constructor(props) {
    super(props);

    this.setNetworkInput = this.setNetworkInput.bind(this);
  }

  componentDidUpdate() {
    const { zwaveNodesNeighbors } = this.props;
    if (zwaveNodesNeighbors) {
      const nodes = zwaveNodesNeighbors.map(node => ({
        id: node.id,
        label: node.product
      }));

      const edges = [];

      const alreadyIn = {};

      zwaveNodesNeighbors.forEach(node => {
        node.neighbors.forEach(neighborId => {
          if (!alreadyIn[`${neighborId}-${node.id}`]) {
            edges.push({
              from: node.id,
              to: neighborId
            });
            alreadyIn[`${node.id}-${neighborId}`] = true;
          }
        });
      });

      // provide the data in the vis format
      let data = {
        nodes,
        edges
      };
      let options = {};
      new Network(this.networkInput, data, options);
    }
  }

  render(props) {
    const zwaveNotConfigured = props.zwaveGetNeighborsStatus === RequestStatus.ServiceNotConfigured;
    return (
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <Text id="integration.zwave.network.title" />
          </h3>
        </div>
        {zwaveNotConfigured && (
          <div class="alert alert-warning">
            <Text id="integration.zwave.setup.zwaveNotConfiguredError" />
          </div>
        )}
        <div
          ref={this.setNetworkInput}
          style={{
            width: '100%',
            height: '400px'
          }}
        />
      </div>
    );
  }
}

export default NetworkTab;
