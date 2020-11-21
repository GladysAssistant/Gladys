import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import Select from 'react-select';

import { CHART_PERIOD } from './chart-box-config/chartConfig';

@connect('httpClient')
class ChartPeriodSelector extends Component {
  updateSelection = option => {
    this.props.updateChartPeriodSelection(option);
  };

  componentWillReceiveProps = newProps => {

    const chartOptions = [];
    let selectedChartPeriod;
    CHART_PERIOD.map(currentChartPeriod => {
      const labelI18N = <Text id={currentChartPeriod.label} />; 
      const tmpOption ={
        label: labelI18N,
        value: currentChartPeriod.value
      }
      chartOptions.push(tmpOption);
      if (newProps.selectedChartPeriod === currentChartPeriod.value) {
        selectedChartPeriod = tmpOption;
      }
    });

    this.setState({ chartOptions, selectedChartPeriod });
  };

  render({}, { chartOptions, selectedChartPeriod }) {
    return <Select value={selectedChartPeriod} options={chartOptions} onChange={this.updateSelection} />;
  }
}

export default ChartPeriodSelector;
