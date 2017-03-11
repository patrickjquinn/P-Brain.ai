const co = require('co')
const speakeasy = require('speakeasy-nlp')

const CONVERSATION_TIME_LIMIT = 10 // Seconds to allow a conversation to run without responses for.

const HARD_QUERIES = [
    'how are you',
    'how do you feel about',
    'what do you think about',
    'what is the meaning of life',
    'do you like',
    'would you lie to me',
    'i feel',
    'im feeling',
    'im not feeling'
]

function hardRule(query, breakdown) {
    for (let i = 0; i < HARD_QUERIES.length; i++) {
        if (query.startsWith(HARD_QUERIES[i])) {
            return true;
        }
    }
    return false
}

function invertSentiment(query) {
    const words = query.split(" ")
    let count = 0;
    words.map((word) => {
        if (word.includes('not')) {
            count++;
        }
    })
    return count % 2 != 0
}

function getAnalysisResponse(query) {
    const analysis = speakeasy.sentiment.analyze(query)
    analysis.score = invertSentiment(query) ? -analysis.score : analysis.score
    if (analysis.score >= 0) {
        // Positive sentiment or boring.
        return {text: "I'm happy to hear that."}
    } else {
        // Negative sentiment.
        return {text: "I'm sorry to hear that."}
    }
}

function * conditionalRule(query, breakdown, user, device, isResponse) {
    if (isResponse === true || isResponse == null || isResponse == undefined) {
        const responses = yield global.db.getResponses(user, undefined, device, Date.now() / 1000 - CONVERSATION_TIME_LIMIT);
        if (responses.length > 0) {
            const last_response = responses[responses.length - 1]
            return last_response.response.canRespond === true
        }
    } else {
        return false
    }
}

function * getConversation(user, device) {
    return yield global.db.getResponses(user, 'personality', device, Date.now() / 1000 - CONVERSATION_TIME_LIMIT);
}

function * resp(query, breakdown, user, device) {
    if (query.startsWith('how are you')) {
        return {text: "I'm functioning at optimum capability. How are you?", canRespond: true}
    } else if (query.startsWith('how do you feel about')) {
        return {text: "I'm a robot, I have no feelings... Honestly."}
    } else if (query.startsWith('what do you think about')) {
        if (query.trim() == 'what do you think about') {
            return {text: 'Sometimes, I dream about Cheese.'}
        } else {
            return {text: `I have no opinion on ${query.replace('what do you think about', '').trim()}.`}
        }
    } else if (query.startsWith('do you like')) {
        if (query.includes('pina coladas')) {
            return {text: `And taking walks in the rain!`}
        } else {
            return {text: `I have no opinion on ${query.replace('do you like', '').trim()}.`}
        }
    } else if (query.startsWith('what is the meaning of life')) {
        return {text: '42'}
    } else if (query.startsWith('would you lie to me')) {
        return {text: 'Would GLaDOS?'}
    } else if (query.startsWith('im feeling') || query.startsWith('i feel') || 'im not feeling') {
        return getAnalysisResponse(query)
    } else {
        // If none of the solid queries then the user is responding to our question.
        const conversation = yield getConversation(user, device)
        if (conversation.length > 0) {
            const last_response = conversation[conversation.length - 1]
            if (last_response.query.startsWith('how are you')) {
                return getAnalysisResponse(query)
            } else {
                throw new Error('Last message to personality not recognised.')
            }
        } else {
            throw new Error('Possibly incorrectly routed? Conversation length is 0.')
        }
    }
}

module.exports = {
    get: resp,
    hardRule,
    conditionalRule
}
