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
	var date = '2019-05-02'
	
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
  
  ftn(id) {
	  let e = document.getElementById("schedule")
	  if (e.style.display === "none") {
		e.style.display = "block";
	  } else {
		e.style.display = "none";
	  }
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
						value={game.teams.away.team.name}
						onclick={this.ftn(game.teams.away.team.id)}>
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
      </div>
    );
  }
}

export default Schedule;
