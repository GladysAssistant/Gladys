import { Component, createRef } from 'preact';
import iro from '@jaames/iro';

import { intToHex, hexToInt } from '../../../../../../../server/utils/colors';
import style from './style.css';

// The wheel is the main target of the panel: it takes the width it is given, up to a size that
// stays reachable with one thumb on a tablet. It is also the tallest block under the brightness
// bar, so it gives way on a short viewport (a phone in landscape, a browser with both toolbars
// out) rather than pushing the sheet into a long scroll. Both bounds are hard caps — a width or
// height floor would make the wheel overflow the very container or viewport it must fit.
const MAX_WHEEL_WIDTH = 260;
const MAX_WHEEL_SHARE_OF_VIEWPORT_HEIGHT = 0.32;

/**
 * The color wheel of the light panel: a full-width iro wheel that resizes with its container,
 * instead of the fixed 150px one squeezed in a table cell.
 *
 * A drag emits two different things. `onPreview` fires on every move and only paints the panel —
 * writing the color there would send one order per move (~5/s through a debounce) to a lamp whose
 * color writes are expensive (xy conversion, Zigbee/Hue queues). `onChange` fires when the finger
 * leaves the wheel, and is the only one that reaches the device.
 *
 * iro@5 does not listen to `touchcancel` (its document listeners are touchmove/touchend only), so
 * a cancelled touch — browser scroll takeover, OS gesture — leaves it mid-drag until the next
 * touchend anywhere on the page, whose `input:end` would commit the cancelled color. A window
 * `touchcancel` listener marks the interaction as cancelled: the events iro keeps emitting for it
 * are swallowed, nothing is written, and the wheel snaps back to the value of the lamp.
 */
class LightColorWheel extends Component {
  containerRef = createRef();

  wheelRef = createRef();

  // While the finger is on the wheel, the value coming back from the parent state is our own echo:
  // writing it back into the picker would fight the drag.
  userIsInteracting = false;

  // Set by a touchcancel during a drag: the interaction is dead, its remaining iro events must not
  // preview nor commit anything.
  interactionCancelled = false;

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
    window.addEventListener('touchcancel', this.handleTouchCancel);
  }

  componentDidUpdate(previousProps) {
    const { value } = this.props;
    if (previousProps.value !== value && !this.userIsInteracting && Number.isFinite(value)) {
      this.colorPicker.color.hexString = `#${intToHex(value)}`;
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('touchcancel', this.handleTouchCancel);
    this.colorPicker.off('input:start', this.handleInputStart);
    this.colorPicker.off('input:change', this.handleInputChange);
    this.colorPicker.off('input:end', this.handleInputEnd);
    this.colorPicker = null;
  }

  getWidth = () => {
    const container = this.containerRef.current;
    const availableWidth = container ? container.getBoundingClientRect().width : MAX_WHEEL_WIDTH;
    const availableHeight = window.innerHeight * MAX_WHEEL_SHARE_OF_VIEWPORT_HEIGHT;
    return Math.round(Math.min(MAX_WHEEL_WIDTH, availableWidth, availableHeight));
  };

  handleResize = () => {
    if (this.colorPicker) {
      this.colorPicker.resize(this.getWidth());
    }
  };

  handleInputStart = () => {
    this.userIsInteracting = true;
    this.interactionCancelled = false;
  };

  handleInputChange = color => {
    if (this.interactionCancelled) {
      return;
    }
    this.props.onPreview(hexToInt(color.hexString));
  };

  handleInputEnd = color => {
    this.userIsInteracting = false;
    if (this.interactionCancelled) {
      this.interactionCancelled = false;
      return;
    }
    this.props.onChange(hexToInt(color.hexString));
  };

  handleTouchCancel = () => {
    if (!this.userIsInteracting) {
      return;
    }
    this.userIsInteracting = false;
    this.interactionCancelled = true;
    // Prop sync was suppressed during the drag: put the wheel back on the color the lamp has.
    const { value } = this.props;
    if (Number.isFinite(value)) {
      this.colorPicker.color.hexString = `#${intToHex(value)}`;
    }
    if (this.props.onCancel) {
      this.props.onCancel();
    }
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
