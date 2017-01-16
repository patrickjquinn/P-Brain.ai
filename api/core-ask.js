var natural = require('natural'),
    classifier = new natural.BayesClassifier(),
    co = require('co');

var response = require('../response/index.js');

var fs = require('fs'),
    path = require('path');

function getDirectories(srcpath) {
  return fs.readdirSync(srcpath).filter(function(file) {
    return fs.statSync(path.join(srcpath, file)).isDirectory();
  });
}

function * train_recognizer() {
  "use strict";

  var skills_dir = __dirname+'/skills/';
  skills_dir = skills_dir.replace('/api','');

  var dirs = getDirectories(skills_dir);

  for (var i = 0; i<dirs.length;i++){
      var dir = dirs[i];
      var intent_funct = require('../skills/'+dir).intent;

      var intent = yield intent_funct();

      for (var j=0; j<intent.keywords.length;j++){
          classifier.addDocument(intent.keywords[j], intent.module);  
      }
  }

  classifier.train();
}

function * _query(q) {

  var result = classifier.getClassifications(q)[0];
  var confidence = result.value;

  var resp;

  console.log(confidence);

  // Confidence is not high enough
  if (confidence > 0.22) {
    throw 'error';
    return;
  }

  var resp = yield response.get({
    responseType: result.label,
    originalQuery: q
  });

  var response_obj = {
    msg: resp,
    type: result.label,
    question: q
  }

  return response_obj;
}

co(function*() {
    yield train_recognizer();
}).catch(function(err) {
    console.log(err);
    throw err;
});

module.exports = {
      query: _query
}
