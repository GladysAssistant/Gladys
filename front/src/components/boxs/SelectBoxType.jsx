import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { DASHBOARD_BOX_TYPE_LIST } from '../../../../server/utils/constants';

import BaseEditBox from './baseEditBox';

class SelectBoxType extends Component {
  selectType = e => {
    this.props.updateNewSelectedBox(this.props.x, this.props.y, e.target.value);
  };
  render(props) {
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
            {DASHBOARD_BOX_TYPE_LIST.map(dashboardBoxType => (
              <option value={dashboardBoxType}>
                <Text id={`dashboard.boxTitle.${dashboardBoxType}`} />
              </option>
            ))}
          </select>
        </div>
      </BaseEditBox>
    );
  }
}

export default SelectBoxType;
