import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import Chart from 'react-apexcharts';
import cx from 'classnames';

import { RequestStatus, DASHBOARD_BOX_STATUS_KEY, DASHBOARD_BOX_DATA_KEY } from '../../../utils/consts';
import get from 'get-value';

import actions from '../../../actions/dashboard/boxes/chart';

@connect('session,user,DashboardBoxDataChartBox,DashboardBoxStatusChartBox', actions)
class ChartMultiFeaturesBox extends Component {

  // TODO mettre le loading

  toggleDropDown = () =>{
    this.props.toggleDropDown(this.props.box, this.props.x, this.props.y);
  }

  changeChartPeriod = async e =>{
    this.setState({ loading: true });
    await this.props.getChartOption(this.props.box, this.props.x, this.props.y, e.target.name);
    this.setState({ loading: false });
  }

  getChartOption= () =>{
    this.setState({ loading: true });
    this.props.getChartOption(this.props.box, this.props.x, this.props.y);
    this.setState({ loading: false });
  }

  componentDidMount() { 
    this.getChartOption(this.props.box, this.props.x, this.props.y);
  }

  render(props, {loading}) {
    const boxData = get(props, `${DASHBOARD_BOX_DATA_KEY}ChartBox.${props.x}_${props.y}`); 
    // TODO voir usage box status = dimmer loading ?
    const boxStatus = get(props, `${DASHBOARD_BOX_STATUS_KEY}ChartBox.${props.x}_${props.y}`);
    const options = get(boxData, 'options');
    const series = get(boxData, 'series');
    const apexType = get(boxData, 'apexType'); 
    const showDropDownChartBox = get(boxData, 'showDropDownChartBox'); 
    const chartPeriod = get(boxData, 'chartPeriod'); 
    console.log("===================================");
    console.log("options: ",options);
    console.log("series: ",series);
    console.log("chartPeriod: ",chartPeriod);

    return (
      <div class="card" >
        <div class="card-body">
          <div class="d-flex align-items-center">
            <div class="subheader">
              {props.box.chartName}              
            </div>
            <div class="ml-auto lh-1">
              <div class={'dropdown ' + (showDropDownChartBox && 'show')}>
                <a
                  class="dropdown-toggle text-muted"
                  data-toggle="dropdown"
                  onClick={this.toggleDropDown}
                >
                  { chartPeriod === 'last1day-selector' && 
                    <Text id="dashboard.period.label.last1day" />
                  } 
                  { chartPeriod === 'last2day-selector' && 
                    <Text id="dashboard.period.label.last2day" />
                  } 
                  { chartPeriod === 'last1week-selector' && 
                    <Text id="dashboard.period.label.last1week" />
                  } 
                  { chartPeriod === 'last1month-selector' && 
                    <Text id="dashboard.period.label.last1month" />
                  } 
                  { chartPeriod === 'last1year-selector' && 
                    <Text id="dashboard.period.label.last1year" />
                  } 
                </a>
                <div class={'dropdown-menu dropdown-menu-right ' + (showDropDownChartBox && 'show')}>
                  <a class={'dropdown-item ' + (chartPeriod === 'last1day-selector' && 'active')} href="#" 
                    onClick={this.changeChartPeriod} name="last1day-selector" 
                  >
                    <Text id="dashboard.period.label.last1day" />
                  </a>
                  <a class={'dropdown-item ' + (chartPeriod === 'last2day-selector' && 'active')}  href="#" 
                    onClick={this.changeChartPeriod} name="last2day-selector" 
                  >
                    <Text id="dashboard.period.label.last2day" />
                  </a>
                  <a class={'dropdown-item ' + (chartPeriod === 'last1week-selector' && 'active')} href="#" 
                    onClick={this.changeChartPeriod} name="last1week-selector" 
                  >
                    <Text id="dashboard.period.label.last1week" />
                  </a>
                  <a class={'dropdown-item ' + (chartPeriod === 'last1month-selector' && 'active')} href="#" 
                    onClick={this.changeChartPeriod} name="last1month-selector" 
                  >
                    <Text id="dashboard.period.label.last1month" />
                  </a>
                  <a class={'dropdown-item ' + (chartPeriod === 'last1year-selector' && 'active')} href="#" 
                    onClick={this.changeChartPeriod} name="last1year-selector" 
                  >
                    <Text id="dashboard.period.label.last1year" />
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <div class={cx('dimmer', { active: loading })}>
            <div class="loader" />
              <div class="dimmer-content">
                {boxStatus === RequestStatus.Success && (
                  options && series && apexType
                    && <Chart options={options} series={series} type={apexType} class="chart-sm" height="300px" />
                )}
              </div>
            </div>
          </div>
      </div>
      
    );
  }
}

export default ChartMultiFeaturesBox;
