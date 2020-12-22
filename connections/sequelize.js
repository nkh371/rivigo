'use strict';

var fs = require('fs');
var path = require('path');
var Sequelize = require('sequelize');
var _ = require('lodash');
var environment  = require(__dirname + '/../config/config.json')["environment"];
var mysqlConfig  = require(__dirname + '/../config/config.json')["mysql"][environment];
var config  = require(__dirname + '/../config/config.json');
var db = {};

var enableLogging = true;

var rootPath = path.normalize(__dirname + '/..');
// var modelsDir = rootPath+'/mysql_models';
// create your instance of sequelize

var sequelize =  new Sequelize(mysqlConfig.database, mysqlConfig.username, mysqlConfig.password, {
        host: mysqlConfig.host,
        port: mysqlConfig.options.port,
        dialect: 'mysql',
        timezone: '+05:30',
        logging: enableLogging
    });
// loop through all files in models directory ignoring hidden files and this file


// invoke associations on each of the models
Object.keys(db).forEach(function (modelName) {
    if (db[modelName].options.hasOwnProperty('associate')) {
        db[modelName].options.associate(db)
    }
});

// assign the sequelize variables to the db object and returning the db. 
module.exports = _.extend({
    sequelize: sequelize,
    Sequelize: Sequelize
}, db);