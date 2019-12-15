const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const logger = require("morgan");
const Data = require("./config/db");
const User = require("./config/db");
const dbRoute = require("./config/local-config");

const API_PORT = 3001;
const app = express();
app.use(cors());
const router = express.Router();

const sessions = {};

// Connect to DB

mongoose.connect(dbRoute, { useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => console.log("connected to the database"));

// (optional) only made for logging and
// bodyParser, parses the request body to be a readable json format
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(logger("dev"));

const cleanupSessions = () => {
  const ses = Object.keys(sessions);
  ses.map(id => {
    if (sessions[id] < Date.now()) {
      console.log('found expired, delete', id);
      delete sessions[id];
      console.log(sessions);
    }
  });
}

const sesCleanupInterval = setInterval(cleanupSessions, 10000);

// How to return proper http error? no such user
router.post("/flowers/login", (req, res) => {
  const { user_name, password } = req.body;
  User.findOne({ name: user_name }, function (err, user) {
    if (err) return console.error(err);
    if (!user) {
      return res.json({ error: 'No such user' });
    }
    const session = user.makeSession(user_name);
    sessions[''+session] = Date.now() + 60000;
    console.log(sessions);
    return res.json({ auth: user.isPasswordValid(password),
                      admin: user.isAdmin(),
                      sessionid: session });
  });
});


router.post("/flowers/checkSession", (req, res) => {
  const { id } = req.body;
  if (sessions[id]) {
    sessions[id] = Date.now() + 60000;
    return res.json({auth: true});
  }
  return res.json({auth: false});
});


// this is our get method
// this method fetches all available data in our database
router.get("/getData", (req, res) => {
  Data.find((err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });
});

// this is our update method
// this method overwrites existing data in our database
router.post("/updateData", (req, res) => {
  const { id, update } = req.body;
  Data.findOneAndUpdate(id, update, err => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

// this is our delete method
// this method removes existing data in our database
router.delete("/deleteData", (req, res) => {
  const { id } = req.body;
  Data.findOneAndDelete(id, err => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });
});

// this is our create method
// this method adds new data in our database
router.post("/putData", (req, res) => {
  let data = new Data();
  const { id, message } = req.body;

  if ((!id && id !== 0) || !message) {
    return res.json({
      success: false,
      error: "INVALID INPUTS"
    });
  }
  data.message = message;
  data.id = id;
  data.save(err => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

// append /api for our http requests
app.use("/api", router);

// launch our backend into a port
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));
