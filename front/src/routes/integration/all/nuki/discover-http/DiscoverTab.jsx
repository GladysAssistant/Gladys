import { Component } from 'preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import EmptyState from '../EmptyState';
import style from '../style.css';
import NukiDeviceBox from '../NukiDeviceBox';

class DiscoverTab extends Component {
  searchDevices = () => {
    this.props.searchDevices('http');
  };

  render(props) {
    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.nuki.discover.http.title" />
          </h1>
          <div class="page-options d-flex">
            <button onClick={this.searchDevices} class="btn btn-outline-primary ml-2" disabled={props.loading}>
              <Text id="integration.nuki.discover.http.scan" /> <i class="fe fe-radio" />
            </button>
          </div>
        </div>
        <div class="card-body">
          <div
            class={cx('dimmer', {
              active: props.loading
            })}
          >
            <div class="loader" />
            <div class={cx('dimmer-content', style.nukiListBody)}>
              {props.errorLoading && (
                <p class="alert alert-danger">
                  <Text id="integration.nuki.discover.error" />
                </p>
              )}

              <hr />
              <div class="row">
                {props.discoveredDevices &&
                  props.discoveredDevices.map((device, index) => (
                    <NukiDeviceBox
                      {...props}
                      editable={!device.created_at || device.updatable}
                      alreadyCreatedButton={device.created_at && !device.updatable}
                      updateButton={device.updatable}
                      saveButton={!device.created_at}
                      device={device}
                      deviceIndex={index}
                      listName="discoveredDevices"
                    />
                  ))}
                {!props.discoveredDevices || (props.discoveredDevices.length === 0 && <EmptyState />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default DiscoverTab;
