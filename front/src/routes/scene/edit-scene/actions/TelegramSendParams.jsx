import Select from 'react-select';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';

@connect('', {})
class TelegramSendParams extends Component {
  handleChangeDuration = e => {
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'value', e.target.value);
  };
  handleChangeUnit = e => {
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'unit', e.target.value);
  };
  componentDidMount() {
    if (!this.props.unit) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'unit', 'seconds');
    }
  }
  render(props, {}) {
    return (
      <div>
        <div class="form-group">
          <label class="form-label">
            User <span class="form-required">*</span>
          </label>
          <Select
            options={
              props.sceneParamsData &&
              props.sceneParamsData.users.map(user => ({
                value: user.selector,
                label: user.firstname
              }))
            }
          />
        </div>
        <div class="form-group">
          <label class="form-label">
            Telegram message <span class="form-required">*</span>
          </label>
          <textarea class="form-control" value={props.action.text} placeholder="Text" />
        </div>
      </div>
    );
  }
}

export default TelegramSendParams;
