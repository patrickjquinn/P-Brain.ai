const request = require('co-request')
const config = require('../../config')

const keys = config.get
const api_opnw = 'http://api.openweathermap.org/data/2.5/weather?q=dublin,ireland&units=metric&appid=' + keys.openweathermap.key
const type_wardrobe = {
    'rain': 'a jacket',
    'snow': 'a scarf and gloves',
    'sun': 'some sun glasses',
    'clear': 'a t-shirt and shorts',
    'wind': 'a jumper',
    'mist': 'a hat'
};


const intent = () => ({
    keywords: ['wear today', 'clothes'],
    module: 'clothing'
})

function contains_key(string, keyword) {
    if (string.toUpperCase().includes(keyword.toUpperCase())) {
        return true
    }
    return false
}

function * clothing_resp() {
	let response = 'Looks like <condition>, better wear <clothes>'
    let data = yield request(api_opnw, {
        headers: {
            'Content-type': 'application/json'
        }
    })

    data = JSON.parse(data.body);

    let condition = data.weather[0].main
    let clothes = 'a jacket'

    if (contains_key(condition, 'rain') || contains_key(condition, 'shower')) {
        clothes = type_wardrobe.rain
    } else if (contains_key(condition, 'snow')) {
        clothes = type_wardrobe.snow
    } else if (contains_key(condition, 'mist')) {
        clothes = type_wardrobe.mist
    } else if (contains_key(condition, 'wind')) {
        clothes = type_wardrobe.wind
    } else if (contains_key(condition, 'sun')) {
        clothes = type_wardrobe.sun
    }

    response = response.replace('<condition>', condition)
    response = response.replace('<clothes>', clothes)

    return response
}

module.exports = {
	get: clothing_resp,
	intent
}