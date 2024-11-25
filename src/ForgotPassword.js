import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ForgotPassword.css';

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleChangeEmail = (e) => {
    const value = e.target.value;
    console.log('Email changed:', value);
    setEmail(value);
  };

  const handleChangeCode = (e) => {
    const value = e.target.value;
    console.log('Code changed:', value);
    setCode(value);
  };

  const handleChangeNewPassword = (e) => {
    const value = e.target.value;
    console.log('New password changed:', value);
    setNewPassword(value);
  };

  const handleChangeConfirmPassword = (e) => {
    const value = e.target.value;
    console.log('Confirm password changed:', value);
    setConfirmPassword(value);
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    const validationErrors = validateEmail(email);
  
    if (Object.keys(validationErrors).length === 0) {
      try {
        const response = await axios.post('http://localhost:3001/send-code', { email });
        console.log('Send code request sent successfully:', response);
        const alertMessage = `6자리의 숫자코드가 ${email} 주소로 수신되었습니다.`;
        setIsCodeSent(true);
        setErrors({});
        window.alert(alertMessage); // 메시지를 alert 창으로 표시
      } catch (error) {
        console.error('Error sending code:', error.response?.data || error.message);
        window.alert('인증번호 발송에 실패했습니다. 다시 시도해주세요.');
      }
    } else {
      window.alert('이메일을 입력해주세요');
      setErrors(validationErrors);
    }
  };  

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3001/verify-code', { email, code });
      console.log('Verify code request sent successfully:', response);
      setIsVerified(true);
      window.alert('인증이 완료되었습니다.'); // 인증 완료 메시지 alert 창으로 표시
    } catch (error) {
      console.error('Error verifying code:', error.response?.data || error.message);
      window.alert('인증번호 확인에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      window.alert('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3001/reset-password', { email, newPassword });
      console.log('Password reset response:', response.data);
      setResetSuccess(true);
      window.alert('비밀번호가 성공적으로 재설정되었습니다.'); // 비밀번호 재설정 성공 메시지 alert 창으로 표시
      navigate('/login');
    } catch (error) {
      console.error('Error resetting password:', error.response?.data || error.message);
      window.alert('비밀번호 재설정에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const validateEmail = (email) => {
    const errors = {};
    if (!email.trim()) {
      errors.email = '이메일을 입력해주세요';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = '유효한 이메일을 입력해주세요';
    }
    return errors;
  };

  return (
    <div className="forgot-password-box">
      <form onSubmit={isCodeSent ? (isVerified ? handleResetPassword : handleVerifyCode) : handleSendCode}>
        <h1 align="center">비밀번호 찾기</h1>
        <div className="input-group">
          <input type="text" name="email" placeholder="이메일" value={email} onChange={handleChangeEmail} disabled={isCodeSent} className="fp-input" />
        </div>
        {isCodeSent && (
          <div className="input-group">
            <input type="text" name="code" placeholder="6자리 숫자코드 입력" value={code} onChange={handleChangeCode} className="fp-input" />
          </div>
        )}
        {isVerified && (
          <div className="fp-input-group">
            <input type="password" name="newPassword" placeholder="새 비밀번호" value={newPassword} onChange={handleChangeNewPassword} className="fp-input" />
          </div>
        )}
        {isVerified && (
          <div className="fp-input-group">
            <input type="password" name="confirmPassword" placeholder="새 비밀번호 확인" value={confirmPassword} onChange={handleChangeConfirmPassword} className="fp-input" />
          </div>
        )}
        <button type="submit" className="fp-button">
          {isCodeSent
            ? isVerified
              ? '비밀번호 재설정'
              : '확인'
            : '확인'}
        </button>
      </form>
    </div>
  );
}

export default ForgotPassword;