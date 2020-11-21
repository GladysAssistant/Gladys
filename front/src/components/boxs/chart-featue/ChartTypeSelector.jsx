import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import Select from 'react-select';

import { CHART_TYPE } from './chart-box-config/chartConfig';

@connect('httpClient')
class ChartTypeSelector extends Component {
  updateSelection = option => {
    this.props.updateChartTypeSelection(option);
  };

  componentWillReceiveProps = newProps => { 

    const chartOptions = [];

    let selectedChartType;
    CHART_TYPE.map(currentChartType => {
      const labelI18N = <Text id={currentChartType.label} />; 
      const tmpOption ={
        label: labelI18N,
        value: currentChartType.value
      }
      chartOptions.push(tmpOption);
      if (newProps.selectedChartType === currentChartType.value) {
        selectedChartType = tmpOption
      }
    });
    
    this.setState({ chartOptions, selectedChartType });
  };

  render({}, { chartOptions, selectedChartType }) {
    return <Select value={selectedChartType} options={chartOptions} onChange={this.updateSelection} />;
  }
}

export default ChartTypeSelector;
