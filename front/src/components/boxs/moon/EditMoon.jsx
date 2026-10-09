import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import BaseEditBox from '../baseEditBox';
import actions from '../../../actions/dashboard/boxActions';

const EditMoonBox = ({ ...props }) => (
  <BaseEditBox {...props} titleKey="dashboard.boxTitle.moon">
    <div class="form-group">
      <label>
        <Text id="dashboard.boxes.moon.editHouseLabel" />
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
          id="moonDisplayDetails"
          name="moonDisplayDetails"
          class="custom-switch-input"
          checked={props.box.display_details !== false}
          onClick={props.updateDisplayDetails}
        />
        <span class="custom-switch-indicator" />
        <span class="custom-switch-description">
          <Text id="dashboard.boxes.moon.displayDetailsLabel" />
        </span>
      </label>
      <p class="mt-2">
        <small class="text-muted">
          <Text id="dashboard.boxes.moon.displayDetailsDescription" />
        </small>
      </p>
    </div>
    <div class="form-group">
      <label class="custom-switch">
        <input
          type="checkbox"
          id="moonComputeAtMidnight"
          name="moonComputeAtMidnight"
          class="custom-switch-input"
          checked={props.box.compute_at_midnight === true}
          onClick={props.updateComputeAtMidnight}
        />
        <span class="custom-switch-indicator" />
        <span class="custom-switch-description">
          <Text id="dashboard.boxes.moon.computeAtMidnightLabel" />
        </span>
      </label>
      <p class="mt-2">
        <small class="text-muted">
          <Text id="dashboard.boxes.moon.computeAtMidnightDescription" />
        </small>
      </p>
    </div>
  </BaseEditBox>
);

class EditMoonBoxComponent extends Component {
  updateBoxHouse = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      house: e.target.value
    });
  };

  updateDisplayDetails = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      display_details: e.target.checked
    });
  };

  updateComputeAtMidnight = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      compute_at_midnight: e.target.checked
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
      <EditMoonBox
        {...props}
        houses={houses}
        updateBoxHouse={this.updateBoxHouse}
        updateDisplayDetails={this.updateDisplayDetails}
        updateComputeAtMidnight={this.updateComputeAtMidnight}
      />
    );
  }
}

export default connect('httpClient', actions)(EditMoonBoxComponent);
