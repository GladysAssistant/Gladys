import { Text, Localizer } from 'preact-i18n';
import cx from 'classnames';

import RtspCameraBox from './RtspCameraBox';
import EmptyState from './EmptyState';
import { RequestStatus } from '../../../../utils/consts';
import style from './style.css';
import CardFilter from '../../../../components/layout/CardFilter';

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
                  <div class="page-options d-flex">
                    <Localizer>
                      <CardFilter
                        changeOrderDir={props.changeOrderDir}
                        orderValue={props.getRtspCameraOrderDir}
                        search={props.debouncedSearch}
                        searchValue={props.rtspCameraSearch}
                        searchPlaceHolder={<Text id="integration.rtspCamera.search" />}
                      />
                    </Localizer>
                    <button onClick={props.addCamera} class="btn btn-outline-primary ml-2">
                      <Text id="scene.newButton" /> <i class="fe fe-plus" />
                    </button>
                  </div>
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
                              updateCameraRotation={props.updateCameraRotation}
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
