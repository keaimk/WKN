import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './PostDetail.css';

const PostDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");
  const [isEditing, setIsEditing] = useState(new URLSearchParams(location.search).get('editing') === 'true');
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([]);
  const [showEditDeleteButtons, setShowEditDeleteButtons] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (isEditing) {
      sessionStorage.setItem('editedTitle', editedTitle);
      sessionStorage.setItem('editedContent', editedContent);
    }
  }, [isEditing, editedTitle, editedContent]);

  useEffect(() => {
    if (isEditing) {
      const storedTitle = sessionStorage.getItem('editedTitle');
      const storedContent = sessionStorage.getItem('editedContent');
      if (storedTitle && storedContent) {
        setEditedTitle(storedTitle);
        setEditedContent(storedContent);
      } else {
        setEditedTitle(post?.title || '');
        setEditedContent(post?.content || '');
      }
    }
  }, [isEditing, post]);

  const fetchComments = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/posts/${id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('댓글을 불러오는 중 오류 발생:', error);
    }
  };

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/posts/${id}`);
        setPost(response.data);
        setImageUrl(response.data.imageUrl);
        console.log('이미지 URL:', response.data.imageUrl);
        setLoading(false);
      } catch (error) {
        console.error('게시글을 불러오는 중 오류 발생:', error);
        setError('게시글을 불러오는 중 오류가 발생했습니다.');
      }
    };

    const emailFromSession = sessionStorage.getItem("email");
    if (emailFromSession) {
      setEmail(emailFromSession);
    }

    fetchPost();
    fetchComments();
  }, [id]);

  useEffect(() => {
    setIsEditing(new URLSearchParams(location.search).get('editing') === 'true');
  }, [location.search]);

  const handleClick = () => {
    navigate('/home');
  };

  const handleEdit = () => {
    navigate(`?editing=true`);
    setIsEditing(true);
    setEditedTitle(post.title);
    setEditedContent(post.content);
  };

  const handleSave = async () => {
    try {
      if (!editedTitle.trim() || !editedContent.trim()) {
        alert('제목과 내용을 모두 입력하세요.');
        return;
      }

      await axios.put(`http://localhost:3001/posts/${id}`, {
        title: editedTitle,
        content: editedContent,
        author: post.author,
      });

      const response = await axios.get(`http://localhost:3001/posts/${id}`);
      setPost(response.data);

      setIsEditing(false);
      sessionStorage.removeItem('editedTitle');
      sessionStorage.removeItem('editedContent');
      alert('수정되었습니다.');
    } catch (error) {
      console.error('게시글을 수정하는 중 오류 발생:', error);
      setError('게시글을 수정하는 중 오류가 발생했습니다.');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    sessionStorage.removeItem('editedTitle');
    sessionStorage.removeItem('editedContent');
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:3001/posts/${id}`);
      alert('삭제되었습니다.');
      navigate('/home');
    } catch (error) {
      console.error('게시글을 삭제하는 중 오류 발생:', error);
      setError('게시글을 삭제하는 중 오류가 발생했습니다.');
    }
  };

  const handleCommentSubmit = async () => {
    try {
      if (!newComment.trim()) {
        alert('댓글을 입력하세요.');
        return;
      }

      await axios.post(`http://localhost:3001/posts/${id}/comments`, {
        author: email,
        content: newComment,
      });

      fetchComments();
      setNewComment('');
    } catch (error) {
      console.error('댓글 작성 중 오류 발생:', error);
      setError('댓글 작성 중 오류가 발생했습니다.');
    }
  };

  const handleCommentDelete = async (commentId) => {
    try {
      await axios.delete(`http://localhost:3001/posts/${id}/comments/${commentId}`);
      alert('댓글이 삭제되었습니다.');
      fetchComments();
    } catch (error) {
      console.error('댓글 삭제 중 오류 발생:', error);
      setError('댓글 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleImageClick = () => {
    setShowEditDeleteButtons(!showEditDeleteButtons);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <button onClick={handleClick} style={{ cursor: 'pointer', border: 'none', background: 'none', width: '300px', display: 'block', margin: '0 auto', outline: 'none' }}>
        <img src="/Home.jpg" alt="Go to Home" style={{ width: '250px', height: '120px' }} />
      </button>
      {!isEditing && (
        <div className="postdetail-box">
          <h1>{post.title}</h1>
          <p>카테고리: {post.category} | 작성자: {post.author} | 작성일: {new Date(post.created_at).toLocaleDateString('ko-KR')}</p>
          <hr />
          {post.imageUrl && <img src={`http://localhost:3001${post.imageUrl}`} className="post-image" onError={() => console.log('이미지를 불러오는 중 오류 발생')} />}
          <div className="content-wrapper">
            <p>{post.content}</p>
            <hr />
          </div>
          <span>
            <button onClick={handleImageClick} className="toggle-button">
              <img src="/Button.png" alt="Show Edit/Delete" />
            </button>
            {showEditDeleteButtons && email === post.author && (
              <div className="button-container">
                <button className="edit-button" onClick={handleEdit}>수정</button>
                <button className="delete-button" onClick={handleDelete}>삭제</button>
              </div>
            )}
          </span>
          <div className="comments-section">
            <h2>댓글</h2>
            <textarea rows="4" cols="50" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="댓글을 입력하세요" />
            <button className="comment-button" onClick={handleCommentSubmit}>작성</button>
            <div className="comments-scroll" style={{ maxHeight: '150px', overflowY: 'auto' }}>
              <ul>
                {comments.map((comment) => (
                  <li key={comment.comment_id} className={`comment-item ${showEditDeleteButtons ? 'with-buttons' : ''}`}>
                    <p>작성자: {comment.author}</p>
                    <p>{comment.content}</p>
                    {comment.author === email && (
                      <button className="comment-delete-button" onClick={() => handleCommentDelete(comment.comment_id)}>삭제</button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      {isEditing && (
        <div>
          <input type="text" className="edit-input" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} />
          <textarea className="edit-textarea" value={editedContent} onChange={(e) => setEditedContent(e.target.value)} />
          <button className="save-button" onClick={handleSave}>저장</button>
          <button className="cancel-button" onClick={handleCancel}>취소</button>
        </div>
      )}
    </div>
  );
};

export default PostDetail;