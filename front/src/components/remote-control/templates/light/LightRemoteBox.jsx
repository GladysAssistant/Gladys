import AbstractRemoteComponent from '../AbstractRemoteComponent';
import { DEVICE_FEATURE_TYPES } from '../../../../../../server/utils/constants';
import ButtonOptions from './template';

class LightRemoteBox extends AbstractRemoteComponent {
  constructor(props) {
    super(props, ButtonOptions);
  }

  render() {
    return <div class="d-flex">{this.renderButton(DEVICE_FEATURE_TYPES.LIGHT.BINARY)}</div>;
  }
}

export default LightRemoteBox;
