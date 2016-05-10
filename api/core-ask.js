var natural = require('natural'),
    classifier = new natural.BayesClassifier();

// search functionality =======================================================
function _query(q) {

  // Placeholder classifiers to test data!

  // Weather train
  classifier.addDocument('is it raining', 'weather');
  classifier.addDocument('is it cold outside', 'weather');
  classifier.addDocument('what is the weather', 'weather');

  // Time train
  classifier.addDocument('what time is it', 'time');
  classifier.addDocument('what day is it', 'time');
  classifier.addDocument('monday tuesday wednesday thursday friday', 'time');

  // Time train
  classifier.addDocument('who won the game', 'sports');
  classifier.addDocument('who is playing', 'sports');
  classifier.addDocument('who is winning', 'sports');
  classifier.addDocument('what is the score', 'sports');
  classifier.addDocument('sports', 'sports');

  classifier.train();

  // classifier.save('./api/classifier.json', function(err, classifier) { });

  // Return value
  var result = classifier.getClassifications(q)[0];
  var confidence = result.value;

  // Confidence is not high enough
  if (confidence > 0.3) {
    return {
      responseType: "error",
      originalQuery: q
    }
  }

  return {
    responseType: result.label,
    originalQuery: q
  };
}

// exports ====================================================================
module.exports = (function() {
    return {
      query: _query
    };
})();
