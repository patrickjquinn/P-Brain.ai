let natural = require('natural'),
    classifier = new natural.BayesClassifier(),
    co = require('co'),
    speakeasy = require('speakeasy-nlp'),
    fs = require('fs'),
    genify = require('thunkify-wrap').genify,
    path = require('path')

let response = require('../response'),
    log = require('../log')

natural.BayesClassifier.load = genify(natural.BayesClassifier.load)

const getDirectories = (srcpath) =>
    fs.readdirSync(srcpath).filter(file =>
        fs.statSync(path.join(srcpath, file)).isDirectory())

function * train_recognizer() {
    let skills_dir = __dirname + '/skills/'
    skills_dir = skills_dir.replace('/api', '')

    const dirs = getDirectories(skills_dir)

    classifier = yield natural.BayesClassifier.load('./api/classifier.json', null)

    for (let i = 0; i < dirs.length; i++) {
        const dir = dirs[i]
        const intent_funct = require('../skills/' + dir).intent

        const intent = yield intent_funct()

        for (let j = 0; j < intent.keywords.length; j++) {
            classifier.addDocument(intent.keywords[j], intent.module)
        }
    }

    classifier.train()
    classifier.save('./api/classifier.json')
}

function * _query(q) {
    const result = classifier.getClassifications(q)[0]
    const confidence = result.value

    var resp

    if (confidence > 0.25) {
        throw 'error'
        return
    }

    yield log.add(q)

    const intent_breakdown = speakeasy.classify(q)

    intent_breakdown.responseType = result.label
    intent_breakdown.originalQuery = q

    var resp = yield response.get(intent_breakdown)

    yield log.response(q, resp, result.label)

    const response_obj = {
        msg: resp,
        type: result.label,
        question: q
    }

    return response_obj
}

co(function * () {
    yield train_recognizer()
}).catch(err => {
    console.log(err)
    throw err
})

module.exports = {
    query: _query
}
