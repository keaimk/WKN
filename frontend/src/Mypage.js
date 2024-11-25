import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Mypage.css';
import PasswordConfirmation from './PasswordConfirmation';

function MyPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isWithdraw, setIsWithdraw] = useState(false);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('email');
    if (storedEmail) {
      console.log('이메일 가져오기 성공:', storedEmail);
      setEmail(storedEmail);
      fetchUserData(storedEmail);
    }
  }, []);

  const fetchUserData = async (email) => {
    try {
      const response = await axios.get(`http://localhost:3001/userdata?email=${email}`);
      if (response.status === 200) {
        setUsername(response.data.username);
      } else {
        console.error('사용자 데이터 가져오기 실패');
      }
    } catch (error) {
      console.error('사용자 데이터 가져오기 실패:', error);
    }
  };

  const handleLogout = () => {
    axios.post('http://localhost:3001/logout')
      .then(response => {
        sessionStorage.removeItem('email');
        console.log('세션에서 이메일 삭제:', email);
        navigate('/login');
      })
      .catch(error => {
        console.error('로그아웃 실패:', error);
      });
  };

  const handleWithdraw = () => {
    setIsWithdraw(true);
  };

  const handleConfirmWithdraw = () => {
    setIsWithdraw(false); 
    navigate('/login');
  };

  const handleClick = () => {
    navigate('/home');
  };

  if (isWithdraw) {
    return <PasswordConfirmation onWithdraw={handleConfirmWithdraw} />;
  }

  return (
    <div>
      <button onClick={handleClick} style={{ cursor: 'pointer', border: 'none', background: 'none', width: '300px', display: 'block', margin: '0 auto', outline: 'none' }}>
        <img src="Home.jpg" alt="Go to Home" style={{ width: '250px', height: '120px' }} />
      </button>
      <div className="mypage-box">
        <h1>Mypage</h1>
        <div>
          <label htmlFor="username">이름 </label>
          <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <label htmlFor="email">이메일 </label>
          <input type="text" id="email" value={email} readOnly />
        </div>
        <div className="mypage-button-container">
          <button onClick={handleLogout} className="logout-button">로그아웃</button>
          <div className="vertical-separator"></div>
          <button onClick={handleWithdraw} className="withdraw-button">회원탈퇴</button>
        </div>
      </div>
    </div>
  );
}

export default MyPage;