import { Text } from 'preact-i18n';
import get from 'get-value';
import cx from 'classnames';

import Node from './Node';
import style from './style.css';
import { RequestStatus } from '../../../../../utils/consts';

const NodeTab = ({ children, ...props }) => {
  const zwaveNotConfigured = props.zwaveGetNodesStatus === RequestStatus.ServiceNotConfigured;
  return (
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <Text id="integration.zwave.setup.title" />
        </h3>
        <div class="page-options d-flex">
          <button class="btn btn-outline-primary" onClick={props.healNetwork} disabled={zwaveNotConfigured}>
            <Text id="integration.zwave.setup.healNetworkButton" /> <i class="fe fe-radio" />
          </button>
          <button class="btn btn-outline-success ml-2" onClick={props.addNode} disabled={zwaveNotConfigured}>
            <Text id="integration.zwave.setup.addNodeButton" /> <i class="fe fe-plus" />
          </button>
          <button class="btn btn-outline-success ml-2" onClick={props.addNodeSecure} disabled={zwaveNotConfigured}>
            <Text id="integration.zwave.setup.addNodeSecureButton" /> <i class="fe fe-plus" />
          </button>
          <button class="btn btn-outline-danger ml-2" onClick={props.removeNode} disabled={zwaveNotConfigured}>
            <Text id="integration.zwave.setup.removeNode" /> <i class="fe fe-trash" />
          </button>
        </div>
      </div>
      <div class="card-body">
        <div
          class={cx('dimmer', {
            active: get(props, 'zwaveStatus.scanInProgress') || props.zwaveGetNodesStatus === RequestStatus.Getting
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
            {zwaveNotConfigured && (
              <div class="alert alert-warning">
                <Text id="integration.zwave.setup.zwaveNotConfiguredError" />
              </div>
            )}
            <div
              class={cx('row', {
                [style.emptyDiv]: get(props, 'zwaveStatus.scanInProgress')
              })}
            >
              {props.zwaveNodes &&
                props.zwaveNodes.map((zwaveNode, index) => (
                  <Node node={zwaveNode} nodeIndex={index} createDevice={props.createDevice} />
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeTab;
