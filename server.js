var express = require('express'),
    app = express(),
    api = require('./routes/api'),
    router = require('./routes/web');

// routes =====================================================================
app.use('/api', api);
app.use('/', router);

// listen =====================================================================
app.listen(8080, () => {
  console.log('App listening on port 8080');
});
