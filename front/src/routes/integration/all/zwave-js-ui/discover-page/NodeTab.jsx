import { Text, Localizer } from 'preact-i18n';
import get from 'get-value';
import cx from 'classnames';

import EmptyState from './EmptyState';
import Node from './Node';
import style from './style.css';
import { RequestStatus } from '../../../../../utils/consts';
import CardFilter from '../../../../../components/layout/CardFilter';

const NodeTab = ({ children, ...props }) => {
  const zwaveNotConfigured = props.zwaveGetNodesStatus === RequestStatus.ServiceNotConfigured;
  const scanInProgress = get(props, 'zwaveStatus.scanInProgress');
  const gettingNodesInProgress = props.zwaveGetNodesStatus === RequestStatus.Getting;
  const zwaveActionsDisabled = scanInProgress || gettingNodesInProgress;
  const zwaveActionsEnabled = !zwaveActionsDisabled;
  return (
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          <Text id="integration.zwave-js-ui.discover.title" />
        </h3>
        <div class="page-options d-flex">
          <Localizer>
            <CardFilter
              changeOrderDir={props.changeOrderDir}
              orderValue={props.getZwaveDeviceOrderDir}
              search={props.debouncedSearch}
              searchValue={props.zwaveDeviceSearch}
              searchPlaceHolder={<Text id="device.searchPlaceHolder" />}
            />
          </Localizer>
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
                <Text id="integration.zwave-js-ui.discover.zwaveNotConfiguredError" />
              </div>
            )}
            <div
              class={cx('row', {
                [style.emptyDiv]: zwaveActionsDisabled
              })}
            >
              {(!props.zwaveNodes || props.zwaveNodes.length === 0) && <EmptyState />}
              {props.zwaveNodes && props.zwaveNodes.length != 0 &&
                !get(props, 'zwaveStatus.scanInProgress') &&
                <>
                  <div class="page-options d-flex">
                    <button class="btn btn-outline-primary" onClick={props.scanNetwork} disabled={zwaveActionsDisabled}>
                      <Text id="integration.zwave-js-ui.discover.scanButton" /> <i class="fe fe-radio" />
                    </button>
                    <a href={zwaveActionsEnabled ? '/dashboard/integration/device/zwave-js-ui/node-operation?action=add' : '#'}>
                      <button class="btn btn-outline-success ml-2" disabled={zwaveActionsDisabled}>
                        <Text id="integration.zwave-js-ui.discover.addNodeButton" /> <i class="fe fe-plus" />
                      </button>
                    </a>
                    <a
                      href={
                        zwaveActionsEnabled ? '/dashboard/integration/device/zwave-js-ui/node-operation?action=add-secure' : '#'
                      }
                    >
                      <button class="btn btn-outline-success ml-2" disabled={zwaveActionsDisabled}>
                        <Text id="integration.zwave-js-ui.discover.addNodeSecureButton" /> <i class="fe fe-plus" />
                      </button>
                    </a>
                    <a
                      href={zwaveActionsEnabled ? '/dashboard/integration/device/zwave-js-ui/node-operation?action=remove' : '#'}
                    >
                      <button class="btn btn-outline-danger ml-2" disabled={zwaveActionsDisabled}>
                        <Text id="integration.zwave-js-ui.discover.removeNode" /> <i class="fe fe-trash" />
                      </button>
                    </a>
                  </div>
                </> &&
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
