
/**
 * We define everything inside including the require statement, because of the limdu package
 * See here: https://github.com/erelsgl/limdu#serialization
 */
module.exports = function(){
    var limdu = require('limdu');

    // First, define our base classifier type (a multi-label classifier based on winnow):
    var TextClassifier = limdu.classifiers.multilabel.BinaryRelevance.bind(0, {
        binaryClassifierType: limdu.classifiers.Winnow.bind(0, {retrain_count: 10})
    });

    // Now define our feature extractor - a function that takes a sample and adds features to a given features set:
    var WordExtractor = function(input, features) {
        input.split(" ").forEach(function(word) {
            features[word]=1;
        });
    };

    //Initialize a classifier with a feature extractor and a case normalizer:
    return new limdu.classifiers.EnhancedClassifier({
        classifierType: TextClassifier,  // same as in previous example
        normalizer: limdu.features.LowerCaseNormalizer,
        featureExtractor: WordExtractor  // same as in previous example
    });
};