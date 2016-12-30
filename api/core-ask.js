var natural = require('natural'),
    classifier = new natural.BayesClassifier();

// search functionality =======================================================
function _query(q) {

  // Placeholder classifiers to test data!

  // Weather train
  classifier.addDocument('is it raining', 'weather');
  classifier.addDocument('is it cold outside', 'weather');
  classifier.addDocument('what is the weather', 'weather');
  classifier.addDocument('whats the weather', 'weather');
  classifier.addDocument('whats it like outside', 'weather');
  classifier.addDocument('whats it like in', 'weather');



  // Time train
  classifier.addDocument('what time is it', 'time');
  classifier.addDocument('what day is it', 'time');
  classifier.addDocument('monday tuesday wednesday thursday friday', 'time');


  // Year train
  classifier.addDocument('what year is it', 'year');
  classifier.addDocument('what is the year', 'year');

  // Location train
  classifier.addDocument('where am i', 'location');
  classifier.addDocument('whats my location', 'location');

  // Sport train
  classifier.addDocument('who won the game', 'sports');
  classifier.addDocument('who is playing', 'sports');
  classifier.addDocument('who is winning', 'sports');
  classifier.addDocument('what is the score', 'sports');
  classifier.addDocument('sports', 'sports');

  // Media play train 
  classifier.addDocument('play song', 'play');
  classifier.addDocument('play', 'play');
  classifier.addDocument('start song', 'play');

  // Media pause train
  classifier.addDocument('play song', 'play');
  classifier.addDocument('play', 'play');
  classifier.addDocument('start song', 'play');

  // Media next train
  classifier.addDocument('play next', 'next');
  classifier.addDocument('play next song', 'next');
  classifier.addDocument('next song', 'nex');

  // Media song train
  classifier.addDocument('play a song', 'song');
  classifier.addDocument('play me a song', 'song');
  classifier.addDocument('start some music', 'song');

  // ID train
  classifier.addDocument('who am i', 'id');
  classifier.addDocument('whats my name', 'id');
  classifier.addDocument('where do i live', 'id');
  classifier.addDocument('where do i work', 'id');
  classifier.addDocument('what age am i', 'id');
  classifier.addDocument('whats my mothers name', 'id');
  classifier.addDocument('whats my fathers name', 'id');

  // Laughter train
  classifier.addDocument('feeling sad', 'joke');
  classifier.addDocument('feeling blue', 'joke');
  classifier.addDocument('feeling down', 'joke');
  classifier.addDocument('joke', 'joke');
  classifier.addDocument('funny', 'joke');
  classifier.addDocument('laugh', 'joke');

  // Fact train
  classifier.addDocument('what is', 'fact');
  classifier.addDocument('who is', 'fact');
  classifier.addDocument('when is', 'fact');
  classifier.addDocument('how old', 'fact');
  classifier.addDocument('who is in', 'fact');

  // Lang train
  classifier.addDocument('spell', 'lang');
  classifier.addDocument('what is the definition of', 'fact');
  classifier.addDocument('pronounce', 'fact');

  // News train
  classifier.addDocument('spell', 'lang');
  classifier.addDocument('what is the definition of', 'fact');
  classifier.addDocument('pronounce', 'fact');

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
