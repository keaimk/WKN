import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Post.css';

function Post() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState(null);
  const email = sessionStorage.getItem('email');
  console.log('이메일:', email);

  const handleClick = () => {
    navigate('/home');
  };

  const handleTitleChange = (event) => {
    setTitle(event.target.value);
  };

  const handleContentChange = (event) => {
    setContent(event.target.value);
  };

  const handleCategoryChange = (event) => {
    setCategory(event.target.value);
  };

  const handleImageChange = (event) => {
    setImage(event.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!title && !content && !category) {
      alert('제목, 내용 및 카테고리를 입력해주세요.');
      return;
    }

    if (!title) {
      alert('제목을 입력해주세요.');
      return;
    }

    if (!category) {
      alert('카테고리를 선택해주세요.');
      return;
    }

    try {
      // 기본 게시글 데이터
      const newPost = { title, content, category, author: email };
      const formData = new FormData();

      for (const key in newPost) {
        formData.append(key, newPost[key]);
      }
      
      // 이미지 파일 추가
      if (image) {
        formData.append('image', image);
      }

      console.log('전송하는 데이터:', formData);

      const response = await axios.post('http://localhost:3001/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.status === 200 || response.status === 201) {
        console.log('게시되었습니다.');
        setTitle('');
        setContent('');
        setCategory(''); 
        setImage(null);
        alert('게시되었습니다.');
        navigate('/home');
      } else {
        console.error('게시 중 오류가 발생했습니다.', response);
        alert('게시 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('게시 중 오류 발생:', error);
      alert('게시 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="post-box">
      <button onClick={handleClick} style={{ cursor: 'pointer', border: 'none', background: 'none', width: '300px', display: 'block', margin: '0 auto', outline: 'none' }}>
        <img src="Home.jpg" alt="Go to Home" style={{ width: '250px', height: '120px' }} />
      </button>
      <div style={{ marginTop: '25px' }}></div>
      <form onSubmit={handleSubmit}>
        <input type="text" value={title} placeholder="제목을 입력해주세요" onChange={handleTitleChange} className="input-field" />
        <textarea value={content} placeholder="내용을 입력해주세요" onChange={handleContentChange} className="input-field" />
        <select value={category} onChange={handleCategoryChange} className="input-field">
          <option value="">카테고리를 선택해주세요</option>
          <option value="이민">이민</option>
          <option value="유학">유학</option>
          <option value="여행">여행</option>
          <option value="생활">생활</option>
          <option value="사진">사진</option>
        </select>
        <input type="file" onChange={handleImageChange} className="input-field" /> {/* 이미지 업로드 필드 추가 */}
        <button type="submit" className="submit-button">게시</button>
      </form>
    </div>
  );
}

export default Post;