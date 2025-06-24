const { UPDATE_THRESHOLDS } = require('./tessie.constants');

/**
 * Détermine si une feature doit être mise à jour
 * @param {object} feature - La feature Gladys
 * @param {any} newValue - La nouvelle valeur
 * @param {number} timeThreshold - Seuil de temps en millisecondes
 * @returns {boolean} True si la mise à jour est nécessaire
 */
function shouldUpdateFeature(feature, newValue, timeThreshold = UPDATE_THRESHOLDS.DEFAULT) {
    const now = Date.now();

    // Si pas de dernière valeur, toujours mettre à jour
    if (feature.last_value === null || feature.last_value === undefined) {
        return true;
    }

    // Si la valeur a changé, mettre à jour
    if (feature.last_value !== newValue) {
        return true;
    }

    // Si plus de 5 minutes se sont écoulées depuis la dernière mise à jour, mettre à jour
    if (feature.last_value_changed && (now - feature.last_value_changed) > timeThreshold) {
        return true;
    }

    return false;
}

module.exports = shouldUpdateFeature; 