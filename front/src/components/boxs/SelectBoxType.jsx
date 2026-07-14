import { Component } from 'preact';
import { Text } from 'preact-i18n';
import get from 'get-value';
import { DASHBOARD_BOX_TYPE_LIST } from '../../../../server/utils/constants';
import withIntlAsProp from '../../utils/withIntlAsProp';

// Widget "devices in room" is deprecated and will be removed soon
const DASHBOARD_BOX_TYPE_LIST_FILTERED = DASHBOARD_BOX_TYPE_LIST.filter(
  dashboardBoxType => dashboardBoxType !== 'devices-in-room'
);

import BaseEditBox from './baseEditBox';

class SelectBoxType extends Component {
  selectType = e => {
    this.props.updateNewSelectedBox(this.props.x, this.props.y, e.target.value);
  };
  render(props) {
    const sortedBoxTypes = DASHBOARD_BOX_TYPE_LIST_FILTERED.map(dashboardBoxType => ({
      type: dashboardBoxType,
      label: get(props.intl.dictionary, `dashboard.boxTitle.${dashboardBoxType}`, { default: dashboardBoxType })
    })).sort((a, b) => a.label.localeCompare(b.label));
    return (
      <BaseEditBox {...props} titleKey="dashboard.selectBoxType">
        <div class="form-group">
          <label>
            <Text id="dashboard.selectBoxTypeLabel" />
          </label>
          <select onChange={this.selectType} class="form-control">
            <option>
              <Text id="global.emptySelectOption" />
            </option>
            {sortedBoxTypes.map(({ type, label }) => (
              <option value={type}>{label}</option>
            ))}
          </select>
        </div>
      </BaseEditBox>
    );
  }
}

export default withIntlAsProp(SelectBoxType);
