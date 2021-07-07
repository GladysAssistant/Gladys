import { Component } from 'preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import get from 'get-value';

import style from './style.css';
class ButtonBox extends Component {
  buttonClick = () => {
    if (this.props.onClick) {
      const { button = {}, value } = this.props;
      const subButton = get(button, `values.${value}`, { default: {} });
      const valuedButton = { ...button, ...subButton };

      this.props.onClick(valuedButton.type, valuedButton.value);
    }
  };

  getValue(key) {
    const { button, value } = this.props;
    return get(button, `values.${value}.${key}`, { default: button[key] });
  }

  render({ category, featureName, button, editionMode, edited, value }) {
    if (!button) {
      return null;
    }

    const subButton = get(button, `values.${value}`, { default: {} });
    const valuedButton = { ...button, ...subButton };

    const { icon, text, customIconStyle, buttonClass } = valuedButton;

    return (
      <Localizer>
        <button
          class={cx('btn', buttonClass, style.iconDiv, {
            [style.editionMode]: editionMode && !edited
          })}
          disabled={!editionMode && !edited}
          onClick={this.buttonClick}
          title={<Text id={`deviceFeatureCategory.${category}.${featureName}`}>{featureName}</Text>}
        >
          <i
            class={cx('fe', {
              [`fe-${icon}`]: icon,
              [style['textued-fe']]: text
            })}
            style={customIconStyle}
          >
            {!icon && (text || ' ')}
          </i>
        </button>
      </Localizer>
    );
  }
}

export default ButtonBox;
