import React, { Component } from 'react';
import './history.css';

// Firebase App (the core Firebase SDK) is always required and
// must be listed before other Firebase SDKs
import firebase from "firebase/app";

// Add the Firebase services that you want to use
import "firebase/database";
import "firebase/firestore";

class History extends Component {
  constructor() {
    super();
    this.state = {
		users: [],
		bets: []
    };
  }
  
  //gets called automatically when component is mounted
  componentDidMount() {
	this.getDBInfo()
  }

  async getDBInfo() {
	let u = await this.getUserInfo()
	let b = await this.getGameBets()
	console.log(u)
	console.log(b)
	this.setState({
		users: u,
		bets: b
	})
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

  //get info of users before adjustments
  async getUserInfo() {
	
	const response = await firebase.database().ref('/users/').once('value')
		.then((snapshot) => {
			return snapshot.val()
		});
	return response
  }

  //get the bets on the games from the previous day
  async getGameBets() {
	
	let yesterdayDate = new Date()
	yesterdayDate.setDate(yesterdayDate.getDate() - 1)
	
	const response = await firebase.database().ref('/bets/' + this.formatDate(yesterdayDate)).once('value')
		.then((snapshot) => {
			return snapshot.val()
		});
	return response
  }

  async getAllBets() {
	const response = await firebase.database().ref('/bets/').once('value')
		.then((snapshot) => {
			return snapshot.val()
		});
	return response
  }
  
  //today's string in YYYY-MM-DD format
  getTodayDate() {
	//return '2021-01-22'
	return this.formatDate(new Date(firebase.firestore.Timestamp.now().toDate()))
  }

  async exportBets() {
	let bets = await this.getAllBets()
	let today = this.getTodayDate()

	//define the heading for each row of the data  
	let csvString = 'Date,Name,Team,Amount\n'
	for (let date in bets) {
		if (date == today) {
			continue
		}
		for (let betID in bets[date]) {
			let usrname = this.state.users[bets[date][betID]['userID']]['firstname'] + ' ' + this.state.users[bets[date][betID]['userID']]['lastname']
			csvString += date+','+usrname+','+bets[date][betID]['team']+','+bets[date][betID]['amount']+'\n'
		}
	}
	
	var hiddenElement = document.createElement('a');  
	hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csvString);  
	hiddenElement.target = '_blank';  
		
	//provide the name for the CSV file to be downloaded  
	hiddenElement.download = 'bet_history.csv';  
	hiddenElement.click();  
  }

  render() {
    return (	  
	  	  
		<div>
		<hr />
		<h2>Yesterday's Bets</h2>

		{this.state.bets && (
			<div>
				<table id="results">
				
					<tr><th>Name</th><th>Team</th><th>Bet</th></tr>
				
					{Object.values(this.state.bets).map(bet => 
					<tr>
					
						<th>
						<p>{this.state.users[bet.userID]['firstname']} {this.state.users[bet.userID]['lastname']}</p>
						</th>
					
						<th>
						<p>{bet.team}</p>
						</th>
						
						<th>
						<p>{bet.amount}</p>
						</th>
						
					</tr>
					)}
				</table>
			</div>
		)}
		{!this.state.bets && (
			<div>
				<p>No bets made yesterday.</p>
			</div>
		)}
		<button id="dl_results" onClick={() => { this.exportBets()}}>Download Full Bet History</button>
		</div>
	  )
    }
}

export default History;