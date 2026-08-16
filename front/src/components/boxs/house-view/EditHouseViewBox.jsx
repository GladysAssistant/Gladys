import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import update from 'immutability-helper';

import BaseEditBox from '../baseEditBox';
import SelectDeviceFeature from '../../device/SelectDeviceFeature';
import { HOUSE_VIEW_GALLERY } from './gallery';
import { resolveHouseViewImage } from './HouseViewBox';
import style from './style.css';

const MAX_UPLOAD_DIMENSION = 1600;

// Downscale and re-encode the uploaded image in a canvas so the payload
// stays well under the server bound whatever the source photo size
const fileToResizedBase64 = file =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, MAX_UPLOAD_DIMENSION / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      const contentType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const dataUrl = canvas.toDataURL(contentType, 0.85);
      resolve({ contentType, data: dataUrl.split(',')[1] });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('INVALID_IMAGE'));
    };
    image.src = objectUrl;
  });

class EditHouseViewBox extends Component {
  updateName = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, { name: e.target.value });
  };

  selectGalleryImage = key => {
    this.props.updateBoxConfig(this.props.x, this.props.y, { image: `gallery:${key}` });
  };

  uploadImage = async e => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      return;
    }
    this.setState({ uploading: true, uploadError: false });
    try {
      const { contentType, data } = await fileToResizedBase64(file);
      const { id } = await this.props.httpClient.post(`/api/v1/dashboard_asset/${this.props.homeDashboard.selector}`, {
        content_type: contentType,
        data
      });
      this.props.updateBoxConfig(this.props.x, this.props.y, { image: `asset:${id}` });
    } catch (err) {
      console.error(err);
      this.setState({ uploadError: true });
    }
    this.setState({ uploading: false });
  };

  refreshImagePreview = async () => {
    try {
      const imageUrl = await resolveHouseViewImage(this.props.httpClient, this.props.box.image);
      this.setState({ imageUrl });
    } catch (e) {
      console.error(e);
    }
  };

  addPinOnImage = e => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
    const yPct = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;
    const pins = this.props.box.pins || [];
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      pins: [...pins, { x_pct: xPct, y_pct: yPct, device_feature: undefined }]
    });
  };

  updatePin = (index, data) => {
    const newPins = update(this.props.box.pins, { [index]: { $merge: data } });
    this.props.updateBoxConfig(this.props.x, this.props.y, { pins: newPins });
  };

  removePin = index => {
    const newPins = update(this.props.box.pins, { $splice: [[index, 1]] });
    this.props.updateBoxConfig(this.props.x, this.props.y, { pins: newPins });
  };

  componentDidMount() {
    this.refreshImagePreview();
  }

  componentDidUpdate(previousProps) {
    if (previousProps.box.image !== this.props.box.image) {
      this.refreshImagePreview();
    }
  }

  render(props, { imageUrl, uploading, uploadError }) {
    const selectedImage = props.box.image || '';
    const pins = props.box.pins || [];
    return (
      <BaseEditBox {...props} titleKey="dashboard.boxTitle.house-view">
        <div class="form-group">
          <label class="form-label">
            <Text id="dashboard.boxes.house-view.editNameLabel" />
          </label>
          <Localizer>
            <input
              type="text"
              class="form-control"
              placeholder={<Text id="dashboard.boxes.house-view.editNamePlaceholder" />}
              value={props.box.name}
              onInput={this.updateName}
            />
          </Localizer>
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="dashboard.boxes.house-view.editGalleryLabel" />
          </label>
          <div class={style.galleryGrid}>
            {HOUSE_VIEW_GALLERY.map(galleryEntry => (
              <div
                class={cx(style.galleryItem, {
                  [style.galleryItemSelected]: selectedImage === `gallery:${galleryEntry.key}`
                })}
                onClick={() => this.selectGalleryImage(galleryEntry.key)}
              >
                <img src={galleryEntry.url} alt={galleryEntry.key} />
              </div>
            ))}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="dashboard.boxes.house-view.editUploadLabel" />
          </label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            class="form-control"
            onChange={this.uploadImage}
          />
          {uploading && (
            <small class="d-block mt-1">
              <Text id="dashboard.boxes.house-view.uploading" />
            </small>
          )}
          {uploadError && (
            <div class="alert alert-danger mt-2">
              <Text id="dashboard.boxes.house-view.uploadError" />
            </div>
          )}
        </div>
        {imageUrl && (
          <div class="form-group">
            <label class="form-label">
              <Text id="dashboard.boxes.house-view.editPinsLabel" />
            </label>
            <small class="d-block mb-2">
              <Text id="dashboard.boxes.house-view.editPinsDescription" />
            </small>
            <div class={style.imageWrapper}>
              <img class={cx(style.image, style.editImage)} src={imageUrl} alt="" onClick={this.addPinOnImage} />
              {pins.map((pin, index) => (
                <span class={style.editPinNumber} style={`left: ${pin.x_pct}%; top: ${pin.y_pct}%;`}>
                  {index + 1}
                </span>
              ))}
            </div>
            {pins.map((pin, index) => (
              <div class="card p-3 mt-2 mb-0">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <strong>
                    <Text id="dashboard.boxes.house-view.editPinLabel" fields={{ index: index + 1 }} />
                  </strong>
                  <button class="btn btn-sm btn-outline-danger" onClick={() => this.removePin(index)}>
                    <i class="fe fe-trash" />
                  </button>
                </div>
                <div class="form-group">
                  <label class="form-label">
                    <Text id="dashboard.boxes.house-view.editPinFeatureLabel" />
                  </label>
                  <SelectDeviceFeature
                    value={pin.device_feature}
                    onDeviceFeatureChange={feature =>
                      this.updatePin(index, { device_feature: feature ? feature.selector : undefined })
                    }
                  />
                </div>
                <div class="form-group mb-0">
                  <label class="form-label">
                    <Text id="dashboard.boxes.house-view.editPinLabelLabel" />
                  </label>
                  <Localizer>
                    <input
                      type="text"
                      class="form-control"
                      placeholder={<Text id="dashboard.boxes.house-view.editPinLabelPlaceholder" />}
                      value={pin.label}
                      onInput={e => this.updatePin(index, { label: e.target.value })}
                    />
                  </Localizer>
                </div>
              </div>
            ))}
          </div>
        )}
      </BaseEditBox>
    );
  }
}

export default connect('httpClient', {})(EditHouseViewBox);
