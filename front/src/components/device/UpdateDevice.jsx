import { Text, MarkupText } from 'preact-i18n';
import { Link } from 'preact-router/match';
import { DEVICE_FEATURE_CATEGORIES_LIST } from '../../../../server/utils/constants';
import { RequestStatus, DeviceFeatureCategoriesIcon } from '../../utils/consts';
import UpdateDeviceFeature from './UpdateDeviceFeature';
import UpdateDeviceForm from './UpdateDeviceForm';
import cx from 'classnames';
import get from 'get-value';

const UpdateDevice = ({ children, ...props }) => (
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

export default UpdateDevice;
