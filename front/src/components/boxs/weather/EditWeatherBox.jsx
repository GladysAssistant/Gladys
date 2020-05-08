import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import actions from '../../../actions/dashboard/edit-boxes/editWeather';
import BaseEditBox from '../baseEditBox';
import Select from '../../form/Select';
import { RequestStatus } from '../../../utils/consts';

const EditWeatherBox = ({ children, ...props }) => (
  <BaseEditBox {...props} titleKey="dashboard.boxTitle.weather">
    <div class="form-group">
      <label>
        <Text id="dashboard.boxes.weather.editHouseLabel" />
      </label>
      <Select
        onChange={props.updateBoxHouse}
        options={props.houses}
        uniqueKey="selector"
        itemLabelKey="name"
        value={props.box.house}
        loading={props.housesGetStatus === RequestStatus.Getting}
      />
    </div>
  </BaseEditBox>
);

@connect('houses,housesGetStatus', actions)
class EditWeatherBoxComponent extends Component {
  updateBoxHouse = house => {
    this.props.updateBoxConfig(this.props.x, this.props.y, {
      house: house.selector
    });
  };
  componentDidMount() {
    this.props.getHouses();
  }

  render(props, {}) {
    return <EditWeatherBox {...props} updateBoxHouse={this.updateBoxHouse} />;
  }
}

export default EditWeatherBoxComponent;
