const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('cross-fetch');
admin.initializeApp();

exports.updatePoints = functions.pubsub.schedule('every day 01:00').onRun(async context => {
    adjustPoints()
    functions.logger.log('Points ajustments finished');
  });

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
        functions.logger.log('found bet: '+betID);
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

//get the bets on the games from the previous day
async function getGameBets() {
	
	let yesterdayDate = new Date()
	yesterdayDate.setDate(yesterdayDate.getDate() - 1)
	
	const response = await admin.database().ref('/bets/' + formatDate(yesterdayDate)).once('value')
		.then((snapshot) => {
			return snapshot.val()
		});
	return response
}

//get info of users before adjustments
async function getUserInfo() {
	
	const response = await admin.database().ref('/users/').once('value')
		.then((snapshot) => {
			return snapshot.val()
		});
	return response
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

//write change to points in db
function writeInfoToDB(updatedUsers) {
	admin.database().ref('users/').set(updatedUsers)
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
