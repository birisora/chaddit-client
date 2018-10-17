import React, { Component } from 'react';
import { connect } from 'react-redux';

// import username component
import UsernameForm from './components/UsernameForm';
// import ChatScreen
import ChatScreen from './components/ChatScreen';

class App extends Component {
  constructor() {
    super();
    this.state = {
      currentUsername: this.getUsernameScreen().username || '',
      currentScreen: this.getUsernameScreen().currentScreen || ''
    }
  }

  // this uses the inbuild React localstorage to help store state values for use
  setUsernameScreen(un, sn) {
    localStorage.setItem('currentUsername', un);
    localStorage.setItem('currentScreen', sn)
  }

  getUsernameScreen() {
    const un = localStorage.getItem('currentUsername');
    const sn = localStorage.getItem('currentScreen');
    return { un, sn };
  }

  onUsernameSubmitted(username) {
    const port = 'https://chaddit-server.herokuapp.com' || 'http://localhost:3001';
    fetch(`${port}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username })
    })
      .then(response => {
        this.setState({
          currentUsername: username,
          currentScreen: 'ChatScreen'
        })
        this.setUsernameScreen(username, 'ChatScreen');
      })
      .catch(error => console.error('error', error));
  }

  // logout removes what was stored in localstorage, then reloads page
  onLogout() {
    this.props.dispatch({type: 'USER_LOGOUT'});
    localStorage.removeItem('currentUsername');
    localStorage.removeItem('currentScreen');
    window.location.reload();
  }

  render() {
    // we conditionally render screen based on this.state.currentScreen
    if (this.state.currentScreen === '') {

      // render UsernameForm and hook up onUsernameSubmitted event handler
      // When this is called, we send POST request to /users route defined
      return <UsernameForm onSubmit={this.onUsernameSubmitted.bind(this)} />
    }
    if (this.state.currentScreen === 'ChatScreen') {
      return <ChatScreen 
        currentUsername={this.state.currentUsername}
        onLogout={this.onLogout.bind(this)}
      />
    }
  }
}

const mapStateToProps = state => ({
  currentUsername: state.currentUsername,
  currentScreen: state.currentScreen
});

// export default App
export default connect(mapStateToProps)(App);