import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import get from 'get-value';

import withIntlAsProp from '../../../../utils/withIntlAsProp';

const isNullOrUndefined = variable => variable === null || variable === undefined;
const DEFAULT_PRECISION = 'minute';

class GetDate extends Component {
  handlePrecisionChange = e => {
    this.props.updateActionProperty(this.props.path, 'precision', e.target.value);
  };

  initActionIfNeeded = () => {
    if (isNullOrUndefined(get(this.props, 'action.precision'))) {
      this.props.updateActionProperty(this.props.path, 'precision', DEFAULT_PRECISION);
    }
  };

  setVariables = () => {
    const DATETIME_VARIABLE = get(this.props.intl.dictionary, 'editScene.variables.getDate.datetime');
    const DATE_VARIABLE = get(this.props.intl.dictionary, 'editScene.variables.getDate.date');
    const TIME_VARIABLE = get(this.props.intl.dictionary, 'editScene.variables.getDate.time');
    const TIMESTAMP_VARIABLE = get(this.props.intl.dictionary, 'editScene.variables.getDate.timestamp');
    this.props.setVariables(this.props.path, [
      {
        name: 'datetime',
        type: 'time',
        ready: true,
        label: DATETIME_VARIABLE,
        data: {}
      },
      {
        name: 'date',
        type: 'time',
        ready: true,
        label: DATE_VARIABLE,
        data: {}
      },
      {
        name: 'time',
        type: 'time',
        ready: true,
        label: TIME_VARIABLE,
        data: {}
      },
      {
        name: 'timestamp',
        type: 'time',
        ready: true,
        label: TIMESTAMP_VARIABLE,
        data: {}
      }
    ]);
  };

  componentDidMount() {
    this.initActionIfNeeded();
    this.setVariables();
  }

  render({ action }) {
    return (
      <div>
        <p>
          <Text id="editScene.actionsCard.getDate.description" />
        </p>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.getDate.precisionLabel" />
          </label>
          <select class="form-control" onChange={this.handlePrecisionChange} value={action.precision}>
            <option value="second">
              <Text id="editScene.actionsCard.getDate.precisionSecond" />
            </option>
            <option value="minute">
              <Text id="editScene.actionsCard.getDate.precisionMinute" />
            </option>
            <option value="hour">
              <Text id="editScene.actionsCard.getDate.precisionHour" />
            </option>
            <option value="day">
              <Text id="editScene.actionsCard.getDate.precisionDay" />
            </option>
          </select>
        </div>
      </div>
    );
  }
}

export default connect('', {})(withIntlAsProp(GetDate));
