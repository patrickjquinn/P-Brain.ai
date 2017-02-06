const WtoN = require('words-to-num')
const config = require.main.require('./config/index.js').get
const request = require('co-request')
const co = require('co')

const timers = []
let socket_io = null

const intent = () => ({
    keywords: ['set timer qqqq', 'set a timer for qqqq', 'show timers', 'show timer', 'in qqqq'],
    module: 'timer'
})

const examples = () => (
    []
)

const timeUnits = [
  {name: 'week', mult: 1000 * 60 * 60 * 24 * 7},
  {name: 'day', mult: 1000 * 60 * 60 * 24},
  {name: 'hour', mult: 1000 * 60 * 60},
  {name: 'minute', mult: 1000 * 60},
  {name: 'second', mult: 1000}
]

function getUnit(word) {
    for (let i = 0; i < timeUnits.length; i++) {
        if (word.includes(timeUnits[i].name)) {
            return timeUnits[i]
        }
    }
    return null
}

function wordsToSentence(arr, start, end) {
    let sentence = ''
    for (var i = start; i < end; i++) {
        sentence += arr[i] + ' '
    }
    return sentence
}

function getTimeRemaining(t) {
    const seconds = Math.floor((t / 1000) % 60)
    const minutes = Math.floor((t / 1000 / 60) % 60)
    const hours = Math.floor((t / (1000 * 60 * 60)) % 24)
    const days = Math.floor(t / (1000 * 60 * 60 * 24))
    return {
        total: t,
        days,
        hours,
        minutes,
        seconds
    }
}

function formatTime(time) {
    let message = ''
    const units = []
    function pushUnit(num, unit) {
        if (num > 0) {
            units.push(num + ' ' + unit + (num > 1 ? 's' : ''))
        }
    }
    pushUnit(time.days, 'day')
    pushUnit(time.hours, 'hour')
    pushUnit(time.minutes, 'minute')
    pushUnit(time.seconds, 'second')
    if (units.length > 1) {
        units.splice(units.length - 1, 0, 'and')
    }
    for (var i = 0; i < units.length; i++) {
        message += ((i > 0) ? ' ' : '') + units[i]
    }

    if (message.length == 0) {
        message = 'now'
    }

    return message
}

function initializeClock(time, command) {
    const timer = {deadline: new Date(Date.parse(new Date()) + time), time, timerInterval: null}
    if (command) {
        timer.command = command
    }
    timers.push(timer)

    function updateClock() {
        if (Date.now() >= timer.deadline) {
            clearInterval(timer.timerInterval)
            const formattedTime = formatTime(getTimeRemaining(time))
            timers.splice(timers.indexOf(timer, 1))

            const response = {
                type: 'timer',
                msg: {text: `Hey there! Your timer for ${formattedTime} is finished.`}
            }
            socket_io.emit('response', response)
            if (timer.command) {
                co(function * () {
                    const ask_url = `http://localhost:${config.port}/api/ask?q=${timer.command}`
                    const data = yield request(ask_url)
                    socket_io.emit('response', JSON.parse(data.body))
                }).catch(err => {
                    console.log(err)
                })
            }
        }
    }

    updateClock()
    timer.timerInterval = setInterval(updateClock, 1000)
}

function parseTime(time) {
    let previousUnit = 0
    let timeInMillis = 0
    const words = time.split(' ')
    for (let i = 1; i < words.length; i++) {
        const unit = getUnit(words[i])
        if (unit != null) {
            const num = WtoN.convert(wordsToSentence(words, previousUnit, i))
            previousUnit = i + 1
            if (isNaN(num)) {
                return num
            }
            timeInMillis += unit.mult * num
        }
    }
    return timeInMillis
}

function getLastUnit(words) {
    let unit = null
    for (let i = 0; i < words.length; i++) {
        if (getUnit(words[i])) {
            unit = i
        }
    }
    return unit
}

function * timer_resp(query) {
    // Parse showing timers.
    if (query.startsWith('show') || query.startsWith('what')) {
        let timersString = 'You have no active timers.'
        if (timers.length > 0) {
            timersString = `You have ${timers.length == 1 ? 'a ' : ''}timer${timers.length > 1 ? 's' : ''} for: `
            for (let i = 0; i < timers.length; i++) {
                const formatted = formatTime(getTimeRemaining(timers[i].deadline.getTime() - Date.now()))
                const command = (timers[i].command) ? ` which will run '${timers[i].command}'` : ''
                timersString += `${i > 0 ? ', ' : ''}${(i > 0 && i == timers.length - 1) ? 'and ' : ''}${formatted}${command}`
            }
        }
        return {text: timersString}
    }

    let commandIndex = null
    let command = null
    const words = query.split(' ')
    if (query.includes('for')) {
        query = query.split('for')[1]
        if (query.includes('then')) {
            commandIndex = words.indexOf('then') + 1
        }
    } else if (query.includes('in')) {
        query = query.split('in')[1]
        commandIndex = getLastUnit(words) + 1
    }
    const time = parseTime(query)

    if (isNaN(time)) {
        return {text: 'Sorry, I dont understand ' + query}
    }
    if (time == 0) {
        return {text: 'Sorry, the query seems to be missing units.'}
    }

    if (commandIndex) {
        command = words.slice(commandIndex, words.length)
        command = wordsToSentence(command, 0, command.length)
    }

    initializeClock(time, command)

    if (commandIndex) {
        return {time, text: 'Okay, task scheduled for ' + formatTime(getTimeRemaining(time))}
    }
    return {time, text: 'Okay, timer set for ' + formatTime(getTimeRemaining(time))}
}

function * register(app, io) {
    socket_io = io
}

module.exports = {
    get: timer_resp,
    intent,
    register,
    examples
}
