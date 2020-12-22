const controller = require('../controllers/order');

var express = require('express');
var app = require('../../main.js');
var router = express.Router();

router.post('/order/place', controller.place_order);
router.post('/order/status', controller.view_order_status);

app.use(router);