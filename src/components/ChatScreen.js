// once username submitted, we want to transition to chat screen

import React, { Component } from 'react';
// import chatkit
import Chatkit from '@pusher/chatkit';

import MessageList from './MessageList';
import SendMessageForm from './SendMessageForm';
import TypingIndicator from './TypingIndicator';
import WhosOnlineList from './WhosOnlineList';
import RoomList from './RoomList';
// import CreateRoom from './CreateRoom';

// import css
import './ChatScreen.css'

class ChatScreen extends Component {
  constructor(props) {
    super(props);
    this.state={
      currentUser: {},
      currentRoom: {},
      messages: [],
      rooms: [],
      roomName: '',
      roomPrivacy: false,
      usersWhoAreTyping: []
    }
    const port = 'https://chaddit-server.herokuapp.com' || 'http://localhost:3001';
    // note to self, to store instance locator and key in safe spot
    // also a config file for url
    // instantiate chatkit chatmanager with given fields
    // with token provder pointing to /authenticate route defined earlier
    this.chatManager = new Chatkit.ChatManager({
      instanceLocator: 'v1:us1:5dff3a4f-a6e4-4036-b974-d09e53dc0568',
      userId: this.props.currentUsername,
      connectionTimeout: 20000,
      tokenProvider: new Chatkit.TokenProvider({
        url: `${port}/authenticate`
      }),
      // leaving this here to debug chatkit in case errors
      // logger: {
      //   verbose: console.log,
      //   debug: console.log,
      //   info: console.log,
      //   warn: console.log,
      //   error: console.log,
      // }
    })

  }

  sendTypingEvent() {
    this.state.currentUser
      .isTypingIn({ roomId: this.state.currentRoom.id })
      .catch(error => console.error('error', error));
    console.log('Someone is typing');
  }

  // when SendMessage form is submitted, we call this
  sendMessage(text) {
    this.state.currentUser.sendMessage({
      text,
      roomId: this.state.currentRoom.id
    })
  }

  // let's users logout
  onLogout(e) {
    e.preventDefault();
    this.props.onLogout();
  }

  // entering a different room
  // https://docs.pusher.com/chatkit/reference/javascript#create-a-room
  createRoom(roomName, isPrivate=false, isUnique=false) {
    this.state.currentUser
      .createRoom({
        name: roomName,
        private: isPrivate
      }).then(room => {
        // if isUnique = true in this case
        if (!isUnique) {
          this.setState({ roomName: '' });
          this.setState({ rooms: [...this.state.rooms, room ]});
          console.log('createRoom rooms:', this.state.rooms);
        } else {
          return room.id;
        }
      })
      .catch(err => {
        console.log('Error: ', err);
      })
  }

  // keeps track of user input for create room name
  onChangeRoomText(e) {
    this.setState({ roomName: e.target.value })
  }

  // if 'Enter' key is pressed we create a new room
  onEnterRoom(e) {
    if (e.keyCode === 13) {
      e.preventDefault();
      console.log('current room name:', this.state.roomName);
      this.createRoom(this.state.roomName, this.state.roomPrivacy);
    }
  }

  //changing rooms
  onRoomChange(roomId) {
    const currRoom = this.state.rooms.filter((room) => { return room.id === roomId });
    this.setState({ currentMemberId: ''});
    this.setState({ currentRoomId: roomId });
    this.setState({ currentRoom: currRoom[0] });
    this.setState({ messages: [] });

    this.chatManager
      .connect()
      .then(currentUser => {
        this.setState({ currentUser })
        this.setState({ channels: currentUser.rooms });
        return currentUser.fetchMessages({
          roomId: roomId
        })
          .then(messages => {
            this.setState({ messages: messages });
          })
          .catch(err => {
            console.log('Error: ', err);
          })
      })
      .catch(err => {
        console.log('Error: ', err);
      })

      // Note! copy and pasting is bad!
      return this.state.currentUser.subscribeToRoom({
        roomId: roomId,
        messageLimit: 100,
        hooks: {
          onNewMessage: message => {
            console.log(`${message} sent`);
            this.setState({
              messages: [...this.state.messages, message],
            })
          },
          onUserStartedTyping: user => {
            console.log(`User ${user.name} started typing`);
            this.setState({
              usersWhoAreTyping: [...this.state.usersWhoAreTyping, user.name],
            })
          },
          onUserStoppedTyping: user => {
            console.log(`User ${user.name} stopped typing`);
            this.setState({
              usersWhoAreTyping: this.state.usersWhoAreTyping.filter(
                username => username !== user.name
              ),
            })
          },
          onUserCameOnline: () => this.forceUpdate(),
          onUserWentOffline: () => this.forceUpdate(),
          onUserJoined: () => this.forceUpdate()
          }
      })
  }

