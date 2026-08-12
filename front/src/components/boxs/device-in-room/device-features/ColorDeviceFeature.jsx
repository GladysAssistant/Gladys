import { Component, createRef, Fragment } from 'preact';
import cx from 'classnames';
import iro from '@jaames/iro';

import { intToHex, hexToInt } from '../../../../../../server/utils/colors';

import style from './style.css';

class ColorDeviceType extends Component {
  colorPickerRef = createRef();

  blur = event => {
    if (!event.composedPath().includes(this.colorPickerRef.current.parentElement)) {
      this.closeColorPicker(false);
    }
  };

  closeColorPicker = () => {
    this.setColorPickerState(false);
  };

  toggleColorPicker = () => {
    this.setColorPickerState(!this.state.open);
  };

  setColorPickerState = (open, fromEvent) => {
    if (!open) {
      document.removeEventListener('click', this.blur, true);
    }

    this.setState({ open, fromEvent }, () => {
      if (this.state.open) {
        document.addEventListener('click', this.blur, true);
      }
    });
  };

  updateValue = color => {
    const colorInt = hexToInt(color.hexString);
    this.props.updateValue(this.props.deviceFeature, colorInt);
  };

  constructor(props) {
    super(props);

    this.blur = this.blur.bind(this);
  }

  componentDidMount() {
    const deviceLastValue = this.props.deviceFeature.last_value;
    const color = !deviceLastValue ? undefined : `#${intToHex(deviceLastValue)}`;

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

  componentWillUnmount() {
    document.removeEventListener('click', this.blur, true);
  }

  render({ rowName, deviceFeature }, { open }) {
    const deviceLastValue = deviceFeature.last_value;
    const color = !deviceLastValue ? undefined : `#${intToHex(deviceLastValue)}`;

    return (
      <Fragment>
        <tr>
          <td>
            <i class="fe fe-circle" />
          </td>
          <td>{rowName}</td>
          <td class="text-right">
            <div class="m-0 float-right d-flex">
              <button
                class="btn py-2 border-1 border-dark"
                style={{ backgroundColor: color }}
                onClick={this.toggleColorPicker}
                disabled={open}
              />
            </div>
          </td>
        </tr>
        <tr>
          <td colSpan="3" class="border-0 p-0">
            <div
              class={cx('fade', 'w-100', 'mw-100', style.deviceRowPopover, {
                'd-none': !open,
                popover: open,
                show: open
              })}
            >
              <div class="row justify-content-end">
                <div class="col-8 py-3 d-flex justify-content-center">
                  <div ref={this.colorPickerRef} />
                </div>
                <div class="col-2">
                  <button class="close m-2" onClick={this.closeColorPicker} />
                </div>
              </div>
            </div>
          </td>
        </tr>
      </Fragment>
    );
  }
}

export default ColorDeviceType;
