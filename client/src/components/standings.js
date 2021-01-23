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
  
  //compares two user objects by points
  compare(p1, p2) {
	  const p1Pts = parseInt(p1.points, 10)
	  const p2Pts = parseInt(p2.points, 10)
	  if (p1Pts > p2Pts)
		return -1
	  else if (p1Pts < p2Pts)
		return 1
	  else
		return 0
  }
  
  render() {
    return (
	  
	  this.state.users.length > 0 && (
	  
		<div>
		<hr />
		<h2>Standings</h2>
		<table id="standings">
		
			<tr><th>Pos</th><th>Name</th><th>Points</th></tr>
		
			{this.state.users.sort(this.compare).map((user, idx) => 
			  <tr>
			  
				<th>
				  <p>{idx+1}</p>
				</th>
			  
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