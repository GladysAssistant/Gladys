import { Text, Localizer } from 'preact-i18n';
import { Link } from 'preact-router/match';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';
import actions from '../../actions/map';
import cx from 'classnames';
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
            <div class={props.loading ? 'dimmer active' : 'dimmer'}>
              <div class="loader" />
              <div class="dimmer-content">
                <div class="card-title">
                  <h3>
                    {props.creationMode && <Text id="newArea.cardTitleCreate" />}
                    {!props.creationMode && <Text id="newArea.cardTitleEdit" />}
                  </h3>
                </div>

                {props.createAreaError && (
                  <div class="alert alert-danger">
                    <Text id="newArea.createAreaError" />
                  </div>
                )}

                {props.getAreaError && (
                  <div class="alert alert-danger">
                    <Text id="newArea.getAreaError" />
                  </div>
                )}

                {props.deleteAreaError && (
                  <div class="alert alert-danger">
                    <Text id="newArea.deleteAreaError" />
                  </div>
                )}

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
                  <label class="form-label">
                    <Text id="newArea.mapLabel" />
                  </label>
                  <NewAreaMap
                    radius={props.radius}
                    color={props.color}
                    setLatLong={props.setLatLong}
                    latitude={props.latitude}
                    longitude={props.longitude}
                    houses={props.houses}
                    creationMode={props.creationMode}
                  />
                </div>

                <div class="form-footer">
                  <div class="row">
                    <div class="col">
                      <button onClick={props.createArea} class="btn btn-primary btn-block">
                        {props.creationMode && <Text id="newArea.createButton" />}
                        {!props.creationMode && <Text id="newArea.updateButton" />}
                      </button>
                    </div>
                    {!props.creationMode && (
                      <div class="col">
                        <button onClick={props.deleteArea} class="btn btn-danger btn-block">
                          <Text id="newArea.deleteButton" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
);

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
  createArea = async e => {
    e.preventDefault();
    try {
      await this.setState({ loading: true, createAreaError: false });
      const newArea = {
        name: this.state.name,
        color: this.state.color,
        radius: this.state.radius,
        latitude: this.state.latitude,
        longitude: this.state.longitude
      };
      if (this.props.areaSelector) {
        await this.props.httpClient.patch(`/api/v1/area/${this.props.areaSelector}`, newArea);
      } else {
        await this.props.httpClient.post('/api/v1/area', newArea);
      }
      route('/dashboard/maps');
    } catch (e) {
      await this.setState({ loading: false, createAreaError: true });
      console.error(e);
    }
  };
  deleteArea = async e => {
    e.preventDefault();
    try {
      await this.setState({ loading: true, deleteAreaError: false });
      await this.props.httpClient.delete(`/api/v1/area/${this.props.areaSelector}`);
      route('/dashboard/maps');
    } catch (e) {
      await this.setState({ loading: false, deleteAreaError: true });
      console.error(e);
    }
  };
  getHouses = async () => {
    try {
      const houses = await this.props.httpClient.get('/api/v1/house');
      this.setState({
        houses
      });
    } catch (e) {
      console.error(e);
    }
  };
  getArea = async () => {
    try {
      await this.setState({ loading: true, getAreaError: false });
      const area = await this.props.httpClient.get(`/api/v1/area/${this.props.areaSelector}`);
      this.setState({
        name: area.name,
        radius: area.radius,
        color: area.color,
        latitude: area.latitude,
        longitude: area.longitude,
        loading: false
      });
    } catch (e) {
      this.setState({ loading: false, getAreaError: true });
      console.error(e);
    }
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      radius: 20,
      color: '#3498db',
      name: '',
      latitude: null,
      longitude: null,
      houses: []
    };
  }
  componentDidMount() {
    this.getHouses();
    if (this.props.areaSelector) {
      this.getArea();
    }
  }
  render(
    props,
    { name, color, radius, latitude, longitude, houses, loading, createAreaError, deleteAreaError, getAreaError }
  ) {
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
                deleteArea={this.deleteArea}
                setLatLong={this.setLatLong}
                latitude={latitude}
                longitude={longitude}
                houses={houses}
                loading={loading}
                createAreaError={createAreaError}
                deleteAreaError={deleteAreaError}
                getAreaError={getAreaError}
                creationMode={this.props.areaSelector === undefined}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect('httpClient', actions)(NewArea);
