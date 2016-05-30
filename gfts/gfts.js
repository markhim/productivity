var Trello = require("node-trello"),
    _ = require("lodash"),
    credentials = require("../credentials.json"),
    config = require("./config.json"),
    FlowdockSession = require('flowdock').Session,
    async = require('async'),
    argv = require('minimist')(process.argv.slice(2));

// credentials from ../credentials.json
var flowDockSession = new FlowdockSession(credentials.flowdock.username, credentials.flowdock.password)
var trello = new Trello(credentials.trello.app_key, credentials.trello.token)

// debug -> print in console, don't send to flowdock
var shouldDebug = argv["_"].indexOf("debug") != -1 || argv["_"].indexOf("DEBUG") != -1

// config from ./config.json
var gftColumnID = argv["trello_gft_column_id"] ? argv["trello_gft_column_id"] : config.trello_gft_column_id
var gfSprintColumnID = argv["trello_gfsprint_column_id"] ? argv["trello_gfsprint_column_id"] : config.trello_gfsprint_column_id
var fdFlowID = argv["flowdock_target_flow_id"] ? argv["flowdock_target_flow_id"] : config.flowdock_target_flow_id

if (!gftColumnID || !gfSprintColumnID || !fdFlowID) {
    console.log("Parameters not sufficient: trello_gft_column_id, trello_gfsprint_column_id, flowdock_target_flow_id may not be nil. Provide them as parameter or define them in the config.json")
    return
}

async.parallel([
    function gfSprint(callback) {
        trello.get("/1/lists/" + gfSprintColumnID, {
            'cards': 'open',
            'card_fields': 'name'
        }, function(err, data) {
            if (err) return callback(err, nil)
            var gftString = _.reduce(data.cards, function(result, cardObj) {
                return result += "* " + cardObj["name"] + "\n"
            }, "#gfsprint\n")
            callback(null, gftString)
        });
    },
    function gft(callback) {
        trello.get("/1/lists/" + gftColumnID, {
            'cards': 'open',
            'card_fields': 'name'
        }, function(err, data) {
            if (err) return callback(err, nil)
            var gfSprintString = _.reduce(data.cards, function(result, cardObj) {
                return result += "* " + cardObj["name"] + "\n"
            }, "#gft\n")
            callback(null, gfSprintString)
        });
    }
], function(error, results) {
    var message = _.values(results).join("\n")
    if (shouldDebug) {
        console.log(message)
    } else {
        flowDockSession.message(fdFlowID, message)
    }

});
