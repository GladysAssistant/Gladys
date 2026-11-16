import { Text, MarkupText } from 'preact-i18n';
import { Link } from 'preact-router/match';
import { DEVICE_FEATURE_CATEGORIES_LIST } from '../../../../server/utils/constants';
import { RequestStatus, DeviceFeatureCategoriesIcon } from '../../utils/consts';
import UpdateDeviceFeature from './UpdateDeviceFeature';
import UpdateDeviceForm from './UpdateDeviceForm';
import MobileUpdateDevice from './MobileUpdateDevice';
import { withMobileViewport } from '../mobile';
import cx from 'classnames';
import get from 'get-value';

const DEVICES_LIST_PATH = '/dashboard/devices';

// A device opened from the devices list goes back to it (the list links here with
// "?from=devices"), otherwise to the page of its integration
const cameFromDevicesList = () =>
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('from') === 'devices';

const UpdateDeviceDesktop = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header">
      <Link href={props.previousPage}>
        <button class="btn btn-secondary mr-2">
          <Text id="global.backButton" />
        </button>
      </Link>
      <h3 class="card-title">{get(props, 'device.name') || <Text id="editDeviceForm.noName" />}</h3>
    </div>
    <div
      class={cx('dimmer', {
        active: props.loading
      })}
    >
      <div class="loader" />
      <div class="dimmer-content">
        <div class="card-body">
          <div class="alert alert-secondary">
            <MarkupText id="editDeviceForm.externalIdMessage" />
          </div>
          {props.saveStatus === RequestStatus.Error && (
            <div class="alert alert-danger">
              <Text id="editDeviceForm.saveError" />
            </div>
          )}
          {props.saveStatus === RequestStatus.ConflictError && (
            <div class="alert alert-danger">
              <Text id="editDeviceForm.saveConflictError" />
            </div>
          )}
          {!props.loading && !props.device && (
            <div>
              <p class="alert alert-danger">
                <Text id="editDeviceForm.notFound" />
              </p>
              <Link href={props.previousPage}>
                <button type="button" class="btn btn-outline-secondary btn-sm">
                  <Text id="global.backButton" />
                </button>
              </Link>
            </div>
          )}
          {props.device && (
            <div>
              <UpdateDeviceForm {...props} />

              {props.allowModifyFeatures && (
                <div class="form-group form-inline">
                  <select class="form-control" onChange={props.selectFeature}>
                    <option value="" selected={!props.selectedFeature}>
                      <Text id="global.emptySelectOption" />
                    </option>
                    {DEVICE_FEATURE_CATEGORIES_LIST.map(category =>
                      Object.keys(DeviceFeatureCategoriesIcon[category]).map(type => (
                        <option value={`${category}|${type}`}>
                          <Text id={`deviceFeatureCategory.${category}.${type}`} />
                        </option>
                      ))
                    )}
                  </select>

                  <button
                    onClick={props.addFeature}
                    class="btn btn-outline-success ml-2"
                    disabled={!props.selectedFeature}
                  >
                    <Text id="editDeviceForm.addButton" />
                  </button>
                </div>
              )}

              <div class="row">
                {props.device &&
                  props.device.features.map((feature, index) => (
                    <UpdateDeviceFeature {...props} feature={feature} featureIndex={index} />
                  ))}
              </div>

              <div class="form-group">
                <Link href={props.previousPage}>
                  <button class="btn btn-secondary mr-2">
                    <Text id="global.backButton" />
                  </button>
                </Link>
                <button onClick={props.saveDevice} class="btn btn-success mr-2">
                  <Text id="editDeviceForm.saveButton" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

// On a phone the device is edited in its own layout (docs/specs/mobile-pages/device-edit.md):
// same props, same container.
const UpdateDevice = ({ isMobile, ...props }) => {
  const fromDevicesList = cameFromDevicesList();
  const previousPage = fromDevicesList ? DEVICES_LIST_PATH : props.previousPage;
  if (isMobile) {
    return (
      <MobileUpdateDevice
        {...props}
        backHref={previousPage}
        backLabel={fromDevicesList ? <Text id="devicesList.title" /> : null}
      />
    );
  }
  return <UpdateDeviceDesktop {...props} previousPage={previousPage} />;
};

export default withMobileViewport(UpdateDevice);
