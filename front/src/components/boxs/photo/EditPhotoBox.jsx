import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Localizer, Text } from 'preact-i18n';
import BaseEditBox from '../baseEditBox';
import style from './style.css';

const DEFAULT_SLIDESHOW_INTERVAL = 10;
const MIN_SLIDESHOW_INTERVAL = 0;
const MAX_SLIDESHOW_INTERVAL = 3600;
const PREVIEW_DEBOUNCE_MS = 800;

const clampInterval = value => Math.min(Math.max(value, MIN_SLIDESHOW_INTERVAL), MAX_SLIDESHOW_INTERVAL);

/**
 * Preview of a photo, loaded through the Gladys proxy like the widget itself, so a photo
 * hosted on the local network is also visible while editing the dashboard remotely.
 */
class PhotoPreview extends Component {
  constructor(props) {
    super(props);
    this.state = { image: null, error: false };
  }

  componentDidMount() {
    this.mounted = true;
    this.schedulePreviewLoad();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.url !== this.props.url) {
      this.schedulePreviewLoad();
    }
  }

  componentWillUnmount() {
    this.mounted = false;
    clearTimeout(this.debounceTimeout);
  }

  schedulePreviewLoad = () => {
    clearTimeout(this.debounceTimeout);
    this.setState({ image: null, error: false });
    // The URL is typed character by character, we wait for a pause before hitting the proxy
    this.debounceTimeout = setTimeout(this.loadPreview, PREVIEW_DEBOUNCE_MS);
  };

  loadPreview = async () => {
    const { url } = this.props;

    if (!url) {
      return;
    }

    try {
      const image = await this.props.httpClient.get('/api/v1/dashboard/photo/proxy', { url });
      if (this.mounted && this.props.url === url) {
        this.setState({ image, error: false });
      }
    } catch (e) {
      if (this.mounted && this.props.url === url) {
        this.setState({ image: null, error: true });
      }
    }
  };

  render(props, { image, error }) {
    return (
      <div class={style.editPhotoPreview}>
        {image && !error && <img src={`data:${image}`} alt="" class={style.editPreviewImage} />}
        {error && <i class="fe fe-alert-circle text-muted" />}
      </div>
    );
  }
}

class EditPhotoBox extends Component {
  constructor(props) {
    super(props);
    // While the user is typing, the raw input value is kept here so the field can stay empty
    this.state = { slideshowIntervalInput: null };
  }

