import { Text, Localizer } from 'preact-i18n';
import { Link } from 'preact-router/match';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from '../../actions/map';
import cx from 'classnames';
import get from 'get-value';
import style from './style.css';
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
              <Text id="newScene.cardTitle" />
            </div>

            <div class="row gutters-xs">
              <div class="col">
                <div class="form-group">
                  <label>Radius</label>
                  <input type="number" class="form-control" />
                </div>
              </div>
              <div class="col">
                <div class="form-group">
                  <label>Color</label>
                  <input type="number" class="form-control" />
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>Test</label>
              <NewAreaMap />
            </div>

            <div class="form-footer">
              <button onClick={props.createScene} class="btn btn-primary btn-block">
                <Text id="newScene.createSceneButton" />
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
  render(props, {}) {
    return (
      <div class="page">
        <div class="page-main">
          <div class="my-3 my-md-5">
            <div class="map-header">
              <NewAreaPage />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default NewArea;
