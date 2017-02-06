const natural = require('natural')
const speakeasy = require('speakeasy-nlp')
const genify = require('thunkify-wrap').genify
const response = require('../response')
const log = require.main.require('./log')
const fs = require('fs')
const config = require.main.require('./config/index.js').get

const classifier = new natural.BayesClassifier()

natural.BayesClassifier.load = genify(natural.BayesClassifier.load)

const MAX_RETRAINS = 20

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

function * train_recognizer(skills) {
    // train a classifier
    skills.map(skill => {
        if (skill.intent) {
            const intent_funct = skill.intent
            const intent = intent_funct()

            intent.keywords.map(keyword => {
                classifier.addDocument(keyword.replaceAll("'", ""), skill.name)
            })
        }
        if (skill.examples) {
            skill.examples().map(keyword => {
                classifier.addDocument(keyword.replaceAll("'", ""), skill.name)
            })
        }
    })

    if (config.trains_from_responses) {
        const responses = yield log.get_responses()
        if (responses) {
            responses.map(response => {
                classifier.addDocument(response.query.replaceAll("'", ""), response.skill)
            })
        }
    }

    classifier.train()

    // Now verify all the responses.
    function validate() {
        let failed = []
        skills.map(skill => {
            if (skill.examples) {
                skill.examples().map(keyword => {
                    keyword = keyword.replaceAll("'", "")
                    const recognised = classifier.getClassifications(keyword)[0].label
                    if (recognised != skill.name) {
                        classifier.addDocument(keyword, skill.name)
                        failed.push({keyword, skill: recognised})
                    }
                })
            }
        })
        if (failed.length > 0) {
            classifier.retrain()
        }
        return failed
    }

    let retrainCount = 0
    let failed = validate()
    if (failed.length > 0) {
        console.log(`${failed.length} queries were not routed correctly, attempting re-education.`)
    }
    while (failed.length > 0) {
        if (retrainCount > MAX_RETRAINS) {
            console.log(`Maximum number of re-trainings reached with ${failed.length} failures.`)
            console.log(failed)
            break
        }
        failed = validate()
        retrainCount++
    }
    if (failed.length == 0) {
        console.log(`Re-education successful after ${retrainCount + 1} iterations.`)
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

    console.log(`Using module ${result.label} with confidence ${confidence}`)
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
    train_recognizer,
    correct_last
}
