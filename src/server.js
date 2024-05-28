const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const port = 3001;
 
// MySQL 데이터베이스 연결 설정
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '12345678',
    database: 'wkn',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// MySQL 연결
pool.getConnection((err, connection) => {
    if (err) {
        console.error('MySQL 연결 실패:', err);
    } else {
        console.log('MySQL 연결 성공!');
    }
});

app.use(cors());
app.use(bodyParser.json());

// 회원가입 엔드포인트
app.post('/signup', async (req, res) => {
    const { username, password, email } = req.body;

    try {
        // 비밀번호 해싱
        const hashedPassword = await bcrypt.hash(password, 10); // 해싱 알고리즘과 솔트(salt)의 길이를 지정합니다.

        // MySQL 풀에서 연결 가져오기
        const connection = await pool.getConnection();

        // 회원가입 정보를 데이터베이스에 삽입하는 SQL 실행
        const sql = 'INSERT INTO users (username, password, email) VALUES (?, ?, ?)';
        const values = [username, hashedPassword, email];
        await connection.execute(sql, values);

        // 연결 풀에 연결 반환
        connection.release();

        console.log('회원가입 성공');
        res.json({ success: true });
    } catch (error) {
        console.error('회원가입 실패:', error);
        res.status(500).json({ error: '회원가입 실패' });
    }
});

// 로그인 처리
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const connection = await pool.getConnection(async conn => conn);
        try {
            // 이메일과 비밀번호를 사용하여 사용자 조회
            const [rows] = await connection.query(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );
            connection.release(); // 연결 해제
            if (rows.length > 0) {
                // 데이터베이스에서 저장된 해싱된 비밀번호를 가져옵니다.
                const hashedPasswordFromDB = rows[0].password;

                // 비밀번호를 해싱하여 비교합니다.
                const match = await bcrypt.compare(password, hashedPasswordFromDB);

                if (match) {
                    console.log('로그인 성공:', rows[0].username);
                    // 로그인 성공 시 사용자 정보를 응답으로 보냅니다.
                    res.status(200).json({ email: rows[0].email });
                } else {
                    console.log('로그인 실패: 잘못된 이메일 또는 비밀번호');
                    res.status(401).send('로그인 실패: 잘못된 이메일 또는 비밀번호');
                }
            } else {
                console.log('로그인 실패: 잘못된 이메일 또는 비밀번호');
                res.status(401).send('로그인 실패: 잘못된 이메일 또는 비밀번호');
            }
        } catch (err) {
            connection.release(); // 오류 발생 시 연결 해제
            console.error('로그인 오류:', err);
            res.status(500).send('로그인 오류가 발생했습니다.');
        }
    } catch (err) {
        console.error('데이터베이스 연결 오류:', err);
        res.status(500).send('데이터베이스 연결 오류가 발생했습니다.');
    }
});

