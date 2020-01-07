"use strict";
// Something is wrong with linter configuration, so some rules are manually disabled
/* eslint-disable no-undef, @typescript-eslint/camelcase*/
exports.__esModule = true;
// Handbook - Interfaces
var express = require("express");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var cors = require("cors");
var logger = require("morgan");
var Data = require("./config/db");
var User = require("./config/db");
var dbRoute = require("./config/local-config");
var API_PORT = 3001;
var app = express();
app.use(cors());
var router = express.Router();
var sessions = {};
// Connect to DB
mongoose.connect(dbRoute, { useNewUrlParser: true, useUnifiedTopology: true });
var db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", function () { return console.log("connected to the database"); });
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(logger("dev"));
function cleanupSessions() {
    var ses = Object.keys(sessions);
    ses.map(function (id) {
        if (sessions[id] < Date.now()) {
            console.log('found expired, delete', id);
            delete sessions[id];
            console.log(sessions);
        }
    });
}
setInterval(cleanupSessions, 10000);
// Router methods
router.post("/putData", function (req, res) {
    var data = new Data();
    var _a = req.body, id = _a.id, message = _a.message;
    if ((!id && id !== 0) || !message) {
        return res.json({
            success: false,
            error: "INVALID INPUTS"
        });
    }
    data.message = message;
    data.id = id;
    data.save(function (err) {
        if (err)
            return res.json({ success: false, error: err });
        return res.json({ success: true });
    });
});
router.get("/getData", function (req, res) {
    Data.find(function (err, data) {
        if (err)
            return res.json({ success: false, error: err });
        return res.json({ success: true, data: data });
    });
});
router.post("/updateData", function (req, res) {
    var _a = req.body, id = _a.id, update = _a.update;
    Data.findOneAndUpdate(id, update, function (err) {
        if (err)
            return res.json({ success: false, error: err });
        return res.json({ success: true });
    });
});
router["delete"]("/deleteData", function (req, res) {
    var id = req.body.id;
    Data.findOneAndDelete(id, function (err) {
        if (err)
            return res.send(err);
        return res.json({ success: true });
    });
});
// Store example methods
router.post("/flowers/login", function (req, res) {
    var _a = req.body, user_name = _a.user_name, password = _a.password;
    User.findOne({ name: user_name }, function (err, user) {
        if (err)
            return console.error(err);
        if (!user) {
            return res.json({ error: 'No such user' });
        }
        var session = user.makeSession(user_name);
        sessions['' + session] = Date.now() + 60000;
        console.log(sessions);
        return res.json({ auth: user.isPasswordValid(password),
            admin: user.isAdmin(),
            sessionid: session });
    });
});
router.post("/flowers/checkSession", function (req, res) {
    var id = req.body.id;
    if (sessions[id]) {
        sessions[id] = Date.now() + 60000;
        return res.json({ auth: true });
    }
    return res.json({ auth: false });
});
// append /api for our http requests
app.use("/api", router);
app.listen(API_PORT, function () { return console.log("LISTENING ON PORT " + API_PORT); });
