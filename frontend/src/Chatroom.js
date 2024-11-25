import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import './Chatroom.css';

const socket = io('http://localhost:3001');

function Chatroom() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [chatroomNameInput, setChatroomNameInput] = useState('');

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('email');
    if (storedEmail) {
      console.log('이메일 가져오기 성공:', storedEmail);
      fetchUserData(storedEmail);
    }
  }, []);

  const fetchUserData = async (email) => {
    try {
      const response = await axios.get(`http://localhost:3001/userdata?email=${email}`);
      if (response.status === 200) {
        console.log('유저 데이터 가져오기 성공:', response.data);
        setUsername(response.data.username);
      } else {
        console.error('사용자 데이터 가져오기 실패');
      }
    } catch (error) {
      console.error('사용자 데이터 가져오기 실패:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim() !== '' && chatroomNameInput.trim() !== '') {
      navigate(`/chat/${chatroomNameInput}/${username}`);
    }
  };

  return (
    <div className="chatroom-container">
      <div className="form-container">
        <h1>Enter Chatroom</h1>
        <form onSubmit={handleSubmit}>
          <input type="text" id="username" value={username} readOnly />
          <input type="text" id="chatroom" value={chatroomNameInput} onChange={(e) => setChatroomNameInput(e.target.value)} placeholder="채팅방 이름을 입력하세요" />
          <button type="submit">Join</button>
        </form>
      </div>
    </div>
  );  
}

export default Chatroom;