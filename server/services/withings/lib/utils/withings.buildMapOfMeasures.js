/**
 * @description Returns map of measures by withings device id.
 * @param {object} measuregrps - List of withings measures.
 * @returns {object} Map of measures by withings device id.
 * @example
 * buildMapOfMeasures(measuregrps)
 */
function buildMapOfMeasures(measuregrps) {
  const mapOfMeasuresGrpsByWithingsDeviceId = new Map();
  if (measuregrps) {
    measuregrps.forEach((element) => {
      if (element) {
        // Build map of measuregrps by withings device id
        const measureList = mapOfMeasuresGrpsByWithingsDeviceId.get(element.deviceid) || [];
        measureList.push(element);
        mapOfMeasuresGrpsByWithingsDeviceId.set(element.deviceid, measureList);
      }
    });
  }
  return mapOfMeasuresGrpsByWithingsDeviceId;
}

module.exports = {
  buildMapOfMeasures,
};
