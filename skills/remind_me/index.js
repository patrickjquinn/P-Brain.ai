function hardRule(query, breakdown) {
    return query.trim().startsWith('remind me to')
}

function * reminder_resp(query) {
    query = query.replace('remind me to', '').trim()
    return {text: `It's time to ${query}.`}
}

const examples = () => (
    ['Remind me to take out the bins.']
)

module.exports = {
    get: reminder_resp,
    hardRule,
    examples
}
