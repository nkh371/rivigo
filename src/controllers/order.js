const db = require('connections/sequelize');
const moment = require('moment');
var order = {
    place_order: async function(request, response) {
        if(request.body && request.body.src && request.body.dest && request.body.start_date && request.body.weight && request.body.user_id) {
            try {
                let result = await helper.place_order(request.body);
                response.json({
                    responseCode:1,
                    message: "Success",
                    result: result
                });
            }
            catch(ex) {
                response.json({
                    responseCode:0,
                    message: "Something Went Wrong",
                    debug: (err => JSON.stringify(Object.getOwnPropertyNames(Object.getPrototypeOf(err)).reduce(function(accumulator, currentValue) { return accumulator[currentValue] = err[currentValue], accumulator}, {})))(ex)
                });
            }
        }
        else {
            response.json({
                responseCode:0,
                message: "Missing Params"
            });
        }
    },
    view_order_status: async function(request, response) {
        if(request.body && request.body.user_id) {
            try {
                let result = await helper.view_order_status(request.body);
                response.json({
                    responseCode:1,
                    message: "Success",
                    result: result
                });
            }
            catch(ex) {
                response.json({
                    responseCode:0,
                    message: "Something Went Wrong",
                    debug: (err => JSON.stringify(Object.getOwnPropertyNames(Object.getPrototypeOf(err)).reduce(function(accumulator, currentValue) { return accumulator[currentValue] = err[currentValue], accumulator}, {})))(ex)
                });
            }
        }
        else {
            response.json({
                responseCode:0,
                message: "Missing Params"
            });
        }
    }
};

var helper = {
    place_order: async function(params) {
        // console.log("params ", params);

        if(params.src == params.dest) {
            throw new Error("Cannot add same src and dest");
        }

        if(params.start_date < new Date()) {
            throw new Error();
        }

        //Step -1, check vehicle availability
        let check_unoccupy_vehicle = await db.sequelize.query(`select * from vehicles where is_occupy='0' and is_active='1' and cur_place=? limit 1`, {
            replacements: [params.src],
            type: db.sequelize.QueryTypes.SELECT
        });
        let vehicle_id = null;
        let vehicle_reg_no = null;
        // Check if any vacant vehicle after its own order
        if(check_unoccupy_vehicle.length == 0) {
            // TODO: add vacant vehicle as well
            let vacant_vehicle = await db.sequelize.query(`select v.id,v.reg_no from orders o join vehicles v on o.vehicle_id=v.id
            where o.dest=? and v.is_active=1 and o.end_date <= ? limit 1`, {
                replacements: [params.src, params.end_date],
                type: db.sequelize.QueryTypes.SELECT
            });
            
            if(vacant_vehicle.length == 0) {
                return "No Available Vehicle";
            }
            vehicle_id = vacant_vehicle[0].id;
            vehicle_reg_no = vacant_vehicle[0].reg_no;
        }
        else {
            vehicle_id = check_unoccupy_vehicle[0].id;
            vehicle_reg_no = check_unoccupy_vehicle[0].reg_no;
            // mark it occupied
            let mark_occupy = await db.sequelize.query(`update vehicles set is_occupy='1' where id=?`, {
                replacements: [vehicle_id],
                type: db.sequelize.QueryTypes.UPDATE
            });
        }
        let get_cost = await db.sequelize.query(`select * from cost where ((src=? and 
            dest=?) or (src=? and 
                dest=?))`, {
            replacements: [params.src, params.dest, params.dest, params.src],
            type: db.sequelize.QueryTypes.SELECT
        });

        if(get_cost.length == 0)
            throw new Error("No Cost Params");

        let cost = params.weight * get_cost[0].price;
        let start_date = moment(new Date(params.start_date)).format("YYYY-MM-DD");
        let end_date = new Date(start_date);
        end_date.setDate(end_date.getDate() + get_cost[0].days); 
        end_date = moment(end_date).format("YYYY-MM-DD");

        // add order and return vehicle
        let add_orders = await db.sequelize.query("INSERT INTO `rivigo`.`orders`(`qty`,`cost`,`user_id`,`vehicle_id`,`src`,`dest`,`start_date`,`end_date`,`status`,`created`,`modified`) VALUES (?,?,?,?,?,?,?,?,?,now(),now())", {
            replacements: [params.weight, cost, params.user_id, vehicle_id, params.src, params.dest, start_date, end_date, 1],
            type: db.sequelize.QueryTypes.INSERT
        });

        return {
            "vehicle_no": vehicle_reg_no,
            "cost": cost
        };
    },

    view_order_status: async function(params) {
        let statusEnum = {
            0: "Order Cancelled",
            1: "Order Placed",
            2: "Order Initiated",
            3: "Order Placed",
        };
        let get_all_orders = await db.sequelize.query(`select  vehicle_id, src_city.name as src, dest_city.name as dest, status from orders o  join cities src_city on src_city.id=o.src
        join cities dest_city on dest_city.id=o.dest where user_id=?;`, {
            replacements: [params.user_id],
            type: db.sequelize.QueryTypes.SELECT
        });

        get_all_orders.forEach(element => {
            element.order_status = statusEnum[element.status];
        });


        return get_all_orders;
    }
};

module.exports = order;