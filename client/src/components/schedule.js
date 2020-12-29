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
      schedule: [],
	  //date: this.getTodayDate()
	  date: '2019-05-04'
    };
	this.setUserName()
  }
  
  //set first name of current user
  setUserName() {
	  var userId = firebase.auth().currentUser.uid;
	  firebase.database().ref('/users/' + userId).once('value')
		.then((snapshot) => {
			this.setState({
				userFirstName: snapshot.val().firstname,
				userLastName: snapshot.val().lastname,
				userID: snapshot.val().uid
			})
		});
  }
  
  //input: integer
  incrementDate(increment) {
	  let newDate = new Date(this.parseDate()) //get date
	  console.log(newDate)
	  newDate.setDate(newDate.getDate() + increment)
	  console.log(newDate)
	  this.setState({ date: this.formatDate(newDate) })
	  this.updateSchedule(this.state.date)
  }
  
  //input: date object, returns string in YYYY-MM-DD format
  formatDate(d) {
	  let month = '' + (d.getMonth());
	  let day = '' + d.getDate();
	  let year = d.getFullYear();

	  if (month.length < 2) 
	  	month = '0' + month;
	  if (day.length < 2) 
		day = '0' + day;
		
	  return [year, month, day].join('-');
  }
  
  //input: string in YYYY-MM-DD format, returns date object
  parseDate(d=this.state.date) {
	  let arr = d.split('-')
	  return new Date(parseInt(arr[0]), parseInt(arr[1]), parseInt(arr[2]))
  }
  
  //today's string in YYYY-MM-DD format
  getTodayDate() {
	  return this.formatDate(new Date())
  }
  
  //fetches schedule based on given date ('YYYY-MM-DD')
  updateSchedule(date) {
	  fetch('https://statsapi.web.nhl.com/api/v1/schedule/?date='+date)
	  .then(res => res.json())
	  .then(
		(data) => {
			try {
				console.log(date)
				this.setState({
					schedule: data.dates[0].games
				});
			} catch(err) {
				console.log(data)
				alert("error loading schedule")
			}
		}
	  )
  }

  //gets called automatically when component is mounted
  componentDidMount() {
	
	/*uses current date - needs try catch block because if no games present, will return undefined*/

	this.updateSchedule(this.state.date)
    
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
	  let date = this.state.currentDate()
	  let uid = this.state.userID
	  
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
		{this.state.userFirstName && (
		  <h2>Welcome, {this.state.userFirstName}</h2>
		)}
		<hr />
        <h2>Schedule</h2>
		<button onClick={() => { this.incrementDate(-1)}}>Prev</button>
		<button disabled>{this.state.date}</button>
		<button onClick={() => { this.incrementDate(1)}}>Next</button>
		
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