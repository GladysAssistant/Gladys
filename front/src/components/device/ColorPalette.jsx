import { Component } from 'preact';
import cx from 'classnames';

import { hexToInt, intToHex } from '../../../../server/utils/colors';
import { BASIC_COLOR_PALETTE, WHITE_COLOR_PALETTE } from '../../utils/colorPalette';
import withIntlAsProp from '../../utils/withIntlAsProp';

import style from './ColorPalette.css';

class ColorPalette extends Component {
  getLabel = labelKey => {
    const [section, key] = labelKey.split('.');
    return this.props.intl.dictionary[section][key];
  };

  selectColor = hex => {
    this.props.onSelectColor(hexToInt(hex));
  };

  isSelected = hex => {
    const { value } = this.props;
    if (value === undefined || value === null) {
      return false;
    }

    return intToHex(value).toLowerCase() === hex.replace('#', '').toLowerCase();
  };

  renderSwatch = color => (
    <button
      key={color.hex}
      type="button"
      class={cx(style.colorSwatch, {
        [style.colorSwatchSelected]: this.isSelected(color.hex)
      })}
      style={{ backgroundColor: color.hex }}
      onClick={() => this.selectColor(color.hex)}
      title={this.getLabel(color.labelKey)}
      aria-label={this.getLabel(color.labelKey)}
    />
  );

  render() {
    return (
      <div class={style.colorPalette}>
        <div class={style.colorPaletteRow}>{BASIC_COLOR_PALETTE.map(this.renderSwatch)}</div>
        <div class={style.colorPaletteRow}>{WHITE_COLOR_PALETTE.map(this.renderSwatch)}</div>
      </div>
    );
  }
}

export default withIntlAsProp(ColorPalette);
