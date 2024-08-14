import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Signup from './Signup';
import Login from './Login';
import ForgotPassword from './ForgotPassword';
import Home from './Home';
import Post from './Post';
import PostDetail from './PostDetail';
import News from './News';
import ChatroomList from './ChatroomList';
import Chatroom from './Chatroom';
import Chat from './Chat';
import Weather from './Weather';
import Information from './Information';
import Mypage from './Mypage';
import PasswordConfirmation from './PasswordConfirmation';

const App = () => {
  // 회원가입 요청을 서버에 보내는 함수
  const handleSignUp = (formData) => {
    // 여기에 회원가입 요청을 서버에 보내는 로직을 추가하세요
    console.log('Signing up:', formData);
    // 실제로는 fetch 또는 axios 등을 사용하여 서버에 요청을 보냅니다.
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login onSignUp={handleSignUp} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/home" element={<Home />} />
        <Route path="/post" element={<Post />} />
        <Route path="/posts/:id" element={<PostDetail />} />
        <Route path="/news" element={<News />} />
        <Route path="/chatroomlist" element={<ChatroomList />} />
        <Route path="/chatroom" element={<Chatroom />} />
        <Route path="/chat/:chatroom/:username" element={<Chat />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/information" element={<Information />} />
        <Route path="/mypage" element={<Mypage />} />
        <Route path="/password-confirmation" element={<PasswordConfirmation />} />
      </Routes>
    </Router>
  );
};

export default App;