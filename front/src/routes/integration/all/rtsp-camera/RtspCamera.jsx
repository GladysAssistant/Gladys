import { Text } from 'preact-i18n';
import cx from 'classnames';

import RtspCameraBox from './RtspCameraBox';
import EmptyState from './EmptyState';
import { RequestStatus } from '../../../../utils/consts';
import style from './style.css';
import PageOptions from '../../../../components/form/PageOptions';

const RtspCameraPage = ({ children, ...props }) => (
  <div class="page">
    <div class="page-main">
      <div class="my-3 my-md-5">
        <div class="container">
          <div class="row">
            <div class="col-lg-12">
              <div class="card">
                <div class="card-header">
                  <h1 class="card-title">
                    <Text id="integration.rtspCamera.title" />
                  </h1>
                  <PageOptions
                    changeOrderDir={props.changeOrderDir}
                    searchPlaceholder={<Text id="integration.rtspCamera.search" />}
                    debouncedSearch={props.debouncedSearch}
                  >
                    <button onClick={props.addCamera} class="btn btn-outline-primary ml-2">
                      <Text id="scene.newButton" /> <i class="fe fe-plus" />
                    </button>
                  </PageOptions>
                </div>
                <div class="card-body">
                  <div
                    class={cx('dimmer', {
                      active: props.getRtspCameraStatus === RequestStatus.Getting
                    })}
                  >
                    <div class="loader" />
                    <div class={cx('dimmer-content', style.rtspCameraListBody)}>
                      <div class="row">
                        {props.rtspCameras &&
                          props.rtspCameras.map((camera, index) => (
                            <RtspCameraBox
                              camera={camera}
                              cameraIndex={index}
                              housesWithRooms={props.housesWithRooms}
                              updateCameraField={props.updateCameraField}
                              updateCameraUrl={props.updateCameraUrl}
                              testConnection={props.testConnection}
                              saveCamera={props.saveCamera}
                              deleteCamera={props.deleteCamera}
                            />
                          ))}
                        {props.rtspCameras && props.rtspCameras.length === 0 && <EmptyState />}
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
  </div>
);

export default RtspCameraPage;
