import { Component } from 'preact';
import { Text } from 'preact-i18n';
import get from 'get-value';

import RtspCameraBox from './RtspCameraBox';
import { RequestStatus } from '../../../../utils/consts';
import withIntlAsProp from '../../../../utils/withIntlAsProp';
import { MobileSectionHeader, MobileGroup, MobileEmptyState, BigButton } from '../../../../components/mobile';
import { MobileIntegrationTab, MobileListToolbar, MobileListLoader } from '../../../../components/integration/mobile';

/**
 * @description The cameras on a phone (docs/specs/mobile-pages/integration-devices.md): one row
 * per camera, opening the sheet that holds what its card holds. Fed by the props of the desktop
 * page; the only state here is which camera was just added with "+", so its sheet opens.
 */
class MobileRtspCameras extends Component {
  state = {
    newCameraId: null
  };

  componentWillReceiveProps(nextProps) {
    if (!this.adding) {
      return;
    }
    // the camera "+" just added: the one that was not in the list and was never saved — a list
    // that grows meanwhile (a search answered) only brings saved cameras
    const previousIds = (this.props.rtspCameras || []).map(camera => camera.id);
    const added = (nextProps.rtspCameras || []).find(camera => !camera.created_at && !previousIds.includes(camera.id));
    if (added) {
      this.adding = false;
      this.setState({ newCameraId: added.id });
    }
  }

  addCamera = async () => {
    if (this.adding) {
      return;
    }
    this.adding = true;
    try {
      await this.props.addCamera();
    } catch (e) {
      console.error(e);
      this.adding = false;
    }
  };

  render(props, { newCameraId }) {
    const { intl, rtspCameras, housesWithRooms } = props;
    const loading = props.getRtspCameraStatus === RequestStatus.Getting;
    const cameras = rtspCameras || [];
    const addLabel = get(intl.dictionary, 'integration.rtspCamera.addCamera');
    return (
      <MobileIntegrationTab
        dataCy="rtsp-cameras-mobile"
        // the list did not load: there is nothing to add a camera to
        fab={rtspCameras ? { onClick: this.addCamera, label: addLabel, dataCy: 'rtsp-camera-create' } : undefined}
      >
        <MobileListToolbar
          // the search is debounced: the field is not controlled, it only starts from the query
          // still applied to the list when it mounts again
          initialSearchValue={props.rtspCameraSearch}
          onSearch={props.debouncedSearch}
          searchPlaceholderId="integration.rtspCamera.search"
          orderDir={props.getRtspCameraOrderDir}
          onOrderChange={props.changeOrderDir}
        />
        <MobileListLoader loading={loading} empty={cameras.length === 0}>
          {cameras.length > 0 && (
            <div>
              <MobileSectionHeader
                title={
                  <Text
                    id="integration.rtspCamera.cameraCount"
                    plural={cameras.length}
                    fields={{ count: cameras.length }}
                  />
                }
              />
              <MobileGroup>
                {cameras.map((camera, index) => (
                  <RtspCameraBox
                    key={camera.id}
                    isMobile
                    autoOpen={camera.id === newCameraId}
                    discardOnClose={camera.id === newCameraId}
                    camera={camera}
                    cameraIndex={index}
                    housesWithRooms={housesWithRooms}
                    updateCameraField={props.updateCameraField}
                    updateCameraUrl={props.updateCameraUrl}
                    updateCameraRotation={props.updateCameraRotation}
                    testConnection={props.testConnection}
                    saveCamera={props.saveCamera}
                    deleteCamera={props.deleteCamera}
                  />
                ))}
              </MobileGroup>
            </div>
          )}
          {rtspCameras && cameras.length === 0 && !loading && (
            <MobileEmptyState icon="camera" text={<Text id="integration.rtspCamera.noCameraFound" />}>
              <BigButton variant="primary" icon="plus" onClick={this.addCamera} data-cy="rtsp-camera-create-empty">
                {addLabel}
              </BigButton>
            </MobileEmptyState>
          )}
        </MobileListLoader>
      </MobileIntegrationTab>
    );
  }
}

export default withIntlAsProp(MobileRtspCameras);
