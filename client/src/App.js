import React, { Component } from 'react';
//import logo from './logo.svg';
import './App.css';
//import Teams from './components/teams';
import Schedule from './components/schedule';
import Login from './components/login';

//Main screen js code
class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Hockey Betting Pool</h1>
        </header>
		<Login />
      </div>
    );
  }
}

export default App;
//<img src={logo} className="App-logo" alt="logo" />