import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

const IP_PATTERN = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const atoi = addr => {
  const parts = addr.split('.').map(str => {
    return parseInt(str, 10);
  });

  return (parts[0] ? parts[0] << 24 : 0) + (parts[1] ? parts[1] << 16 : 0) + (parts[2] ? parts[2] << 8 : 0) + parts[3];
};

class SearchForm extends Component {
  searchDevices = () => {
    const params = {};

    if (this.state.searchByRange) {
      params.firstAddress = this.state.firstAddress;
      params.lastAddress = this.state.lastAddress;
    } else {
      params.singleAddress = this.state.singleAddress;
    }

    this.props.searchDevices('http', params);
  };
  singleSearchMode = () => {
    this.setState({ searchByRange: false });
  };

  rangeSearchMode = () => {
    this.setState({ searchByRange: true });
  };

  updateSingleAddress = e => {
    e.preventDefault();
    this.setState({ singleAddress: e.target.value });
  };

  updateFirstAddress = e => {
    e.preventDefault();
    this.setState({ firstAddress: e.target.value });
  };

  updateLastAddress = e => {
    e.preventDefault();
    this.setState({ lastAddress: e.target.value });
  };

  render(props, state) {
    let discoverable = false;
    if (state.searchByRange) {
      discoverable =
        IP_PATTERN.test(state.firstAddress) &&
        IP_PATTERN.test(state.lastAddress) &&
        atoi(state.firstAddress) < atoi(state.lastAddress);
    } else {
      discoverable = (state.singleAddress || '').length > 0;
    }

    return (
      <div class="d-sm-flex justify-content-sm-between">
        <div class="col-sm-3 text-center text-sm-left mt-2">
          <div class="btn-group btn-group-toggle">
            {state.searchByRange && (
              <label class={cx('btn btn-primary', { active: !state.searchByRange })}>
                <input type="radio" name="searchMode" onClick={this.singleSearchMode} />
                <Text id="integration.tasmota.discover.http.singleModeButton" />
              </label>
            )}
            {!state.searchByRange && (
              <label class={cx('btn btn-primary', { active: state.searchByRange })}>
                <input type="radio" name="searchMode" onClick={this.rangeSearchMode} />
                <Text id="integration.tasmota.discover.http.rangeModeButton" />
              </label>
            )}
          </div>
        </div>
        <div class="mt-2">
          {!state.searchByRange && (
            <div class="form-inline">
              <label for="singleAddress">
                <Text id="integration.tasmota.discover.http.singleAddressLabel" />
              </label>
              <Localizer>
                <input
                  id="singleAddress"
                  type="text"
                  placeholder={<Text id="integration.tasmota.discover.http.singleAddressPlaceholer" />}
                  value={state.singleAddress}
                  onInput={this.updateSingleAddress}
                  class="form-control ml-2 mr-2"
                  size="15"
                />
              </Localizer>
            </div>
          )}
          {state.searchByRange && (
            <div class="form-inline">
              <label for="firstAddress">
                <Text id="integration.tasmota.discover.http.firstAddressLabel" />
              </label>
              <Localizer>
                <input
                  id="firstAddress"
                  type="text"
                  placeholder={<Text id="integration.tasmota.discover.http.firstAddressPlaceholer" />}
                  value={state.firstAddress}
                  onInput={this.updateFirstAddress}
                  class="form-control mr-sm-2 ml-sm-2 mb-1 mb-sm-0"
                  size="15"
                />
                <label for="lastAddress">
                  <Text id="integration.tasmota.discover.http.lastAddressLabel" />
                </label>
                <input
                  id="lastAddress"
                  type="text"
                  placeholder={<Text id="integration.tasmota.discover.http.lastAddressPlaceholer" />}
                  value={state.lastAddress}
                  onInput={this.updateLastAddress}
                  class="form-control ml-sm-2"
                  size="15"
                />
              </Localizer>
            </div>
          )}
        </div>
        <div class="col-sm-3 text-center text-sm-right mt-2">
          <button class="btn btn-success" disabled={!discoverable} onClick={this.searchDevices}>
            <Text id="integration.tasmota.discover.http.discoverButton" />
          </button>
        </div>
      </div>
    );
  }
}

export default SearchForm;
