import Select from '../../../../components/form/Select';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Text } from 'preact-i18n';
import cx from 'classnames';

import { DEVICE_FEATURE_CATEGORIES, MUSIC_PLAY_MODES } from '../../../../../../server/utils/constants';
import withIntlAsProp from '../../../../utils/withIntlAsProp';
import MediaBrowser from '../../../../components/boxs/music/MediaBrowser';
import { musicRoute, getErrorStatus } from '../../../../components/boxs/music/musicApi';
import style from '../../../../components/boxs/music/MusicBox.css';

// The "play music" action (capabilities/music.md, section 7): a player, then a MediaItem picked
// from the player's catalog, stored as { id, type, title } — the title is display only, the id is
// what plays — and a mode when the player accepts enqueueing.
class PlayMedia extends Component {
  state = {
    devicesOptions: null,
    selectedDeviceOption: '',
    // the on-demand operations of the selected player; null while unknown, false when the player
    // has no catalog (an internal service's player, or an integration without `music`)
    capabilities: null,
    picking: false
  };

  getOptions = async () => {
    try {
      const devices = await this.props.httpClient.get('/api/v1/device', {
        device_feature_category: DEVICE_FEATURE_CATEGORIES.MUSIC
      });
      const devicesOptions = devices.map(device => ({
        value: device.selector,
        label: device.name
      }));
      await this.setState({ devicesOptions });
      this.refreshSelectedOptions(this.props);
    } catch (e) {
      console.error(e);
    }
  };

  getCapabilities = async deviceSelector => {
    if (!deviceSelector) {
      this.setState({ capabilities: null });
      return;
    }
    // the answer of a player the user already switched away from is ignored: the last request
    // started is the only one allowed to set the capabilities
    this.requestedDevice = deviceSelector;
    try {
      const capabilities = await this.props.httpClient.get(musicRoute(deviceSelector, 'capabilities'));
      if (this.requestedDevice !== deviceSelector) {
        return;
      }
      const usable = Boolean(capabilities.browse || capabilities.search);
      this.setState({ capabilities: usable ? capabilities : false });
    } catch (e) {
      if (getErrorStatus(e) !== 404) {
        console.error(e);
      }
      if (this.requestedDevice === deviceSelector) {
        this.setState({ capabilities: false });
      }
    }
  };

  handleDeviceChange = selectedOption => {
    const device = selectedOption && selectedOption.value ? selectedOption.value : null;
    this.props.updateActionProperty(this.props.path, 'device', device);
    // a media id only makes sense on the player's own provider
    this.props.updateActionProperty(this.props.path, 'media', undefined);
    this.setState({ picking: false });
    this.getCapabilities(device);
  };

  pickMedia = item => {
    this.props.updateActionProperty(this.props.path, 'media', { id: item.id, type: item.type, title: item.title });
    this.setState({ picking: false });
  };

  startPicking = () => this.setState({ picking: true });

  updateMode = e => {
    this.props.updateActionProperty(this.props.path, 'mode', e.target.value);
  };

  refreshSelectedOptions = nextProps => {
    let selectedDeviceOption = '';
    if (nextProps.action.device && this.state.devicesOptions) {
      const option = this.state.devicesOptions.find(deviceOption => deviceOption.value === nextProps.action.device);
      if (option) {
        selectedDeviceOption = option;
      }
    }
    this.setState({ selectedDeviceOption });
  };

  componentDidMount() {
    this.getOptions();
    if (this.props.action.device) {
      this.getCapabilities(this.props.action.device);
    }
    if (!this.props.action.mode) {
      this.props.updateActionProperty(this.props.path, 'mode', MUSIC_PLAY_MODES.REPLACE);
    }
  }

  componentWillReceiveProps(nextProps) {
    this.refreshSelectedOptions(nextProps);
  }

  render(props, { devicesOptions, selectedDeviceOption, capabilities, picking }) {
    const { media, device, mode } = props.action;
    const canEnqueue = Boolean(capabilities && capabilities.append);
    return (
      <div>
        <p>
          <Text id="editScene.actionsCard.playMedia.description" />
        </p>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.playMedia.deviceLabel" />
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <Select
            styles={{
              // Fixes the overlapping problem of the component
              menu: provided => ({ ...provided, zIndex: 2 })
            }}
            options={devicesOptions}
            value={selectedDeviceOption}
            onChange={this.handleDeviceChange}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>
        {device && capabilities === false && (
          <p class="text-muted small">
            <Text id="editScene.actionsCard.playMedia.unsupported" />
          </p>
        )}
        {device && capabilities && (
          <div class="form-group">
            <label class="form-label">
              <Text id="editScene.actionsCard.playMedia.mediaLabel" />
              <span class="form-required">
                <Text id="global.requiredField" />
              </span>
            </label>
            {media && !picking && (
              <div class={cx('d-flex align-items-center', style.breadcrumb)}>
                <span class={style.breadcrumbTitle}>
                  <Text id="editScene.actionsCard.playMedia.selectedMedia" />
                  {': '}
                  {media.title || media.id} (<Text id={`musicMediaTypes.${media.type}`}>{media.type}</Text>)
                </span>
                <button type="button" class="btn btn-secondary btn-sm" onClick={this.startPicking}>
                  <Text id="editScene.actionsCard.playMedia.changeMedia" />
                </button>
              </div>
            )}
            {!media && !picking && (
              <p class="text-muted small">
                <Text id="editScene.actionsCard.playMedia.noMedia" />
              </p>
            )}
            {(!media || picking) && (
              <MediaBrowser
                httpClient={props.httpClient}
                deviceSelector={device}
                capabilities={capabilities}
                onPick={this.pickMedia}
                intl={props.intl}
              />
            )}
          </div>
        )}
        {device && capabilities && canEnqueue && (
          <div class="form-group">
            <label class="form-label">
              <Text id="editScene.actionsCard.playMedia.modeLabel" />
            </label>
            <select class="form-control" value={mode || MUSIC_PLAY_MODES.REPLACE} onChange={this.updateMode}>
              <option value={MUSIC_PLAY_MODES.REPLACE}>
                <Text id="editScene.actionsCard.playMedia.modeReplace" />
              </option>
              <option value={MUSIC_PLAY_MODES.NEXT}>
                <Text id="editScene.actionsCard.playMedia.modeNext" />
              </option>
              <option value={MUSIC_PLAY_MODES.APPEND}>
                <Text id="editScene.actionsCard.playMedia.modeAppend" />
              </option>
            </select>
          </div>
        )}
      </div>
    );
  }
}

export default connect('httpClient', {})(withIntlAsProp(PlayMedia));
