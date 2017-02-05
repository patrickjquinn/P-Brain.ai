const natural = require('natural')
const speakeasy = require('speakeasy-nlp')
const genify = require('thunkify-wrap').genify
const response = require('../response')
const log = require.main.require('./log')
const fs = require('fs')

const classifier = new natural.BayesClassifier()

natural.BayesClassifier.load = genify(natural.BayesClassifier.load)

const MAX_RETRAINS = 10

function * train_recognizer(skills) {
    // train a classifier
    skills.map(skill => {
        if (skill.intent) {
            const intent_funct = skill.intent
            const intent = intent_funct()

            intent.keywords.map(keyword => {
                classifier.addDocument(keyword, skill.name)
            })
        }
        if (skill.examples) {
            skill.examples().map(keyword => {
                classifier.addDocument(keyword, skill.name)
            })
        }
    })

    const responses = yield log.get_responses()
    if (responses) {
        responses.map(response => {
            classifier.addDocument(response.query, response.skill)
        })
    }

    classifier.train()

    // Now verify all the responses.
    function validate() {
        let failedCount = 0
        skills.map(skill => {
            if (skill.examples) {
                skill.examples().map(keyword => {
                    const recognised = classifier.getClassifications(keyword)[0].label
                    if (recognised != skill.name) {
                        console.log(`Query '${keyword}' failed. Classed as ${recognised}. Attempting re-education.`)
                        classifier.addDocument(keyword, skill.name)
                        failedCount++
                    }
                })
            }
        })
        if (failedCount > 0) {
            classifier.retrain()
        }
        return failedCount
    }

    let retrainCount = 0
    let failedCount = validate()
    while (failedCount > 0) {
        if (retrainCount > MAX_RETRAINS) {
            console.log(`Maximum number of re-trainings reached with ${failedCount}.`)
            break
        }
        failedCount = validate()
        retrainCount++
    }
    if (failedCount == 0) {
        console.log('Re-education successful.')
    }
}

function * correct_last(new_skill) {
    const response = yield log.remove_last_response()
    if (response) {
        response.skill = new_skill
        while (classifier.getClassifications(response.query)[0].label != new_skill) {
            yield log.response(response.query, response.response, response.skill)
            classifier.addDocument(response.query, response.skill)
            classifier.retrain()
        }
    }
}

function * query(q) {
    const result = classifier.getClassifications(q)[0]
    const confidence = result.value

    if (confidence > 0.25) {
        throw new Error('error')
    }

    yield log.add(q)

    const intent_breakdown = speakeasy.classify(q)
    console.log('classifications')
    console.log(classifier.getClassifications(q))

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
    train_recognizer,
    correct_last
}
