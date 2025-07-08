const { EVENTS } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const shouldUpdateFeature = require('../utils/shouldUpdateFeature');

/**
 * @description Save values of Smart Home Weather Station NAMain Indoor.
 * @param {object} deviceGladys - Device object in Gladys.
 * @param {object} vehicle - Vehicle object coming from the Tessie API.
 * @param {string} externalId - Device identifier in gladys.
 * @example updateState(deviceGladys, vehicle, externalId);
 */
async function updateState(deviceGladys, vehicle, externalId) {
  const { vehicle_state: vehicleState } = vehicle;

  const frontDriverDoorOpenedFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:door_df_opened`,
  );
  const frontPassengerDoorOpenedFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:door_pf_opened`,
  );
  const rearDriverDoorOpenedFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:door_dr_opened`,
  );
  const rearPassengerDoorOpenedFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:door_pr_opened`,
  );
  const frunkOpenedFeature = deviceGladys.features.find((f) => f.external_id === `${externalId}:door_ft_opened`);
  const trunkOpenedFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:door_rt_opened`,
  );
  const odometerFeature = deviceGladys.features.find((f) => f.external_id === `${externalId}:odometer`);
  const frontLeftTirePressureFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:tire_pressure_fl`,
  );
  const frontRightTirePressureFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:tire_pressure_fr`,
  );
  const rearLeftTirePressureFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:tire_pressure_rl`,
  );
  const rearRightTirePressureFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:tire_pressure_rr`,
  );
  const frontDriverWindowOpenedFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:window_fd_opened`,
  );
  const frontPassengerWindowOpenedFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:window_fp_opened`,
  );
  const rearDriverWindowOpenedFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:window_rd_opened`,
  );
  const rearPassengerWindowOpenedFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:window_rp_opened`,
  );

  try {
    if (vehicleState) {
      if (frontDriverDoorOpenedFeature) {
        const newValue = vehicleState.df;
        if (shouldUpdateFeature(frontDriverDoorOpenedFeature, newValue)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: frontDriverDoorOpenedFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated door_df_opened: ${newValue} for device ${deviceGladys.name}`);
        } else {
          logger.debug(`Skipped door_df_opened: value unchanged (${newValue}) for device ${deviceGladys.name}`);
        }
      }
      if (frontPassengerDoorOpenedFeature) {
        const newValue = vehicleState.pf;
        if (shouldUpdateFeature(frontPassengerDoorOpenedFeature, newValue)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: frontPassengerDoorOpenedFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated door_pf_opened: ${newValue} for device ${deviceGladys.name}`);
        } else {
          logger.debug(`Skipped door_pf_opened: value unchanged (${newValue}) for device ${deviceGladys.name}`);
        }
      }
      if (rearDriverDoorOpenedFeature) {
        const newValue = vehicleState.dr;
        if (shouldUpdateFeature(rearDriverDoorOpenedFeature, newValue)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: rearDriverDoorOpenedFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated door_dr_opened: ${newValue} for device ${deviceGladys.name}`);
        } else {
          logger.debug(`Skipped door_dr_opened: value unchanged (${newValue}) for device ${deviceGladys.name}`);
        }
      }
      if (rearPassengerDoorOpenedFeature) {
        const newValue = vehicleState.pr;
        if (shouldUpdateFeature(rearPassengerDoorOpenedFeature, newValue)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: rearPassengerDoorOpenedFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated door_pr_opened: ${newValue} for device ${deviceGladys.name}`);
        } else {
          logger.debug(`Skipped door_pr_opened: value unchanged (${newValue}) for device ${deviceGladys.name}`);
        }
      }
      if (frunkOpenedFeature) {
        const newValue = vehicleState.ft;
        if (shouldUpdateFeature(frunkOpenedFeature, newValue)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: frunkOpenedFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated door_ft_opened: ${newValue} for device ${deviceGladys.name}`);
        } else {
          logger.debug(`Skipped door_ft_opened: value unchanged (${newValue}) for device ${deviceGladys.name}`);
        }
      }
      if (trunkOpenedFeature) {
        const newValue = vehicleState.rt;
        if (shouldUpdateFeature(trunkOpenedFeature, newValue)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: trunkOpenedFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated door_rt_opened: ${newValue} for device ${deviceGladys.name}`);
        } else {
          logger.debug(`Skipped door_rt_opened: value unchanged (${newValue}) for device ${deviceGladys.name}`);
        }
      }
      if (odometerFeature) {
        const newValue = vehicleState.odometer;
        if (shouldUpdateFeature(odometerFeature, newValue)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: odometerFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated odometer: ${newValue} for device ${deviceGladys.name}`);
        } else {
          logger.debug(`Skipped odometer: value unchanged (${newValue}) for device ${deviceGladys.name}`);
        }
      }
      if (frontLeftTirePressureFeature) {
        const newValue = vehicleState.tpms_pressure_fl;
        if (shouldUpdateFeature(frontLeftTirePressureFeature, newValue)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: frontLeftTirePressureFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated tire_pressure_fl: ${newValue} for device ${deviceGladys.name}`);
        } else {
          logger.debug(`Skipped tire_pressure_fl: value unchanged (${newValue}) for device ${deviceGladys.name}`);
        }
      }
      if (frontRightTirePressureFeature) {
        const newValue = vehicleState.tpms_pressure_fr;
        if (shouldUpdateFeature(frontRightTirePressureFeature, newValue)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: frontRightTirePressureFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated tire_pressure_fr: ${newValue} for device ${deviceGladys.name}`);
        } else {
          logger.debug(`Skipped tire_pressure_fr: value unchanged (${newValue}) for device ${deviceGladys.name}`);
        }
      }
      if (rearLeftTirePressureFeature) {
        const newValue = vehicleState.tpms_pressure_rl;
        if (shouldUpdateFeature(rearLeftTirePressureFeature, newValue)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: rearLeftTirePressureFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated tire_pressure_rl: ${newValue} for device ${deviceGladys.name}`);
        } else {
          logger.debug(`Skipped tire_pressure_rl: value unchanged (${newValue}) for device ${deviceGladys.name}`);
        }
      }
      if (rearRightTirePressureFeature) {
        const newValue = vehicleState.tpms_pressure_rr;
        if (shouldUpdateFeature(rearRightTirePressureFeature, newValue)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: rearRightTirePressureFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated tire_pressure_rr: ${newValue} for device ${deviceGladys.name}`);
        } else {
          logger.debug(`Skipped tire_pressure_rr: value unchanged (${newValue}) for device ${deviceGladys.name}`);
        }
      }
      if (frontDriverWindowOpenedFeature) {
        const newValue = vehicleState.fd_window;
        if (shouldUpdateFeature(frontDriverWindowOpenedFeature, newValue)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: frontDriverWindowOpenedFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated window_fd_opened: ${newValue} for device ${deviceGladys.name}`);
        } else {
          logger.debug(`Skipped window_fd_opened: value unchanged (${newValue}) for device ${deviceGladys.name}`);
        }
      }
      if (frontPassengerWindowOpenedFeature) {
        const newValue = vehicleState.fp_window;
        if (shouldUpdateFeature(frontPassengerWindowOpenedFeature, newValue)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: frontPassengerWindowOpenedFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated window_fp_opened: ${newValue} for device ${deviceGladys.name}`);
        } else {
          logger.debug(`Skipped window_fp_opened: value unchanged (${newValue}) for device ${deviceGladys.name}`);
        }
      }
      if (rearDriverWindowOpenedFeature) {
        const newValue = vehicleState.rd_window;
        if (shouldUpdateFeature(rearDriverWindowOpenedFeature, newValue)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: rearDriverWindowOpenedFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated window_rd_opened: ${newValue} for device ${deviceGladys.name}`);
        } else {
          logger.debug(`Skipped window_rd_opened: value unchanged (${newValue}) for device ${deviceGladys.name}`);
        }
      }
      if (rearPassengerWindowOpenedFeature) {
        const newValue = vehicleState.rp_window;
        if (shouldUpdateFeature(rearPassengerWindowOpenedFeature, newValue)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: rearPassengerWindowOpenedFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated window_rp_opened: ${newValue} for device ${deviceGladys.name}`);
        } else {
          logger.debug(`Skipped window_rp_opened: value unchanged (${newValue}) for device ${deviceGladys.name}`);
        }
      }
    }
  } catch (e) {
    logger.error('deviceGladys State: ', deviceGladys.name, 'error: ', e);
  }
}

module.exports = {
  updateState,
};
