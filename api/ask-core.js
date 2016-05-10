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

  classifier.train();

  // Return value
  var result = classifier.classify(q);

  return result;
}

// exports ====================================================================
module.exports = (function() {
    return {
      query: _query
    };
})();
