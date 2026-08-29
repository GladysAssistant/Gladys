import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import { Link } from 'preact-router/match';
import dayjs from 'dayjs';

import { ERROR_MESSAGES } from '../../../../../server/utils/constants';
import Modal from '../../../routes/integration/all/external-integration/components/Modal';
import style from './style.css';

const REFRESH_INTERVAL_MS = 30 * 60 * 1000;
const SKELETON_TILE_COUNT = 8;
const GRID_STYLE =
  'display: grid; grid-template-columns: repeat(auto-fill, minmax(84px, 1fr)); gap: 14px; max-height: 360px; overflow-y: auto; padding-bottom: 2px';

const ErrorCard = ({ messageId, children }) => (
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">
        <i class="fe fe-film" />
        <span class="m-1">
          <Text id="dashboard.boxTitle.premieres" />
        </span>
      </h3>
    </div>
    <div class="card-body">
      <p class="alert alert-danger mb-0">
        <i class="fe fe-bell" />
        <span class="pl-2">
          <Text id={messageId} />
          {children}
        </span>
      </p>
    </div>
  </div>
);

const MoviePoster = ({ movie, sizeStyle }) =>
  movie.posterUrl ? (
    <img src={movie.posterUrl} alt={movie.title} style={`${sizeStyle} object-fit: cover; border-radius: 6px`} />
  ) : (
    <div
      style={`${sizeStyle} border-radius: 6px; background: rgba(127, 127, 127, 0.15); display: flex; align-items: center; justify-content: center`}
    >
      <i class="fe fe-film" style="font-size: 20px; opacity: 0.5" />
    </div>
  );

const SkeletonGrid = () => (
  <div style={GRID_STYLE}>
    {Array.from({ length: SKELETON_TILE_COUNT }).map((value, index) => (
      // eslint-disable-next-line react/no-array-index-key
      <div key={index}>
        <div class={style.skeletonTile} />
        <div class={style.skeletonLineWide} />
        <div class={style.skeletonLineNarrow} />
      </div>
    ))}
  </div>
);

const MovieDetailModal = ({ movie, userLanguage, onClose }) => (
  <Modal title={movie.title} onClose={onClose}>
    <div class="card-body">
      <div class={style.detailLayout}>
        <div class={style.detailPoster}>
          <MoviePoster movie={movie} sizeStyle="width: 100%; aspect-ratio: 2 / 3;" />
        </div>
        <div style="min-width: 0">
          {movie.releaseDate && (
            <div class="text-muted mb-2">
              {dayjs(movie.releaseDate)
                .locale(userLanguage)
                .format('D MMMM YYYY')}
            </div>
          )}
          {movie.overview ? (
            <p>{movie.overview}</p>
          ) : (
            <p class="text-muted">
              <Text id="dashboard.boxes.premieres.noOverview" />
            </p>
          )}
          <div style="display: flex; gap: 8px; flex-wrap: wrap">
            {movie.trailerUrl && (
              <a href={movie.trailerUrl} target="_blank" rel="noopener noreferrer" class="btn btn-danger btn-sm">
                <i class="fe fe-play mr-1" />
                <Text id="dashboard.boxes.premieres.watchTrailer" />
              </a>
            )}
            <a
              href={`https://www.themoviedb.org/movie/${movie.id}`}
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-outline-secondary btn-sm"
            >
              <Text id="dashboard.boxes.premieres.viewOnTmdb" />
            </a>
          </div>
        </div>
      </div>
    </div>
  </Modal>
);

