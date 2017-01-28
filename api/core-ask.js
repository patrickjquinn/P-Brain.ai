const fs = require('fs')
const path = require('path')
const co = require('co')
const natural = require('natural')
const speakeasy = require('speakeasy-nlp')
const genify = require('thunkify-wrap').genify
const response = require('../response')
const log = require('../log')

let classifier = new natural.BayesClassifier()

natural.BayesClassifier.load = genify(natural.BayesClassifier.load)

const getDirectories = srcpath =>
    fs.readdirSync(srcpath).filter(file =>
        fs.statSync(path.join(srcpath, file)).isDirectory())

function * train_recognizer() {
    classifier = yield natural.BayesClassifier.load('./api/classifier.json', null)

    let skills_dir = path.join(__dirname, '/skills/')
    skills_dir = skills_dir.replace('/api', '')
    const dirs = getDirectories(skills_dir)

    dirs.map(dir => {
        const intent_funct = require(`../skills/${dir}`).intent
        const intent = intent_funct()

        intent.keywords
            .map(keyword => classifier.addDocument(keyword, intent.module))
    })

    classifier.train()
    classifier.save('./api/classifier.json')
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

co(function * () {
    yield train_recognizer()
}).catch(err => {
    console.log(err)
    throw err
})

module.exports = {
    query
}
