import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ isVisible, onClose }) => {
  const sidebarRef = useRef(null);
  const navigate = useNavigate();

  const handleClose = () => {
    if (isVisible) {
      onClose();
    }
  };

  const handlenewsButtonClick = () => {
    navigate('/news');
    onClose();
  };

  const handleChatButtonClick = () => {
    navigate('/chatroomList');
    onClose();
  };

  const handleWeatherButtonClick = () => {
    navigate('/weather');
    onClose();
  };

  const handleInformationButtonClick = () => {
    navigate('/information');
    onClose();
  };

  const handleMyPageButtonClick = () => {
    navigate('/mypage');
    onClose();
  };


  const handleClickOutside = (event) => {
    // 사이드바 영역 외의 클릭을 감지하여 닫기
    if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
      onClose();
    }
  };

  useEffect(() => {
    // 외부 클릭 감지 이벤트 리스너 등록
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // 컴포넌트 언마운트 시 이벤트 리스너 제거
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`sidebar ${isVisible ? 'visible' : ''}`} ref={sidebarRef}>
      <img src="Sidebar.png" alt="Sidebar" className="sidebar-img" onClick={handleClose} />
      <button onClick={handlenewsButtonClick} className="news-button">뉴스</button>
      <button onClick={handleChatButtonClick} className="chat-button">채팅</button>
      <button onClick={handleWeatherButtonClick} className="weather-button">날씨</button>
      <button onClick={handleInformationButtonClick} className="information-button">정보</button>
      <button onClick={handleMyPageButtonClick} className="mypage-button">마이페이지</button>
    </div>
  );
};

export default Sidebar;