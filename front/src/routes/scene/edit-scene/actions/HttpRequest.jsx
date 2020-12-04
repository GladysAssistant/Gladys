import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';

const METHOD_WITH_BODY = ['post', 'patch', 'put'];

@connect('', {})
class HttpRequestAction extends Component {
  handleChangeMethod = e => {
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'method', e.target.value);
    if (!METHOD_WITH_BODY.includes(e.target.value)) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'body', undefined);
    }
  };
  handleChangeUrl = e => {
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'url', e.target.value);
  };
  handleChangeBody = e => {
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'body', e.target.value);
  };
  componentDidMount() {
    if (!this.props.action.method) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'method', 'post');
    }
  }
  render(props, {}) {
    const displayBody = METHOD_WITH_BODY.includes(props.action.method);
    return (
      <div>
        <p>
          <Text id="editScene.actionsCard.httpRequest.description" />
        </p>
        <form>
          <div class="form-group">
            <label class="form-label">
              <Text id="editScene.actionsCard.httpRequest.methodLabel" />
              <span class="form-required">
                <Text id="global.requiredField" />
              </span>
            </label>
            <select class="custom-select" value={props.action.method} onChange={this.handleChangeMethod}>
              <option value="post">
                <Text id="editScene.actionsCard.httpRequest.post" />
              </option>
              <option value="get">
                <Text id="editScene.actionsCard.httpRequest.get" />
              </option>
              <option value="put">
                <Text id="editScene.actionsCard.httpRequest.put" />
              </option>
              <option value="patch">
                <Text id="editScene.actionsCard.httpRequest.patch" />
              </option>
              <option value="delete">
                <Text id="editScene.actionsCard.httpRequest.delete" />
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">
              <Text id="editScene.actionsCard.httpRequest.urlLabel" />
              <span class="form-required">
                <Text id="global.requiredField" />
              </span>
            </label>
            <Localizer>
              <input
                type="text"
                class="form-control"
                value={props.action.url}
                onChange={this.handleChangeUrl}
                placeholder={<Text id="editScene.actionsCard.httpRequest.urlPlaceholder" />}
              />
            </Localizer>
          </div>
          {displayBody && (
            <div class="form-group">
              <label class="form-label">
                <Text id="editScene.actionsCard.httpRequest.bodyLabel" />
                <span class="form-required">
                  <Text id="global.requiredField" />
                </span>
              </label>
              <Localizer>
                <textarea
                  type="text"
                  class="form-control"
                  value={props.action.body}
                  onChange={this.handleChangeBody}
                  placeholder={<Text id="editScene.actionsCard.httpRequest.bodyPlaceholder" />}
                />
              </Localizer>
            </div>
          )}
        </form>
      </div>
    );
  }
}

export default HttpRequestAction;
