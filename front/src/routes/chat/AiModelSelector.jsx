import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import cx from 'classnames';
import style from './style.css';

class AiModelSelector extends Component {
  state = {
    models: [],
    loading: true,
    loadError: false
  };

  componentDidMount() {
    this.fetchModels();
  }

  fetchModels = async () => {
    try {
      const response = await this.props.httpClient.get('/api/v1/gateway/aichat/models');
      this.setState({
        models: response.models || [],
        loading: false,
        loadError: false
      });
    } catch (e) {
      console.error(e);
      this.setState({
        loading: false,
        loadError: true
      });
    }
  };

  handleChange = e => {
    if (this.props.onChange) {
      this.props.onChange(e.target.value);
    }
  };

  render({ value }, { models, loading, loadError }) {
    return (
      <div class={style.modelSelectorWrap}>
        <label class={style.modelSelectorLabel} for="ai-chat-model">
          <Text id="chat.modelSelector.label" />
        </label>
        <select
          id="ai-chat-model"
          class={cx('form-control', 'form-control-sm', style.modelSelector)}
          value={value}
          onChange={this.handleChange}
          disabled={loading || loadError}
        >
          <option value="auto">
            <Text id="chat.modelSelector.auto" />
          </option>
          {models.map(model => (
            <option key={model.id} value={model.id}>
              {model.id}
              {model.vision ? ' · vision' : ''}
            </option>
          ))}
        </select>
      </div>
    );
  }
}

export default connect('httpClient', {})(AiModelSelector);
