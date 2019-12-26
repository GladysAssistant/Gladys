import { Component } from 'preact';
import reactCSS from 'reactcss'
import { CustomPicker } from 'react-color';
import { DEVICE_FEATURE_TYPES } from '../../../../../../server/utils/constants';
import style from './style.css';

class SimpleColorDeviceFeature extends Component {

  updateValue = () => {
    console.log("updateValue", props)
  }

  handleChangeColor = (color) => {
    console.log("clicked on color", color);
  }

  render(props) {
    console.log("render", props);

    const styles = reactCSS({
      'default': {
        color: {
          width: '36px',
          height: '14px',
          borderRadius: '2px',
          background: `red`,
        }
      }
    });

    return (
      <tr>
        <td class={style.hidden}></td>
        <td>
          <div class={style.colorsContainer}>
            <div className={style.colorButton + ' ' + style.color1}>1</div>
            <div className={style.colorButton + ' ' + style.color2}>2</div>
            <div className={style.colorButton + ' ' + style.color3}>3</div>
            <div className={style.colorButton + ' ' + style.color4}>4</div>
            <div className={style.colorButton + ' ' + style.color5}>5</div>
            <div className={style.colorButton + ' ' + style.color6}>6</div>
            <div className={style.colorButton + ' ' + style.color7}>7</div>
            <div className={style.colorButton + ' ' + style.color8}>8</div>
          </div>          
        </td>        
        <td class={style.hidden}></td>
      </tr>
    );
  }
};

export default CustomPicker(SimpleColorDeviceFeature);
