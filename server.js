const express = require('express');
var router = express.Router();
var request = require('request');

const app = express();
/*
app.get('https://statsapi.web.nhl.com/api/v1/teams', (req, res) => {
  
  write('HELOOOOO');
  console.log(req.teams);
  const teams = req.teams;

  res.json(teams);
});
*/
/*
router.get('/', function(req, res, next) {
  request({
    uri: 'https://statsapi.web.nhl.com/api/v1/teams',
    //qs: {
      //api_key: '123456',
      //query: 'World of Warcraft: Legion'
    //}
  }).pipe(res);
});
*/
const port = 5000;

app.listen(port, () => `Server running on port ${port}`);