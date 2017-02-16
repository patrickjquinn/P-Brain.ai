const natural = require('natural')
const speakeasy = require('speakeasy-nlp')
const genify = require('thunkify-wrap').genify
const fs = require('fs')
const config = require.main.require('./config/index.js').get

const classifier = new natural.BayesClassifier()

natural.BayesClassifier.load = genify(natural.BayesClassifier.load)

const MAX_RETRAINS = 20
let loaded_skills = []

String.prototype.replaceAll = function (search, replacement) {
    const target = this
    return target.replace(new RegExp(search, 'g'), replacement)
}

function strip(word) {
    return word.replaceAll('\'', '').replace(/\?/g, '')
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

    if (config.trains_from_responses) {
        const responses = yield log.get_responses()
        if (responses) {
            responses.map(response => {
                classifier.addDocument(strip(response.query), response.skill)
            })
        }
    }

    classifier.train()

    // Now verify all the responses.
    function validate() {
        const failed = []
        skills.map(skill => {
            if (skill.examples) {
                skill.examples().map(keyword => {
                    const recognised = classify(keyword).skill.name
                    if (recognised != skill.name) {
                        if (skill.hard_rule) {
                            throw new Error(`Example for hard rule failed to parse for ${skill.name}`)
                        }
                        classifier.addDocument(strip(keyword).toLowerCase(), skill.name)
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

function classify(q) {
    const intent_breakdown = speakeasy.classify(q)
    q = strip(q).toLowerCase()
    const hard_skills = []
    loaded_skills.map(skill => {
        if (skill.hard_rule) {
            if (skill.hard_rule(q, intent_breakdown)) {
                hard_skills.push(skill)
            }
        }
    })

    let result_skill = null
    if (hard_skills.length > 0) {
        if (hard_skills.length > 1) {
            console.log(`Multiple hard skills for query '${q}'`)
            throw new Error('Multiple hard skills')
        } else {
            result_skill = hard_skills[0]
        }
    } else {
        const result = classifier.getClassifications(q)[0]
        const confidence = result.value
        if (confidence > 0.5) {
            throw new Error('error')
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

function * query(q, user) {
    const query_data = yield global.db.addQuery(q, user)
    const classification = classify(q)

    console.log(`Using skill ${classification.skill.name} for ${q}`)
    const resp = yield classification.skill.get(q, classification.intent_breakdown, user)

    yield global.db.addResponse(query_data, classification.skill.name, resp)

    return {
        msg: resp,
        type: classification.skill.name,
        question: q
    }
}

global.query = query
module.exports = {
    query,
    train_recognizer
}
