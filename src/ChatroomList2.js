import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './ChatroomList2.css';

function ChatroomList2({ username }) {
  const [chatRooms, setChatRooms] = useState([]);

  useEffect(() => {
    const fetchUserChatRooms = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/users/${username}/chatrooms`);
        setChatRooms(response.data);
      } catch (error) {
        console.error('Error fetching user chat rooms:', error);
      }
    };

    if (username) {
      fetchUserChatRooms();
    }
  }, [username]);

  return (
    <div className="chatroomlist2-container">
      <h2>Your Chat Rooms</h2>
      <ul>
        {chatRooms.map((room, index) => (
          <li key={index}>
            <Link to={`/chat/${room}`}>{room}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ChatroomList2;