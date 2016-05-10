var express = require('express'),
    path = require('path');

// exports ====================================================================
module.exports = (function() {
    'use strict';
    var router = express.Router();

    // handle all requests ----------------------------------------------------
    router.use('/', express.static(__dirname + '/../src'));

    return router;
})();
