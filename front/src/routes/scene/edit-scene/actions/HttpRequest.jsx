import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';
import update from 'immutability-helper';

import TextWithVariablesInjected from '../../../../components/scene/TextWithVariablesInjected';

const METHOD_WITH_BODY = ['post', 'patch', 'put'];

const helpTextStyle = {
  fontSize: 12,
  marginBottom: '.375rem'
};

function isNumeric(str) {
  if (typeof str != 'string') return false; // we only process strings!
  return (
    !isNaN(str) && !isNaN(parseFloat(str)) // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
  ); // ...and ensure strings of whitespace fail
}

const getAllPropertiesObject = (obj, path = '', results = []) => {
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    const shouldContinueParsingTree = typeof value === 'object' && value !== null && value !== undefined;
    const keyIsNumber = isNumeric(key);
    if (shouldContinueParsingTree && !keyIsNumber) {
      getAllPropertiesObject(value, `${path}${key}.`, results);
    } else if (shouldContinueParsingTree && keyIsNumber) {
      getAllPropertiesObject(value, `${path}[${key}].`, results);
    } else if (!keyIsNumber) {
      results.push(`${path}${key}`);
    } else if (keyIsNumber) {
      results.push(`${path}[${key}]`);
    }
  });
  return results;
};

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
  handleChangeBody = text => {
    const newBody = text && text.length > 0 ? text : undefined;
    this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'body', newBody);
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
  loadVariables = keys => {
    const { columnIndex, index } = this.props;
    const keysVariables = keys.map(key => {
      const keyWithData = `data.${key}`;
      return {
        name: keyWithData,
        type: 'http_request',
        ready: true,
        label: keyWithData
      };
    });
    keysVariables.push({
      name: 'status',
      type: 'http_request',
      ready: true,
      label: 'status'
    });
    this.props.setVariables(columnIndex, index, keysVariables);
  };
  tryRequest = async e => {
    e.preventDefault();
    try {
      await this.setState({ error: false, pending: true });
      // format headers properly for the http request route
      const newHeaders = {};
      this.props.action.headers.forEach(header => {
        newHeaders[header.key] = header.value;
      });
      const actionWithCorrectHeader = update(this.props.action, {
        headers: {
          $set: newHeaders
        }
      });
      const { data, headers } = await this.props.httpClient.post('/api/v1/http/request', actionWithCorrectHeader);
      let responseData = data;
      const isJsonResponse =
        headers && headers['content-type'] && headers['content-type'].indexOf('application/json') !== -1;
      if (isJsonResponse) {
        responseData = JSON.stringify(data, null, 2);
      }
      this.setState({
        apiTestResponse: responseData
      });
      if (isJsonResponse) {
        const keys = getAllPropertiesObject(data);
        this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'request_response_keys', keys);
        this.loadVariables(keys);
      }
      await this.setState({ error: false, pending: false });
    } catch (e) {
      console.error(e);
      await this.setState({ error: true, pending: false });
    }
  };
  componentDidMount() {
    if (!this.props.action.method) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'method', 'post');
    }
    if (!this.props.action.headers) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'headers', []);
    }
    if (this.props.action.request_response_keys) {
      this.loadVariables(this.props.action.request_response_keys);
    }
  }
  render(props) {
    const displayBody = METHOD_WITH_BODY.includes(props.action.method);
    return (
      <div>
        <div
          class={cx('dimmer', {
            active: this.state.pending
          })}
        >
          <div class="loader" />
          <div class="dimmer-content">
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
                  </label>
                  <div style={helpTextStyle}>
                    <Text id="editScene.actionsCard.httpRequest.variablesExplanation" />
                  </div>
                  <Localizer>
                    <TextWithVariablesInjected
                      text={props.action.body}
                      updateText={this.handleChangeBody}
                      triggersVariables={props.triggersVariables}
                      actionsGroupsBefore={props.actionsGroupsBefore}
                      variables={props.variables}
                      placeholder={<Text id="editScene.actionsCard.httpRequest.bodyPlaceholder" />}
                    />
                  </Localizer>
                </div>
              )}
              {this.state.apiTestResponse && (
                <div>
                  <label class="form-label">
                    <Text id="editScene.actionsCard.httpRequest.responseData" />
                  </label>
                  <pre>
                    <code>{this.state.apiTestResponse}</code>
                  </pre>
                </div>
              )}
              {this.state.error && (
                <div class="alert alert-danger">
                  <Text id="editScene.actionsCard.httpRequest.requestError" />
                </div>
              )}
              <button class="btn btn-primary" onClick={this.tryRequest}>
                <Text id="editScene.actionsCard.httpRequest.tryButton" />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(HttpRequestAction);
