import { Text, MarkupText } from 'preact-i18n';
import cx from 'classnames';

import EmptyState from './EmptyState';
import style from './style.css';
import AirplayDeviceBox from '../AirplayDeviceBox';
import { connect } from 'unistore/preact';
import { Component } from 'preact';
import {
  withMobileViewport,
  MobileSectionHeader,
  MobileGroup,
  MobileNotice,
  MobileEmptyState,
  BigButton,
  kitStyle
} from '../../../../../components/mobile';
import {
  MobileIntegrationTab,
  MobileListLoader,
  integrationMobileStyle
} from '../../../../../components/integration/mobile';

class DiscoverTab extends Component {
  getDiscoveredDevices = async () => {
    this.setState({
      loading: true
    });
    try {
      const discoveredDevices = await this.props.httpClient.get('/api/v1/service/airplay/discover');
      const existingAirplayDevices = await this.props.httpClient.get('/api/v1/service/airplay/device', {});
      discoveredDevices.forEach(discoveredDevice => {
        const existingDevice = existingAirplayDevices.find(d => d.external_id === discoveredDevice.external_id);
        if (existingDevice) {
          discoveredDevice.alreadyExist = true;
        }
      });
      this.setState({
        discoveredDevices,
        loading: false,
        errorLoading: false
      });
    } catch (e) {
      this.setState({
        loading: false,
        errorLoading: true
      });
    }
  };
  async componentWillMount() {
    this.getDiscoveredDevices();
  }

  // The discovery on a phone (docs/specs/mobile-pages/integration-devices.md): the scan as the
  // button of the page, then one row per device found
  renderMobile({ loading, errorLoading, discoveredDevices }) {
    const devices = discoveredDevices || [];
    return (
      <MobileIntegrationTab dataCy="airplay-discover-mobile">
        <p class={kitStyle.lead}>
          <Text id="integration.airplay.discover.description" />
        </p>
        <div class={integrationMobileStyle.block}>
          <BigButton
            variant="primary"
            icon="radio"
            onClick={this.getDiscoveredDevices}
            loading={loading}
            data-cy="airplay-discover-scan"
          >
            <Text id="integration.airplay.discover.scan" />
          </BigButton>
        </div>
        {errorLoading && (
          <MobileNotice tone="danger" icon="alert-circle" role="alert">
            <Text id="integration.airplay.discover.errorWhileScanning" />
          </MobileNotice>
        )}
        <MobileListLoader loading={loading} empty={devices.length === 0}>
          {devices.length > 0 && (
            <div>
              <MobileSectionHeader
                title={
                  <Text id="mobileDeviceList.foundCount" plural={devices.length} fields={{ count: devices.length }} />
                }
              />
              <MobileGroup>
                {devices.map((device, index) => (
                  <AirplayDeviceBox
                    key={device.external_id}
                    isMobile
                    discovered
                    saveButton
                    device={device}
                    deviceIndex={index}
                  />
                ))}
              </MobileGroup>
            </div>
          )}
          {discoveredDevices && devices.length === 0 && !loading && (
            <MobileEmptyState icon="radio">
              <div class={kitStyle.emptyText}>
                <MarkupText id="integration.airplay.discover.noDeviceFound" />
              </div>
            </MobileEmptyState>
          )}
        </MobileListLoader>
      </MobileIntegrationTab>
    );
  }

  render({ isMobile }, { loading, errorLoading, discoveredDevices }) {
    if (isMobile) {
      return this.renderMobile(this.state);
    }
    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.airplay.discover.title" />
          </h1>
          <div class="page-options d-flex">
            <button onClick={this.getDiscoveredDevices} class="btn btn-outline-primary ml-2" disabled={loading}>
              <Text id="integration.airplay.discover.scan" /> <i class="fe fe-radio" />
            </button>
          </div>
        </div>
        <div class="card-body">
          <div class="alert alert-secondary">
            <Text id="integration.airplay.discover.description" />
          </div>
          {errorLoading && (
            <div class="alert alert-danger">
              <Text id="integration.airplay.discover.errorWhileScanning" />
            </div>
          )}
          <div
            class={cx('dimmer', {
              active: loading
            })}
          >
            <div class="loader" />
            <div class={cx('dimmer-content', style.airplayListBody)}>
              <div class="row">
                {discoveredDevices &&
                  discoveredDevices.map((device, index) => (
                    <AirplayDeviceBox saveButton device={device} deviceIndex={index} />
                  ))}
                {!discoveredDevices || (discoveredDevices.length === 0 && <EmptyState />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(withMobileViewport(DiscoverTab));
