import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import EmptyState from './EmptyState';
import { RequestStatus } from '../../../../../utils/consts';
import style from './style.css';
import CardFilter from '../../../../../components/layout/CardFilter';
import AirplayDeviceBox from '../AirplayDeviceBox';
import debounce from 'debounce';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import {
  withMobileViewport,
  MobileSectionHeader,
  MobileGroup,
  MobileEmptyState,
  BigButton
} from '../../../../../components/mobile';
import {
  MobileIntegrationTab,
  MobileListToolbar,
  MobileListLoader
} from '../../../../../components/integration/mobile';

class DeviceTab extends Component {
  constructor(props) {
    super(props);
    this.debouncedSearch = debounce(this.search, 200).bind(this);
  }

  componentWillMount() {
    this.getAirplayDevices();
    this.getHouses();
  }

  getAirplayDevices = async () => {
    this.setState({
      getAirplayStatus: RequestStatus.Getting
    });
    try {
      const options = {
        order_dir: this.state.orderDir || 'asc'
      };
      if (this.state.search && this.state.search.length) {
        options.search = this.state.search;
      }

      const airplayDevices = await this.props.httpClient.get('/api/v1/service/airplay/device', options);
      this.setState({
        airplayDevices,
        getAirplayStatus: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        getAirplayStatus: e.message
      });
    }
  };

  async getHouses() {
    this.setState({
      housesGetStatus: RequestStatus.Getting
    });
    try {
      const params = {
        expand: 'rooms'
      };
      const housesWithRooms = await this.props.httpClient.get(`/api/v1/house`, params);
      this.setState({
        housesWithRooms,
        housesGetStatus: RequestStatus.Success
      });
    } catch (e) {
      this.setState({
        housesGetStatus: RequestStatus.Error
      });
    }
  }

  async search(e) {
    await this.setState({
      search: e.target.value
    });
    this.getAirplayDevices();
  }

  changeOrderDir = async e => {
    await this.setState({
      orderDir: e.target.value
    });
    this.getAirplayDevices();
  };

  // The devices on a phone (docs/specs/mobile-pages/integration-devices.md): one row per device,
  // opening the sheet that holds what its card holds
  renderMobile({ orderDir, search, getAirplayStatus, airplayDevices, housesWithRooms }) {
    const loading = getAirplayStatus === RequestStatus.Getting;
    const devices = airplayDevices || [];
    return (
      <MobileIntegrationTab dataCy="airplay-devices-mobile">
        <MobileListToolbar
          searchValue={search}
          onSearch={this.debouncedSearch}
          orderDir={orderDir}
          onOrderChange={this.changeOrderDir}
        />
        <MobileListLoader loading={loading} empty={devices.length === 0}>
          {devices.length > 0 && (
            <div>
              <MobileSectionHeader
                title={
                  <Text id="mobileDeviceList.deviceCount" plural={devices.length} fields={{ count: devices.length }} />
                }
              />
              <MobileGroup>
                {devices.map((device, index) => (
                  <AirplayDeviceBox
                    key={device.external_id}
                    isMobile
                    editable
                    saveButton
                    deleteButton
                    device={device}
                    deviceIndex={index}
                    getAirplayDevices={this.getAirplayDevices}
                    housesWithRooms={housesWithRooms}
                  />
                ))}
              </MobileGroup>
            </div>
          )}
          {airplayDevices && devices.length === 0 && !loading && (
            <MobileEmptyState icon="airplay" text={<Text id="integration.airplay.device.noDeviceFound" />}>
              <BigButton
                variant="primary"
                icon="radio"
                href="/dashboard/integration/device/airplay/discover"
                data-cy="airplay-devices-discover"
              >
                <Text id="integration.airplay.discoverTab" />
              </BigButton>
            </MobileEmptyState>
          )}
        </MobileListLoader>
      </MobileIntegrationTab>
    );
  }

  render({ isMobile }, { orderDir, search, getAirplayStatus, airplayDevices, housesWithRooms }) {
    if (isMobile) {
      return this.renderMobile(this.state);
    }
    return (
      <div class="card">
        <div class="card-header">
          <h1 class="card-title">
            <Text id="integration.airplay.device.title" />
          </h1>
          <div class="page-options d-flex">
            <Localizer>
              <CardFilter
                changeOrderDir={this.changeOrderDir}
                orderValue={orderDir}
                search={this.debouncedSearch}
                searchValue={search}
                searchPlaceHolder={<Text id="device.searchPlaceHolder" />}
              />
            </Localizer>
          </div>
        </div>
        <div class="card-body">
          <div
            class={cx('dimmer', {
              active: getAirplayStatus === RequestStatus.Getting
            })}
          >
            <div class="loader" />
            <div class={cx('dimmer-content', style.airplayListBody)}>
              <div class="row">
                {airplayDevices &&
                  airplayDevices.length > 0 &&
                  airplayDevices.map((device, index) => (
                    <AirplayDeviceBox
                      editable
                      saveButton
                      deleteButton
                      device={device}
                      deviceIndex={index}
                      getAirplayDevices={this.getAirplayDevices}
                      housesWithRooms={housesWithRooms}
                    />
                  ))}
                {!airplayDevices || (airplayDevices.length === 0 && <EmptyState />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(withMobileViewport(DeviceTab));
