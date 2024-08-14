import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PasswordConfirmation.css';

function PasswordConfirmation({ onWithdraw }) {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');

  const handleWithdraw = () => {
    const email = sessionStorage.getItem('email'); // 세션에서 이메일 가져오기

    // 비밀번호 확인 후 회원 탈퇴 처리
    axios.post('http://localhost:3001/confirmPasswordAndWithdraw', { email, password })
      .then(response => {
        if (response.status === 200) {
          onWithdraw(); // 부모 컴포넌트로 회원 탈퇴가 성공적으로 처리되었음을 알림
          sessionStorage.removeItem('email'); // 세션에서 이메일 제거
          navigate('/login');
        } else {
          console.error('회원 탈퇴 실패');
        }
      })
      .catch(error => {
        console.error('회원 탈퇴 실패:', error);
      });
  };

  const handleClick = () => {
    navigate('/home');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleWithdraw();
    }
  };

  return (
    <div>
      <button onClick={handleClick} style={{ cursor: 'pointer', border: 'none', background: 'none', width: '300px', display: 'block', margin: '0 auto', outline: 'none' }}>
        <img src="Home.jpg" alt="Go to Home" style={{ width: '250px', height: '120px' }} />
      </button>
      <div className="password-confirmation-page">
        <h2>비밀번호 확인</h2>
        <div>
          <input
            type="password"
            id="password"
            value={password}
            placeholder="비밀번호를 입력해주세요"
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress} // 엔터 키 감지
          />
        </div>
        <button onClick={handleWithdraw}>확인 및 탈퇴</button>
      </div>
    </div>
  );
}

export default PasswordConfirmation;