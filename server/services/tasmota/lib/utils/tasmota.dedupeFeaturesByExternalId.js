const dedupeFeaturesByExternalId = (features = []) => {
  return features.reduce((acc, feature) => {
    if (!feature || !feature.external_id) {
      acc.push(feature);
      return acc;
    }
    const isDuplicate = acc.some((existingFeature) => existingFeature.external_id === feature.external_id);
    if (!isDuplicate) {
      acc.push(feature);
    }
    return acc;
  }, []);
};

module.exports = {
  dedupeFeaturesByExternalId,
};