  updateName = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, { name: e.target.value });
  };

  updatePhotoUrl = (index, e) => {
    const photos = [...(this.props.box.photos || [])];
    photos[index] = { ...photos[index], url: e.target.value };
    this.props.updateBoxConfig(this.props.x, this.props.y, { photos });
  };

  updatePhotoCaption = (index, e) => {
    const photos = [...(this.props.box.photos || [])];
    photos[index] = { ...photos[index], caption: e.target.value };
    this.props.updateBoxConfig(this.props.x, this.props.y, { photos });
  };

  addPhoto = () => {
    const photos = [...(this.props.box.photos || []), { url: '', caption: '' }];
    this.props.updateBoxConfig(this.props.x, this.props.y, { photos });
  };

  removePhoto = index => {
    const photos = [...(this.props.box.photos || [])];
    photos.splice(index, 1);
    this.props.updateBoxConfig(this.props.x, this.props.y, { photos });
  };

  updateFit = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, { photo_fit: e.target.value });
  };

  updateSlideshowInterval = e => {
    const rawValue = e.target.value;
    this.setState({ slideshowIntervalInput: rawValue });

    const value = parseInt(rawValue, 10);
    // An empty (or not yet valid) field is kept as-is so the user can clear it and retype a value,
    // it is validated on blur.
    if (!Number.isNaN(value)) {
      this.props.updateBoxConfig(this.props.x, this.props.y, {
        photo_slideshow_interval: Math.max(value, MIN_SLIDESHOW_INTERVAL)
      });
    }
  };

  validateSlideshowInterval = () => {
    const { slideshowIntervalInput } = this.state;

    if (slideshowIntervalInput === null) {
      return;
    }

    const value = parseInt(slideshowIntervalInput, 10);
    this.setState({ slideshowIntervalInput: null });
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      photo_slideshow_interval: Number.isNaN(value) ? 0 : clampInterval(value)
    });
  };

  updateShowCaption = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, { photo_show_caption: e.target.checked });
  };

  render(props, { slideshowIntervalInput }) {
    const photos = props.box.photos || [];
    const fit = props.box.photo_fit || 'cover';
    const savedSlideshowInterval =
      props.box.photo_slideshow_interval != null ? props.box.photo_slideshow_interval : DEFAULT_SLIDESHOW_INTERVAL;
    const slideshowInterval = slideshowIntervalInput !== null ? slideshowIntervalInput : savedSlideshowInterval;
    const showCaption = props.box.photo_show_caption !== false;

    return (
      <BaseEditBox {...props} titleKey="dashboard.boxTitle.photo">
        <p class="text-muted small mb-3">
          <Text id="dashboard.boxes.photo.description" />
        </p>

        <div class="form-group">
          <label>
            <Text id="dashboard.boxes.photo.editNameLabel" />
          </label>
          <Localizer>
            <input
              type="text"
              class="form-control"
              placeholder={<Text id="dashboard.boxes.photo.editNamePlaceholder" />}
              value={props.box.name || ''}
              onInput={this.updateName}
            />
          </Localizer>
        </div>

        <div class="form-group">
          <label>
            <Text id="dashboard.boxes.photo.photosLabel" />
          </label>
          {photos.map((photo, index) => (
            <div key={index} class={style.editPhotoRow}>
              <div class={style.editPhotoFields}>
                <Localizer>
                  <input
                    type="url"
                    class="form-control mb-2"
                    placeholder={<Text id="dashboard.boxes.photo.editUrlPlaceholder" />}
                    value={photo.url || ''}
                    onInput={e => this.updatePhotoUrl(index, e)}
                  />
                </Localizer>
                <Localizer>
                  <input
                    type="text"
                    class="form-control"
                    placeholder={<Text id="dashboard.boxes.photo.editCaptionPlaceholder" />}
                    value={photo.caption || ''}
                    onInput={e => this.updatePhotoCaption(index, e)}
                  />
                </Localizer>
              </div>
              {photo.url && <PhotoPreview url={photo.url} httpClient={props.httpClient} />}
              <button type="button" class="btn btn-outline-danger btn-sm" onClick={() => this.removePhoto(index)}>
                <i class="fe fe-trash-2" />
              </button>
            </div>
          ))}
          <button type="button" class="btn btn-secondary btn-sm mt-2" onClick={this.addPhoto}>
            <i class="fe fe-plus mr-1" />
            <Text id="dashboard.boxes.photo.addPhotoButton" />
          </button>
        </div>

        <div class="form-group">
          <label>
            <Text id="dashboard.boxes.photo.fitLabel" />
          </label>
          <select value={fit} onChange={this.updateFit} class="form-control">
            <option value="cover">
              <Text id="dashboard.boxes.photo.fitCover" />
            </option>
            <option value="contain">
              <Text id="dashboard.boxes.photo.fitContain" />
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>
            <Text id="dashboard.boxes.photo.slideshowIntervalLabel" />
          </label>
          <input
            type="number"
            class="form-control"
            min={MIN_SLIDESHOW_INTERVAL}
            max={MAX_SLIDESHOW_INTERVAL}
            value={slideshowInterval}
            onInput={this.updateSlideshowInterval}
            onBlur={this.validateSlideshowInterval}
          />
          <small class="form-text text-muted">
            <Text id="dashboard.boxes.photo.slideshowIntervalHelp" />
          </small>
        </div>

        <div class="form-group">
          <label class="custom-switch">
            <input
              type="checkbox"
              class="custom-switch-input"
              checked={showCaption}
              onChange={this.updateShowCaption}
            />
            <span class="custom-switch-indicator" />
            <span class="custom-switch-description">
              <Text id="dashboard.boxes.photo.showCaptionLabel" />
            </span>
          </label>
        </div>
      </BaseEditBox>
    );
  }
}

export default connect('httpClient', {})(EditPhotoBox);
