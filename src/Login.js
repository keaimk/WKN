import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
  
    // 이메일 필드 유효성 검사
    if (!formData.email.trim()) {
      errors.email = '이메일을 입력해주세요';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = '유효한 이메일을 입력해주세요';
    }
  
    // 비밀번호 필드 유효성 검사
    if (!formData.password.trim()) {
      errors.password = '비밀번호를 입력해주세요';
    } else if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{1,10}$/.test(formData.password)) {
      errors.password = '10자 이내의 영문, 숫자를 포함한 비밀번호를 입력해주세요';
    }
  
    // 유효성 검사 통과 여부 확인
    if (Object.keys(errors).length === 0) {
      try {
        const response = await axios.post('http://localhost:3001/login', formData);
        console.log(response.data);
        
        // 세션에 이메일 저장
        sessionStorage.setItem('email', response.data.email);
        // 세션에 저장된 이메일 콘솔에 기록
        console.log("Logged in email:", response.data.email);
        
        alert('로그인 성공!');
        navigate('/home');
      } catch (error) {
        console.error('Error:', error.response.data);
        setError('');
        alert('이메일 또는 비밀번호가 일치하지 않습니다.');
      }
    } else {
      // 유효성 검사 에러가 있는 경우 에러 상태 업데이트
      setErrors(errors);
    }
  };  
  
  return (
      <div className="login-box">
        <form onSubmit={handleSubmit}>
          <h1 align="center">로그인</h1>
          <div className="input-group">
            <input type="text" name="email" placeholder="이메일" value={formData.email} onChange={handleChange} />
            {errors.email && <span>{errors.email}</span>}
          </div>
          <div className="input-group">
            <input type="password" name="password" placeholder="비밀번호" value={formData.password} onChange={handleChange} />
            {errors.password && <span>{errors.password}</span>}
          </div>
          <button type="submit" style={{ marginBottom: '17px' }}>로그인</button>
          <div className="link-container">
          아직 계정이 없으신가요? <Link to="/signup" className="signup-link">회원가입</Link>
        </div>
        <div className="link-container">
          <Link to="/forgot-password" className="forgot-password-link">비밀번호 찾기</Link>
        </div>
      </form>
    </div>
  );
}

export default Login;