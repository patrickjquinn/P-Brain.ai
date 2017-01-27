var WtoN = require('words-to-num');

function * _intent(){
	return {keywords:['set timer','set timer for qqqq'], module:'timer'};
}

const timeUnits = [
  { name: "week", mult: 1000 * 60 * 60 * 24 * 7 },
  { name: "day", mult: 1000 * 60 * 60 * 24 },
  { name: "hour", mult: 1000 * 60 * 60 },
  { name: "minute", mult: 1000 * 60 },
  { name: "second", mult: 1000 }
];

function getUnit(word) {
  for (var i = 0; i < timeUnits.length; i++) {
    if (word.includes(timeUnits[i].name)) {
      return timeUnits[i];
    }
  }
  return null;
}

function wordsToSentence(arr, start, end) {
  var sentence = "";
  for (var i = start; i < end; i++) {
    sentence += arr[i] + " ";
  }
  return sentence;
}

function parseTime(time) {
  var previousUnit = 0;
  var timeInMillis = 0;
  var words = time.split(' ');
  for (var i = 1; i < words.length; i++) {
    var unit = getUnit(words[i]);
    if (unit != null) {
      var num = WtoN.convert(wordsToSentence(words, previousUnit, i));
      previousUnit = i + 1;
      if (isNaN(num)) {
        return num;
      }
      timeInMillis += unit.mult * num;
    }
  }
  return timeInMillis;
}

function * timer_resp(query){
	var time_to_set = query.split('for ')[1];
  var time = parseTime(time_to_set);

  if (isNaN(time)) {
    return 'Sorry, I dont understand ' + query;
  }
  if (time == 0) {
    return 'Sorry, the query seems to be missing units.';
  }

  return ':timer: ' + time;
}

module.exports = {
	get: timer_resp,
	intent: _intent
}
