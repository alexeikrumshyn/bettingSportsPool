const express = require('express');
var router = express.Router();
var request = require('request');

const app = express();
const cronJob = require('cron').CronJob;
const fetch = require('node-fetch');

//input: date object, returns string in YYYY-MM-DD format
//note: month + 1 because date objects use Jan as month 0
function formatDate(d) {
  let month = '' + (d.getMonth()+1);
  let day = '' + d.getDate();
  let year = d.getFullYear();

  if (month.length < 2) 
	month = '0' + month;
  if (day.length < 2) 
	day = '0' + day;
	
  return [year, month, day].join('-');
}

function getGameResults() {
	let yesterdayDate = new Date()
	yesterdayDate.setDate(yesterdayDate.getDate() - 1)

	fetch('https://statsapi.web.nhl.com/api/v1/schedule/?date='+formatDate(yesterdayDate))
	  .then(response => response.json())
	  .then(data => {
		console.log(data)
	  })
	  .catch(err => {
		console.log(err)
	  })
}
getGameResults() //move this inside job

//const job = new cronJob('*/5 * * * * *', () => {
const job = new cronJob('0 5 * * *', () => {
    console.log('This will get executed at 5am daily');
}, null, true, 'Europe/London');

job.start();


const port = 5000;
app.listen(port, () => `Server running on port ${port}`);