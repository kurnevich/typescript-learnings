// Something is wrong with linter configuration, so some rules are manually disabled
/* eslint-disable no-undef, @typescript-eslint/camelcase*/

// Handbook - Interfaces

import * as express from 'express';
import * as mongoose from 'mongoose';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as logger from 'morgan';
import * as Data from './config/db';
import * as User from './config/db';
import * as dbRoute from './config/local-config';

const API_PORT = 3001;
const app = express();
app.use(cors());
const router = express.Router();
const sessions = {};

// Connect to DB

mongoose.connect(dbRoute, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => console.log("connected to the database"));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(logger("dev"));

function cleanupSessions(): void {
  const ses = Object.keys(sessions);
  ses.map(id => {
    if (sessions[id] < Date.now()) {
      console.log('found expired, delete', id);
      delete sessions[id];
      console.log(sessions);
    }
  });
}
setInterval(cleanupSessions, 10000);

// Router methods

router.post("/putData", (req, res) => {
  const data = new Data();
  const { id, message }: { id: number; message: string } = req.body;

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

router.get("/getData", (req, res) => {
  Data.find((err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });
});

router.post("/updateData", (req, res) => {
  const { id, update }: { id: number; update: string } = req.body;
  Data.findOneAndUpdate(id, update, err => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

router.delete("/deleteData", (req, res) => {
  const { id }: {id: number} = req.body;
  Data.findOneAndDelete(id, err => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });
});

// Store example methods

router.post("/flowers/login", (req, res) => {
  const { user_name, password }: { user_name: string; password: string } = req.body;
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
  const { id }: {id: number} = req.body;
  if (sessions[id]) {
    sessions[id] = Date.now() + 60000;
    return res.json({auth: true});
  }
  return res.json({auth: false});
});

// append /api for our http requests
app.use("/api", router);
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));
