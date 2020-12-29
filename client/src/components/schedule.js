import React, { Component } from 'react';
import './schedule.css';

// Firebase App (the core Firebase SDK) is always required and
// must be listed before other Firebase SDKs
import firebase from "firebase/app";

// Add the Firebase services that you want to use
import "firebase/database";

class Schedule extends Component {
  constructor() {
    super();
    this.state = {
      schedule: []
    };
  }
  
  //returns string in YYYY-MM-DD format
  getCurrentDate() {
		var d = new Date(),
			month = '' + (d.getMonth() + 1),
			day = '' + d.getDate(),
			year = d.getFullYear();

		if (month.length < 2) 
			month = '0' + month;
		if (day.length < 2) 
			day = '0' + day;
		
		return [year, month, day].join('-');
	}

  //gets called automatically when component is mounted - fetch schedule
  componentDidMount() {
	
	/*uses current date - needs try catch block because if no games present, will return undefined*/
	//var date = this.getCurrentDate()
	
	//use this day as today for now
	var date = '2019-05-04'
	
    fetch('https://statsapi.web.nhl.com/api/v1/schedule/?date='+date)
	  .then(res => res.json())
	  .then(
		(data) => {
			this.setState({
				schedule: data.dates[0].games
			});
		}
	  )
  }
  
  //returns true if number, false otherwise
  isNum(val) {
	  return !isNaN(val);
  }
  
  //run checks and save bets
  processBets() {
	  let table = document.getElementById("schedule")
	  let bets = []
	  
	  for (var i = 1, row; row = table.rows[i]; i++) { //start at 1 to skip header row
		   
		   let awayTeam = row.cells[0].firstChild
		   let homeTeam = row.cells[1].firstChild
		   let betValue = row.cells[2].firstChild.value

		   //check for valid number
		   if (!this.isNum(betValue)) {
			   alert("Bet value "+betValue+" invalid - must contain digits only. Try again.")
			   return
		   }
		   
		   let thisBet = {}
		   
		   if (awayTeam.checked) {
			   thisBet.team = awayTeam.value
			   thisBet.gameID = awayTeam.name
		   } else if (homeTeam.checked) {
			   thisBet.team = homeTeam.value
			   thisBet.gameID = homeTeam.name
		   } else { //neither team selected
			   continue
		   }
		   
		   //check if bet value empty
		   if (betValue == "") {
			   alert("Bet on "+thisBet.team+" has no value - please enter a value or clear to continue.")
			   return
		   }
		   thisBet.amount = betValue
		   
		   
		   bets.push(thisBet)
		  
	  }
	  //check if no bets made
	  if (bets.length == 0) {
		  alert("Please make at least one bet before submitting.")
		  return
	  }
	  
	  if (this.confirmBets(bets)) {
		console.log(bets)
		this.writeToDB(bets)
		this.clearAllBets()
	  }
  }
  
  //write to firebase db
  writeToDB(bets) {
	  
	  let db = firebase.database()
	  let date = this.getCurrentDate()
	  let uid = firebase.auth().currentUser.uid
	  
	  //add user id to bet and save
	  for (var i = 0; i < bets.length; i++) {
		  
		  //use gameID as key and leave the rest for the bet properties
		  let {gameID, ...thisBet} = bets[i]
		  
		  db.ref('bets/'+date+'/'+gameID+'/'+uid+'/').set(thisBet)
	  }
  }
  
  //allow user to review and confirm bets - return confirmation status
  confirmBets(bets) {
	  return window.confirm("Please confirm your bets and press OK to submit:\n\n"+this.betsToString(bets))
  }
  
  //returns string representation of all bets given
  betsToString(bets) {
	  
	  let str = ""
	  for (var i = 0; i < bets.length; i++) {
		  str += bets[i].amount + ' on ' + bets[i].team + '\n'
	  }
	  return str
  }
  
  //clears row of given game ID
  clearBet(gameID, clearAll=false) {
	  let table = document.getElementById("schedule")
	  
	  for (var i = 1, row; row = table.rows[i]; i++) { //start at 1 to skip header row
		   
		   let thisGameID = row.cells[0].firstChild.name
		   if (thisGameID == gameID || clearAll) {
			   console.log("CLEAR"+i)
			   
			   //clear away team
			   row.cells[0].firstChild.checked = false
			   //clear home team
			   row.cells[1].firstChild.checked = false
			   //clear bet value
			   row.cells[2].firstChild.value = ""
		   } 
	  }
  }
  
  //clears all rows
  clearAllBets() {
	  this.clearBet(0, true)
  }

  render() {
    return (
      <div>
	    <h2>Welcome {firebase.auth().currentUser.email}</h2>
		<hr />
        <h2>Today's Schedule</h2>
		<table id="schedule">
		
		<tr><th>Away</th><th>Home</th><th>Bet Amount</th></tr>
		
		{this.state.schedule.map(game => 
		  <tr>
			<th>
			  <input 	type="radio" 
						id={game.teams.away.team.id}
						name={game.gamePk}
						value={game.teams.away.team.name}>
						
			  </input>
			  <label for={game.teams.away.team.id}>{game.teams.away.team.name}</label>
			</th>
			
			<th>
			  <input 	type="radio" 
						id={game.teams.home.team.id}
						name={game.gamePk}
						value={game.teams.home.team.name}>
			  </input>
			  <label for={game.teams.home.team.id}>{game.teams.home.team.name}</label>
			</th>
			
			<th><input type="text" id={game.gamePk} name={game.gamePk}></input></th>
			<th><button onClick={() => { this.clearBet(game.gamePk)}}>Clear</button></th>
		  </tr>
		)}
		</table>
	
		<button onClick={() => { this.processBets()} }>Submit</button>
		<button onClick={() => { this.clearAllBets()} }>Clear All</button>
      </div>
    );
  }
}

export default Schedule;