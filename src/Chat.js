import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { useParams } from 'react-router-dom';
import './Chat.css';
import ChatUsers from './ChatUsers';
import ChatroomList2 from './ChatroomList2';

const socket = io('http://localhost:3001');

function Chat() {
  const { chatroom: chatroomParam, username } = useParams();
  const userId = 123; // 예시로 userId를 정의
  const [currentChat, setCurrentChat] = useState(chatroomParam || 'general');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [userJoinedMessage, setUserJoinedMessage] = useState('');

  useEffect(() => {
    console.log('URL params:', { chatroom: chatroomParam, username });

    if (chatroomParam && username) {
      console.log(`User ${username} has joined chatroom ${chatroomParam}`);
      socket.emit('joinRoom', { roomId: chatroomParam, username });
    }

    if (currentChat && username) {
      socket.emit('joinRoom', { roomId: currentChat, username });

      socket.on('initialMessages', (initialMessages) => {
        setMessages(initialMessages);
      });

      socket.on('Chat', (msg) => {
        setMessages((prevMessages) => [...prevMessages, msg]);
      });

      socket.on('userJoined', (msg) => {
        setUserJoinedMessage(`${msg.username}님이 채팅방에 입장했습니다.`);
        const joinMessage = {
          username: 'System',
          message: `${msg.username}님이 채팅방에 입장했습니다.`,
          timestamp: new Date()
        };
        setMessages((prevMessages) => [...prevMessages, joinMessage]);
      });

      return () => {
        socket.off('initialMessages');
        socket.off('Chat');
        socket.off('userJoined');
      };
    }
  }, [chatroomParam, username, currentChat]);

  const sendMessage = () => {
    if (message.trim() && username) {
      socket.emit('Chat', { username, message, chatroom: currentChat });
      setMessage('');
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="chat-and-users-container">
      <ChatroomList2 username={username} />
      <ChatUsers chatroomId={chatroomParam} />
      <div className="chat-container">
        <h1>Chat</h1>
        <hr />
        {userJoinedMessage && <div className="user-joined">{userJoinedMessage}</div>}
        <div className="messages-container">
          {messages.map((msg, index) => (
            <div className={`message ${msg.username === username ? 'sent-message' : 'received-message'}`} key={index}>
              <div className="message-bubble">
                <span className="username">{msg.username}:</span> {msg.message}
              </div>
              <span className="timestamp">({new Date(msg.timestamp).getHours()}:{new Date(msg.timestamp).getMinutes()})</span>
            </div>
          ))}
        </div>
        <div className="message-input-container">
          <input type="text" className="message-input" value={message} onChange={(e) => setMessage(e.target.value)} onKeyPress={handleKeyPress} />
          <button onClick={sendMessage} className="send-button">전송</button>
        </div>
      </div>
    </div>
  ); 
}

export default Chat;