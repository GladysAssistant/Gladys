import update from 'immutability-helper';
import get from 'get-value';
import { RequestStatus } from '../../../utils/consts';
import createBoxActions from '../boxActions';
import chartConfig from './chart-box-config/chartConfig';
import chartStyle from '../../../actions/dashboard/boxes/chart-box-config/chartStyle';

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
        
        // const chartData = state.httpClient.get(`/api/v1/room/${box.room}?expand=devices`);
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
        chartData.forEach(device => {
          const yData = [];
          device.features.forEach(feature => {
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

        // TODO last_value, unit , room name et device name a revoir => depends du type de box
        boxActions.mergeBoxData(state, BOX_KEY, x, y, {
          options,
          series,
          apexType,
          chartPeriod: newChartPeriod,
          showDropDownChartBox: false,
          roomName: chartData.roomName,
          deviceName: chartData.deviceName,
          lastValue: chartData.lastValue,
          unit: chartData.unit,
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
