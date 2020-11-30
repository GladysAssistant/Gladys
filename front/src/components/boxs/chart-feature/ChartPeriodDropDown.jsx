import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';

import actions from '../../../actions/dashboard/boxes/chart';

@connect('session,user,DashboardBoxDataChartBox,DashboardBoxStatusChartBox', actions)
class ChartPeriodDropDown extends Component {
  render({ children, ...props }) {
    return (
      <div class={`dropdown ${this.props.showDropDownChartBox && 'show'}`}>
        <a class="dropdown-toggle text-muted" data-toggle="dropdown" onClick={props.toggleDropDown}>
          {this.props.chartPeriod === 'last1day-selector' && <Text id="dashboard.period.label.last1day" />}
          {this.props.chartPeriod === 'last2day-selector' && <Text id="dashboard.period.label.last2day" />}
          {this.props.chartPeriod === 'last1week-selector' && <Text id="dashboard.period.label.last1week" />}
          {this.props.chartPeriod === 'last1month-selector' && <Text id="dashboard.period.label.last1month" />}
          {this.props.chartPeriod === 'last1year-selector' && <Text id="dashboard.period.label.last1year" />}
        </a>
        <div class={`dropdown-menu dropdown-menu-right ' ${this.props.showDropDownChartBox && 'show'}`}>
          <a
            class={`dropdown-item ${this.props.chartPeriod === 'last1day-selector' && 'active'}`}
            href="#"
            onClick={props.changeChartPeriod}
            name="last1day-selector"
          >
            <Text id="dashboard.period.label.last1day" />
          </a>
          <a
            class={`dropdown-item ${this.props.chartPeriod === 'last2day-selector' && 'active'}`}
            href="#"
            onClick={props.changeChartPeriod}
            name="last2day-selector"
          >
            <Text id="dashboard.period.label.last2day" />
          </a>
          <a
            class={`dropdown-item ${this.props.chartPeriod === 'last1week-selector' && 'active'}`}
            href="#"
            onClick={props.changeChartPeriod}
            name="last1week-selector"
          >
            <Text id="dashboard.period.label.last1week" />
          </a>
          <a
            class={`dropdown-item ${this.props.chartPeriod === 'last1month-selector' && 'active'}`}
            href="#"
            onClick={props.changeChartPeriod}
            name="last1month-selector"
          >
            <Text id="dashboard.period.label.last1month" />
          </a>
          <a
            class={`dropdown-item ${this.props.chartPeriod === 'last1year-selector' && 'active'}`}
            href="#"
            onClick={props.changeChartPeriod}
            name="last1year-selector"
          >
            <Text id="dashboard.period.label.last1year" />
          </a>
        </div>
      </div>
    );
  }
}

export default ChartPeriodDropDown;
