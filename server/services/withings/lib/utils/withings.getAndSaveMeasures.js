const Promise = require('bluebird');

/**
 * @description Call Withings WS to get measures of feature and save it.
 * @param {object} feature - Withings feature to poll.
 * @param {object} withingsType - Withings measure type to poll.
 * @param {object} userId - Current user id.
 * @example
 * getAndSaveMeasures(feature, 1, 'rezrz-uiop-mlljl-jklmj-ji34k')
 */
async function getAndSaveMeasures(feature, withingsType, userId) {
  // Fix date to start poll in tmestamp
  let dateToPoll = 0;
  if (feature.last_value_changed) {
    dateToPoll = new Date(feature.last_value_changed).getTime();
  }

  const measureResult = await this.getMeasures(
    userId,
    `&meastype=${withingsType}&category=1&lastupdate=${dateToPoll / 1000 + 1}`,
  );

  if (measureResult.data.body.measuregrps) {
    const mapOfMeasuresGrpsByWithingsDeviceId = this.buildMapOfMeasures(measureResult.data.body.measuregrps);

    await Promise.each(mapOfMeasuresGrpsByWithingsDeviceId, async (value) => {
      const key = value[0];
      const valueList = value[1];
      if (key) {
        await Promise.each(valueList, async (currentGroup) => {
          if (currentGroup) {
            await Promise.each(currentGroup.measures, async (measure) => {
              if (measure) {
                const historicalValueState = (measure.value * 10 ** measure.unit).toFixed(2);
                const createdAt = new Date(currentGroup.created * 1000);
                await this.gladys.device.saveHistoricalState(feature, historicalValueState, createdAt);
              }
            });
          }
        });
      }
    });
  }
}

module.exports = {
  getAndSaveMeasures,
};
