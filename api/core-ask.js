const natural = require('natural')
const speakeasy = require('speakeasy-nlp')
const genify = require('thunkify-wrap').genify
const response = require('../response')
const log = require('../log')

const classifier = new natural.BayesClassifier()

natural.BayesClassifier.load = genify(natural.BayesClassifier.load)

function * train_recognizer(skills) {
    skills.map(skill => {
        if (skill.intent) {
            const intent_funct = skill.intent
            const intent = intent_funct()

            intent.keywords
                .map(keyword => classifier.addDocument(keyword, intent.module))
        }
    })

    classifier.train()
}

function * query(q) {
    const result = classifier.getClassifications(q)[0]
    const confidence = result.value

    if (confidence > 0.25) {
        throw new Error('error')
    }

    yield log.add(q)

    const intent_breakdown = speakeasy.classify(q)

    intent_breakdown.responseType = result.label
    intent_breakdown.originalQuery = q

    const resp = yield response.get(intent_breakdown)

    yield log.response(q, resp, result.label)

    return {
        msg: resp,
        type: result.label,
        question: q
    }
}

module.exports = {
    query,
    train_recognizer
}
