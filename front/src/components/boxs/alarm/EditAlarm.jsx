import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import BaseEditBox from '../baseEditBox';
import actions from '../../../actions/dashboard/boxActions';

class EditAlarm extends Component {
  updateBoxHouse = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      house: e.target.value
    });
  };

  updateBoxName = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      name: e.target.value
    });
  };

  getHouses = async () => {
    try {
      await this.setState({
        error: false,
        pending: true
      });
      const houses = await this.props.httpClient.get('/api/v1/house');
      this.setState({
        houses,
        pending: false
      });
    } catch (e) {
      console.error(e);
      this.setState({
        error: true,
        pending: false
      });
    }
  };

  componentDidMount() {
    this.getHouses();
  }

  render(props, { houses }) {
    return (
      <BaseEditBox {...props} titleKey="dashboard.boxTitle.alarm">
        <div class="form-group">
          <div class="form-group">
            <label>
              <Text id="dashboard.boxes.alarm.editBoxNameLabel" />
            </label>
            <Localizer>
              <input
                type="text"
                value={props.box.name}
                onInput={this.updateBoxName}
                class="form-control"
                placeholder={<Text id="dashboard.boxes.alarm.editBoxNamePlaceholder" />}
              />
            </Localizer>
          </div>
          <label>
            <Text id="dashboard.boxes.alarm.editHouseLabel" />
          </label>
          <select onChange={this.updateBoxHouse} class="form-control">
            <option>
              <Text id="global.emptySelectOption" />
            </option>
            {houses &&
              houses.map(house => (
                <option selected={house.selector === props.box.house} value={house.selector}>
                  {house.name}
                </option>
              ))}
          </select>
        </div>
      </BaseEditBox>
    );
  }
}

export default connect('httpClient', actions)(EditAlarm);
