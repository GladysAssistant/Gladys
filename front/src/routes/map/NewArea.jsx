import { Text, Localizer } from 'preact-i18n';
import { Link } from 'preact-router/match';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../../actions/map';
import cx from 'classnames';
import get from 'get-value';
import style from './style.css';
import ColorPicker from './ColorPicker';
import NewAreaMap from './NewAreaMap';

const NewAreaPage = ({ children, ...props }) => (
  <div class={cx('container', style.containerWithMargin)}>
    <Link href="/dashboard/maps" class="btn btn-secondary btn-sm">
      <Text id="global.backButton" />
    </Link>
    <div class="row">
      <div class="col col-md-8 mx-auto">
        <form onSubmit={props.createScene} class="card">
          <div class="card-body p-6">
            <div class="card-title">
              <h3>
                <Text id="newArea.cardTitle" />
              </h3>
            </div>

            <p>
              <Text id="newArea.cardDescription" />
            </p>

            <div class="form-group">
              <label class="form-label">
                <Text id="newArea.nameLabel" />
              </label>
              <Localizer>
                <input
                  type="text"
                  class="form-control"
                  value={props.name}
                  onInput={props.setName}
                  placeholder={<Text id="newArea.namePlaceholder" />}
                />
              </Localizer>
            </div>

            <div class="row gutters-xs">
              <div class="col">
                <div class="form-group">
                  <label class="form-label">
                    <Text id="newArea.radiusLabel" />
                  </label>
                  <Localizer>
                    <input
                      type="number"
                      value={props.radius}
                      onInput={props.setRadius}
                      class="form-control"
                      placeholder={<Text id="newArea.radiusPlaceholder" />}
                    />
                  </Localizer>
                </div>
              </div>
              <div class="col">
                <div class="form-group">
                  <label class="form-label">
                    <Text id="newArea.colorLabel" />
                  </label>
                  <ColorPicker value={props.color} setColor={props.setColor} />
                </div>
              </div>
            </div>

            <div class="form-group">
              <NewAreaMap
                radius={props.radius}
                color={props.color}
                setLatLong={props.setLatLong}
                latitude={props.latitude}
                longitude={props.longitude}
              />
            </div>

            <div class="form-footer">
              <button onClick={props.createArea} class="btn btn-primary btn-block">
                <Text id="newArea.createButton" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
);

@connect('httpClient', actions)
class NewArea extends Component {
  setName = e => {
    this.setState({ name: e.target.value });
  };
  setColor = color => {
    this.setState({ color });
  };
  setRadius = e => {
    this.setState({ radius: e.target.value });
  };
  setLatLong = (latitude, longitude) => {
    this.setState({ latitude, longitude });
  };
  createArea = e => {
    e.preventDefault();
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      radius: 20,
      color: '#3498db',
      name: '',
      latitude: null,
      longitude: null
    };
  }
  render(props, { name, color, radius, latitude, longitude }) {
    return (
      <div class="page">
        <div class="page-main">
          <div class="my-3 my-md-5">
            <div class="map-header">
              <NewAreaPage
                name={name}
                color={color}
                radius={radius}
                setName={this.setName}
                setColor={this.setColor}
                setRadius={this.setRadius}
                createArea={this.createArea}
                setLatLong={this.setLatLong}
                latitude={latitude}
                longitude={longitude}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default NewArea;
