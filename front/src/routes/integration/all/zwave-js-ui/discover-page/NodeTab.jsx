import { Text, Localizer } from 'preact-i18n';
import { Component } from 'preact';
import cx from 'classnames';
import get from 'get-value';

import EmptyState from './EmptyState';
import Node from './Node';
import style from './style.css';
import { RequestStatus } from '../../../../../utils/consts';
import CardFilter from '../../../../../components/layout/CardFilter';

class NodeTab extends Component {
  render(props, { zwaveStatus, zwaveGetNodesStatus }) {
    const zwaveNotConfigured = zwaveGetNodesStatus === RequestStatus.ServiceNotConfigured;
    const scanInProgress = get(zwaveStatus, 'scanInProgress');
    const gettingNodesInProgress = props.zwaveGetNodesStatus === RequestStatus.Getting;
    const zwaveActionsDisabled = scanInProgress || gettingNodesInProgress;
    const zwaveActionsEnabled = !zwaveActionsDisabled;
    return (
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">
            <Text id="integration.zwavejsui.discover.title" />
          </h2>
          <div class="page-options d-flex">
            <label class="custom-switch">
              <input
                type="checkbox"
                class="custom-switch-input"
                checked={props.filterExisting | true}
                onClick={props.toggleFilterOnExisting}
              />
              <span class={cx('custom-switch-indicator', 'mr-1', { 'bg-light': props.gettingNodesInProgress })} />
              <span class="custom-switch-description">
                <Text id="integration.zwavejsui.discover.hideExistingDevices" />
              </span>
            </label>
            <Localizer>
              <CardFilter
                changeOrderDir={props.changeOrderDir}
                orderValue={props.orderDir}
                search={props.debouncedSearch}
                searchValue={props.searchKeyword}
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
                  <Text id="integration.zwavejsui.discover.zwaveNotConfiguredError" />
                </div>
              )}
              <div
                class={cx('row', {
                  [style['page-options']]: zwaveActionsEnabled,
                  [style.emptyDiv]: zwaveActionsDisabled
                })}
              >
                <button class="btn btn-outline-primary" onClick={props.scanNetwork} disabled={zwaveActionsDisabled}>
                  <Text id="integration.zwavejsui.discover.scanButton" /> <i class="fe fe-radio" />
                </button>
                <a
                  href={
                    zwaveActionsEnabled ? '/dashboard/integration/device/zwave-js-ui/node-operation?action=add' : '#'
                  }
                >
                  <button class="btn btn-outline-success ml-2" disabled={zwaveActionsDisabled}>
                    <Text id="integration.zwavejsui.discover.addNodeButton" /> <i class="fe fe-plus" />
                  </button>
                </a>
                <a
                  href={
                    zwaveActionsEnabled
                      ? '/dashboard/integration/device/zwave-js-ui/node-operation?action=add-secure'
                      : '#'
                  }
                >
                  <button class="btn btn-outline-success ml-2" disabled={zwaveActionsDisabled}>
                    <Text id="integration.zwavejsui.discover.addNodeSecureButton" /> <i class="fe fe-plus" />
                  </button>
                </a>
                <a
                  href={
                    zwaveActionsEnabled ? '/dashboard/integration/device/zwave-js-ui/node-operation?action=remove' : '#'
                  }
                >
                  <button class="btn btn-outline-danger ml-2" disabled={zwaveActionsDisabled}>
                    <Text id="integration.zwavejsui.discover.removeNode" /> <i class="fe fe-trash" />
                  </button>
                </a>
              </div>
              <div class="row">
                {(!props.zwaveNodes || props.zwaveNodes.length === 0) && <EmptyState />}
                {props.zwaveNodes &&
                  props.zwaveNodes.length > 0 &&
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
  }
}

export default NodeTab;
