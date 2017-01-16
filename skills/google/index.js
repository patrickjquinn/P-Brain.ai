'use strict';

var rp = require('request-promise');
var $ = require('cheerio');
var Entities = require('html-entities').XmlEntities;
var entities = new Entities();
var striptags = require('striptags');
var tabletojson = require('tabletojson');
var xray = require('x-ray')();
var json2csv = require('json2csv');

function* _intent() {
    return {
        keywords: ['google', 'ask google'],
        module: 'google'
    };
}

function* google_resp(query) {
    // Remove spaces and replace with +
    query = query.toLowerCase();
    query = query.replace('ask google','');
    query = query.replace(" ", "+");

    // Remove _ and replace with +
    query = query.replace(/ /g, "+");


    var userAgent = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
        'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_1) AppleWebKit/602.2.14 (KHTML, like Gecko) Version/10.0.1 Safari/602.2.14',
        'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:50.0) Gecko/20100101 Firefox/50.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36'
    ];

    var sel = Math.floor((Math.random() * 5));
    var userAgentRandom = userAgent[sel];
    var items;

    // Create search sring
    var queryString = "http://www.google.com/search?q=" + query + '&oe=utf8';

    var options = {
        uri: queryString,
        'User-Agent': userAgentRandom
    };

    var body = yield rp(options);

    // result variable init
    var found = 0;

    //how many 2
    if (!found) {
        //how many
        items = $('._m3b', body).get().length; // find how many lines there are in answer table

        if (items) {
            found = $('._eGc', body).html() + ", ";


            for (var count = 0; count < items; count++) {
                found = found + $('._m3b', body).eq(count).html() + ", ";
            }
        }
    }

    //name list
    if (!found && $('#_vBb', body).length > 0) {

        found = $('#_vBb', body).html();
    }

    //facts 1
    if (!found && $('._tXc>span', body).length > 0) {

        found = $('._tXc>span', body).html();
    }

    //facts 2
    if (!found && $('._sPg', body).length > 0) {

        found = " " + $('._sPg', body).html();
    }

    //instant + description 1
    if (!found && $('._Oqb', body).length > 0) {

        found = $('._Oqb', body).html();

        //how many 1
        if ($('._Mqb', body).length > 0) {

            found += " " + $('._Mqb', body).html();
        }
    }
    //instant + description 2
    if (!found && $('._o0d', body).length > 0) {

        var tablehtml = $('._o0d', body).html();

        found = tablehtml;

        xray(tablehtml, ['table@html'])(function(conversionError, tableHtmlList) {

            if (tableHtmlList) {
                // xray returns the html inside each table tag, and tabletojson
                // expects a valid html table, so we need to re-wrap the table.
                var table1 = tabletojson.convert('<table>' + tableHtmlList[0] + '</table>');

                var csv = json2csv({
                    data: table1,
                    hasCSVColumnTitle: false
                });

                csv = csv.replace(/(['"])/g, "");
                csv = csv.replace(/\,(.*?)\:/g, ", ");
                csv = csv.replace(/\{(.*?)\:/g, ", ");

                found = csv.toString();

            }


        });
    }

    //Time, Date
    if (!found && $('._rkc._Peb', body).length > 0) {

        found = $('._rkc._Peb', body).html();

    }
    //Maths	
    if (!found && $('.nobr>.r', body).length > 0) {
        found = $('.nobr>.r', body).html();
    }

    //simple answer
    if (!found && $('.obcontainer', body).length > 0) {
        found = $('.obcontainer', body).html();

    }

    //Definition
    if (!found && $('.r>div>span', body).first().length > 0) {
        found = $('.r>div>span', body).first().html() + " definition. ";
        //how many
        items = $('.g>div>table>tr>td>ol>li', body).get().length; // find how many lines there are in answer table

        if (items) {

            for (var count = 0; count < items; count++) {

                found = found + $('.g>div>table>tr>td>ol>li', body).eq(count).html() + ", ";
            }
        }
    }
    //TV show
    if (!found && $('._B5d', body).length > 0) {
        found = $('._B5d', body).html();
        //how many
        if ($('._Pxg', body).length > 0) {
            found += ". " + $('._Pxg', body).html();
        }
        //how many
        if ($('._tXc', body).length > 0) {

            found += ". " + $('._tXc', body).html();
        }
    }

    //Weather
    if (!found && $('.g>.e>h3', body).length > 0) {

        found = $('.g>.e>h3', body).html();
        //how many
        if ($('.wob_t', body).first().length > 0) {

            found += " " + $('.wob_t', body).first().html();
        }

        //how many
        if ($('._Lbd', body).length > 0) {

            found += " " + $('._Lbd', body).html();
        }
    }

    // strip out html tags to leave just text
    var speechOutputTemp = entities.decode(striptags(found));
    // var cardOutputText = speechOutputTemp;
    // make sure all full stops have space after them otherwise alexa says the word dot 

    // speechOutputTemp = speechOutputTemp.split('.com').join(" dot com "); // deal with dot com
    // speechOutputTemp = speechOutputTemp.split('.co.uk').join(" dot co dot uk "); // deal with .co.uk
    // speechOutputTemp = speechOutputTemp.split('.net').join(" dot net "); // deal with .net
    // speechOutputTemp = speechOutputTemp.split('.org').join(" dot org "); // deal with .org
    // speechOutputTemp = speechOutputTemp.split('a.m').join("am"); // deal with a.m
    // speechOutputTemp = speechOutputTemp.split('p.m').join("pm"); // deal with a.m


    // // deal with decimal places
    // speechOutputTemp = speechOutputTemp.replace(/\d[\.]{1,}/g, '\$&DECIMALPOINT');
    // speechOutputTemp = speechOutputTemp.replace(/.DECIMALPOINT/g, 'DECIMALPOINT');

    // // deal with characters that are illegal in SSML

    // speechOutputTemp = speechOutputTemp.replace(/&/g, ' and ');
    // speechOutputTemp = speechOutputTemp.replace(/</g, ' less than ');
    // speechOutputTemp = speechOutputTemp.replace(/""/g, '');
    if (speechOutputTemp == "" || typeof speechOutputTemp == undefined ){
    	return 'Hmmm I couldnt get the answer to that on Google';
    }

    return speechOutputTemp;
}

module.exports = {
    get: google_resp,
    intent: _intent
};