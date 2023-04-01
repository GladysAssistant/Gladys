import { Component } from 'preact';
import { Localizer, Text } from 'preact-i18n';

class LANManagerIPLine extends Component {
  toggleStatus = () => {
    const { ipMask, maskIndex } = this.props;
    this.props.updateMaskConfig(maskIndex, { ...ipMask, enabled: !ipMask.enabled });
  };

  deleteMask = () => {
    const { maskIndex } = this.props;
    this.props.deleteMaskConfig(maskIndex);
  };

  render({ ipMask, disabled }) {
    const { networkInterface, enabled, mask, name } = ipMask;
    const editable = !networkInterface;
    return (
      <tr>
        <td>{mask}</td>
        <td>{name}</td>
        <td>
          <label class="custom-switch">
            <input
              type="radio"
              class="custom-switch-input"
              checked={enabled}
              onClick={this.toggleStatus}
              disabled={disabled}
            />
            <span class="custom-switch-indicator" />
          </label>
        </td>
        <td>
          <Localizer>
            <button
              class="btn btn-danger btn-sm"
              disabled={!editable || disabled}
              onClick={this.deleteMask}
              title={
                editable ? (
                  <Text id="integration.lanManager.setup.deleteButtonTooltip" />
                ) : (
                  <Text id="integration.lanManager.setup.networkInterfaceDescription" />
                )
              }
            >
              <i class="fe fe-trash" />
            </button>
          </Localizer>
        </td>
      </tr>
    );
  }
}

export default LANManagerIPLine;
