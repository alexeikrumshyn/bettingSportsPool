import React, { Component } from 'react';
import './schedule.css';

// Firebase App (the core Firebase SDK) is always required and
// must be listed before other Firebase SDKs
import firebase from "firebase/app";

// Add the Firebase services that you want to use
import "firebase/database";
import "firebase/firestore";

class Schedule extends Component {
  constructor() {
    super();
    this.state = {
      schedule: [],
	  date: this.getTodayDate(),
	  userBets: []
    };
	this.setUserBets()
	this.IMG_SRC = "https://raw.githubusercontent.com/alexeikrumshyn/bettingSportsPool/master/client/images/logos/"
	this.TEXTART_SUFFIX = "a-removebg-preview.png"
	this.LOGO_SUFFIX = "b.webp"
  }
  
  //set first name of current user
  async setUserName() {
	  var userId = firebase.auth().currentUser.uid;
	  await firebase.database().ref('/users/' + userId).once('value')
		.then((snapshot) => {
			this.setState({
				userFirstName: snapshot.val().firstname,
				userLastName: snapshot.val().lastname,
				userID: userId,
				userPts: snapshot.val().points
			})
		});
  }

  //get bets of today's games
  async getAllBets() {
	
	const response = await firebase.database().ref('/bets/' + this.getTodayDate()).once('value')
		.then((snapshot) => {
			return snapshot.val()
		});
	return response
  }

  //get only current user's bets of today's games
  async setUserBets() {
	await this.setUserName()
	let bets = await this.getAllBets()
	let thisUserBets = []
	for (const betID in bets) {
		if (this.state.userID == bets[betID].userID) {
			thisUserBets.push(bets[betID])
		}
	}
	this.setState({
		userBets: thisUserBets
	});
  }
  
  //input: integer, also updates state and returns updated date
  incrementDate(increment) {
	  let newDate = new Date(this.parseDate()) //get date
	  newDate.setDate(newDate.getDate() + increment)
	  this.setState({ date: this.formatDate(newDate) })
	  return this.formatDate(newDate)
  }
  
  //input: date object, returns string in YYYY-MM-DD format
  //note: month + 1 because date objects use Jan as month 0
  formatDate(d) {
	  let month = '' + (d.getMonth()+1);
	  let day = '' + d.getDate();
	  let year = d.getFullYear();

	  if (month.length < 2) 
	  	month = '0' + month;
	  if (day.length < 2) 
		day = '0' + day;
		
	  return [year, month, day].join('-');
  }
  
  //input: string in YYYY-MM-DD format, returns date object
  //note: month-1 because date objects use Jan as month 0
  parseDate(d=this.state.date) {
	  let arr = d.split('-')
	  return new Date(parseInt(arr[0], 10), parseInt(arr[1], 10)-1, parseInt(arr[2], 10))
  }
  
  //today's string in YYYY-MM-DD format
  getTodayDate() {
	  //return '2021-01-22'
	  return this.formatDate(new Date(firebase.firestore.Timestamp.now().toDate()))
  }
  
  //get the current time
  getTimeNow() {
	  return new Date(firebase.firestore.Timestamp.now().toDate()).getTime()
	  //return new Date(2021, 0, 22, 9, 30, 1).getTime()
  }
  
  //get date, optionally incremented by given days
  getDate(increment=0) {
	  let d = this.parseDate()
	  d.setDate(d.getDate() + increment)
	  return this.formatDate(d)
  }
  
  //get time where all bets must be in (earliest game of current date)
  //input: string in YYYY-MM-DD format, returns date object with time
  getCutoffTime() {
	  
	  let earliestDate = new Date("9999/12/31") //date far into future as placeholder
	  
	  for (let i = 0; i < this.state.schedule.length; i++) {
		  let thisDate = this.state.schedule[i].gameDate
		  
		  try {
			  let tempDate = new Date(thisDate)
			  if (tempDate < earliestDate) {
				  earliestDate = tempDate
			  }
		  } catch(err) { //not scheduled yet
			  console.log(err)
			  return new Date(0)
		  }
	  }
	  return earliestDate
  }
  
  //get time in 12h format, returns "hh:mm xM", where x is A or P
  getGameStartTime(rawDateStr) {
	  let dateObj = new Date(rawDateStr)
	  let hrs = dateObj.getHours()
	  let ampm = hrs / 12
	  let mins = dateObj.getMinutes()
	  
	  if (mins == 0)
		  mins = '00'
	  
	  if (ampm == 0) //midnight
		  return '12:' + mins + ' AM'
	  else if (ampm == 1) //noon
		  return '12:' + mins + ' PM'
	  else if (ampm > 0 && ampm < 1) //am
		  return hrs + ':' + mins + ' AM'	  
	  else  //pm
		  return (hrs-12) + ':' + mins + ' PM'
  }
  
