/**
 * @description Check if a concrete MQTT topic matches a topic filter, wildcards included.
 * Comparison is done level by level, as described in the MQTT specification: "+" matches
 * exactly one level, "#" matches any number of remaining levels and is only valid as the
 * last level of the filter.
 * @param {string} filter - The topic filter, possibly containing "+" and "#" wildcards.
 * @param {string} topic - The concrete topic a message was received on.
 * @returns {boolean} True when the topic matches the filter.
 * @example
 * mqttTopicMatches('+/+/BTtoMQTT/A4C138800021', 'gateway1/office/BTtoMQTT/A4C138800021');
 */
function mqttTopicMatches(filter, topic) {
  if (filter === topic) {
    return true;
  }
  const filterLevels = filter.split('/');
  const topicLevels = topic.split('/');
  for (let i = 0; i < filterLevels.length; i += 1) {
    const filterLevel = filterLevels[i];
    if (filterLevel === '#') {
      return i === filterLevels.length - 1;
    }
    if (i >= topicLevels.length) {
      return false;
    }
    if (filterLevel !== '+' && filterLevel !== topicLevels[i]) {
      return false;
    }
  }
  return filterLevels.length === topicLevels.length;
}

module.exports = {
  mqttTopicMatches,
};
