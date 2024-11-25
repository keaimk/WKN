import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ChatroomList.css';

const ChatroomList = () => {
  const [chatrooms, setChatrooms] = useState([]);
  const [username, setUsername] = useState('');
  const email = sessionStorage.getItem('email');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChatrooms = async () => {
      try {
        const response = await axios.get('http://localhost:3001/chatrooms');
        setChatrooms(response.data);
      } catch (error) {
        console.error('Error fetching chatrooms:', error);
      }
    };

    const fetchUsername = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/userdata?email=${email}`);
        if (response.status === 200) {
          setUsername(response.data.username);
        } else {
          console.error('Failed to fetch username');
        }
      } catch (error) {
        console.error('Error fetching username:', error);
      }
    };

    fetchChatrooms();
    fetchUsername();
  }, [email]);

  const handleChatroom = (chatroom_id) => {
    navigate(`/chat/${chatroom_id}/${username}`);
  };

  const handleCreateChatroom = () => {
    navigate('/Chatroom');
  };

  const handleClick = () => {
    navigate('/home');
  };

  return (
    <div>
      <button onClick={handleClick} style={{ cursor: 'pointer', border: 'none', background: 'none', width: '300px', display: 'block', margin: '0 auto', outline: 'none' }}>
        <img src="Home.jpg" alt="Go to Home" style={{ width: '250px', height: '120px' }} />
      </button>
      <div className="chatroomlist-container">
      <button onClick={handleCreateChatroom} className="chatroom-image-button">
        <img src="Chat.png" alt="Go to Chatroom" />
      </button>
      <h1>Available Chatrooms</h1>
      {chatrooms.length > 0 ? (
        <div className="chatroom-grid">
          {chatrooms.map(chatroom_id => (
            <div key={chatroom_id} className="chatroom-card" onClick={() => handleChatroom(chatroom_id)}>
              Chatroom ID: {chatroom_id}
            </div>
          ))}
        </div>
      ) : (
        <p>No chatrooms available</p>
      )}
      </div>
    </div>
  );
};

export default ChatroomList;