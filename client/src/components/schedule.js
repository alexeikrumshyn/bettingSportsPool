import React, { Component } from 'react';
import './schedule.css';

class Schedule extends Component {
  constructor() {
    super();
    this.state = {
      schedule: []
    };
  }
  
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

  //gets called automatically when component is mounted
  componentDidMount() {
	
	/*uses current date - needs try catch block because if no games present, will return undefined*/
	//var date = this.getCurrentDate()
	
	//use this day as today for now
	var date = '2019-05-03'
	
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
  
  processBets() {
	  let table = document.getElementById("schedule")
	  let bets = []
	  
	  for (var i = 1, row; row = table.rows[i]; i++) { //start at 1 to skip header row
		   
		   let awayTeam = row.cells[0].firstChild
		   let homeTeam = row.cells[1].firstChild
		   let betValue = row.cells[2].firstChild.value
		   
		   let thisBet = {}
		   
		   if (awayTeam.checked)
			   thisBet.team = awayTeam.value
		   else if (homeTeam.checked)
			   thisBet.team = homeTeam.value
		   else { //neither team selected
			   continue
		   }
		   
		   thisBet.amount = betValue
		   bets.push(thisBet)
			   
		   
		   /*
		   for (var j = 0, col; col = row.cells[j]; j++) {
			 
			 if (col.firstChild) {
				 //console.log(col.firstChild.id) //get ID
				 //console.log(col.firstChild.value) //get input text
				 //console.log(col.firstChild.checked) //get radio button value
				 
				 if (col.firstChild.checked)
					 thisBet[col.firstChild.value] = 
				 
			 }
		   } */
	  }
	  if (bets.length == 0)
		  alert("Please make at least one bet before submitting.")

	  console.log(bets)
  }

  render() {
    return (
      <div>
        <h2>Today's Schedule</h2>
		<table id="schedule">
		
		<tr><th>Away</th><th>Home</th><th></th></tr>
		
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
		  </tr>
		)}
		</table>
	
		<button onClick={() => { this.processBets()} }>Submit</button>
      </div>
    );
  }
}

export default Schedule;