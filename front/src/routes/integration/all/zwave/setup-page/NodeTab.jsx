import { Text } from 'preact-i18n';
import get from 'get-value';
import cx from 'classnames';

import Node from './Node';
import style from './style.css';
import { RequestStatus } from '../../../../../utils/consts';

const NodeTab = ({ children, ...props }) => {
  const zwaveNotConfigured = props.zwaveGetNodesStatus === RequestStatus.ServiceNotConfigured;
  const scanInProgress = get(props, 'zwaveStatus.scanInProgress');
  const healInProgress = props.zwaveHealNetworkStatus === RequestStatus.Getting;
  const gettingNodesInProgress = props.zwaveGetNodesStatus === RequestStatus.Getting;
  const zwaveActionsDisabled = scanInProgress || healInProgress || gettingNodesInProgress;
  const zwaveActionsEnabled = !zwaveActionsDisabled;
  return (
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <Text id="integration.zwave.setup.title" />
        </h3>
        <div class="page-options d-flex">
          <button class="btn btn-outline-primary" onClick={props.healNetwork} disabled={zwaveActionsDisabled}>
            <Text id="integration.zwave.setup.healNetworkButton" /> <i class="fe fe-radio" />
          </button>
          <a href={zwaveActionsEnabled ? '/dashboard/integration/device/zwave/node-operation?action=add' : '#'}>
            <button class="btn btn-outline-success ml-2" disabled={zwaveActionsDisabled}>
              <Text id="integration.zwave.setup.addNodeButton" /> <i class="fe fe-plus" />
            </button>
          </a>
          <a href={zwaveActionsEnabled ? '/dashboard/integration/device/zwave/node-operation?action=add-secure' : '#'}>
            <button class="btn btn-outline-success ml-2" disabled={zwaveActionsDisabled}>
              <Text id="integration.zwave.setup.addNodeSecureButton" /> <i class="fe fe-plus" />
            </button>
          </a>
          <a href={zwaveActionsEnabled ? '/dashboard/integration/device/zwave/node-operation?action=remove' : '#'}>
            <button class="btn btn-outline-danger ml-2" disabled={zwaveActionsDisabled}>
              <Text id="integration.zwave.setup.removeNode" /> <i class="fe fe-trash" />
            </button>
          </a>
        </div>
      </div>
      <div class="card-body">
        <div
          class={cx('dimmer', {
            active: zwaveActionsDisabled
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
                [style.emptyDiv]: zwaveActionsDisabled
              })}
            >
              {props.zwaveNodes &&
                !get(props, 'zwaveStatus.scanInProgress') &&
                props.zwaveNodes.map((zwaveNode, index) => (
                  <Node
                    node={zwaveNode}
                    nodeIndex={index}
                    createDevice={props.createDevice}
                    editNodeName={props.editNodeName}
                  />
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeTab;
