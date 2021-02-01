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

    const houseValid = false;
    if(this.props.houses){
      
      if(selectedHouse.latitude && selectedHouse.longitude){
        houseValid
      }
      console.log(selectedHouse);
    }
    return (
      <div>
        <div class="row">
          <div class="col-sm-4">
            <div class="form-group">
              <div class="form-label">
                <Text id="editScene.triggersCard.scheduledTrigger.house" />
              </div>
              <select onChange={this.handleHouseChange} className="form-control">
                <option>
                  <Text id="global.emptySelectOption" />
                </option>
                {this.props.houses &&
                  this.props.houses.map(house => (
                    <option selected={house.selector === this.props.trigger.house} value={house.selector}>
                      {house.name}
                    </option>
                  ))}
              </select>
              {
                this.props.houses &&
              }
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default SunriseSunsetTrigger;
