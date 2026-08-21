import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text, Localizer } from 'preact-i18n';
import update from 'immutability-helper';

import BaseEditBox from '../baseEditBox';
import SelectDeviceFeature from '../../device/SelectDeviceFeature';
import { COVER_STATE } from '../../../../../server/utils/constants';
import { isCoverStateFeature, isActionableFeature } from './actionableFeatures';

const ACTION_TYPES = ['scene', 'device-feature'];
const COVER_COMMANDS = [COVER_STATE.OPEN, COVER_STATE.STOP, COVER_STATE.CLOSE];
const COVER_COMMAND_KEYS = {
  [COVER_STATE.OPEN]: 'open',
  [COVER_STATE.STOP]: 'stop',
  [COVER_STATE.CLOSE]: 'close'
};

class EditActionsBox extends Component {
  updateActions = actions => {
    this.props.updateBoxConfig(this.props.x, this.props.y, { actions });
  };

  addAction = () => {
    const actions = this.props.box.actions || [];
    this.updateActions([...actions, { action_type: 'scene' }]);
  };

  removeAction = index => {
    this.updateActions(update(this.props.box.actions, { $splice: [[index, 1]] }));
  };

  updateAction = (index, data) => {
    this.updateActions(update(this.props.box.actions, { [index]: { $merge: data } }));
  };

  updateActionType = (index, e) => {
    // Reset the action when its type changes so stale fields are not saved
    this.updateActions(update(this.props.box.actions, { [index]: { $set: { action_type: e.target.value } } }));
  };

  updateActionFeature = (index, feature) => {
    const newAction = {
      action_type: 'device-feature',
      device_feature: feature ? feature.selector : undefined,
      label: this.props.box.actions[index].label
    };
    // A shutter/curtain state feature is commanded, not toggled: it needs a value
    if (isCoverStateFeature(feature)) {
      newAction.value = COVER_STATE.OPEN;
    }
    this.updateActions(update(this.props.box.actions, { [index]: { $set: newAction } }));
    this.setState(prevState => ({
      featuresBySelector: {
        ...prevState.featuresBySelector,
        ...(feature ? { [feature.selector]: feature } : {})
      }
    }));
  };

  updateName = e => {
    this.props.updateBoxConfig(this.props.x, this.props.y, { name: e.target.value });
  };

  getScenesAndFeatures = async () => {
    try {
      const actions = this.props.box.actions || [];
      const featureSelectors = actions.filter(a => a.device_feature).map(a => a.device_feature);
      const [scenes, devices] = await Promise.all([
        this.props.httpClient.get('/api/v1/scene', { order_dir: 'asc' }),
        featureSelectors.length
          ? this.props.httpClient.get('/api/v1/device', { device_feature_selectors: featureSelectors.join(',') })
          : Promise.resolve([])
      ]);
      const featuresBySelector = {};
      devices.forEach(device => {
        device.features.forEach(feature => {
          featuresBySelector[feature.selector] = feature;
        });
      });
      this.setState({ scenes, featuresBySelector });
    } catch (e) {
      console.error(e);
    }
  };

  componentDidMount() {
    this.getScenesAndFeatures();
  }

  render(props, { scenes, featuresBySelector }) {
    const actions = props.box.actions || [];
    return (
      <BaseEditBox {...props} titleKey="dashboard.boxTitle.actions">
        <div class="form-group">
          <label class="form-label">
            <Text id="dashboard.boxes.actions.editNameLabel" />
          </label>
          <Localizer>
            <input
              type="text"
              class="form-control"
              placeholder={<Text id="dashboard.boxes.actions.editNamePlaceholder" />}
              value={props.box.name}
              onInput={this.updateName}
            />
          </Localizer>
        </div>
        {actions.map((action, index) => {
          const feature = action.device_feature && featuresBySelector && featuresBySelector[action.device_feature];
          return (
            <div class="card p-3 mb-2">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <strong>
                  <Text id="dashboard.boxes.actions.actionLabel" fields={{ index: index + 1 }} />
                </strong>
                <Localizer>
                  <button
                    class="btn btn-sm btn-outline-danger"
                    onClick={() => this.removeAction(index)}
                    aria-label={<Text id="dashboard.boxes.actions.removeActionButton" fields={{ index: index + 1 }} />}
                  >
                    <i class="fe fe-trash" aria-hidden="true" />
                  </button>
                </Localizer>
              </div>
              <div class="form-group">
                <label class="form-label">
                  <Text id="dashboard.boxes.actions.actionTypeLabel" />
                </label>
                <select class="form-control" value={action.action_type} onChange={e => this.updateActionType(index, e)}>
                  {ACTION_TYPES.map(actionType => (
                    <option value={actionType}>
                      <Text id={`dashboard.boxes.actions.actionTypes.${actionType}`} />
                    </option>
                  ))}
                </select>
              </div>
              {action.action_type === 'scene' && (
                <div class="form-group">
                  <label class="form-label">
                    <Text id="dashboard.boxes.actions.sceneLabel" />
                  </label>
                  <select
                    class="form-control"
                    value={action.scene || ''}
                    onChange={e => this.updateAction(index, { scene: e.target.value || undefined })}
                  >
                    <option value="">
                      <Text id="global.emptySelectOption" />
                    </option>
                    {(scenes || []).map(scene => (
                      <option value={scene.selector}>{scene.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {action.action_type === 'device-feature' && (
                <div class="form-group">
                  <label class="form-label">
                    <Text id="dashboard.boxes.actions.deviceFeatureLabel" />
                  </label>
                  {/* only what runAction knows how to command: writable
                      binaries (toggle) and shutter/curtain state (command) */}
                  <SelectDeviceFeature
                    value={action.device_feature}
                    exclude_read_only_device_features
                    filterFeature={isActionableFeature}
                    onDeviceFeatureChange={selectedFeature => this.updateActionFeature(index, selectedFeature)}
                  />
                </div>
              )}
              {action.action_type === 'device-feature' && isCoverStateFeature(feature) && (
                <div class="form-group">
                  <label class="form-label">
                    <Text id="dashboard.boxes.actions.commandLabel" />
                  </label>
                  <select
                    class="form-control"
                    value={action.value}
                    onChange={e => this.updateAction(index, { value: parseInt(e.target.value, 10) })}
                  >
                    {COVER_COMMANDS.map(command => (
                      <option value={command}>
                        <Text id={`dashboard.boxes.actions.commands.${COVER_COMMAND_KEYS[command]}`} />
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div class="form-group mb-0">
                <label class="form-label">
                  <Text id="dashboard.boxes.actions.labelLabel" />
                </label>
                <Localizer>
                  <input
                    type="text"
                    class="form-control"
                    placeholder={<Text id="dashboard.boxes.actions.labelPlaceholder" />}
                    value={action.label}
                    onInput={e => this.updateAction(index, { label: e.target.value })}
                  />
                </Localizer>
              </div>
            </div>
          );
        })}
        <button class="btn btn-outline-primary btn-block" onClick={this.addAction}>
          <Text id="dashboard.boxes.actions.addActionButton" /> <i class="fe fe-plus" />
        </button>
      </BaseEditBox>
    );
  }
}

export default connect('httpClient', {})(EditActionsBox);
