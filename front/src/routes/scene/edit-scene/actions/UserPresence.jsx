import Select from 'react-select';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';

import { ACTIONS } from '../../../../../../server/utils/constants';

class UserSeenAtHome extends Component {
  getOptions = async () => {
    try {
      const [users, houses] = await Promise.all([
        this.props.httpClient.get('/api/v1/user'),
        this.props.httpClient.get('/api/v1/house')
      ]);
      const userOptions = [];
      users.forEach(user => {
        userOptions.push({
          label: user.firstname,
          value: user.selector
        });
      });
      const houseOptions = [];
      houses.forEach(house => {
        houseOptions.push({
          label: house.name,
          value: house.selector
        });
      });
      await this.setState({ userOptions, houseOptions });
      this.refreshSelectedOptions(this.props);
      return userOptions;
    } catch (e) {
      console.error(e);
    }
  };
  handleChange = selectedOption => {
    if (selectedOption && selectedOption.value) {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'user', selectedOption.value);
    } else {
      this.props.updateActionProperty(this.props.columnIndex, this.props.index, 'user', null);
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
    let selectedOption = '';
    let selectedHouseOption = '';
    if (nextProps.action.user && this.state.userOptions) {
      const userOption = this.state.userOptions.find(option => option.value === nextProps.action.user);

      if (userOption) {
        selectedOption = userOption;
      }
    }
    if (nextProps.action.house && this.state.houseOptions) {
      const houseOption = this.state.houseOptions.find(option => option.value === nextProps.action.house);

      if (houseOption) {
        selectedHouseOption = houseOption;
      }
    }
    this.setState({ selectedOption, selectedHouseOption });
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      selectedOption: '',
      selectedHouseOption: ''
    };
  }
  componentDidMount() {
    this.getOptions();
  }
  componentWillReceiveProps(nextProps) {
    this.refreshSelectedOptions(nextProps);
  }
  render(props, { selectedOption, userOptions, houseOptions, selectedHouseOption }) {
    return (
      <div>
        <p>
          {props.action.type === ACTIONS.USER.SET_SEEN_AT_HOME && (
            <Text id="editScene.actionsCard.userPresence.userSeenDescription" />
          )}
          {props.action.type === ACTIONS.USER.SET_OUT_OF_HOME && (
            <Text id="editScene.actionsCard.userPresence.userLeftHomeDescription" />
          )}
        </p>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.userPresence.userLabel" />
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <Select options={userOptions} value={selectedOption} onChange={this.handleChange} />
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.userPresence.houseLabel" />
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <Select options={houseOptions} value={selectedHouseOption} onChange={this.handleHouseChange} />
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(UserSeenAtHome);
