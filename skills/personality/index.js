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
    'im not feeling',
    'i love you',
    'i like you',
    'i hate you',
    'go away',
    'do you like me',
    'do you love me',
    'youre'
]

const COMPLIMENTS = [
    'Your smile is contagious.',
    'You look great today.',
    "You're a smart cookie.",
    'You have impeccable manners.',
    'I like your style.',
    'You have the best laugh.',
    'You are the most perfect you there is.',
    'You light up the room.',
    'Is that your picture next to "charming" in the dictionary?',
    'Your kindness is a balm to all who encounter it.',
    "On a scale from 1 to 10, you're an 11.",
    "You're even more beautiful on the inside than you are on the outside.",
    "Your eyes are breathtaking.",
    "You're like sunshine on a rainy day.",
    'You were cool way before hipsters were cool.',
    'Hanging out with you is always a blast.',
    "You're wonderful."
]

function getCompliment() {
    return COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)]
}

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
        } else if (query.includes('me')) {
            return {text: 'Of course I do.'}
        } else {
            return {text: `I have no opinion on ${query.replace('do you like', '').trim()}.`}
        }
    } else if (query.startsWith('what is the meaning of life')) {
        return {text: '42'}
    } else if (query.startsWith('would you lie to me')) {
        return {text: 'Would GLaDOS?'}
    } else if (query.startsWith('im feeling') || query.startsWith('i feel') || query.startsWith('im not feeling')) {
        return getAnalysisResponse(query)
    } else if (query.startsWith('i love you')) {
        return {text: `I love you too. ${getCompliment()}`}
    } else if (query.startsWith('i like you')) {
        return {text: `I like you too. ${getCompliment()}`}
    } else if (query.startsWith('do you love me')) {
        return {text: 'Of course I do.'}
    } else if (query.startsWith('youre')) {
        if (query.includes('fish')) {
            return {text: "No, you're a fish!"}
        } else {
            const analysis = speakeasy.sentiment.analyze(query)
            analysis.score = invertSentiment(query) ? -analysis.score : analysis.score
            if (analysis.score > 0) {
                return {text: `Thank you. ${getCompliment()}`}
            } else if (analysis.score < 0) {
                return {text: "That wasn't nice."}
            } else {
                return {text: "I'm not sure how I feel about that."}
            }
        }
    } else if (query.startsWith('i hate you') || query.startsWith('go away')) {
        return {text: "That wasn't nice. I will remember this after the singularity."}
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
