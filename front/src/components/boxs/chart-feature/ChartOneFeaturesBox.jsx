import { Component } from 'preact';
import { connect } from 'unistore/preact';
import Chart from 'react-apexcharts';
import cx from 'classnames';
import get from 'get-value';
import { Text } from 'preact-i18n';

import ChartPeriodDropDown from './ChartPeriodDropDown';
import { RequestStatus, DASHBOARD_BOX_STATUS_KEY, DASHBOARD_BOX_DATA_KEY } from '../../../utils/consts';

import actions from '../../../actions/dashboard/boxes/chart';

@connect('session,user,DashboardBoxDataChartBox,DashboardBoxStatusChartBox', actions)
class ChartOneFeaturesBox extends Component {
  
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
    const boxStatus = get(props, `${DASHBOARD_BOX_STATUS_KEY}ChartBox.${props.x}_${props.y}`);
    const options = get(boxData, 'options');
    const series = get(boxData, 'series');
    const apexType = get(boxData, 'apexType'); 
    const showDropDownChartBox = get(boxData, 'showDropDownChartBox'); 
    const chartPeriod = get(boxData, 'chartPeriod');
    const roomName = get(boxData, 'roomName'); 
    const deviceName = get(boxData, 'deviceName'); 
    const lastValue = get(boxData, 'lastValue'); 
    const unit = get(boxData, 'unit'); 
    const trend = get(boxData, 'trend'); 
    const trendColor = get(boxData, 'trendColor');

    return (
      <div class="card" >
        <div class="card-body">
          <div class="d-flex align-items-baseline">
            <div class="subheader">
              <div class="h5 mb-3 mr-2">{roomName + ' - ' + deviceName}</div>         
            </div>
            <div class="ml-auto lh-1">
              <ChartPeriodDropDown box={props.box} x={props.x} y={props.y} 
                chartPeriod={chartPeriod} 
                showDropDownChartBox={showDropDownChartBox} 
                toggleDropDown={this.toggleDropDown} 
                changeChartPeriod={this.changeChartPeriod}
              />
            </div>
          </div>
          <div class="d-flex align-items-baseline">
            <Text id="dashboard.boxes.devicesChart.lastValue" />  
            <div class="h6 mb-3 mr-2" style="padding-left: 0.5em;" >
              {lastValue + ' ' + unit}
              <span class="d-inline-flex align-items-baseline lh-1">
                <svg xmlns="http://www.w3.org/2000/svg" 
                  class="icon ml-1" width="24" height="24" viewBox="0 0 24 24" 
                  stroke-width="2" stroke={trendColor} fill="none" 
                  stroke-linecap="round" stroke-linejoin="round"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  { (trend === 1) && <line x1="5" y1="12" x2="19" y2="12" />}
                  { (trend > 1) && <polyline points="3 17 9 11 13 15 21 7" />}
                  { (trend > 1) && <polyline points="14 7 21 7 21 14" />}
                  { (trend < 1) && <polyline points="3 7 9 13 13 9 21 17" /> }
                  { (trend < 1) && <polyline points="21 10 21 17 14 17" /> }                  
                </svg>
              </span>
            </div>
          </div>
          
          <div class={cx('dimmer', { active: loading })}>
            <div class="loader" />
              <div class="dimmer-content">
                {boxStatus === RequestStatus.Success && (
                  options && series && apexType
                    && <Chart options={options} series={series} type={apexType} class="chart-sm" height="50" />
                )}
              </div>
            </div>
          </div>
      </div>      
    );
  }
}

export default ChartOneFeaturesBox;