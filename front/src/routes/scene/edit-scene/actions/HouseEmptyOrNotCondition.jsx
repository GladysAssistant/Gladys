import Select from 'react-select';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';

import { ACTIONS } from '../../../../../../server/utils/constants';

class HouseEmptyOrNotCondition extends Component {
  getOptions = async () => {
    try {
      const houses = await this.props.httpClient.get('/api/v1/house');
      const houseOptions = [];
      houses.forEach(house => {
        houseOptions.push({
          label: house.name,
          value: house.selector
        });
      });
      await this.setState({ houseOptions });
      this.refreshSelectedOptions(this.props);
    } catch (e) {
      console.error(e);
    }
  };
  handleHouseChange = selectedOption => {
    if (selectedOption && selectedOption.value) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'house', selectedOption.value);
    } else {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'house', null);
    }
  };
  refreshSelectedOptions = nextProps => {
    let selectedHouseOption = '';
    if (nextProps.action.house && this.state.houseOptions) {
      const houseOption = this.state.houseOptions.find(option => option.value === nextProps.action.house);

      if (houseOption) {
        selectedHouseOption = houseOption;
      }
    }
    this.setState({ selectedHouseOption });
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      selectedHouseOption: ''
    };
  }
  componentDidMount() {
    this.getOptions();
  }
  componentWillReceiveProps(nextProps) {
    this.refreshSelectedOptions(nextProps);
  }
  render(props, { houseOptions, selectedHouseOption }) {
    return (
      <div>
        <p>
          {props.action.type === ACTIONS.HOUSE.IS_EMPTY && (
            <Text id="editScene.actionsCard.houseEmptyOrNot.houseIsEmptyDescription" />
          )}
          {props.action.type === ACTIONS.HOUSE.IS_NOT_EMPTY && (
            <Text id="editScene.actionsCard.houseEmptyOrNot.houseIsNotEmptyDescription" />
          )}
        </p>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.houseEmptyOrNot.houseLabel" />
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <Select
            options={houseOptions}
            class="scene-house-empty-or-not-choose-house"
            value={selectedHouseOption}
            onChange={this.handleHouseChange}
          />
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(HouseEmptyOrNotCondition);
