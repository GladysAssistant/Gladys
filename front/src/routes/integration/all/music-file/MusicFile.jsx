import { Component } from 'preact';
import { Text, Localizer, MarkupText } from 'preact-i18n';
import DeviceConfigurationLink from '../../../../components/documentation/DeviceConfigurationLink';
import cx from 'classnames';
import { MUSIC } from '../../../../../../server/utils/constants';

class MusicFilePage extends Component {
  toggleStatus = () => {
    const newStatus =
      this.props.musicFileEnableProvider === MUSIC.PROVIDER.STATUS.ENABLED
        ? MUSIC.PROVIDER.STATUS.DISABLED
        : MUSIC.PROVIDER.STATUS.ENABLED;
    this.props.enableMusicFileProvider(newStatus);
  };

  toggleReadSubFolderStatus = () => {
    const newStatus =
      this.props.musicFileReadSubFolder === MUSIC.PROVIDER.STATUS.ENABLED
        ? MUSIC.PROVIDER.STATUS.DISABLED
        : MUSIC.PROVIDER.STATUS.ENABLED;
    this.props.enableReadSubFolder(newStatus);
  };

  render(props, user, {}) {
    const serviceEnabled = props.musicFileEnableProvider === MUSIC.PROVIDER.STATUS.ENABLED;
    const readSubFolderEnabled = props.musicFileReadSubFolder === MUSIC.PROVIDER.STATUS.ENABLED;
    return (
      <div class="page">
        <div class="page-main">
          <div class="my-3 my-md-5">
            <div class="container">
              <div class="row">
                <div class="col-lg-3">
                  <h3 class="page-title mb-5">
                    <Text id="integration.musicFile.title" />
                  </h3>
                  <div>
                    <div class="list-group list-group-transparent mb-0">
                      <DeviceConfigurationLink
                        user={user}
                        documentKey="music-file"
                        linkClass="list-group-item list-group-item-action d-flex align-items-center"
                      >
                        <span class="icon mr-3">
                          <i class="fe fe-book-open" />
                        </span>
                        <Text id="integration.musicFile.documentation" />
                      </DeviceConfigurationLink>
                    </div>
                  </div>
                </div>
                <div class="col-lg-9">
                  <div class="card">
                    <div class="card-header">
                      <h1 class="card-title">
                        <Text id="integration.musicFile.settings" />
                      </h1>
                    </div>
                    <div class="card-body">
                      <div
                        class={cx('dimmer', {
                          active: props.loading
                        })}
                      >
                        <div class="loader" />
                        <div class="dimmer-content">
                          <p>
                            <MarkupText id="integration.musicFile.introduction" />
                          </p>

                          <div class="form-group">
                            <label class="custom-switch">
                              <input
                                type="radio"
                                class="custom-switch-input"
                                checked={serviceEnabled}
                                onClick={this.toggleStatus}
                              />
                              <span class="custom-switch-indicator" />
                              <span class="custom-switch-description">
                                <Text id="integration.musicFile.enableProvider" />
                              </span>
                            </label>
                          </div>

                          <form onSubmit={props.saveDefaultFolder}>
                            <div class="form-group">
                              <div class="form-label">
                                <Text id="integration.musicFile.defaultFolder" />
                              </div>
                              <div class="input-group">
                                <Localizer>
                                  <input
                                    type="text"
                                    class="form-control"
                                    placeholder={<Text id="integration.musicFile.defaultFolderPlaceholder" />}
                                    onInput={props.updateDefaultFolder}
                                    value={props.musicFileDefaultFolder}
                                  />
                                </Localizer>
                              </div>
                            </div>

                            <div class="form-group">
                              <label class="custom-switch">
                                <input
                                  type="radio"
                                  class="custom-switch-input"
                                  checked={readSubFolderEnabled}
                                  onClick={this.toggleReadSubFolderStatus}
                                />
                                <span class="custom-switch-indicator" />
                                <span class="custom-switch-description">
                                  <Text id="integration.musicFile.enableReadSubFolder" />
                                </span>
                              </label>
                            </div>

                            <div class="form-group">
                              <span class="input-group-append">
                                <button
                                  class={cx('btn', 'btn-success', {
                                    'btn-loading': props.loading
                                  })}
                                  type="submit"
                                >
                                  <Text id="integration.musicFile.saveButton" />
                                </button>
                              </span>
                            </div>

                            <div class="form-group">
                              <label>
                                <Text id="integration.musicFile.instructionsToUse" />
                              </label>
                            </div>
                          </form>
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
  }
}

export default MusicFilePage;
