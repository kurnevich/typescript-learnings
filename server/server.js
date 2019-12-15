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
mongoose.connect(dbRoute, { useNewUrlParser: true });
var db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", function () { return console.log("connected to the database"); });
// (optional) only made for logging and
// bodyParser, parses the request body to be a readable json format
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(logger("dev"));
// two default users
// const crypto = require('crypto');
// function hashCode(str) {
//   return str.split('').reduce((prevHash, currVal) =>
//     (((prevHash << 5) - prevHash) + currVal.charCodeAt(0))|0, 0);
// }
// const admin = new User({
//     id: 0,
//     name: 'Admin',
//     role: 'admin',
//     password: crypto.createHash('sha256').update(''+hashCode('qweiop')).digest('base64')
//   });
// admin.save();
// const user = new User({
//     id: 1,
//     name: 'Salesman',
//     role: 'salesman',
//     password: crypto.createHash('sha256').update(''+hashCode('qwe')).digest('base64')
//   });
// user.save();
var cleanupSessions = function () {
    var ses = Object.keys(sessions);
    ses.map(function (id) {
        if (sessions[id] < Date.now()) {
            console.log('found expired, delete', id);
            delete sessions[id];
            console.log(sessions);
        }
    });
};
var sesCleanupInterval = setInterval(cleanupSessions, 10000);
// How to return proper http error? no such user
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
// this is our get method
// this method fetches all available data in our database
router.get("/getData", function (req, res) {
    Data.find(function (err, data) {
        if (err)
            return res.json({ success: false, error: err });
        return res.json({ success: true, data: data });
    });
});
// this is our update method
// this method overwrites existing data in our database
router.post("/updateData", function (req, res) {
    var _a = req.body, id = _a.id, update = _a.update;
    Data.findOneAndUpdate(id, update, function (err) {
        if (err)
            return res.json({ success: false, error: err });
        return res.json({ success: true });
    });
});
// this is our delete method
// this method removes existing data in our database
router["delete"]("/deleteData", function (req, res) {
    var id = req.body.id;
    Data.findOneAndDelete(id, function (err) {
        if (err)
            return res.send(err);
        return res.json({ success: true });
    });
});
// this is our create methid
// this method adds new data in our database
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
// append /api for our http requests
app.use("/api", router);
// launch our backend into a port
app.listen(API_PORT, function () { return console.log("LISTENING ON PORT " + API_PORT); });