  //fetches schedule based on given date
  updateSchedule(date, warn=true, inc=0) {
	  if (this.state.schedule.length !== 0 && warn && this.isEnabled() && !window.confirm("Changing dates will cause any unsubmitted bets to be reset. Press OK to confirm.")) {
		return
	  }
	  this.incrementDate(inc)
	  fetch('https://statsapi.web.nhl.com/api/v1/schedule/?date='+date)
	  .then(res => res.json())
	  .then(
		(data) => {
			this.clearAllBets()
			
			if (data.totalGames > 0) { //if there are games
				this.setState({
					schedule: data.dates[0].games
				});
			} else {
				this.setState({
					schedule: []
				});
			}
		}
	  )
  }

  //gets called automatically when component is mounted
  componentDidMount() {
	
	/*uses current date - needs try catch block because if no games present, will return undefined*/

	this.updateSchedule(this.state.date, false)
    
  }
  
  //run checks and save bets
  processBets() {
	  
	  //check if it is not too late
	  if (!this.isEnabled) {
		  alert("You have missed the cutoff time for bets today.")
		  return
	  }
	  
	  let table = document.getElementById("schedule")
	  let bets = []
	  
	  for (var i = 1, row; row = table.rows[i]; i++) { //start at 1 to skip header row
		   
		   let awayTeam = row.cells[1].firstChild.firstChild
		   let homeTeam = row.cells[3].firstChild.firstChild
		   let betValue = row.cells[4].firstChild.value

		   //check for valid number
		   if (isNaN(betValue)) {
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
	  
	  //check if user bet a valid number of points
	  if (!this.verifyBetValues(bets)) {
		  return
	  }
	  
	  //read bets back to user and ask to confirm
	  if (this.confirmBets(bets)) {
		this.writeToDB(bets)
		this.clearAllBets()
		this.setUserBets() //update state so new bets are disabled
		alert("Bets successfully submitted. Good luck!")
	  }
  }
  
  //check if user bets have valid amounts
  verifyBetValues(bets) {
	  
	  let totalPtsBet = 0
	  for (var i = 0; i < bets.length; i++) {
		  if (bets[i].amount <= 0) {
			  alert("You cannot have a bet of 0 or less. Please correct and try again.")
			  return false
		  }
		  totalPtsBet += parseInt(bets[i].amount, 10)
	  }
	  
	  if (totalPtsBet == this.state.userPts) {
		  if (!window.confirm("You are betting all your points. Are you sure?")) {
			  return false
		  }
	  } else if (totalPtsBet > this.state.userPts) {
		  alert("You are trying to bet a total of "+totalPtsBet+" points, but you only have "+this.state.userPts+". Please correct and try again.")
		  return false
	  }
	  
	  return true
  }
  
  //write to firebase db
  writeToDB(bets) {
	  
	  let db = firebase.database()
	  let date = this.getDate()
	  let uid = this.state.userID
	  
	  
	  
	  //add user id to bet and save
	  for (var i = 0; i < bets.length; i++) {
		  
		  //use gameID as key and leave the rest for the bet properties
		  //let {gameID, ...thisBet} = bets[i]
		  
		  let betObj = {
			  userID : uid,
			  gameID : bets[i].gameID,
			  team : bets[i].team,
			  amount : parseInt(bets[i].amount)
		  }
		  
		  let currBets = db.ref('bets/'+date)
		  let newBet = currBets.push()
		  newBet.set(betObj)
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
		  str += bets[i].amount + ' on ' + bets[i].team + ';\n'
	  }
	  return str
  }
  
  //clears row of given game ID
  clearBet(gameID, clearAll=false) {
	  let table = document.getElementById("schedule")
	  
	  for (var i = 1, row; row = table.rows[i]; i++) { //start at 1 to skip header row
		   
		   let thisGameID = row.cells[1].firstChild.firstChild.name
		   if (thisGameID == gameID || clearAll) {
			   
			   //clear away team
			   row.cells[1].firstChild.firstChild.checked = false
			   //clear home team
			   row.cells[3].firstChild.firstChild.checked = false
			   //clear bet value
			   row.cells[4].firstChild.value = ""
		   } 
	  }
  }
  
  //clears all rows
  clearAllBets() {
	  this.clearBet(0, true)
  }

  //returns true if element should be enabled, false otherwise
  isEnabled(game=null) {

	  //check if bets already made
	  if (this.state.userBets.length > 0)
	  	return false

	  let enableDate = (this.getDate()==this.getTodayDate() && this.getTimeNow() < this.getCutoffTime().getTime())
	  
	  if (game)
		return enableDate && game.status.detailedState=='Scheduled'
	  else
		return enableDate
  }

  render() {
    return (
      <div>
		{this.state.userFirstName && (
		  <h2>Welcome, {this.state.userFirstName}</h2>
		)}
		{this.state.userBets.length > 0 && (
		  <div>
		    <p>You have already made your bets for today ({this.getTodayDate()}).</p>
		    <p>{this.betsToString(this.state.userBets)}</p>
		  </div>
		)}
		<hr />
        <h2>Schedule</h2>
		<button onClick={() => {this.updateSchedule(this.getDate(-1), true, -1)}}>{this.getDate(-1)}</button>
		<p id="currDate">{this.getDate()}</p>
		<button onClick={() => {this.updateSchedule(this.getDate(1), true, 1)}}>{this.getDate(1)}</button>
		
		{this.state.schedule.length > 0 && this.getDate()==this.getTodayDate() && (
			<p>Cutoff time: {this.getGameStartTime(this.getCutoffTime().toString())}</p>
		)}
		
		<table id="schedule">
		
		{this.state.schedule.length > 0 && (
			<tr><th>Time</th><th>Away</th><th></th><th>Home</th><th>Bet Amount</th></tr>
		)}
		
		{this.state.schedule.length == 0 && (
			<p>No games scheduled for this day</p>
		)}
		
		{this.state.schedule.map(game => 
		  <tr>
		  
			<th>
			{(game.status.detailedState=='Scheduled' || game.status.detailedState=='Pre-Game') && (
				<p>{this.getGameStartTime(game.gameDate)}</p>
			)}
			
			{(game.status.detailedState=='Final' || game.status.detailedState=='Game Over') && (
				<p>Final</p>
			)}
			
			{game.status.detailedState.includes('In Progress') && (
				<p>LIVE</p>
			)}
			
			{game.status.detailedState=='Postponed' && (
				<p>PPD</p>
			)}
			</th>
		  
			<th>
			  <label>
			    <input 	type="radio"  class="rad"
						disabled={!this.isEnabled(game)}
						id={game.teams.away.team.id}
						name={game.gamePk}
						value={game.teams.away.team.name}>
						
			    </input>
				<div class="teamimg" onClick={() => { if (this.isEnabled()) document.getElementById(game.teams.away.team.id).checked=true} }>
					<img height="100" width="100" src={this.IMG_SRC+game.teams.away.team.id+this.TEXTART_SUFFIX}/>
					<img height="100" width="100" src={this.IMG_SRC+game.teams.away.team.id+this.LOGO_SUFFIX}/>
				</div>
			  </label>
			</th>
			
			<th class="score">
			  {(game.status.detailedState.includes('In Progress') || game.status.detailedState=='Final' || game.status.detailedState=='Game Over') && (
				  <p>{game.teams.away.score} - {game.teams.home.score}</p>
			  )}
			</th>
			
			<th>
			  <label>
			    <input 	type="radio"  class="rad"
						disabled={!this.isEnabled(game)}
						id={game.teams.home.team.id}
						name={game.gamePk}
						value={game.teams.home.team.name}>
			    </input>
				<div class="teamimg" onClick={() => { if (this.isEnabled()) document.getElementById(game.teams.home.team.id).checked = true} }>
					<img height="100" width="100" src={this.IMG_SRC+game.teams.home.team.id+this.LOGO_SUFFIX}/>
					<img height="100" width="100" src={this.IMG_SRC+game.teams.home.team.id+this.TEXTART_SUFFIX}/>
				</div>
			  </label>
			</th>
			
			<th><input		type="text" class="betbox"
							maxlength="6"
							disabled={!this.isEnabled(game)}
							size="5"
							id={game.gamePk}
							name={game.gamePk}>
			</input></th>
			<th><button onClick={() => { this.clearBet(game.gamePk)}}
				disabled={!this.isEnabled(game)}>
				Clear</button>
			</th>
		  </tr>
		)}
		</table>
		
		{this.isEnabled() && (
			<p>You have a maximum of {this.state.userPts} points to bet.</p>
		)}
	
		<button onClick={() => { this.processBets()} }
				disabled={!this.isEnabled()}>
				Submit</button>
		<button onClick={() => { this.clearAllBets()} }
				disabled={!this.isEnabled()}>
				Clear All</button>
      </div>
    );
  }
}

export default Schedule;