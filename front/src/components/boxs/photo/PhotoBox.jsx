import { Component } from 'preact';
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
    this.state = {
      currentIndex: 0,
      imageError: false,
      isTransitioning: false
    };
  }

  static getDerivedStateFromProps(props, state) {
    const photos = getValidPhotos(get(props, 'box.photos', []));
    const boundedIndex = getBoundedIndex(state.currentIndex, photos.length);

    if (boundedIndex !== state.currentIndex) {
      return { currentIndex: boundedIndex, imageError: false };
    }

    return null;
  }

  componentDidMount() {
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
      this.preloadNextImage();
    }
  }

  componentWillUnmount() {
    clearInterval(this.slideshowInterval);
  }

  preloadNextImage = () => {
    const photos = getValidPhotos(get(this.props, 'box.photos', []));
    if (photos.length <= 1) {
      return;
    }
    const nextIndex = (this.state.currentIndex + 1) % photos.length;
    const img = new Image();
    img.src = photos[nextIndex].url;
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
      imageError: false,
      isTransitioning: true
    }));
    setTimeout(() => this.setState({ isTransitioning: false }), 600);
    this.startSlideshow();
  };

  goToIndex = index => {
    this.setState({ currentIndex: index, imageError: false, isTransitioning: true });
    setTimeout(() => this.setState({ isTransitioning: false }), 600);
    this.startSlideshow();
  };

  handleImageError = () => {
    this.setState({ imageError: true });
  };

  handleImageLoad = () => {
    this.setState({ imageError: false });
  };

  render(props, state) {
    const photos = getValidPhotos(get(props, 'box.photos', []));
    const name = get(props, 'box.name', '');
    const fit = get(props, 'box.photo_fit', PHOTO_FIT_COVER);
    const showCaption = get(props, 'box.photo_show_caption', true);
    const { currentIndex, imageError, isTransitioning } = state;

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
            {!imageError ? (
              <img
                key={currentPhoto.url}
                src={currentPhoto.url}
                alt={currentPhoto.caption || ''}
                class={cx(style.photo, {
                  [style.photoCover]: fit === PHOTO_FIT_COVER,
                  [style.photoContain]: fit === PHOTO_FIT_CONTAIN,
                  [style.photoTransitioning]: isTransitioning
                })}
                loading="lazy"
                onError={this.handleImageError}
                onLoad={this.handleImageLoad}
              />
            ) : (
              <div class={style.errorState}>
                <i class={`fe fe-alert-circle ${style.errorIcon}`} />
                <Text id="dashboard.boxes.photo.imageError" />
              </div>
            )}

            {showCaption && currentPhoto.caption && !imageError && (
              <div class={style.captionOverlay}>
                <span class={style.captionText}>{currentPhoto.caption}</span>
              </div>
            )}

            {hasMultiple && (
              <>
                <button type="button" class={cx(style.navButton, style.navPrev)} onClick={this.goToPrevious} aria-label="Previous">
                  <i class="fe fe-chevron-left" />
                </button>
                <button type="button" class={cx(style.navButton, style.navNext)} onClick={this.goToNext} aria-label="Next">
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

export default PhotoBox;
