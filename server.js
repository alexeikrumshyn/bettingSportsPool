const express = require('express');
var router = express.Router();
var request = require('request');

const app = express();
const cronJob = require('cron').CronJob;
const fetch = require('node-fetch');

// Firebase App (the core Firebase SDK) is always required and
// must be listed before other Firebase SDKs
var firebase = require("firebase/app");

// Add the Firebase products that you want to use
require("firebase/auth");
require("firebase/database");
initFirebase()

function initFirebase() {
	const firebaseConfig = {
		  apiKey: "AIzaSyDXl2MWhFegAK0iiPTy6c0_mTfPH0XsbZE",
		  authDomain: "sports-betting-pool.firebaseapp.com",
		  projectId: "sports-betting-pool",
		  storageBucket: "sports-betting-pool.appspot.com",
		  messagingSenderId: "12001411941",
		  appId: "1:12001411941:web:f2afbc892b4ebc2e53978c",
		  measurementId: "G-2RLDV4JK57"
	  };
	  
	  // Initialize Firebase
	  firebase.initializeApp(firebaseConfig);
}

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

//get the results of the games from the previous day
async function getGameResults() {
	let yesterdayDate = new Date()
	yesterdayDate.setDate(yesterdayDate.getDate() - 1)

	const response = await fetch('https://statsapi.web.nhl.com/api/v1/schedule/?date='+formatDate(yesterdayDate))
	  .then(response => response.json())
	  .then(data => {
		return data.dates[0].games
	  })
	  .catch(err => {
		console.log(err)
	  })
	return response
}

//get info of users before adjustments
async function getUserInfo() {
	
	const response = await firebase.database().ref('/users/').once('value')
		.then((snapshot) => {
			return snapshot.val()
		});
	return response
}

//get the bets on the games from the previous day
async function getGameBets() {
	
	let yesterdayDate = new Date()
	yesterdayDate.setDate(yesterdayDate.getDate() - 1)
	
	const response = await firebase.database().ref('/bets/' + formatDate(yesterdayDate)).once('value')
		.then((snapshot) => {
			return snapshot.val()
		});
	return response
}

//adjust points based on previous day bets
async function adjustPoints() {
	let bets = await getGameBets()	
	let userInfo = await getUserInfo()
	
	//check for null (no bets)
	if (bets == null) {
		return
	}
	
	let results = await getGameResults()
	for (const betID in bets) {
		let winner = getWinningTeam(results, bets[betID].gameID)
		if (winner == null)
			continue
		else if (winner == bets[betID].team)
			userInfo[bets[betID].userID].points += parseInt(bets[betID].amount)
		else
			userInfo[bets[betID].userID].points -= parseInt(bets[betID].amount)
	}
	
	writeInfoToDB(userInfo)
}

//write change to points in db
function writeInfoToDB(updatedUsers) {
	firebase.database().ref('users/').set(updatedUsers)
}

//return winner of given game, null if game was not completed
function getWinningTeam(gamesArr, gameID) {
	for (let i = 0; i < gamesArr.length; i++) {
		if (gamesArr[i].gamePk == gameID) {
			if (gamesArr[i].status.detailedState != 'Final')
				return null
			else 
				return ( (parseInt(gamesArr[i].teams.away.score) > parseInt(gamesArr[i].teams.home.score)) ?
				gamesArr[i].teams.away.team.name : gamesArr[i].teams.home.team.name)
		}
	}
}

//const job = new cronJob('*/5 * * * * *', () => {
const job = new cronJob('0 5 * * *', () => {
    console.log('This will get executed at 5am daily');
	adjustPoints()
	console.log(new Date())
}, null, true, 'Europe/London');

job.start();


const port = 5000;
app.listen(port, () => `Server running on port ${port}`);