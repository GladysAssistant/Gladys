import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import BaseEditBox from '../baseEditBox';
import actions from '../../../actions/dashboard/boxActions';

const EditSunBox = ({ ...props }) => (
  <BaseEditBox {...props} titleKey="dashboard.boxTitle.sun">
    <div class="form-group">
      <label>
        <Text id="dashboard.boxes.sun.editHouseLabel" />
      </label>
      <select onChange={props.updateBoxHouse} class="form-control">
        <option value="">
          <Text id="global.emptySelectOption" />
        </option>
        {props.houses &&
          props.houses.map(house => (
            <option key={house.selector} selected={house.selector === props.box.house} value={house.selector}>
              {house.name}
            </option>
          ))}
      </select>
    </div>
  </BaseEditBox>
);

class EditSunBoxComponent extends Component {
  updateBoxHouse = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      house: e.target.value
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
    return <EditSunBox {...props} houses={houses} updateBoxHouse={this.updateBoxHouse} />;
  }
}

export default connect('httpClient', actions)(EditSunBoxComponent);
