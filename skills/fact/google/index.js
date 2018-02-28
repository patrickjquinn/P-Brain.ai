let request = require('co-request'),
    $ = require('cheerio'),
    Entities = require('html-entities').XmlEntities,
    entities = new Entities(),
    striptags = require('striptags'),
    tabletojson = require('tabletojson'),
    xray = require('x-ray')(),
    json2csv = require('json2csv')

function * google_resp(query) {
    // Remove spaces and replace with +
    query = query.toLowerCase()
    query = query.replace('ask google', '')
    query = query.replace('+', '%2B')
    query = query.replace(' ', '+')

    // Remove _ and replace with +
    query = query.replace(/ /g, '+')

    const userAgent = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
        'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_1) AppleWebKit/602.2.14 (KHTML, like Gecko) Version/10.0.1 Safari/602.2.14',
        'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:50.0) Gecko/20100101 Firefox/50.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36'
    ]

    const sel = Math.floor((Math.random() * 5))
    const userAgentRandom = userAgent[sel]
    let items

    // Create search sring
    const queryString = 'http://www.google.com/search?q=' + query + '&oe=utf8'

    const options = {
        uri: queryString,
        'User-Agent': userAgentRandom
    }

    let body = yield request(options)

    body = body.body

    // result variable init
    let found = 0

    // how many 2
    if (!found) {
        // how many
        items = $('._m3b', body).get().length // find how many lines there are in answer table

        if (items) {
            found = $('._eGc', body).html() + ', '

            for (var count = 0; count < items; count++) {
                found = found + $('._m3b', body).eq(count).html() + ', '
            }
        }
    }

    // name list
    if (!found && $('#_vBb', body).length > 0) {
        found = $('#_vBb', body).html()
    }

    // facts 1
    if (!found && $('._tXc>span', body).length > 0) {
        found = $('._tXc>span', body).html()
    }

    // facts 2
    if (!found && $('._sPg', body).length > 0) {
        found = ' ' + $('._sPg', body).html()
    }

    // instant + description 1
    if (!found && $('._Oqb', body).length > 0) {
        found = $('._Oqb', body).html()

        // how many 1
        if ($('._Mqb', body).length > 0) {
            found += ' ' + $('._Mqb', body).html()
        }
    }
    // instant + description 2
    if (!found && $('._o0d', body).length > 0) {
        const tablehtml = $('._o0d', body).html()

        found = tablehtml

        xray(tablehtml, ['table@html'])((conversionError, tableHtmlList) => {
            if (tableHtmlList) {
                // xray returns the html inside each table tag, and tabletojson
                // expects a valid html table, so we need to re-wrap the table.
                const table1 = tabletojson.convert('<table>' + tableHtmlList[0] + '</table>')

                let csv = json2csv({
                    data: table1,
                    hasCSVColumnTitle: false
                })

                csv = csv.replace(/(['"])/g, '')
                csv = csv.replace(/\,(.*?)\:/g, ', ')
                csv = csv.replace(/\{(.*?)\:/g, ', ')

                found = csv.toString()
            }
        })
    }

    // Time, Date
    if (!found && $('._rkc._Peb', body).length > 0) {
        found = $('._rkc._Peb', body).html()
    }
    // Maths
    if (!found && $('.nobr>.r', body).length > 0) {
        found = $('.nobr>.r', body).html()
    }

    // simple answer
    if (!found && $('.obcontainer', body).length > 0) {
        found = $('.obcontainer', body).html()
    }

    // Definition
    if (!found && $('.r>div>span', body).first().length > 0) {
        found = $('.r>div>span', body).first().html() + ' definition. '
        items = $('.g>div>table>tr>td>ol>li', body).get().length // find how many lines there are in answer table

        if (items) {
            for (var count = 0; count < items; count++) {
                found = found + $('.g>div>table>tr>td>ol>li', body).eq(count).html() + ', '
            }
        }
    }
    // TV show
    if (!found && $('._B5d', body).length > 0) {
        found = $('._B5d', body).html()
        if ($('._Pxg', body).length > 0) {
            found += '. ' + $('._Pxg', body).html()
        }
        if ($('._tXc', body).length > 0) {
            found += '. ' + $('._tXc', body).html()
        }
    }

    // Weather
    if (!found && $('.g>.e>h3', body).length > 0) {
        found = $('.g>.e>h3', body).html()

        if ($('.wob_t', body).first().length > 0) {
            found += ' ' + $('.wob_t', body).first().html()
        }

        if ($('._Lbd', body).length > 0) {
            found += ' ' + $('._Lbd', body).html()
        }
    }

    const speechOutputTemp = entities.decode(striptags(found))

    if (speechOutputTemp === '' || typeof speechOutputTemp === undefined) {
        return null
    }

    return speechOutputTemp
}

module.exports = {
    get: google_resp
}
