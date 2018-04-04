const natural = require('natural')
const speakeasy = require('speakeasy-nlp')
const genify = require('thunkify-wrap').genify
const fs = require('fs')

const classifier = new natural.BayesClassifier()

natural.BayesClassifier.load = genify(natural.BayesClassifier.load)

const MAX_RETRAINS = 20
let loaded_skills = []

String.prototype.replaceAll = function (search, replacement) {
    const target = this
    return target.replace(new RegExp(search, 'g'), replacement)
}

function strip(word) {
    return word.replaceAll('\'', '').replace(/\?/g, '').replaceAll('\\.', '').toLowerCase().trim()
}

function * train_recognizer(skills) {
    loaded_skills = skills
    // train a classifier
    skills.map(skill => {
        if (skill.intent) {
            const intent_funct = skill.intent
            const intent = intent_funct()

            intent.keywords.map(keyword => {
                classifier.addDocument(strip(keyword), skill.name)
            })
        }
    })

    classifier.train()

    // Now verify all the responses.
    function * validate() {
        const failed = []
        for (let i = 0; i < skills.length; i++) {
            const skill = skills[i]
            if (skill.examples) {
                const examples = skill.examples()
                for (let j = 0; j < examples.length; j++) {
                    const keyword = examples[j]
                    const recognised = (yield classify(keyword)).skill.name
                    if (recognised != skill.name) {
                        if (skill.hardRule && skill.intent == null) {
                            throw new Error(`Example for hard rule failed to parse for ${skill.name}`)
                        }
                        classifier.addDocument(strip(keyword).toLowerCase(), skill.name)
                        failed.push({keyword, skill: recognised, expected: skill.name})
                    }
                }
            }
        }

        if (failed.length > 0) {
            classifier.retrain()
        }
        return failed
    }

    let retrainCount = 0
    let failed = yield validate()
    if (failed.length > 0) {
        console.log(`${failed.length} queries were not routed correctly, attempting re-education.`)
    }
    for (let i = 0; i < failed.length; i++) {
        console.log(`Expected (${failed[i].expected}), used (${failed[i].skill}) for: '${failed[i].keyword}'`);
    }
    while (failed.length > 0) {
        if (retrainCount > MAX_RETRAINS) {
            console.log(`Maximum number of re-trainings reached with ${failed.length} failures.`)
            console.log(failed)
            break
        }
        failed = yield validate()
        retrainCount++
    }
    if (failed.length == 0) {
        console.log(`Re-education successful after ${retrainCount + 1} iterations.`)
    }
}

function * classify(q, user, token, isResponse) {
    const intent_breakdown = speakeasy.classify(q)
    q = strip(q)
    const hard_skills = []
    const conditional_skills = []
    for (let i = 0; i < loaded_skills.length; i++) {
        const skill = loaded_skills[i]
        if (skill.hardRule) {
            if (skill.hardRule(q, intent_breakdown)) {
                hard_skills.push(skill)
            }
        }
        if (skill.conditionalRule && user && token) {
            if (yield skill.conditionalRule(q, intent_breakdown, user, token, isResponse)) {
                conditional_skills.push(skill)
            }
        }
    }

    let result_skill = null
    if (hard_skills.length > 0) {
        if (hard_skills.length > 1) {
            console.log(`Multiple hard skills for query '${q}'`)
            throw new Error('Multiple hard skills')
        } else {
            result_skill = hard_skills[0]
        }
    } else if (conditional_skills.length > 0) {
        if (conditional_skills.length > 1) {
            console.log(`Multiple conditional skills for query '${q}'`)
            throw new Error('Multiple conditional skills')
        } else {
            result_skill = conditional_skills[0]
        }
    } else {
        const result = classifier.getClassifications(q)[0]
        const confidence = result.value
        if (confidence > 0.5) {
            console.log(`Warning: Confidence for query '${q}' to skill '${result.label}' is unusually high at ${confidence}`)
        }
        for (let i = 0; i < loaded_skills.length; i++) {
            if (loaded_skills[i].name == result.label) {
                result_skill = loaded_skills[i]
                break
            }
        }
    }

    if (result_skill) {
        return {
            skill: result_skill,
            intent_breakdown
        }
    }
    throw new Error('No skill found.')
}

function * query(input, user, token) {
    let query = input
    if (query.text) {
        query = query.text
    }
    const query_data = yield global.db.addQuery(query, user, token)
    const classification = yield classify(query, user, token, query.isResponse)

    console.log(`Using skill ${classification.skill.name} for ${query}`)
    const resp = yield classification.skill.get(strip(query), classification.intent_breakdown, user, token)

    yield global.db.addResponse(query_data, classification.skill.name, resp)

    return {
        msg: resp,
        type: classification.skill.name,
        question: query
    }
}

global.query = query
module.exports = {
    query,
    train_recognizer
}
