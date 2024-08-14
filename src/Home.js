import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Home.css';
import './PostButton.css';
import Sidebar from './Sidebar';

const Home = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  useEffect(() => {
    const savedSearchTerm = sessionStorage.getItem('searchTerm') || '';
    setSearchTerm(savedSearchTerm);
    getPosts(savedSearchTerm, selectedCategory);
  }, [selectedCategory]);

  const getPosts = async (searchTerm = '', category = '') => {
    try {
      const response = await axios.get('http://localhost:3001/posts');
      const filteredPosts = response.data.filter(post =>
        (post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
         post.author.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (category === '' || post.category === category)
      );
      console.log("검색어:", searchTerm);
      console.log("카테고리:", category);
      console.log("검색 결과:", filteredPosts);
      setPosts(filteredPosts);
    } catch (error) {
      console.error('게시글을 불러오는 중 오류 발생:', error);
    }
  };  

  const handleSearchChange = (event) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
    sessionStorage.setItem('searchTerm', newSearchTerm);
    getPosts(newSearchTerm, selectedCategory);
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    console.log('Selected category:', category); // 로그 추가
  };

  const handleHomeButtonClick = () => {
    window.location.reload();
  };

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const closeSidebar = () => {
    setIsSidebarVisible(false);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Get current posts
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);

  // Calculate page numbers
  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(posts.length / postsPerPage); i++) {
    pageNumbers.push(i);
  }

  return (
    <div>
      <Sidebar isVisible={isSidebarVisible} onClose={closeSidebar} />
      <div className="content">
        <button onClick={handleHomeButtonClick} style={{ cursor: 'pointer', border: 'none', background: 'none', width: '300px', display: 'block', margin: '0 auto' }}>
          <img src="Home.jpg" alt="Go to Home" style={{ width: '250px', height: '120px' }} />
        </button>
        <button onClick={toggleSidebar} className="sidebar-toggle-button">
          <img src="Sidebar.png" alt="Toggle Sidebar" style={{ width: '50px', height: '50px' }} />
        </button>
        <div className="post-button-container">
          <button onClick={() => navigate('/post')} className="postbutton">글쓰기</button>
        </div>
        <div className="search-container">
          <input type="text" placeholder="검색어를 입력하세요" value={searchTerm} onChange={handleSearchChange} className="search-input" />
        </div>
        <div className="category-buttons">
          <button onClick={() => handleCategoryClick('')} className={`category-button ${selectedCategory === '' ? 'active' : ''}`}>전체</button>
          <button onClick={() => handleCategoryClick('이민')} className={`category-button ${selectedCategory === '이민' ? 'active' : ''}`}>이민</button>
          <button onClick={() => handleCategoryClick('유학')} className={`category-button ${selectedCategory === '유학' ? 'active' : ''}`}>유학</button>
          <button onClick={() => handleCategoryClick('여행')} className={`category-button ${selectedCategory === '여행' ? 'active' : ''}`}>여행</button>
          <button onClick={() => handleCategoryClick('생활')} className={`category-button ${selectedCategory === '생활' ? 'active' : ''}`}>생활</button>
          <button onClick={() => handleCategoryClick('사진')} className={`category-button ${selectedCategory === '사진' ? 'active' : ''}`}>사진</button>
        </div>
        <div className="board">
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <table style={{ width: '60%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ width: '1%', border: '1px solid #dddddd', padding: '8px', textAlign: 'center' }}>번호</th>
                  <th style={{ width: '5%', border: '1px solid #dddddd', padding: '8px', textAlign: 'center' }}>제목</th>
                  <th style={{ width: '2%', border: '1px solid #dddddd', padding: '8px', textAlign: 'center' }}>작성자</th>
                  <th style={{ width: '3%', border: '1px solid #dddddd', padding: '8px', textAlign: 'center' }}>작성일</th>
                </tr>
              </thead>
              <tbody>
                {currentPosts.length > 0 ? (
                  currentPosts.map((post, index) => (
                    <tr key={index} style={{ border: '1px solid #dddddd' }}>
                      <td className="board-number-cell" style={{ border: '1px solid #dddddd', padding: '8px', textAlign: 'center' }}>{indexOfFirstPost + index + 1}</td>
                      <td className="board-title-cell" style={{ border: '1px solid #dddddd', padding: '8px', textAlign: 'center', cursor: 'pointer', color: 'black' }} onClick={() => navigate(`/posts/${post.id}`)}>{post.title}</td>
                      <td className="board-author-cell" style={{ border: '1px solid #dddddd', padding: '8px', textAlign: 'center' }}>{post.author}</td>
                      <td className="board-date-cell" style={{ border: '1px solid #dddddd', padding: '8px', textAlign: 'center' }}>{new Date(post.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ padding: '10px', textAlign: 'center' }}>게시된 글이 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="pagination">
          {pageNumbers.map(number => (
          <button
          key={number}
          onClick={() => handlePageChange(number)}
          className={`page-number ${currentPage === number ? 'active' : ''}`}>{number}</button>
          ))}
          </div>
      </div>
    </div>
  );
};

export default Home;