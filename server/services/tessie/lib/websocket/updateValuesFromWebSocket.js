const { EVENTS } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');

// Cache temporaire pour stocker les valeurs de tension et courant
const batteryCache = new Map();
const CACHE_TTL = 30 * 1000; // 5 secondes de TTL

async function updateValuesFromWebSocket(device, data, externalId, vin) {
    // Nettoyer le cache expiré
    const now = Date.now();
    if (batteryCache.has(vin)) {
        const cacheEntry = batteryCache.get(vin);
        if (now - cacheEntry.timestamp > CACHE_TTL) {
            batteryCache.delete(vin);
        }
    }

    // Initialiser ou récupérer le cache pour ce VIN
    if (!batteryCache.has(vin)) {
        batteryCache.set(vin, {
            packVoltage: null,
            packCurrent: null,
            timestamp: now
        });
    }
    const cache = batteryCache.get(vin);

    // First pass: collect PackVoltage and PackCurrent to calculate battery_power
    for (const item of data) {
        const { key, value } = item;
        const mapping = this.getWebSocketFeatureMapping(key);
        if (key === 'ChargeState') {
            console.log('ChargeState', value);
            console.log('data', data);
            console.log('mapping', mapping);
        }
        if (key === 'PackVoltage') {
            const parsedValue = this.parseWebSocketValue(value, mapping);
            if (parsedValue !== null && !isNaN(parsedValue)) {
                cache.packVoltage = parsedValue;
                cache.timestamp = now; // Mettre à jour le timestamp
            }
        } else if (key === 'PackCurrent') {
            const parsedValue = this.parseWebSocketValue(value, mapping);
            if (parsedValue !== null && !isNaN(parsedValue)) {
                cache.packCurrent = parsedValue;
                cache.timestamp = now; // Mettre à jour le timestamp
            }
        }
    }

    // Second pass: process all data
    for (const item of data) {
        const { key, value } = item;

        // Map WebSocket keys to Gladys features
        const featureMapping = this.getWebSocketFeatureMapping(key);
        if (featureMapping) {
            let newValue = this.parseWebSocketValue(value, featureMapping);

            // Validation of values
            if (newValue !== null && newValue !== undefined && !isNaN(newValue)) {
                // Special case for doors that require updating multiple features
                if (featureMapping.type === 'door_state' && typeof newValue === 'object') {
                    // Update each door individually
                    const doorFeatures = {
                        'door_df_opened': newValue.driverFront ? 1 : 0,
                        'door_dr_opened': newValue.driverRear ? 1 : 0,
                        'door_pf_opened': newValue.passengerFront ? 1 : 0,
                        'door_pr_opened': newValue.passengerRear ? 1 : 0,
                        'trunk_front_opened': newValue.trunkFront ? 1 : 0,
                        'trunk_rear_opened': newValue.trunkRear ? 1 : 0
                    };

                    for (const [doorFeatureId, doorValue] of Object.entries(doorFeatures)) {
                        const doorFeature = device.features.find(f => f.external_id === `${externalId}:${doorFeatureId}`);
                        if (doorFeature) {
                            // Check if the value has changed or if more than 5 minutes have elapsed
                            const shouldUpdate = this.shouldUpdateFeature(doorFeature, doorValue);
                            if (shouldUpdate) {
                                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                                    device_feature_external_id: doorFeature.external_id,
                                    state: doorValue
                                });
                                logger.debug(`Updated door ${doorFeatureId}: ${doorValue} for VIN ${vin}`);
                            }
                        }
                    }
                } else {
                    // Normal case for other features
                    const feature = device.features.find(f => f.external_id === `${externalId}:${featureMapping.featureId}`);
                    if (feature) {
                        // Check if the value has changed or if more than 5 minutes have elapsed
                        const shouldUpdate = this.shouldUpdateFeature(feature, newValue);
                        if (shouldUpdate) {
                            this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                                device_feature_external_id: feature.external_id,
                                state: newValue
                            });
                            logger.debug(`Updated ${key} (${featureMapping.valueProperty || 'unknown'}): ${newValue} for VIN ${vin}`);
                        } else {
                            logger.debug(`Skipped ${key}: value unchanged (${newValue}) for VIN ${vin}`);
                        }
                    }
                }
            } else {
                logger.debug(`Skipping ${key} - invalid value: ${newValue} for VIN ${vin}`);
            }
        }
    }

    // Calculate and update battery_power if PackVoltage and PackCurrent are available in cache
    if (cache.packVoltage !== null && cache.packCurrent !== null &&
        !isNaN(cache.packVoltage) && !isNaN(cache.packCurrent)) {

        // Calculation of power: P = V × I
        const batteryPower = cache.packVoltage * cache.packCurrent; // Power in watts

        // Validation of the calculation result            
        const featureMapping = this.getWebSocketFeatureMapping('battery_power');
        if (featureMapping) {
            let newValue = this.parseWebSocketValue(batteryPower, featureMapping);
            if (newValue !== null && newValue !== undefined && !isNaN(newValue)) {
                const feature = device.features.find(f => f.external_id === `${externalId}:${featureMapping.featureId}`);
                if (feature) {
                    const shouldUpdate = this.shouldUpdateFeature(feature, newValue);
                    if (shouldUpdate) {
                        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                            device_feature_external_id: feature.external_id,
                            state: newValue
                        });
                        logger.debug(`Updated battery_power: ${newValue}W for VIN ${vin}`);
                    }
                } else {
                    logger.debug(`Skipped battery_power: value unchanged (${newValue}) for VIN ${vin}`);
                    logger.warn(`Invalid battery_power calculation: ${cache.packVoltage}V × ${cache.packCurrent}A = ${batteryPower} for VIN ${vin}`);
                }
            }
        }
        // if (!isNaN(batteryPower) && isFinite(batteryPower)) {

        //     const batteryPowerFeature = device.features.find(f => f.external_id === `${externalId}:battery_power`);
        //     if (batteryPowerFeature) {
        //         // Check if the value has changed or if more than 5 minutes have elapsed
        //         const shouldUpdate = this.shouldUpdateFeature(batteryPowerFeature, batteryPower);
        //         if (shouldUpdate) {
        //             this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        //                 device_feature_external_id: batteryPowerFeature.external_id,
        //                 state: batteryPower
        //             });
        //             logger.debug(`Calculated battery_power: ${batteryPower}W (${cache.packVoltage}V × ${cache.packCurrent}A) for VIN ${vin}`);
        //         } else {
        //             logger.debug(`Skipped battery_power: value unchanged (${batteryPower}W) for VIN ${vin}`);
        //         }
        //     }
        // } else {
        //     logger.warn(`Invalid battery_power calculation: ${cache.packVoltage}V × ${cache.packCurrent}A = ${batteryPower} for VIN ${vin}`);
        // }
    } else {
        // Log debug info when values are missing
        if (cache.packVoltage === null || cache.packCurrent === null) {
            logger.debug(`Waiting for battery values - PackVoltage: ${cache.packVoltage}, PackCurrent: ${cache.packCurrent} for VIN ${vin}`);
        }
    }
}

module.exports = updateValuesFromWebSocket; 