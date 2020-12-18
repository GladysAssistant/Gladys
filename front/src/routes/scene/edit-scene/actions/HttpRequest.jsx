import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import update from 'immutability-helper';

const METHOD_WITH_BODY = ['post', 'patch', 'put'];

class Header extends Component {
  updateHeaderKey = e => {
    this.props.updateHeader(this.props.index, {
      key: e.target.value,
      value: this.props.header.value
    });
  };
  updateHeaderValue = e => {
    this.props.updateHeader(this.props.index, {
      key: this.props.header.key,
      value: e.target.value
    });
  };
  deleteHeader = e => {
    e.preventDefault();
    this.props.deleteHeader(this.props.index);
  };
  render(props) {
    return (
      <div class="row g-2 mb-2">
        <div class="col-5">
          <Localizer>
            <input
              type="text"
              class="form-control"
              value={props.header.key}
              onChange={this.updateHeaderKey}
              placeholder={<Text id="editScene.actionsCard.httpRequest.headersKeyPlaceholder" />}
            />
          </Localizer>
        </div>
        <div class="col-5">
          <Localizer>
            <input
              type="text"
              class="form-control"
              value={props.header.value}
              onChange={this.updateHeaderValue}
              placeholder={<Text id="editScene.actionsCard.httpRequest.headersValuePlaceholder" />}
            />
          </Localizer>
        </div>
        <div class="col-2">
          <button class="btn btn-danger" onClick={this.deleteHeader}>
            <i class="fe fe-trash" />
          </button>
        </div>
      </div>
    );
  }
}

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
  addNewHeader = e => {
    e.preventDefault();
    const newHeaderArray = update(this.props.action.headers || [], {
      $push: [
        {
          key: null,
          value: null
        }
      ]
    });
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'headers', newHeaderArray);
  };
  updateHeader = (index, newHeader) => {
    const newHeaderArray = update(this.props.action.headers, {
      [index]: {
        $set: newHeader
      }
    });
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'headers', newHeaderArray);
  };
  deleteHeader = index => {
    const newHeaderArray = update(this.props.action.headers, {
      $splice: [[index, 1]]
    });
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'headers', newHeaderArray);
  };
  componentDidMount() {
    if (!this.props.action.method) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'method', 'post');
    }
    if (!this.props.action.headers) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'headers', []);
    }
  }
  render(props) {
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
          <div class="form-group">
            <label class="form-label">
              <Text id="editScene.actionsCard.httpRequest.headersLabel" />
              <span class="form-required">
                <Text id="global.requiredField" />
              </span>
            </label>
            {props.action.headers &&
              props.action.headers.map((header, index) => (
                <Header
                  header={header}
                  index={index}
                  updateHeader={this.updateHeader}
                  deleteHeader={this.deleteHeader}
                  lastItem={index === props.action.headers.length - 1}
                />
              ))}
            <button class="btn btn-secondary" onClick={this.addNewHeader}>
              <i class="fe fe-plus" />
            </button>
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
