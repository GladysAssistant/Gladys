import { Component, createRef } from 'preact';
import cx from 'classnames';
import iro from '@jaames/iro';

import { intToHex, hexToInt } from '../../../../server/utils/colors';

class ColorDeviceType extends Component {
  colorPickerRef = createRef();

  updateValue = color => {
    if (color) {
      const colorInt = hexToInt(color.hexString);
      this.props.updateValue(colorInt);
    }
  };

  componentDidMount() {
    const { value } = this.props;
    const color = !value ? undefined : `#${intToHex(value)}`;

    this.colorPicker = new iro.ColorPicker(this.colorPickerRef.current, {
      width: 150,
      color,
      layout: [
        {
          component: iro.ui.Wheel,
          options: {}
        }
      ]
    });
    this.colorPicker.on('input:end', color => this.updateValue(color));
  }

  componentDidUpdate(previousProps) {
    if (previousProps.value !== this.props.value) {
      const { value } = this.props;
      if (value) {
        const color = `#${intToHex(value)}`;
        this.colorPicker.color.hexString = color;
      }
    }
  }

  render({}, {}) {
    return (
      <div
        class={cx('fade', 'w-100', 'mw-100', {
          show: true
        })}
      >
        <div class="row justify-content-end">
          <div class="col-12 py-3 d-flex justify-content-center">
            <div ref={this.colorPickerRef} />
          </div>
        </div>
      </div>
    );
  }
}

export default ColorDeviceType;
