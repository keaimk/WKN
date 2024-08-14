import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Signup.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    emailDomain: '', // 이메일 도메인 추가
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // 입력 필드에 대한 에러가 있었다면 에러를 제거
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validateForm = () => {
      const newErrors = {};
      if (!formData.username.trim()) {
        newErrors.username = '이름을 입력해주세요';
      }
      if (!formData.password.trim()) {
        newErrors.password = '비밀번호를 입력해주세요';
      } else if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,10}$/.test(formData.password)) {
        newErrors.password = '영문과 숫자를 포함한 8~10자 비밀번호를 입력해주세요';
      }
      if (!formData.confirmPassword.trim()) {
        newErrors.confirmPassword = '비밀번호 확인을 입력해주세요';
      } else if (formData.confirmPassword !== formData.password) {
        newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
      }
      if (!formData.email.trim() || !formData.emailDomain.trim()) {
        newErrors.email = '이메일을 입력해주세요';
      }
      return newErrors;
    };

    const errors = validateForm();

    // 유효성 검사 통과 시, 회원가입 처리
    if (Object.keys(errors).length === 0) {
      try {
        // 서버로 전송할 데이터
        const requestData = {
          username: formData.username,
          password: formData.password,
          email: `${formData.email}@${formData.emailDomain}`
        };
        await axios.post('http://localhost:3001/signup', requestData);
        alert('회원가입 성공!');
        navigate('/');
      } catch (error) {
        console.log('에러:', error.message);
        alert('서버 오류가 발생했습니다.');
      }
    } else {
      setErrors(errors);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="signup-box">
        <h1>회원가입</h1>
        <div>
          <input type="username" id="username" name="username" placeholder="이름" value={formData.username} onChange={handleChange} />
          {errors.username && <span className="error">{errors.username}</span>}
        </div>
        <div>
          <input type="password" id="password" name="password" placeholder="비밀번호" value={formData.password} onChange={handleChange} />
          {errors.password && <span className="error">{errors.password}</span>}
        </div>
        <div>
          <input type="password" id="confirmPassword" name="confirmPassword" placeholder="비밀번호 확인" value={formData.confirmPassword} onChange={handleChange} />
          {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}
        </div>
        <div>
          <input type="text" id="email" name="email" placeholder="이메일" value={formData.email} onChange={handleChange} />
          @
          <select id="emailDomain" name="emailDomain" value={formData.emailDomain} onChange={handleChange}>
            <option value="">선택</option>
            <option value="gmail.com">gmail.com</option>
            <option value="naver.com">naver.com</option>
          </select>
        </div>
        {errors.email && <span className="error">{errors.email}</span>}
          <button type="submit">가입하기</button>
        </div>
    </form>
  );
};

export default Signup;