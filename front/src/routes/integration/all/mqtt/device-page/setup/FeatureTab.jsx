import { Text, MarkupText } from 'preact-i18n';
import { Link } from 'preact-router/match';
import cx from 'classnames';

import Feature from './Feature';
import FeatureCatalog from './FeatureCatalog';
import { RequestStatus } from '../../../../../../utils/consts';

import MqttDeviceForm from '../DeviceForm';
import style from '../style.css';

const FeatureTab = ({ children, ...props }) => (
  <div class="card">
    <div class="card-header d-flex align-items-center">
      <Link href="/dashboard/integration/device/mqtt" class={style.backLink}>
        <i class="fe fe-arrow-left" />
        <Text id="global.backButton" />
      </Link>
      <h3 class={cx('card-title mb-0', style.cardTitleWithBack)}>
        {(props.device && props.device.name) || <Text id="integration.mqtt.device.noNameLabel" />}
      </h3>
      <div class="page-options">
        <button onClick={props.saveDevice} class="btn btn-success" disabled={props.loading}>
          <Text id="integration.mqtt.device.saveButton" />
        </button>
      </div>
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
            <MarkupText id="integration.mqtt.feature.externalIdMessage" />
          </div>
          {props.saveStatus === RequestStatus.Error && (
            <div class="alert alert-danger">
              <Text id="integration.mqtt.device.saveError" />
            </div>
          )}
          {props.saveStatus === RequestStatus.ValidationError && (
            <div class="alert alert-danger">
              <Text id="integration.mqtt.device.validationError" />
              {props.erroredAttributes.length > 0 && (
                <p>
                  {props.erroredAttributes.map(attribute => (
                    <>
                      <br />
                      - <Text id={`integration.mqtt.device.validationErrors.${attribute}`} />
                    </>
                  ))}
                </p>
              )}
            </div>
          )}
          {props.saveStatus === RequestStatus.ConflictError && (
            <div class="alert alert-danger">
              <Text id="integration.mqtt.device.saveConflictError" />
            </div>
          )}
          {!props.loading && !props.device && (
            <div>
              <p class="alert alert-danger">
                <Text id="integration.mqtt.device.notFound" />
              </p>
              <Link href="/dashboard/integration/device/mqtt">
                <button type="button" class="btn btn-outline-secondary btn-sm">
                  <Text id="integration.mqtt.device.backToList" />
                </button>
              </Link>
            </div>
          )}
          {props.device && (
            <div>
              <div class={style.deviceEditSection}>
                <MqttDeviceForm {...props} compact />
              </div>

              <div class={style.featuresSection}>
                <div class={style.featuresSectionHeader}>
                  <h4 class="mb-0">
                    <Text id="integration.mqtt.device.featuresLabel" />
                  </h4>
                  <span class="badge badge-secondary">{props.device.features ? props.device.features.length : 0}</span>
                </div>

                {props.device.features && props.device.features.length > 0 && (
                  <div class={style.featureAccordionList}>
                    {props.device.features.map((feature, index) => (
                      <Feature
                        {...props}
                        feature={feature}
                        featureIndex={index}
                        initiallyExpanded={props.expandedFeatureIndices && props.expandedFeatureIndices.includes(index)}
                      />
                    ))}
                  </div>
                )}

                {(!props.device.features || props.device.features.length === 0) && (
                  <p class="text-muted">
                    <Text id="integration.mqtt.featureCatalog.noFeaturesYet" />
                  </p>
                )}

                <div class={style.addFeatureSection}>
                  <button
                    type="button"
                    onClick={props.toggleFeatureCatalog}
                    class={cx('btn', props.showFeatureCatalog ? 'btn-secondary' : 'btn-outline-primary')}
                  >
                    <i class={cx('fe mr-2', props.showFeatureCatalog ? 'fe-x' : 'fe-plus')} />
                    <Text
                      id={
                        props.showFeatureCatalog
                          ? 'integration.mqtt.featureCatalog.closeButton'
                          : 'integration.mqtt.featureCatalog.openButton'
                      }
                    />
                  </button>
                </div>

                {props.showFeatureCatalog && (
                  <FeatureCatalog
                    deviceFeaturesOptions={props.deviceFeaturesOptions}
                    intl={props.intl}
                    user={props.user}
                    onSelectFeature={props.selectAndAddFeature}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default FeatureTab;
