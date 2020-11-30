import update from 'immutability-helper';
import get from 'get-value';
import { RequestStatus } from '../../../utils/consts';
import createBoxActions from '../boxActions';
import chartConfig from './chart-box-config/chartConfig';
import chartStyle from '../../../actions/dashboard/boxes/chart-box-config/chartStyle';
import commons from './commons';

const BOX_KEY = 'ChartBox';
function createActions(store) {
  const boxActions = createBoxActions(store);

  const actions = {
    toggleDropDown(state, box, x, y) {

      const data = boxActions.getBoxData(state, BOX_KEY, x, y);
      const currentShowDropDownChartBox = get(data, 'showDropDownChartBox');
      const showDropDownChartBox = !currentShowDropDownChartBox;
            
      boxActions.mergeBoxData(state, BOX_KEY, x, y, {
        showDropDownChartBox
      });
    },
    async getChartOption(state, box, x, y, chartPeriod) {

      boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Getting);
      try {

        let newChartPeriod = box.chartPeriod;
        if(chartPeriod){
          newChartPeriod = chartPeriod;
        }
        
        const chartData = await state.httpClient
          .get(`/api/v1/device_feature_sate/${box.device_features}?downsample=true&maxValue=1000&chartPeriod=${newChartPeriod}`);        
                
        let chartTypeStyle;
        let apexType;
        switch (box.chartType) {
          case chartConfig.CHART_TYPE_SELECTOR.LINE.name:
            chartTypeStyle = chartStyle.OPTIONS_LINE;
            apexType = chartConfig.CHART_TYPE_SELECTOR.LINE.apexName;
            break;
          case chartConfig.CHART_TYPE_SELECTOR.AREA.name:
            chartTypeStyle = chartStyle.OPTIONS_AREA;
            apexType = chartConfig.CHART_TYPE_SELECTOR.AREA.apexName;
            break;
          case chartConfig.CHART_TYPE_SELECTOR.BAR.name:
            chartTypeStyle = chartStyle.OPTIONS_BAR;
            apexType = chartConfig.CHART_TYPE_SELECTOR.BAR.apexName;
            break;
          default:
            chartTypeStyle = chartStyle.OPTIONS_LINE.NAME;
            apexType = chartConfig.CHART_TYPE_SELECTOR.LINE.apexName;
        }

        // we merge the old with the new one
        let options = update(
          chartStyle.OPTIONS_COMMON,
          {
            chart: {
              $merge: chartTypeStyle.chart
            }
          },
          {
            xaxis: {
              $merge: chartTypeStyle.xaxis
            }
          },
          {
            yaxis: {
              $merge: chartTypeStyle.yaxis
            }
          }
        );
        for (let attrName in chartTypeStyle) {
          if (attrName !== 'chart' && attrName !== 'xaxis' && attrName !== 'yaxis') {
            if (chartTypeStyle.hasOwnProperty(attrName)) {
              options[attrName] = chartTypeStyle[attrName];
            }
          }
        }

        const series = [];
        const xData = [];
        let minYAxis;
        let maxYAxis; 
        let unit;
        chartData.forEach(device => {
          device.features.forEach(feature => {
            const yData = [];
            // Format unit to display
            unit = commons.formatUnitToDisplay(feature.unit);
            
            feature.device_feature_states.forEach(featureState => {
              xData.push(featureState.x);
              yData.push(featureState.y);
            });
            series.push(
              {
                name: device.name + ' - ' + feature.name,
                data: yData 
              }
            );
            const formatter = y => {
              if(typeof y !== "undefined") {
                return  y.toFixed(2) + ' ' + unit;
              }
              return y;
            };
            options.tooltip.y.push({
              formatter
            });
            
            const tmpMinYAxis = Math.min.apply(null, yData);
            if(!minYAxis || minYAxis > tmpMinYAxis){
              minYAxis = tmpMinYAxis;
            }
            const tmpMaxYAxis = Math.max.apply(null, yData);
            if(!maxYAxis || maxYAxis < tmpMaxYAxis){
              maxYAxis = tmpMaxYAxis;
            }

          });
        });

        options.xaxis.categories = xData;
        options.yaxis.min = minYAxis - 1;
        options.yaxis.max = maxYAxis + 1;

        // Specific to OneFeature Box
        let deviceName = '';
        let roomName = '';
        let lastValue = '';
        let trend = 1;
        let trendColor = 'grey';
        if(box.type === 'chart-one-feature' && chartData.length > 0){
          options.grid.padding.bottom = 0;
          deviceName = chartData[0].name;
          roomName = chartData[0].room.name; 
          if(chartData[0].features.length > 0){
            lastValue = chartData[0].features[0].last_value;
            trend = chartData[0].features[0].trend;
            if(trend < 1){
              trendColor = 'red';
            }
            if(trend > 1){
              trendColor = 'green';
            }
          }
        }else{
          options.grid.padding.bottom = 40;
        }

        // TODO last_value, unit , room name et device name a revoir => depends du type de box
        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          options,
          series,
          apexType,
          chartPeriod: newChartPeriod,
          showDropDownChartBox: false,
          roomName,
          deviceName,
          lastValue,
          unit,
          trend,
          trendColor
        });

        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Success);
      } catch (e) {
        boxActions.updateBoxStatus(state, BOX_KEY, x, y, RequestStatus.Error);
      }
    }
  };

  return actions;
}

export default createActions;
