import { Component } from 'preact';
import Select from 'react-select';

import withIntlAsProp from '../../utils/withIntlAsProp';

function hexToRgb(hex) {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => {
    return r + r + g + g + b + b;
  });

  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null;
}

function generateDimmedColor(hex) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, 0.1);`;
}

const dot = (color = '#ccc') => ({
  alignItems: 'center',
  display: 'flex',

  ':before': {
    backgroundColor: color,
    borderRadius: 10,
    content: '" "',
    display: 'block',
    marginRight: 8,
    height: 10,
    width: 10
  }
});

const colourStyles = {
  menu: provided => ({ ...provided, zIndex: 2 }),
  control: styles => ({ ...styles, backgroundColor: 'white' }),
  option: (styles, { data, isDisabled, isFocused, isSelected }) => {
    const color = data.value;
    return {
      ...styles,
      backgroundColor: isDisabled ? null : isSelected ? color : isFocused ? generateDimmedColor(color) : null,
      color: isDisabled ? '#ccc' : isSelected ? data.contrast : color,
      cursor: isDisabled ? 'not-allowed' : 'default',

      ':active': {
        ...styles[':active'],
        backgroundColor: !isDisabled && color,
        opacity: !isDisabled && (isSelected ? 1 : 0.1)
      }
    };
  },
  input: styles => ({ ...styles, ...dot() }),
  placeholder: styles => ({ ...styles, ...dot() }),
  singleValue: (styles, { data }) => ({ ...styles, ...dot(data.value) })
};

class ColorPicker extends Component {
  initValue = props => {
    const colorOptions = [
      {
        value: '#3498db',
        label: this.props.intl.dictionary.color.blue,
        contrast: 'white'
      },
      {
        value: '#e74c3c',
        label: this.props.intl.dictionary.color.red,
        contrast: 'white'
      },
      {
        value: '#2ecc71',
        label: this.props.intl.dictionary.color.green,
        contrast: 'white'
      },
      {
        value: '#2c3e50',
        label: this.props.intl.dictionary.color.black,
        contrast: 'white'
      },
      {
        value: '#f1c40f',
        label: this.props.intl.dictionary.color.yellow,
        contrast: 'black'
      },
      {
        value: '#8e44ad',
        label: this.props.intl.dictionary.color.purple,
        contrast: 'white'
      }
    ];

    this.setState({ colorOptions });

    if (props.value) {
      const color = colorOptions.find(c => c.value === props.value);
      if (color) {
        this.setState({ value: color });
      }
    }
  };
  onChange = value => {
    this.props.setColor(value.value);
  };
  componentDidMount() {
    this.initValue(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.initValue(nextProps);
  }
  render(props, { value, colorOptions }) {
    if (!colorOptions) {
      return null;
    }
    return (
      <Select
        id="react-select-color-picker"
        defaultValue={colorOptions[0]}
        options={colorOptions}
        styles={colourStyles}
        value={value}
        onChange={this.onChange}
      />
    );
  }
}

export default withIntlAsProp(ColorPicker);
