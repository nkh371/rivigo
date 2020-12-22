require('app-module-path').addPath(__dirname);
var express = require('express'),
bodyParser = require('body-parser'),
util = require('util')
var app = module.exports = express();

// increasing the limit : else giving error Request entity too large.
app.use(bodyParser.json({
    limit: '100mb'
}));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('www'));


process.on('uncaughtException', function (err) {
    util.log(err.stack);
});



require('./connections/sequelize.js');

/* Initialize Redis Client */
// require('./libs/redis').init();

/* Initialization Script for Server *

/* Including the route file */
require('./src/routes/index');

// Start the server
app.set('port', 9999);
// app.set('port', process.env.PORT || config.PORT);
app.use('*',function(req, res){
    res.status(404).send( 'Not found');
});
// Error callback
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

    var server = app.listen(app.get('port'), function () {
        util.log('Express server listening on port ' + server.address().port);
    });
