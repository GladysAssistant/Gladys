import { Text } from 'preact-i18n';
import cx from 'classnames';

import EmptyState from './EmptyState';
import DiscoveredBox from './DiscoveredBox';
import { RequestStatus } from '../../../../../utils/consts';
import style from './style.css';
import CheckHeatzyPanel from '../commons/CheckHeatzyPanel';

const DiscoverTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        <Text id="integration.heatzy.discover.title" />
      </h1>
      <div class="page-options d-flex">
        <button class="btn btn-outline-primary" onClick={props.discover} disabled={props.discoverHeatzy}>
          <Text id="integration.heatzy.discover.scanButton" /> <i class="fe fe-radio" />
        </button>
      </div>
    </div>
    <div class="card-body">
      <CheckHeatzyPanel />

      {props.discoverHeatzyError && (
        <div class="alert alert-danger">
          <Text id={props.discoverHeatzyError} />
        </div>
      )}

      <div
        class={cx('dimmer', {
          active: props.discoverHeatzy
        })}
      >
        <div class="loader" />
        <div class={cx('dimmer-content', style.heatzyListBody)}>
          <div class="row">
            {props.heatzyDevices &&
              props.heatzyDevices.map((device, index) => (
                <DiscoveredBox {...props} device={device} deviceIndex={index} />
              ))}
            {!props.heatzyDevices || (props.heatzyDevices.length === 0 && <EmptyState />)}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default DiscoverTab;
