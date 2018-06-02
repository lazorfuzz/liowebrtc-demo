import React, { Component } from 'react';
import LioWebRTC from 'liowebrtc';
import Modal from 'react-responsive-modal';
import './App.css';

class App extends Component {
  constructor() {
    super();
    this.state = {
      room: 'liowebrtc-chat-demo',
      nick: `Anon${Math.floor(Math.random() * 99999)}`,
      message: '',
      chatLog: [],
      peerCount: 1,
      scrollHeight: null,
      changingNick: false,
      typing: false,
      typers: [],
      typingEllipsis: '...'
    };
  }

  componentDidMount() {
    this.webrtc = new LioWebRTC({
      debug: true,
      dataOnly: true,
      url: 'https://sandbox.simplewebrtc.com:443/',
      nick: this.state.nick
    });

    this.textBox.focus();
    this.createIntervals();

    this.webrtc.on('readyToCall', () => this.webrtc.joinRoom(this.state.room));
    this.webrtc.on('createdPeer', this.handlePeerCreated);
    this.webrtc.on('iceConnectionStateChange', this.handleUpdateCount);
    this.webrtc.on('receivedPeerData', this.handleDataReceived);
    this.webrtc.on('peerStreamRemoved', this.handlePeerStreamRemoved);
  }

  handlePeerStreamRemoved = (peer) => {
    this.removeTyper(peer.nick);
  }

  handleUpdateCount = () => {
    const newCount = this.webrtc.getPeers().length + 1;
    if (this.state.peerCount > newCount) {
      this.appendChat({
        notification: true,
        payload: `A peer left the room!`
      });
    }
    this.setState({
      peerCount: newCount
    });
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
        this.appendChat(data);
        this.removeTyper(peer.nick);
        break;
      case 'changeNick':
        const oldNick = peer.nick;
        peer.nick = data;
        this.appendChat({
          notification: true,
          payload: `${oldNick} changed their nickname to ${data}`
        });
        this.setState({ typers: this.state.typers.filter((t) => t !== oldNick) });
        break;
      case 'typingChange':
        if (data.typing && !this.state.typers.includes(peer.nick)) {
          this.setState({ typers: [...this.state.typers, peer.nick] });
        } else if (!data.typing) {
          this.removeTyper(peer.nick);
        }
        break;
      default:
        break;
    }
  }

  handleInput = (evt) => {
    if (this.state.message.length === 0) {
      this.setState({ typing: true, message: evt.target.value });
      this.webrtc.shout('typingChange', { typing: true });
      return;
    }
    if (evt.target.value.length === 0) {
      this.setState({ typing: false });
      this.webrtc.shout('typingChange', { typing: false });
    }
    this.setState({ message: evt.target.value });
  }

  handleSend = () => {
    this.msgBox.scrollTop = this.msgBox.scrollHeight;
    if (this.state.message.length === 0) return;
    const chatObj = {
      username: this.state.nick,
      payload: this.state.message
    };
    this.webrtc.shout('chat', chatObj);
    this.setState({
      chatLog: [...this.state.chatLog, chatObj],
      message: '',
      typing: false
    });
  }

  handleNickChange = () => {
    if (!this.state.changingNick) {
      this.setState({ changingNick: true });
      return;
    }
    const nickMatches = this.webrtc.getPeers().filter((p) => p.nick === this.state.nick);
    if (nickMatches.length > 0) {
      return;
    }
    this.webrtc.shout('changeNick', this.state.nick);
    this.setState({ changingNick: false });
    this.appendChat({
      notification: true,
      payload: `You changed your nickname to ${this.state.nick}`
    });
  }

  appendChat = (chatObj) => {
    this.msgBox.scrollTop = this.msgBox.scrollHeight;
    this.setState({
      chatLog: [...this.state.chatLog, chatObj],
      scrollHeight: this.msgBox.scrollHeight
    });
  }

  createIntervals = () => {
    setInterval(() => {
      const sh = this.msgBox.scrollHeight;
      if (this.state.scrollHeight !== sh) {
        this.msgBox.scrollTop = this.msgBox.scrollHeight;
        this.setState({
          scrollHeight: this.msgBox.scrollHeight
        });
      }
    }, 50);

    setInterval(() => {
      if (this.state.typers.length >= 1) {
        this.setState({ typingEllipsis: this.state.typingEllipsis.length > 2 ? '..' : '...' });
      }
    }, 1000)
  }

  removeTyper = (nick) => {
    this.setState({ typers: this.state.typers.filter((t) => t !== nick) });
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
          <h1>P2P Chatroom Demo</h1>
          <p>To try this out, open this page in another tab, or send this page to a friend. Open dev tools to see the logging.
            To view the source code for this app, <a href="https://github.com/lazorfuzz/liowebrtc-demo" target="_blank" rel="noopener noreferrer">click here</a>. This app is powered by <a href="https://github.com/lazorfuzz/liowebrtc" target="_blank" rel="noopener noreferrer">LioWebRTC</a>.
            <br /><br />
            <a className="github-button" href="https://github.com/lazorfuzz/liowebrtc" data-icon="octicon-star" data-size="large" data-show-count="true" aria-label="Star lazorfuzz/liowebrtc on GitHub">Star LioWebRTC on GitHub</a></p>
        </div>
        <div className="msgBoxTop">
          <p
            className="changeNick"
            onClick={this.handleNickChange}
            >
              Change Nick
          </p>
          {
            this.state.typers.length > 0 &&
            <p
              className="peerCount"
              >
                {this.state.typers.length === 1 ? `${this.state.typers[0]}${this.state.typingEllipsis}` : `${this.state.typingEllipsis}`}
            </p>
          }
          <p className="peerCount">{this.state.peerCount} {this.state.peerCount > 1 ? 'people' : 'person'} in the room.</p>
        </div>
        <div
          className="messageBox"
          ref={(el) => this.msgBox = el}
          >
          {this.generateChats()}
        </div>
        <div className="controls">
          <input
            type="text"
            className="textBox"
            placeholder="Type a message..."
            ref={(t) => this.textBox = t}
            onChange={this.handleInput}
            value={this.state.message}
            onKeyUp={(e) => {
              if (e.key === 'Enter') {
                this.handleSend();
              }
            }}
          />
        </div>

        <Modal
          classNames={{ overlay: 'overlay', modal: 'modal' }}
          open={this.state.changingNick}
          onClose={() => this.setState({ changingNick: false })}
          center
          >
          <h3>Change Your Nickname</h3>
          <input
            type="text"
            className="nickBox"
            onChange={(evt) => {
              this.setState({ nick: evt.target.value });
            }}
            value={this.state.nick}
            onKeyUp={(e) => {
              if (e.key === 'Enter') {
                this.handleNickChange();
              }
            }}
          />
        </Modal>
      </div>
    );
  }
}

export default App;
