import { Component } from 'preact';
import 'cropperjs/dist/cropper.css';
import Cropper from 'cropperjs';

const imageStyle = {
  maxHeight: '15rem'
};

class EditableProfilePicture extends Component {
  initCropper = () => {
    if (this.cropper) {
      this.cropper.destroy();
    }
    this.cropper = new Cropper(this.img, {
      aspectRatio: 1
    });
    this.props.setCropperInstance(this.cropper);
  };
  componentDidMount() {
    this.initCropper();
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.newProfilePicture !== this.props.newProfilePicture) {
      this.cropper.destroy();
      this.initCropper();
    }
  }
  shouldComponentUpdate(nextProps) {
    if (nextProps.newProfilePicture !== this.props.newProfilePicture) {
      return true;
    }
    return false;
  }
  componentDidUpdate() {
    this.initCropper();
  }
  componentWillUnmount() {
    if (this.img) {
      this.cropper.destroy();
      delete this.img;
      delete this.cropper;
    }
  }

  render(props, {}) {
    return (
      <div style={imageStyle}>
        <img ref={img => (this.img = img)} src={props.newProfilePicture} />
      </div>
    );
  }
}

export default EditableProfilePicture;
