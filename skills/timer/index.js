const WtoN = require('words-to-num')

let timers = [];
let socket_io = null;

const intent = () => ({
    keywords: ['set timer', 'set timer for qqqq', 'show timers', 'show timer'],
    module: 'timer'
})

const timeUnits = [
  { name: "week", mult: 1000 * 60 * 60 * 24 * 7 },
  { name: "day", mult: 1000 * 60 * 60 * 24 },
  { name: "hour", mult: 1000 * 60 * 60 },
  { name: "minute", mult: 1000 * 60 },
  { name: "second", mult: 1000 }
];

function getUnit(word) {
  for (let i = 0; i < timeUnits.length; i++) {
    if (word.includes(timeUnits[i].name)) {
      return timeUnits[i]
    }
  }
  return null
}

function wordsToSentence(arr, start, end) {
  let sentence = ""
  for (var i = start; i < end; i++) {
    sentence += arr[i] + " "
  }
  return sentence;
}

function getTimeRemaining(t) {
    var seconds = Math.floor((t / 1000) % 60)
    var minutes = Math.floor((t / 1000 / 60) % 60)
    var hours = Math.floor((t / (1000 * 60 * 60)) % 24)
    var days = Math.floor(t / (1000 * 60 * 60 * 24))
    return {
        'total': t,
        'days': days,
        'hours': hours,
        'minutes': minutes,
        'seconds': seconds
    }
}

function formatTime(time) {
    var message = ""
    var units = []
    function pushUnit(num, unit) {
        if (num > 0) {
            units.push(num + " " + unit + (num > 1 ? "s" : ""))
        }
    }
    pushUnit(time.days, "day")
    pushUnit(time.hours, "hour")
    pushUnit(time.minutes, "minute")
    pushUnit(time.seconds, "second")
    if (units.length > 1) {
        units.splice(units.length - 1, 0, "and")
    }
    for (var  i = 0; i < units.length; i++) {
        message += ((i > 0) ? " " : "") + units[i]
    }
    return message;
}

function initializeClock(time) {
  const timer = { deadline: new Date(Date.parse(new Date()) + time), time: time, timerInterval: null }
  timers.push(timer);

  function updateClock() {
    if (Date.now() >= timer.deadline) {
      clearInterval(timer.timerInterval)
      const formattedTime = formatTime(getTimeRemaining(time))
      const response = {
        type: "timer",
        msg: { text: `Hey there! Your timer for ${formattedTime} is finished.`}
      }
      socket_io.emit('response', response)
      timers.splice(timers.indexOf(timer, 1));
    }
  }

  updateClock();
  timer.timerInterval = setInterval(updateClock, 1000);
}

function parseTime(time) {
  let previousUnit = 0
  let timeInMillis = 0
  var words = time.split(' ')
  for (let i = 1; i < words.length; i++) {
    const unit = getUnit(words[i])
    if (unit != null) {
      const num = WtoN.convert(wordsToSentence(words, previousUnit, i))
      previousUnit = i + 1
      if (isNaN(num)) {
        return num;
      }
      timeInMillis += unit.mult * num
    }
  }
  return timeInMillis
}

function * timer_resp(query){
  if (query.includes('show')) {
      let timersString = `You have ${timers.length == 1 ? "a ":""} timer${timers.length > 1 ? "s" : ""} for: `;
      for (let i = 0; i < timers.length; i++) {
        const formatted = formatTime(getTimeRemaining(timers[i].deadline.getTime() - Date.now()))
        timersString += `${i > 0 ? ", " : ""}${(i > 0 && i == timers.length - 1) ? "and ":""}${formatted}`
      }
      return {'text': timersString}
  } else {
      const time_to_set = query.split('for ')[1]
      const time = parseTime(time_to_set)

      if (isNaN(time)) {
          return {'text': 'Sorry, I dont understand ' + query}
      }
      if (time == 0) {
          return {'text': 'Sorry, the query seems to be missing units.'}
      }

      initializeClock(time);

      return {time: time, text: 'Okay, timer set for ' + formatTime(getTimeRemaining(time))}
  }
}

function register(app, io) {
    socket_io = io;
}

module.exports = {
	get: timer_resp,
	intent,
    register: register
}
