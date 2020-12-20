import { Component } from 'preact';
import { connect } from 'unistore/preact';
import DatePicker from 'react-datepicker';
import get from 'get-value';
import { Text, Localizer } from 'preact-i18n';
import { format } from 'date-fns';
import Select from 'react-select';

import fr from 'date-fns/locale/fr';

import 'react-datepicker/dist/react-datepicker.css';

const DAYS_OF_THE_MONTH = new Array(31).fill(0, 0, 31).map((val, index) => index + 1);

@connect('httpClient,user', {})
class SunriseSunsetTrigger extends Component {
  handleHouseChange = e => {
    this.props.updateTriggerProperty(this.props.index, 'house', e.target.value);
  };

  render({}, {}) {
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
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default SunriseSunsetTrigger;
