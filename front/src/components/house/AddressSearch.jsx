import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import { searchAddress } from '../../utils/geocoding';
import { MobileGroup, MobileRow, fieldClass, kitStyle } from '../mobile';
import style from './mobileHouse.css';

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
      if (this.unmounted) {
        return;
      }
      this.setState({
        results,
        loading: false
      });
    } catch (e) {
      console.error(e);
      if (this.unmounted) {
        return;
      }
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

  componentWillUnmount() {
    this.unmounted = true;
  }

  // The search on a phone (docs/specs/mobile-pages/house-and-rooms.md, C.2): one control holding
  // the field and its button, the keyboard's "search" key, and the results as rows
  renderMobile({ query, results, loading, error }) {
    return (
      <div class={style.addressSearch}>
        <div class={fieldClass.group}>
          <Localizer>
            <input
              type="search"
              class={fieldClass.input}
              value={query}
              onInput={this.updateQuery}
              onKeyPress={this.onKeyPress}
              placeholder={<Text id="signup.configureHouse.addressSearchPlaceholder" />}
              aria-label={<Text id="signup.configureHouse.addressSearchPlaceholder" />}
              autocomplete="street-address"
              enterkeyhint="search"
              data-cy="address-search-input"
            />
          </Localizer>
          <Localizer>
            <button
              type="button"
              class={fieldClass.addon}
              onClick={this.search}
              disabled={loading}
              aria-label={<Text id="signup.configureHouse.addressSearchButton" />}
              data-cy="address-search-button"
            >
              {loading ? (
                <span class={kitStyle.buttonSpinner} aria-hidden="true" />
              ) : (
                <i class="fe fe-search" aria-hidden="true" />
              )}
            </button>
          </Localizer>
        </div>
        {error && (
          <div class={kitStyle.fieldError} role="alert">
            <Text id="signup.configureHouse.addressSearchError" />
          </div>
        )}
        {results && results.length === 0 && (
          <div class={kitStyle.fieldHelp} role="status">
            <Text id="signup.configureHouse.addressSearchNoResults" />
          </div>
        )}
        {results && results.length > 0 && (
          <MobileGroup data-cy="address-search-results">
            {results.map(result => (
              <MobileRow
                key={result.id}
                icon="map-pin"
                title={result.label}
                chevron={false}
                onClick={this.selectResult(result)}
              />
            ))}
          </MobileGroup>
        )}
        <div class={kitStyle.fieldHelp}>
          <Text id="signup.configureHouse.addressSearchPrivacyNotice" />
        </div>
      </div>
    );
  }

  render(props, { query, results, loading, error }) {
    if (props.mobile) {
      return this.renderMobile({ query, results, loading, error });
    }
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
        <div class="text-muted small mt-1">
          <Text id="signup.configureHouse.addressSearchPrivacyNotice" />
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
                key={result.id}
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
