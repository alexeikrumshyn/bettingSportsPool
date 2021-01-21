import React, { Component } from 'react';
import './standings.css';

// Firebase App (the core Firebase SDK) is always required and
// must be listed before other Firebase SDKs
import firebase from "firebase/app";

// Add the Firebase services that you want to use
import "firebase/database";

class Standings extends Component {
  constructor() {
    super();
    this.state = {
		users : []
    };
  }
  
  //gets called automatically when component is mounted
  componentDidMount() {
	this.getUserInfo()
  }
  
  //pull user info from database and set state accordingly
  getUserInfo() {
	  firebase.database().ref('/users/').once('value')
		.then((snapshot) => {
			
			let dbUsers = snapshot.val()
			let usersArr = []
			
			for (const userID in dbUsers) {
				usersArr.push(dbUsers[userID])
			}
			
			this.setState({
					users: usersArr
			});
		});
  }
  
  render() {
    return (
	  
	  this.state.users.length > 0 && (
	  
		<div>
		<hr />
		<h2>Standings</h2>
		<table id="standings">
		
			<tr><th>Name</th><th>Points</th></tr>
		
			{this.state.users.map(user => 
			  <tr>
			  
				<th>
				  <p>{user.firstname} {user.lastname}</p>
				</th>
				
				<th>
				  <p>{user.points}</p>
				</th>
				
			  </tr>
			)}
		</table>
		</div>
	  )
      
    );
  }
}

export default Standings;