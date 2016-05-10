var express = require('express');

// exports ====================================================================
module.exports = (function() {
    'use strict';
    var api = express.Router();

    // search function --------------------------------------------------------
    api.get('/ask', function(req, res) {
      var input = req.query['q'];
      var search = require('../api/ask-core.js');

      res.send(search.query(input));
    });

    return api;
})();
