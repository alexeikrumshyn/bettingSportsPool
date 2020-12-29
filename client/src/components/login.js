import React, { Component } from 'react';
import './login.css';

// Firebase App (the core Firebase SDK) is always required and
// must be listed before other Firebase SDKs
import firebase from "firebase/app";

// Add the Firebase services that you want to use
import "firebase/auth";
import "firebase/database";

//starting points
var startPts = 50

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loggedIn: false
    };
	this.showMainScreen = this.showMainScreen.bind(this)
  }
  
  //called when user successfully logs in
  showMainScreen() {
	  const { loggedIn } = this.state
	  this.setState({
		  loggedIn: !loggedIn
	  });
  }

  //gets called automatically when component is mounted
  componentDidMount() {
	  
	  const firebaseConfig = {
		  apiKey: "AIzaSyDXl2MWhFegAK0iiPTy6c0_mTfPH0XsbZE",
		  authDomain: "sports-betting-pool.firebaseapp.com",
		  projectId: "sports-betting-pool",
		  storageBucket: "sports-betting-pool.appspot.com",
		  messagingSenderId: "12001411941",
		  appId: "1:12001411941:web:f2afbc892b4ebc2e53978c",
		  measurementId: "G-2RLDV4JK57"
	  };
	  
	  // Initialize Firebase
	  firebase.initializeApp(firebaseConfig);
	  	  
  }
  
  //sign in existing user
  signInUser() {
	  let email = document.getElementById("user").value
	  let password = document.getElementById("pw").value
	  
	  firebase.auth().signInWithEmailAndPassword(email, password)
	  .then((user) => {
		this.clearFields()
		this.showMainScreen()
	  })
	  .catch((error) => {
		var errorCode = error.code;
		var errorMessage = error.message;
		alert("Error: "+errorMessage+" ("+errorCode+")")
	  });
  }
  
  //create a new user
  createUser() {
	  let email = document.getElementById("newuser").value
	  let password = document.getElementById("newpw").value
	  let confirm_password = document.getElementById("newpw2").value
	  
	  //check if passwords match
	  if (password !== confirm_password) {
		  alert("Passwords do not match, please try again.")
		  return
	  }
	  
	   firebase.auth().createUserWithEmailAndPassword(email, password)
	  .then((user) => {
		this.clearFields()
		this.writeToDB(user)
		alert('Account successfully created. You can now login.')
	  })
	  .catch((error) => {
		var errorCode = error.code;
		var errorMessage = error.message;
		alert("Error: "+errorMessage+" ("+errorCode+")")
	  });
  }
  
  //writes user info to db
  writeToDB(user) {
	  let firstname = document.getElementById("firstname").value
	  let lastname = document.getElementById("lastname").value
	  	  
	  var newUser = {
		  firstname: firstname,
		  lastname: lastname,
		  email: user.user.email,
		  points: startPts
	  }
	  
	  var updates = {}
	  updates[user.user.uid] = newUser
	  
	  return firebase.database().ref().child('users').update(updates);
	  
  }
  
  //clear fields
  clearFields() {
	  document.getElementById("user").value = ''
	  document.getElementById("pw").value = ''
	  document.getElementById("newuser").value = ''
	  document.getElementById("newpw").value = ''
	  document.getElementById("newpw2").value = ''
  }

  //{children} calls the next component after login success
  render() {
	  
	var { title, children } = this.props
	const { loggedIn } = this.state
	  
    if (loggedIn){
	    title = "Logged In"
    } //else for toggle back if needed later
	  
    return (
	<body>
	
	  <script src="/__/firebase/8.2.1/firebase-app.js"></script>
	  <script src="/__/firebase/8.2.1/firebase-analytics.js"></script>
	  <script src="/__/firebase/8.2.1/firebase-auth.js"></script>
	  <script src="/__/firebase/8.2.1/firebase-firestore.js"></script>
	  <script src="/__/firebase/init.js"></script>
	  
	  {!loggedIn && (
		  <div>
			  <h1>Sign in</h1>
			  <p>Email: <input type='text' id='user'></input></p>
			  <p>Password: <input type='password' id='pw'></input></p>
			  
			  <button onClick={() => { this.signInUser()} }>Sign In</button>
			  <button onClick={() => { alert("Contact Alexei to reset password (alexei.w.k@gmail.com).")} }>Forgot Password?</button>
			  
			  <hr />
			  
			  <h2>Don't have an account? Create one below.</h2>
			  <p>First Name: <input type='text' id='firstname'></input></p>
			  <p>Last Name: <input type='text' id='lastname'></input></p>
			  <p>Email: <input type='text' id='newuser'></input></p>
			  <p>Password: <input type='password' id='newpw'></input></p>
			  <p>Confirm Password: <input type='password' id='newpw2'></input></p>
			  <button onClick={() => { this.createUser()} }>Create Account</button>
		  </div>
	  )}
	  
	  {loggedIn && (
		<div>
		  {children}
		</div>
		  
	  )}
	</body>
    );
  }
}

export default Login;
