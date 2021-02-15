import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';

import 'react-datepicker/dist/react-datepicker.css';

@connect('httpClient,user', {})
class SunriseSunsetTrigger extends Component {
  handleHouseChange = e => {
    this.props.updateTriggerProperty(this.props.index, 'house', e.target.value);
  };

  render({}, {}) {
    let houseValid = false;
    if (this.props.trigger.house === undefined || this.props.trigger.house === '') {
      houseValid = true;
    } else if (this.props.houses) {
      const selectedHouse = this.props.houses.find(house => house.selector === this.props.trigger.house);
      if (selectedHouse !== undefined) {
        houseValid = selectedHouse.latitude && selectedHouse.longitude;
      }
    }

    return (
      <div>
        <div class="row">
          <div class="col-sm-12">
            <div class="form-group">
              <div class="form-label">
                <Text id="editScene.triggersCard.scheduledTrigger.house" />
              </div>
              {!houseValid && (
                <div className="alert alert-danger">
                  <Text id="editScene.triggersCard.warning.houseWithoutCoordinate" />
                </div>
              )}
              <select onChange={this.handleHouseChange} className="form-control">
                <option value="">
                  <Text id="global.emptySelectOption" />
                </option>
                {this.props.houses &&
                  this.props.houses.map(house => (
                    <option selected={house.selector === this.props.trigger.house} value={house.selector}>
                      {house.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default SunriseSunsetTrigger;
