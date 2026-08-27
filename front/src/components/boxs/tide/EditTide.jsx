import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import BaseEditBox from '../baseEditBox';
import actions from '../../../actions/dashboard/boxActions';

const EditTideBox = ({ ...props }) => (
  <BaseEditBox {...props} titleKey="dashboard.boxTitle.tide">
    <p class="alert alert-info">
      <Text id="dashboard.boxes.tide.editDescription" />
    </p>
    <div class="form-group">
      <label>
        <Text id="dashboard.boxes.tide.editHouseLabel" />
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
    <div class="form-group">
      <label class="custom-switch">
        <input
          type="checkbox"
          id="tideDisplayCurve"
          name="tideDisplayCurve"
          class="custom-switch-input"
          checked={props.box.display_curve !== false}
          onClick={props.updateDisplayCurve}
        />
        <span class="custom-switch-indicator" />
        <span class="custom-switch-description">
          <Text id="dashboard.boxes.tide.displayCurveLabel" />
        </span>
      </label>
      <p class="mt-2">
        <small class="text-muted">
          <Text id="dashboard.boxes.tide.displayCurveDescription" />
        </small>
      </p>
    </div>
  </BaseEditBox>
);

class EditTideBoxComponent extends Component {
  updateBoxHouse = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      house: e.target.value
    });
  };

  updateDisplayCurve = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      display_curve: e.target.checked
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
      <EditTideBox
        {...props}
        houses={houses}
        updateBoxHouse={this.updateBoxHouse}
        updateDisplayCurve={this.updateDisplayCurve}
      />
    );
  }
}

export default connect('httpClient', actions)(EditTideBoxComponent);
