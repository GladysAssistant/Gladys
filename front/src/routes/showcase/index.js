import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';
import update from 'immutability-helper';

import { generateAll } from './generator';
import ShowcaseCategory from './ShowcaseCategory';

@connect('user', {})
class Showcase extends Component {
  updateValue = (x, y, device, deviceFeature, deviceIndex, featureIndex, action) => {
    const newState = update(this.state, {
      rows: {
        [deviceIndex]: {
          features: {
            [featureIndex]: {
              last_value: {
                $set: action
              }
            }
          }
        }
      }
    });

    this.setState(newState);
  };

  constructor(props) {
    super(props);

    const rows = generateAll();
    this.state = {
      columns: [
        {
          titleId: 'showcase.actuatorDevices',
          options: {
            readOnly: false
          }
        },
        {
          titleId: 'showcase.sensorDevices',
          options: {
            readOnly: true
          }
        }
      ],
      rows
    };
  }

  render({ user }, { columns, rows }) {
    return (
      <div class="page">
        <div class="page-main">
          <div class="my-3 my-md-5">
            <div class="container">
              <div class="page-header">
                <h1 class="page-title">
                  <Text id="showcase.title" />
                </h1>
              </div>
              <div class="d-flex flex-row flex-wrap justify-content-left">
                {columns.map(column => (
                  <div class="d-flex flex-column col-lg-4">
                    <div class="card" style="display: inline-block; min-width: 300px">
                      <div class="card-header">
                        <h3 class="card-title">
                          <Text id={column.titleId} />
                        </h3>
                      </div>
                    </div>
                    {rows.map((row, deviceIndex) => (
                      <ShowcaseCategory
                        {...row}
                        {...column.options}
                        deviceIndex={deviceIndex}
                        user={user}
                        updateValue={this.updateValue}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Showcase;