// 사용자 데이터 가져오기 엔드포인트
app.get('/userdata', async (req, res) => {
    const email = req.query.email;

    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT username FROM users WHERE email = ?', [email]);
        connection.release();

        if (rows.length > 0) {
            res.status(200).json({ username: rows[0].username });
        } else {
            res.status(404).send('사용자를 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error('사용자 데이터 가져오기 실패:', error);
        res.status(500).send('사용자 데이터 가져오기 실패');
    }
});

// 로그아웃 처리 엔드포인트
app.post('/logout', (req, res) => {
    // 클라이언트 측에서 세션 스토리지를 사용하고 있기 때문에 서버에서는 할 일이 없습니다.
    res.status(200).send('로그아웃 성공');
});

// 회원탈퇴 엔드포인트
app.post('/withdraw', async (req, res) => {
    const { email } = req.body;

    try {
        const connection = await pool.getConnection(async conn => conn);
        try {
            // 사용자가 작성한 모든 댓글을 삭제합니다.
            await connection.query(
                'DELETE FROM comments WHERE author = ?',
                [email]
            );

            // 사용자가 작성한 게시글에 달린 모든 댓글을 삭제합니다.
            await connection.query(
                'DELETE FROM comments WHERE post_id IN (SELECT id FROM posts WHERE author = ?)',
                [email]
            );

            // 사용자가 작성한 게시글을 삭제합니다.
            await connection.query(
                'DELETE FROM posts WHERE author = ?',
                [email]
            );

            // 사용자를 데이터베이스에서 삭제합니다.
            const [result] = await connection.query(
                'DELETE FROM users WHERE email = ?',
                [email]
            );

            connection.release(); // 연결 해제

            if (result.affectedRows > 0) {
                console.log('회원 탈퇴 성공:', email);
                res.status(200).json({ success: true });
            } else {
                console.log('회원 탈퇴 실패: 해당 이메일이 존재하지 않습니다.');
                res.status(404).send('회원 탈퇴 실패: 해당 이메일이 존재하지 않습니다.');
            }
        } catch (err) {
            connection.release(); // 오류 발생 시 연결 해제
            console.error('회원 탈퇴 오류:', err);
            res.status(500).send('회원 탈퇴 오류가 발생했습니다.');
        }
    } catch (err) {
        console.error('데이터베이스 연결 오류:', err);
        res.status(500).send('데이터베이스 연결 오류가 발생했습니다.');
    }
});

// 게시글 저장 엔드포인트
app.post('/posts', async (req, res) => {
    const { title, content, author } = req.body;

    try {
        const connection = await pool.getConnection();

        // 작성자의 이메일이 사용자 테이블에 있는지 확인
        console.log(`작성자 이메일: ${author}`); // 전달된 작성자 이메일 로그

        const [user] = await connection.execute('SELECT * FROM users WHERE email = ?', [author]);

        console.log('사용자 조회 결과:', user); // 사용자 조회 결과 로그

        if (user.length === 0) {
            connection.release();
            console.log('작성자 이메일이 사용자 테이블에 없습니다.');
            return res.status(400).send('작성자 이메일이 사용자 테이블에 없습니다.');
        }

        // 게시글 삽입 SQL 실행
        await connection.execute(
            'INSERT INTO posts (title, content, author, created_at) VALUES (?, ?, ?, NOW())',
            [title, content, author]
        );

        connection.release();
        console.log('게시글이 성공적으로 저장되었습니다.');
        res.status(201).send('게시글이 성공적으로 저장되었습니다.');
    } catch (error) {
        console.error('게시글 저장 실패:', error);
        res.status(500).send('게시글 저장 실패');
    }
});

// 홈으로 게시글 정보를 가져오는 엔드포인트 수정
app.get('/posts', async (req, res) => {
    try {
        // MySQL 풀에서 연결 가져오기
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT id, title, author, created_at FROM posts');
        connection.release();

        console.log('게시글 정보를 성공적으로 가져왔습니다.', rows);
        res.status(200).json(rows);
    } catch (error) {
        console.error('게시글 정보 가져오기 실패:', error);
        res.status(500).send('게시글 정보 가져오기 실패');
    }
});

// 특정 ID를 가진 게시글 정보를 가져오는 엔드포인트
app.get('/posts/:id', async (req, res) => {
    const postId = req.params.id;
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT title, author, content, created_at FROM posts WHERE id = ?', [postId]);
        connection.release();

        if (rows.length > 0) {
            console.log('게시글 정보:', rows[0]);
            res.status(200).json(rows[0]);
        } else {
            res.status(404).send('게시글을 찾을 수 없습니다.');
        }
        
    } catch (error) {
        console.error('게시글 정보 가져오기 실패:', error);
        res.status(500).send('게시글 정보 가져오기 실패');
    }
});

