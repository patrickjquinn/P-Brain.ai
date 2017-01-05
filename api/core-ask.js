var natural = require('natural'),
    classifier = new natural.BayesClassifier();

var response = require('../response/index.js');

// search functionality =======================================================

function train_recognizer(classifier) {
// Weather train

  classifier.addDocument('what is the weather', 'weather');
  classifier.addDocument('whats it like in qqqq', 'weather');
  classifier.addDocument('temperature', 'weather');


  // Fact train
  classifier.addDocument('who is qqqq', 'fact');
  classifier.addDocument('where is qqqq', 'fact');
  classifier.addDocument('what is qqqq', 'fact');
  classifier.addDocument(['√ ','-','+','%'], 'fact');

  classifier.addDocument('news', 'news');


  // Time train
  classifier.addDocument('what time is it', 'time');
  classifier.addDocument('what is the time', 'time');
  // Year train
  // classifier.addDocument('what year is it', 'year');
  // classifier.addDocument('what is the year', 'year');

  // Location train
  classifier.addDocument('where am I', 'location');
  classifier.addDocument('whats my location', 'location');

  // Sport train
  // classifier.addDocument('who won the game', 'sports');
  // classifier.addDocument('who is playing', 'sports');
  // classifier.addDocument('who is winning', 'sports');
  // classifier.addDocument('what is the score', 'sports');
  // classifier.addDocument('sports', 'sports');

  classifier.addDocument('heads or tails', 'coin');
  classifier.addDocument('coin flip', 'coin');
  classifier.addDocument('coin toss', 'coin');

  // // Media play train 
  // classifier.addDocument('play song', 'play');
  // classifier.addDocument('play', 'play');
  // classifier.addDocument('start song', 'play');

  // // Media pause train
  // classifier.addDocument('play song', 'play');
  // classifier.addDocument('play', 'play');
  // classifier.addDocument('start song', 'play');

  // // Media next train
  // classifier.addDocument('play next', 'skip');
  // classifier.addDocument('play next song', 'skip');
  // classifier.addDocument('next song', 'skip');

  // Media song train
  classifier.addDocument('play qqqq by qqqq', 'song');
  // ID train
  classifier.addDocument('What is my name', 'id');


  classifier.addDocument('start movie qqqq', 'movie');
  classifier.addDocument('play movie', 'movie');




  // classifier.addDocument('whats my name', 'id');
  // classifier.addDocument('where do i live', 'id');
  // classifier.addDocument('where do i work', 'id');
  // classifier.addDocument('what age am i', 'id');
  // classifier.addDocument('whats my mothers name', 'id');
  // classifier.addDocument('whats my fathers name', 'id');
  // Laughter train

  classifier.addDocument('tell me a joke', 'joke');
  classifier.addDocument('say something funny', 'joke');
  classifier.addDocument('make me laugh', 'joke');

  // Lang train
  // classifier.addDocument('spell', 'lang');
  // classifier.addDocument('what is the definition of', 'lang');
  // classifier.addDocument('pronounce', 'lang');

  // News train
  // classifier.addDocument('spell', 'lang');
  // classifier.addDocument('what is the definition of', 'fact');
  // classifier.addDocument('pronounce', 'fact');

  classifier.train();

}


function * _query(q) {

  // Placeholder classifiers to test data!
  train_recognizer(classifier);


  // classifier.save('./api/classifier.json', function(err, classifier) { });

  // Return value
  var result = classifier.getClassifications(q)[0];
  var confidence = result.value;

  var resp;

  // Confidence is not high enough
  if (confidence > 0.3) {
    return 'error';
  }



  var resp = yield response.get({
    responseType: result.label,
    originalQuery: q
  });

  return resp;
}

// exports ====================================================================
module.exports = {
      query: _query
}
