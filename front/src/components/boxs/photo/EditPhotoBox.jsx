import { Component } from 'preact';
import { Localizer, Text } from 'preact-i18n';
import BaseEditBox from '../baseEditBox';
import style from './style.css';

const DEFAULT_SLIDESHOW_INTERVAL = 10;

class EditPhotoBox extends Component {
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
    const value = parseInt(e.target.value, 10);
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      photo_slideshow_interval: Number.isNaN(value) ? 0 : value
    });
  };

  updateShowCaption = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, { photo_show_caption: e.target.checked });
  };

  render(props) {
    const photos = props.box.photos || [];
    const fit = props.box.photo_fit || 'cover';
    const slideshowInterval = props.box.photo_slideshow_interval ?? DEFAULT_SLIDESHOW_INTERVAL;
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
              {photo.url && (
                <div class={style.editPhotoPreview}>
                  <img src={photo.url} alt="" class={style.editPreviewImage} loading="lazy" />
                </div>
              )}
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
            min="0"
            max="3600"
            value={slideshowInterval}
            onInput={this.updateSlideshowInterval}
          />
          <small class="form-text text-muted">
            <Text id="dashboard.boxes.photo.slideshowIntervalHelp" />
          </small>
        </div>

        <div class="form-group">
          <label class="custom-switch">
            <input type="checkbox" class="custom-switch-input" checked={showCaption} onChange={this.updateShowCaption} />
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

export default EditPhotoBox;