  // // add scroll to bottom of chatmessage later
  // // https://stackoverflow.com/questions/37620694/how-to-scroll-to-bottom-in-react
  // scrollToBottom() {
  //   this.messagesEnd.scrollIntoView({ behavior: "smooth" });
  // }

  componentDidMount () {
    // const port = 'https://chaddit-server.herokuapp.com' || 'http://localhost:3001';
    // note to self, to store instance locator and key in safe spot
    // also a config file for url
    // instantiate chatkit chatmanager with given fields
    // with token provder pointing to /authenticate route defined earlier
    

    // once initialized, call connect which happens async and a Promise returned
    // get a current user obj that represents current connected user
    this.chatManager
      .connect()
      .then(currentUser => {
        this.setState({ currentUser });    
        //let's grab all joinable rooms for user
        currentUser.getJoinableRooms()
          .then(rooms => {
            // combines all of the rooms into one array without mutating
            const roomsArray = [...this.state.rooms, ...rooms, ...currentUser.rooms];
            this.setState({rooms: roomsArray});
          })
          .catch(err => {
            console.log('Error getJoinableRooms():', err);
          })
        // call subscribeToRoom on curr user, takes event handler onNewMessage
        // called in real tiem each time new message arrives
        // call forceUpdate which tells React to evaluate currentRoom.users and update the UI
        return currentUser.subscribeToRoom({
          roomId: 18192681,
          messageLimit: 100,
          hooks: {
            onNewMessage: message => {
              console.log(`${message} sent`);
              this.setState({
                messages: [...this.state.messages, message],
              })
            },
            onUserStartedTyping: user => {
              console.log(`User ${user.name} started typing`);
              this.setState({
                usersWhoAreTyping: [...this.state.usersWhoAreTyping, user.name],
              })
            },
            onUserStoppedTyping: user => {
              console.log(`User ${user.name} stopped typing`);
              this.setState({
                usersWhoAreTyping: this.state.usersWhoAreTyping.filter(
                  username => username !== user.name
                ),
              })
            },
            onUserCameOnline: () => this.forceUpdate(),
            onUserWentOffline: () => this.forceUpdate(),
            onUserJoined: () => this.forceUpdate()
          }
        })
      })
      .then(currentRoom => {
        this.setState({ currentRoom })
      })
      .catch(error => console.error('error', error));
  }

  render() {
    return (
      <div className="container">
        <div className="chatContainer">
          <aside className="onlineListContainer">
            <div>
              <h3 className="welcomeContainer">Welcome {this.state.currentUser.name}
                <a className="logoutContainer" onClick={this.onLogout.bind(this)}>Log out</a>
              </h3>
            </div>
            <WhosOnlineList 
              currentUser={this.state.currentUser}
              users={this.state.currentRoom.users}
            />
            {/*<CreateRoom
              value={this.state.roomName}
              onChange={this.onChangeRoomText.bind(this)}
              onKeyDown={this.onEnterRoom.bind(this)}
            />*/}
            { // display rooms if we have rooms
              this.state.rooms.length > 0
              ? <RoomList
                  rooms={this.state.rooms}
                  currentRoomId={this.state.currentRoomId}
                  onRoomChange={this.onRoomChange.bind(this)}
                />
              : ''
            }
            <div>
              <form>
                <input 
                  type="text"
                  placeholder="Create a Room"
                  onChange={this.onChangeRoomText.bind(this)}
                  onKeyDown={this.onEnterRoom.bind(this)}
                  defaultValue={this.state.roomName}
                />
              </form>
            </div>
          </aside>
          <section className="chatListContainer">
            <div className="chatListHeader">
              <h3 className="headerTitle">Room: {this.state.currentRoom.name}</h3>
            </div>
            <MessageList
              messages={this.state.messages}
            />
            <TypingIndicator usersWhoAreTyping={this.state.usersWhoAreTyping} />
            <SendMessageForm
              onSubmit={this.sendMessage.bind(this)}
              onChange={this.sendTypingEvent.bind(this)}
            />
          </section>
        </div>
      </div>
    )
  }
}

export default ChatScreen;
