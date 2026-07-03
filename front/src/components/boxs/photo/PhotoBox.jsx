import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import get from 'get-value';
import cx from 'classnames';
import style from './style.css';

const DEFAULT_SLIDESHOW_INTERVAL = 10;
const PHOTO_FIT_COVER = 'cover';
const PHOTO_FIT_CONTAIN = 'contain';

const getValidPhotos = photos => (Array.isArray(photos) ? photos.filter(photo => photo && photo.url) : []);

const getBoundedIndex = (index, photosLength) => {
  if (photosLength === 0) {
    return 0;
  }
  return index >= photosLength ? 0 : index;
};

class PhotoBox extends Component {
  constructor(props) {
    super(props);
    this.imageCache = {};
    this.state = {
      currentIndex: 0,
      image: null,
      imageError: false,
      loading: false,
      isTransitioning: false
    };
  }

  static getDerivedStateFromProps(props, state) {
    const photos = getValidPhotos(get(props, 'box.photos', []));
    const boundedIndex = getBoundedIndex(state.currentIndex, photos.length);

    if (boundedIndex !== state.currentIndex) {
      return { currentIndex: boundedIndex, image: null, imageError: false };
    }

    return null;
  }

  componentDidMount() {
    this.loadCurrentPhoto();
    this.startSlideshow();
    this.preloadNextImage();
  }

  componentDidUpdate(prevProps, prevState) {
    const interval = get(this.props, 'box.photo_slideshow_interval', DEFAULT_SLIDESHOW_INTERVAL);
    const prevPhotos = getValidPhotos(get(prevProps, 'box.photos', []));
    const photos = getValidPhotos(get(this.props, 'box.photos', []));

    if (
      photos.length !== prevPhotos.length ||
      interval !== get(prevProps, 'box.photo_slideshow_interval', DEFAULT_SLIDESHOW_INTERVAL)
    ) {
      this.startSlideshow();
    }

    if (prevState.currentIndex !== this.state.currentIndex) {
      this.loadCurrentPhoto();
      this.preloadNextImage();
    }

    const prevUrl = prevPhotos[prevState.currentIndex]?.url;
    const currentUrl = photos[this.state.currentIndex]?.url;
    if (prevUrl !== currentUrl) {
      this.loadCurrentPhoto();
    }
  }

  componentWillUnmount() {
    clearInterval(this.slideshowInterval);
  }

  getCurrentPhotoUrl = () => {
    const photos = getValidPhotos(get(this.props, 'box.photos', []));
    return photos[this.state.currentIndex]?.url;
  };

  fetchPhoto = async url => {
    if (!url) {
      return null;
    }

    if (this.imageCache[url]) {
      return this.imageCache[url];
    }

    const image = await this.props.httpClient.get('/api/v1/dashboard/photo/proxy', { url });
    this.imageCache[url] = image;
    return image;
  };

  loadCurrentPhoto = async () => {
    const url = this.getCurrentPhotoUrl();

    if (!url) {
      this.setState({ image: null, imageError: false, loading: false });
      return;
    }

    if (this.imageCache[url]) {
      this.setState({ image: this.imageCache[url], imageError: false, loading: false });
      return;
    }

    this.setState({ loading: true, imageError: false, image: null });

    try {
      const image = await this.fetchPhoto(url);
      if (this.getCurrentPhotoUrl() === url) {
        this.setState({ image, imageError: false, loading: false });
      }
    } catch (e) {
      if (this.getCurrentPhotoUrl() === url) {
        this.setState({ imageError: true, loading: false, image: null });
      }
    }
  };

  preloadNextImage = () => {
    const photos = getValidPhotos(get(this.props, 'box.photos', []));
    if (photos.length <= 1) {
      return;
    }
    const nextIndex = (this.state.currentIndex + 1) % photos.length;
    const nextUrl = photos[nextIndex]?.url;
    if (nextUrl && !this.imageCache[nextUrl]) {
      this.fetchPhoto(nextUrl).catch(() => {});
    }
  };

