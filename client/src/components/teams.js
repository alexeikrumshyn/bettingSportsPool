import React, { Component } from 'react';
import './teams.css';

class Teams extends Component {
  constructor() {
    super();
    this.state = {
      teams: []
    };
  }

  //gets called automatically when component is mounted
  componentDidMount() {
    fetch('https://statsapi.web.nhl.com/api/v1/teams')
	  .then(res => res.json())
	  .then(
		(data) => {
			this.setState({
				teams: data.teams
			});
		}
	  )
  }

  render() {
    return (
      <div>
        <h2>Teams</h2>
		<ul>
		{this.state.teams.map(team => 
		  <li key={team.id}>{team.name}</li>
		)}
		</ul>
      </div>
    );
  }
}

export default Teams;
