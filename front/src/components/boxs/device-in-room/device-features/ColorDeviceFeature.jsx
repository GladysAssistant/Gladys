import { Component } from 'preact';
import reactCSS from 'reactcss'
import { GithubPicker, SketchPicker, BlockPicker, TwitterPicker, CirclePicker } from 'react-color';
import { DEVICE_FEATURE_TYPES } from '../../../../../../server/utils/constants';

class ColorDeviceType extends Component {

  state = {
    displayColorPicker: false,
  };

  updateValue = () => {

    props.updateValue(
      props.x,
      props.y,
      props.device,
      props.deviceFeature,
      props.deviceIndex,
      props.deviceFeatureIndex
    );

    console.log("updating")
    console.log(props.device)
    console.log(props.deviceFeature)
  }

  handleButtonColorClick = () => {
    console.log("clicked color button")
    this.setState({ displayColorPicker: !this.state.displayColorPicker });
  }

  handleCloseColor = () => {
    console.log("closed color")
    this.setState({ displayColorPicker: false })
  }

  handleChangeColor = (colorObject) => {
    const colorDeviceFeature = this.props.device.features.find(
      deviceFeature => deviceFeature.type === DEVICE_FEATURE_TYPES.LIGHT.COLOR
    );

    console.log("clicked on color:", colorObject);

    const color = {
      h: colorObject.hsl.h,
      s: colorObject.hsl.s,
      l: colorObject.hsl.l
    }

    this.setState({
      color
    });

    this.props.setValue(colorDeviceFeature, color);
    this.handleCloseColor();
  }

  

  render(props, { loading }) {

    console.log(props.device)
    console.log(props.deviceFeature)

    const styles = reactCSS({
      'default': {
        color: {
          width: '36px',
          height: '14px',
          borderRadius: '2px',
          background: `red`,
        },
        swatch: {
          padding: '5px',
          background: '#fff',
          borderRadius: '1px',
          boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
          display: 'inline-block',
          cursor: 'pointer',
        },
        popover: {
          position: 'absolute',
          zIndex: '2',
        },
        cover: {
          position: 'fixed',
          top: '0px',
          right: '0px',
          bottom: '0px',
          left: '0px',
        },
      },
    });

    return (
      <tr>
        <td>
          <i class="fe fe-aperture" />
        </td>
        <td>{props.device.name}</td>
        <td class="text-right">
          <label class="custom-switch">
            <div>
              <div style={ styles.swatch } onClick={ this.handleButtonColorClick }>
                <div style={ styles.color } />
              </div>
              { this.state.displayColorPicker ? <div style={ styles.popover }>
                <div style={ styles.cover } onClick={ this.handleCloseColor }/>
                <GithubPicker color={ this.state.color } onChangeComplete={ this.handleChangeColor } />
                {/* GithubPicker, SketchPicker, BlockPicker, TwitterPicker, CirclePicker */}
              </div> : null }
            </div>
          </label>
        </td>
      </tr>
    );
  }
};

export default ColorDeviceType;
