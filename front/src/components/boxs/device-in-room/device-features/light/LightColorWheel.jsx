import { Component, createRef } from 'preact';
import iro from '@jaames/iro';

import { intToHex, hexToInt } from '../../../../../../../server/utils/colors';
import style from './style.css';

// The wheel is the main target of the panel: it takes the width it is given, between a comfortable
// floor on a phone and a size that stays reachable with one thumb on a tablet.
const MIN_WHEEL_WIDTH = 180;
const MAX_WHEEL_WIDTH = 260;

/**
 * The color wheel of the light panel: a full-width iro wheel that resizes with its container,
 * instead of the fixed 150px one squeezed in a table cell.
 */
class LightColorWheel extends Component {
  containerRef = createRef();

  wheelRef = createRef();

  // While the finger is on the wheel, the value coming back from the parent state is our own echo:
  // writing it back into the picker would fight the drag.
  userIsInteracting = false;

  componentDidMount() {
    const { value } = this.props;

    this.colorPicker = new iro.ColorPicker(this.wheelRef.current, {
      width: this.getWidth(),
      color: Number.isFinite(value) ? `#${intToHex(value)}` : undefined,
      layout: [{ component: iro.ui.Wheel, options: {} }]
    });

    this.colorPicker.on('input:start', this.handleInputStart);
    this.colorPicker.on('input:change', this.handleInputChange);
    this.colorPicker.on('input:end', this.handleInputEnd);

    window.addEventListener('resize', this.handleResize);
  }

  componentDidUpdate(previousProps) {
    const { value } = this.props;
    if (previousProps.value !== value && !this.userIsInteracting && Number.isFinite(value)) {
      this.colorPicker.color.hexString = `#${intToHex(value)}`;
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  getWidth = () => {
    const container = this.containerRef.current;
    const availableWidth = container ? container.getBoundingClientRect().width : MAX_WHEEL_WIDTH;
    return Math.round(Math.max(MIN_WHEEL_WIDTH, Math.min(MAX_WHEEL_WIDTH, availableWidth)));
  };

  handleResize = () => {
    if (this.colorPicker) {
      this.colorPicker.resize(this.getWidth());
    }
  };

  handleInputStart = () => {
    this.userIsInteracting = true;
  };

  handleInputChange = color => {
    this.props.onChange(hexToInt(color.hexString));
  };

  handleInputEnd = color => {
    this.userIsInteracting = false;
    this.props.onChange(hexToInt(color.hexString));
  };

  render() {
    return (
      <div ref={this.containerRef} class={style.colorWheel}>
        <div ref={this.wheelRef} />
      </div>
    );
  }
}

export default LightColorWheel;
