import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import get from 'get-value';

import { RequestStatus } from '../../../../utils/consts';
import withIntlAsProp from '../../../../utils/withIntlAsProp';

class MoviesNewRelease extends Component {
  getProviders = async () => {
    this.setState({ status: RequestStatus.Getting });
    try {
      const providers = await this.props.httpClient.get('/api/v1/premieres/provider');
      this.setState({ providers, status: RequestStatus.Success });
    } catch (e) {
      this.setState({ status: RequestStatus.Error });
    }
  };

  onProviderChange = e => {
    this.props.updateTriggerProperty(this.props.index, 'movies_provider', e.target.value);
  };

  onKeywordChange = e => {
    this.props.updateTriggerProperty(this.props.index, 'movies_title_keyword', e.target.value);
  };

  // Declares the Handlebars variables this trigger exposes to every
  // downstream action (message, AI, etc.), same mechanism as
  // triggers/CalendarEventIsComing.jsx's setVariables().
  setVariables = () => {
    const TITLE_VARIABLE = get(this.props.intl.dictionary, 'editScene.variables.movies.title');
    const RELEASE_DATE_VARIABLE = get(this.props.intl.dictionary, 'editScene.variables.movies.releaseDate');
    const SHOWTIMES_VARIABLE = get(this.props.intl.dictionary, 'editScene.variables.movies.showtimesText');
    const TRAILER_URL_VARIABLE = get(this.props.intl.dictionary, 'editScene.variables.movies.trailerUrl');
    const SOURCE_URL_VARIABLE = get(this.props.intl.dictionary, 'editScene.variables.movies.sourceUrl');
    const CINEMA_VARIABLE = get(this.props.intl.dictionary, 'editScene.variables.movies.cinema');
    this.props.setVariablesTrigger(this.props.index, [
      { name: 'movie.title', type: 'movies', ready: true, label: TITLE_VARIABLE, data: {} },
      { name: 'movie.releaseDate', type: 'movies', ready: true, label: RELEASE_DATE_VARIABLE, data: {} },
      { name: 'movie.showtimesText', type: 'movies', ready: true, label: SHOWTIMES_VARIABLE, data: {} },
      { name: 'movie.trailerUrl', type: 'movies', ready: true, label: TRAILER_URL_VARIABLE, data: {} },
      { name: 'movie.sourceUrl', type: 'movies', ready: true, label: SOURCE_URL_VARIABLE, data: {} },
      { name: 'serviceLabel', type: 'movies', ready: true, label: CINEMA_VARIABLE, data: {} }
    ]);
  };

  constructor(props) {
    super(props);
    this.state = {
      providers: []
    };
  }

  componentDidMount() {
    this.getProviders();
    this.setVariables();
  }

  render({ trigger }, { providers }) {
    return (
      <div>
        <p>
          <Text id="editScene.triggersCard.moviesNewRelease.description" />
        </p>
        <div className="form-group">
          <div className="form-label">
            <Text id="editScene.triggersCard.moviesNewRelease.providerLabel" />
          </div>
          <select onChange={this.onProviderChange} className="form-control">
            <option value="" selected={!trigger.movies_provider}>
              <Text id="editScene.triggersCard.moviesNewRelease.anyProvider" />
            </option>
            {providers &&
              providers.map(provider => (
                <option selected={provider.service_name === trigger.movies_provider} value={provider.service_name}>
                  {provider.service_name === 'tmdb' ? (
                    <Text id="dashboard.boxes.premieres.providerInternalTmdb" />
                  ) : (
                    provider.label || provider.service_name
                  )}
                </option>
              ))}
          </select>
        </div>
        <div className="form-group">
          <div className="form-label">
            <Text id="editScene.triggersCard.moviesNewRelease.keywordLabel" />
          </div>
          <Localizer>
            <input
              type="text"
              className="form-control"
              onInput={this.onKeywordChange}
              value={trigger.movies_title_keyword || ''}
              placeholder={<Text id="editScene.triggersCard.moviesNewRelease.keywordPlaceholder" />}
            />
          </Localizer>
        </div>
      </div>
    );
  }
}

export default connect('httpClient,user', {})(withIntlAsProp(MoviesNewRelease));