const PremieresBox = ({
  movies,
  loading,
  error,
  userLanguage: rawUserLanguage,
  selectedMovie,
  onSelectMovie,
  onCloseDetail
}) => {
  // dayjs().locale() with no truthy argument is a GETTER (returns the locale
  // name string, not a chainable instance): a real fallback is required, not
  // just an `undefined` pass-through, or `.format()` would crash on it —
  // guards the brief moment before the `user` global state is loaded.
  const userLanguage = rawUserLanguage || 'en';
  if (error === ERROR_MESSAGES.SERVICE_NOT_CONFIGURED) {
    return (
      <ErrorCard messageId="dashboard.boxes.premieres.serviceNotConfigured">
        {' '}
        <Link href="/dashboard/integration/multimedia">
          <Text id="dashboard.boxes.premieres.clickHere" />
        </Link>
      </ErrorCard>
    );
  }
  if (error === ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED) {
    return <ErrorCard messageId="dashboard.boxes.premieres.requestToThirdPartyFailed" />;
  }
  if (error) {
    return <ErrorCard messageId="dashboard.boxes.premieres.unknownError" />;
  }

  return (
    <>
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fe fe-film" />
            <span class="m-1">
              <Text id="dashboard.boxTitle.premieres" />
            </span>
          </h3>
        </div>
        <div class="card-body">
          {loading && !movies && <SkeletonGrid />}
          {movies && movies.length === 0 && (
            <p class="text-muted mb-0">
              <Text id="dashboard.boxes.premieres.noUpcomingMovies" />
            </p>
          )}
          {movies && movies.length > 0 && (
            <div style={GRID_STYLE}>
              {movies.map(movie => (
                <div key={movie.id}>
                  <button type="button" class={style.posterButton} onClick={() => onSelectMovie(movie)}>
                    <MoviePoster movie={movie} sizeStyle="width: 100%; aspect-ratio: 2 / 3;" />
                    <div style="font-size: 12px; font-weight: 600; margin-top: 6px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.3">
                      {movie.title}
                    </div>
                    {movie.releaseDate && (
                      <div class="text-muted" style="font-size: 11px">
                        {dayjs(movie.releaseDate)
                          .locale(userLanguage)
                          .format('D MMMM')}
                      </div>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {selectedMovie && <MovieDetailModal movie={selectedMovie} userLanguage={userLanguage} onClose={onCloseDetail} />}
    </>
  );
};

class PremieresBoxComponent extends Component {
  // Bumped on every refreshData call, and captured locally in the closure of
  // each call. Two overlapping requests (a days_ahead/region change firing
  // while the 30-minute interval's own call is still in flight, or two rapid
  // config edits) can settle out of order — without this guard, an older
  // response landing last would silently replace newer, already-correct data.
  refreshSequence = 0;

  refreshData = async () => {
    const refreshSequence = (this.refreshSequence += 1);
    try {
      await this.setState(prevState => ({ error: false, loading: !prevState.movies }));
      const params = {};
      if (this.props.box.days_ahead) {
        params.daysAhead = this.props.box.days_ahead;
      }
      if (this.props.box.premieres_region) {
        params.region = this.props.box.premieres_region;
      }
      if (this.props.box.provider) {
        params.service = this.props.box.provider;
      }
      const movies = await this.props.httpClient.get(
        '/api/v1/premieres/upcoming',
        Object.keys(params).length > 0 ? params : undefined
      );
      if (refreshSequence !== this.refreshSequence) {
        return;
      }
      this.setState({ movies, loading: false, error: false });
    } catch (e) {
      if (refreshSequence !== this.refreshSequence) {
        return;
      }
      const responseMessage = e && e.response && e.response.data && e.response.data.message;
      this.setState({ loading: false, error: responseMessage || true });
    }
  };

  selectMovie = movie => {
    this.setState({ selectedMovie: movie });
  };

  closeDetail = () => {
    this.setState({ selectedMovie: null });
  };

  componentDidMount() {
    this.refreshData();
    this.interval = setInterval(this.refreshData, REFRESH_INTERVAL_MS);
  }

  componentDidUpdate(previousProps) {
    if (
      previousProps.box.days_ahead !== this.props.box.days_ahead ||
      previousProps.box.premieres_region !== this.props.box.premieres_region ||
      previousProps.box.provider !== this.props.box.provider
    ) {
      this.refreshData();
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  constructor(props) {
    super(props);
    this.state = { loading: true, error: false, selectedMovie: null };
  }

  render({ user }, { movies, loading, error, selectedMovie }) {
    return (
      <PremieresBox
        movies={movies}
        loading={loading}
        error={error}
        userLanguage={user && user.language}
        selectedMovie={selectedMovie}
        onSelectMovie={this.selectMovie}
        onCloseDetail={this.closeDetail}
      />
    );
  }
}

export default connect('httpClient,user', {})(PremieresBoxComponent);
