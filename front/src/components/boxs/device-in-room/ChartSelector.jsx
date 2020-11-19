import { Component } from 'preact';
import { connect } from 'unistore/preact';
import Select from 'react-select';

@connect('httpClient')
class ChartSelector extends Component {
  updateSelection = option => {
    this.props.updateChartSelection(option);
  };

  componentWillReceiveProps = newProps => {
    // TODO ici mettre la liste complete + ajouter img du graph choisit
    const chartOptions = [
      {
        label: 'test1',
        selector: 'test1-selector'
      },
      {
        label: 'test2',
        selector: 'test2-selector'
      }
    ];

    let selectedChartType;
    if (newProps.selectedChartType) {
      chartOptions.map(currentChartType => {
        if (newProps.selectedChartType === currentChartType.selector) {
          selectedChartType = currentChartType;
        }
      });
    }

    this.setState({ chartOptions, selectedChartType });
  };

  render({}, { chartOptions, selectedChartType }) {
    return <Select value={selectedChartType} options={chartOptions} onChange={this.updateSelection} />;
  }
}

export default ChartSelector;
