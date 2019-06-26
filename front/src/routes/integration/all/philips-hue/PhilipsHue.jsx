import { Link } from 'preact-router/match';
import { Text, MarkupText } from 'preact-i18n';

const PhilipsHuePage = ({ children, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="page-header">
            <h1 class="page-title">
              <Link href="/dashboard/integration/device" class="btn btn-secondary btn-sm btn-block">
                ◀️️ Back
              </Link>
            </h1>
          </div>

          <div class="row">
            <div class="col-lg-3">
              <div class="card">
                <Link href={`${props.currentUrl}/${props.integration.key}`}>
                  <img class="card-img-top" src={props.integration.img} alt={props.integration.name} />
                </Link>
                <div class="card-body d-flex flex-column">
                  <h4>
                    <Link href="#">{props.integration.name}</Link>
                  </h4>
                  <div class="text-muted">{props.integration.description}</div>
                  <br />
                  <div class="row">
                    <div class="col-6">
                      <button class="btn btn-success btn-block">Restart</button>
                    </div>
                    <div class="col-6">
                      <button class="btn btn-danger btn-block">Stop</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-lg-9">
              <div class="card">
                <div class="card-body">
                  <div class="dimmer">
                    <div class="dimmer-content">
                      <h2>
                        <Text id="integration.philipsHue.title" />
                      </h2>
                      <p>
                        <MarkupText id="integration.philipsHue.introduction" />
                      </p>
                      {props.philipsHueGetBridgeError && (
                        <div class="alert alert-danger" role="alert">
                          <i class="fe fe-alert-triangle mr-2" /> {props.philipsHueGetBridgeError}
                        </div>
                      )}
                      <h3>List of available bridges</h3>
                      {props.bridges && (
                        <p>Click on the toggle to connect to a Philips Hue bridge and imports lights in your Gladys</p>
                      )}
                      <div class="card-columns">
                        {props.bridges &&
                          props.bridges.map((bridge, index) => (
                            <div class="card">
                              <div class="card-header">
                                <h3 class="card-title">{bridge.name}</h3>
                                <div class="card-options">
                                  <label class="custom-switch m-0">
                                    <input type="checkbox" value="0" class="custom-switch-input" />
                                    <span class="custom-switch-indicator" />
                                  </label>
                                </div>
                              </div>
                              <div class="card-body">
                                <b>IP Address:</b> {bridge.ipaddress}
                              </div>
                            </div>
                          ))}
                      </div>
                      <dib class="form-group">
                        <button class="btn btn-info btn-sm" onClick={props.getBridges}>
                          <Text id="integration.philipsHue.searchForBridgesButton" /> <i class="fe fe-radio" />
                        </button>
                      </dib>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default PhilipsHuePage;