  startSlideshow = () => {
    clearInterval(this.slideshowInterval);
    const photos = getValidPhotos(get(this.props, 'box.photos', []));
    const interval = get(this.props, 'box.photo_slideshow_interval', DEFAULT_SLIDESHOW_INTERVAL);

    if (photos.length <= 1 || !interval || interval <= 0) {
      return;
    }

    this.slideshowInterval = setInterval(() => {
      this.goToNext();
    }, interval * 1000);
  };

  goToNext = () => {
    const photos = getValidPhotos(get(this.props, 'box.photos', []));
    if (photos.length <= 1) {
      return;
    }
    this.setState(prevState => ({
      currentIndex: (prevState.currentIndex + 1) % photos.length,
      image: null,
      imageError: false,
      isTransitioning: true
    }));
    setTimeout(() => this.setState({ isTransitioning: false }), 600);
  };

  goToPrevious = () => {
    const photos = getValidPhotos(get(this.props, 'box.photos', []));
    if (photos.length <= 1) {
      return;
    }
    this.setState(prevState => ({
      currentIndex: (prevState.currentIndex - 1 + photos.length) % photos.length,
      image: null,
      imageError: false,
      isTransitioning: true
    }));
    setTimeout(() => this.setState({ isTransitioning: false }), 600);
    this.startSlideshow();
  };

  goToIndex = index => {
    this.setState({ currentIndex: index, image: null, imageError: false, isTransitioning: true });
    setTimeout(() => this.setState({ isTransitioning: false }), 600);
    this.startSlideshow();
  };

  render(props, state) {
    const photos = getValidPhotos(get(props, 'box.photos', []));
    const name = get(props, 'box.name', '');
    const fit = get(props, 'box.photo_fit', PHOTO_FIT_COVER);
    const showCaption = get(props, 'box.photo_show_caption', true);
    const { currentIndex, image, imageError, loading, isTransitioning } = state;

    if (photos.length === 0) {
      return (
        <div class="card">
          <div class={cx(style.emptyState, 'text-muted')}>
            <i class={`fe fe-image ${style.emptyIcon}`} />
            <Text id="dashboard.boxes.photo.emptyPhotos" />
          </div>
        </div>
      );
    }

    const currentPhoto = photos[currentIndex];
    const hasMultiple = photos.length > 1;

    return (
      <div class="card mb-0">
        {name && (
          <div class="card-header">
            <h3 class="card-title">{name}</h3>
          </div>
        )}
        <div class={style.photoContainer}>
          <div class={style.imageWrapper}>
            {image && !imageError && (
              <img
                key={currentPhoto.url}
                src={`data:${image}`}
                alt={currentPhoto.caption || ''}
                class={cx(style.photo, {
                  [style.photoCover]: fit === PHOTO_FIT_COVER,
                  [style.photoContain]: fit === PHOTO_FIT_CONTAIN,
                  [style.photoTransitioning]: isTransitioning
                })}
                loading="lazy"
              />
            )}

            {imageError && (
              <div class={style.errorState}>
                <i class={`fe fe-alert-circle ${style.errorIcon}`} />
                <Text id="dashboard.boxes.photo.imageError" />
              </div>
            )}

            {loading && !image && !imageError && (
              <div class={cx('dimmer active', style.loadingOverlay)}>
                <div class="loader" />
              </div>
            )}

            {showCaption && currentPhoto.caption && image && !imageError && (
              <div class={style.captionOverlay}>
                <span class={style.captionText}>{currentPhoto.caption}</span>
              </div>
            )}

            {hasMultiple && (
              <>
                <button
                  type="button"
                  class={cx(style.navButton, style.navPrev)}
                  onClick={this.goToPrevious}
                  aria-label="Previous"
                >
                  <i class="fe fe-chevron-left" />
                </button>
                <button
                  type="button"
                  class={cx(style.navButton, style.navNext)}
                  onClick={this.goToNext}
                  aria-label="Next"
                >
                  <i class="fe fe-chevron-right" />
                </button>
              </>
            )}
          </div>

          {hasMultiple && (
            <div class={style.indicators}>
              {photos.map((_, index) => (
                <button
                  type="button"
                  key={index}
                  class={cx(style.indicator, { [style.indicatorActive]: index === currentIndex })}
                  onClick={() => this.goToIndex(index)}
                  aria-label={`Photo ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(PhotoBox);