// 게시글 수정 엔드포인트 추가
app.put('/posts/:id', async (req, res) => {
    const postId = req.params.id;
    const { title, content } = req.body;

    try {
        const connection = await pool.getConnection();

        // 게시글 업데이트 SQL 실행 (수정된 날짜와 작성 시간 업데이트)
        const sql = 'UPDATE posts SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP, created_at = IFNULL(created_at, CURRENT_TIMESTAMP) WHERE id = ?';
        const values = [title, content, postId];
        const [result] = await connection.execute(sql, values);
        
        connection.release();

        if (result.affectedRows === 0) {
            res.status(404).send('게시글을 찾을 수 없습니다.');
        } else {
            res.status(200).send('게시글이 성공적으로 수정되었습니다.');
        }
    } catch (error) {
        console.error('게시글 수정 실패:', error);
        res.status(500).send('게시글 수정 실패');
    }
});

// 게시글 삭제 엔드포인트 추가
app.delete('/posts/:id', async (req, res) => {
    const postId = req.params.id;

    try {
        const connection = await pool.getConnection();

        // 먼저 해당 게시물에 연결된 모든 댓글을 삭제합니다.
        await connection.execute('DELETE FROM comments WHERE post_id = ?', [postId]);
        console.log('게시물에 연결된 모든 댓글이 삭제되었습니다.');

        // 게시글 삭제 SQL 실행
        const [result] = await connection.execute('DELETE FROM posts WHERE id = ?', [postId]);
        console.log('게시글이 삭제되었습니다.');

        connection.release();

        if (result.affectedRows === 0) {
            res.status(404).send('게시글을 찾을 수 없습니다.');
        } else {
            res.status(200).send('게시글이 성공적으로 삭제되었습니다.');
        }
    } catch (error) {
        console.error('게시글 삭제 실패:', error);
        res.status(500).send('게시글 삭제 실패');
    }
});

// 댓글 저장 엔드포인트
app.post('/posts/:id/comments', async (req, res) => {
    const postId = req.params.id;
    const { author, content } = req.body;

    // 현재 시간을 작성일로 설정
    const created_at = new Date();

    console.log('요청 본문:', req.body); // 디버깅을 위해 요청 본문을 로깅합니다.

    if (!author || !content) {
        console.error('작성자 또는 내용이 정의되지 않았습니다.');
        res.status(400).send('작성자와 내용은 필수입니다.');
        return;
    }

    try {
        // MySQL 풀에서 연결 가져오기
        const connection = await pool.getConnection();

        // 게시글이 존재하는지 확인
        const [rows] = await connection.execute('SELECT * FROM posts WHERE id = ?', [postId]);
        if (rows.length === 0) {
            console.error('게시글이 존재하지 않습니다.');
            connection.release();
            res.status(404).send('게시글을 찾을 수 없습니다.');
            return;
        }

        // 댓글을 데이터베이스에 삽입하는 SQL 실행
        const sql = 'INSERT INTO comments (post_id, author, content, created_at) VALUES (?, ?, ?, ?)';
        const values = [postId, author, content, created_at];
        await connection.execute(sql, values);
        console.log('삽입될 데이터:', values); // 삽입 전 데이터를 로깅합니다.

        // 연결 풀에 연결 반환
        connection.release();

        console.log('새로운 댓글이 성공적으로 추가되었습니다.');
        res.status(200).send('댓글이 성공적으로 저장되었습니다.');
    } catch (error) {
        console.error('댓글 저장 실패:', error);
        res.status(500).send('댓글 저장 실패');
    }
});

// 댓글 가져오는 엔드포인트
app.get('/posts/:id/comments', async (req, res) => {
    const postId = req.params.id;

    try {
        const connection = await pool.getConnection();

        const [rows] = await connection.execute('SELECT * FROM posts WHERE id = ?', [postId]);
        if (rows.length === 0) {
            console.error('게시글이 존재하지 않습니다.');
            connection.release();
            res.status(404).send('게시글을 찾을 수 없습니다.');
            return;
        }

        const [comments] = await connection.execute('SELECT * FROM comments WHERE post_id = ?', [postId]);
        connection.release();
        console.log('게시물의 댓글을 성공적으로 가져왔습니다.');
        res.status(200).json(comments);
    } catch (error) {
        console.error('댓글 가져오기 실패:', error);
        res.status(500).send('댓글 가져오기 실패');
    }
});

app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});