import React, { Component } from 'react';
import LioWebRTC from 'liowebrtc';
import './App.css';

class App extends Component {
  constructor() {
    super();
    this.state = {
      room: 'liowebrtc-chat-demo',
      nick: `Anon${Math.floor(Math.random() * 99999)}`,
      message: '',
      chatLog: [],
      peerCount: 1
    };
  }

  componentDidMount() {
    this.webrtc = new LioWebRTC({
      debug: true,
      dataOnly: true,
      url: 'https://sandbox.simplewebrtc.com:443/',
      nick: this.state.nick,
    });

    this.textBox.focus();

    this.webrtc.on('readyToCall', () => {
      this.webrtc.joinRoom(this.state.room);
    });
    this.webrtc.on('createdPeer', this.handlePeerCreated);
    this.webrtc.on('iceConnectionStateChange', this.updateCount);
    this.webrtc.on('receivedPeerData', this.handleDataReceived);
  }

  updateCount = () => {
    const newCount = this.webrtc.getPeers().length + 1;
    if (this.state.peerCount > newCount) {
      this.appendChat({
        notification: true,
        payload: `A peer left the room!`
      });
    }
    this.setState({ peerCount: newCount });
  }

  handlePeerCreated = (peer) => {
    this.appendChat({
      notification: true,
      payload: `A peer joined the room!`
    });
  }

  handleDataReceived = (type, data, peer) => {
    switch (type) {
      case 'chat':
        this.setState({ chatLog: [...this.state.chatLog, data]});
      break;
      default:
      break;
    }
  }

  handleSend = () => {
    if (this.state.message.length === 0) return;
    const chatObj = {
      username: this.state.nick,
      payload: this.state.message
    };
    this.webrtc.shout('chat', chatObj);
    this.setState({
      chatLog: [...this.state.chatLog, chatObj],
      message: ''
    });
  }

  appendChat = (chatObj) => {
    this.setState({
      chatLog: [...this.state.chatLog, chatObj]
    });
  }

  generateChats = () => this.state.chatLog.map((chat, idx) => {
    return (
      <li
        key={`${idx}`}
        className="chatItem"
        >
        {
          chat.username &&
          <p><b className="chatUserName">{chat.username}: </b>{`${chat.payload}`}</p>
        }
        {
          chat.notification &&
          <p>{chat.payload}</p>
        }
      </li>
    );
  });

  render() {
    return (
      <div className="App">
        <div className="header">
          <h1>Demo Chat Room with LioWebRTC</h1>
          <p>Open the window in another tab, or send this link to a friend. Open dev tools to see the logging.
            To view the source code for this demo, <a href="https://github.com/lazorfuzz/liowebrtc-demo" target="_blank" rel="noopener noreferrer">click here</a>. This app is powered by <a href="https://github.com/lazorfuzz/liowebrtc" target="_blank" rel="noopener noreferrer">LioWebRTC</a>.</p>
          <p className="peerCount">There {this.state.peerCount > 1 ? 'are' : 'is'} {this.state.peerCount} {this.state.peerCount > 1 ? 'people' : 'person'} in the room.</p>
        </div>
        <div className="messageBox">
          {this.generateChats()}
          <li
            className="msgEnd"
            ref={(el) => this.msgEnd = el}
          />
        </div>
        <div className="controls">
          <input
            type="text"
            className="textBox"
            placeholder="Type a message..."
            ref={(t) => this.textBox = t}
            onChange={(evt) => {
              this.setState({ message: evt.target.value });
            }}
            value={this.state.message}
            onKeyUp={(e) => {
              if (e.key === 'Enter') {
                this.handleSend();
              }
            }}
          />
        </div>
      </div>
    );
  }
}

export default App;
