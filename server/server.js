const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/"
const app = express();
const port = 8080;
const users = require('./router/router.js');
const cors = require("cors");

const corsOptions = {
  origin: 'http://localhost:3000', // create-react-app dev server
}

app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '50mb' }));
app.use("/api", users);

MongoClient.connect(url, { useUnifiedTopology: true }, function (err, con) {
  if (err) throw err;
  app.locals.db = con.db('lego-organizer');
  console.log("Connection established!");
  app.listen(port, () => console.log(`The app is listening at http://localhost:${port}`));
});