import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { searchAddress } from '../../utils/geocoding';

class AddressSearch extends Component {
  updateQuery = e => {
    this.setState({
      query: e.target.value,
      results: null,
      error: false
    });
  };
  onKeyPress = e => {
    if (e.keyCode === 13) {
      e.preventDefault();
      this.search();
    }
  };
  search = async () => {
    const query = this.state.query.trim();
    if (query.length === 0 || this.state.loading) {
      return;
    }
    this.setState({
      loading: true,
      results: null,
      error: false
    });
    try {
      const results = await searchAddress(query);
      this.setState({
        results,
        loading: false
      });
    } catch (e) {
      console.error(e);
      this.setState({
        error: true,
        loading: false
      });
    }
  };
  selectResult = result => () => {
    this.setState({
      query: result.label,
      results: null
    });
    this.props.onSelectLocation(result.latitude, result.longitude);
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      query: '',
      results: null,
      loading: false,
      error: false
    };
  }

  render(props, { query, results, loading, error }) {
    return (
      <div class="mb-2">
        <div class="input-group">
          <Localizer>
            <input
              type="text"
              class="form-control"
              value={query}
              onInput={this.updateQuery}
              onKeyPress={this.onKeyPress}
              placeholder={<Text id="signup.configureHouse.addressSearchPlaceholder" />}
            />
          </Localizer>
          <span class="input-group-append">
            <button
              class={cx('btn', 'btn-primary', {
                'btn-loading': loading
              })}
              type="button"
              onClick={this.search}
              disabled={loading}
            >
              <i class="fe fe-search mr-1" />
              <Text id="signup.configureHouse.addressSearchButton" />
            </button>
          </span>
        </div>
        {error && (
          <div class="text-danger small mt-1">
            <Text id="signup.configureHouse.addressSearchError" />
          </div>
        )}
        {results && results.length === 0 && (
          <div class="text-muted small mt-1">
            <Text id="signup.configureHouse.addressSearchNoResults" />
          </div>
        )}
        {results && results.length > 0 && (
          <div class="list-group mt-1">
            {results.map(result => (
              <button
                type="button"
                class="list-group-item list-group-item-action text-left"
                onClick={this.selectResult(result)}
              >
                <i class="fe fe-map-pin mr-2" />
                {result.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
}

export default AddressSearch;
