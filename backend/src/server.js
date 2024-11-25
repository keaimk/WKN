const cors = require('cors');
const multer = require('multer');
const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');
const nodemailer = require('nodemailer');

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

// multer 설정
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname)); // 파일명 중복 방지
    },
  });
  
  const upload = multer({ storage: storage });

// HTTP 서버 생성
const server = http.createServer(app);

// Socket.IO 서버 생성
const io = socketIo(server, {
    cors: {
        origin: '*', // 허용할 클라이언트의 URL
        methods: ['GET', 'POST'],
    },
});

// 사용자가 채팅방에 입장할 때 클라이언트에게 사용자 목록을 업데이트하는 이벤트 발송
async function sendUpdatedUserList(chatroomId) {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT DISTINCT username FROM chat WHERE chatroom_id = ?', [chatroomId]);
        connection.release();
        const users = rows.map(row => row.username);
        io.to(chatroomId).emit('updateUsers', users); // 특정 방의 모든 클라이언트에게 업데이트된 사용자 목록을 보냄
    } catch (error) {
        console.error('사용자 목록 조회 및 업데이트 오류:', error);
    }
}

// Socket.IO 이벤트 처리
io.on('connection', async (socket) => {
    console.log('새로운 클라이언트 연결됨');

    let chatRoomId; // 클라이언트가 속한 채팅방 ID를 저장할 변수

// 서버 측 (사용자 이름을 함께 받아서 처리)
socket.on('joinRoom', async ({ roomId, username }) => {
    console.log(`사용자 ${username}이가 ${roomId} 채팅방에 입장함`);
    chatRoomId = roomId;

    // 클라이언트에게 새로운 사용자가 채팅방에 입장했음을 알림
    socket.broadcast.to(chatRoomId).emit('userJoined', `${username}님이 채팅방에 입장했습니다.`);

    // 이전 메시지 가져와서 클라이언트에게 전송
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM chat WHERE chatroom_id = ? ORDER BY timestamp ASC', [chatRoomId]);
        socket.emit('initialMessages', rows);
        connection.release();
    } catch (err) {
        console.error('이전 메시지 조회 오류:', err);
    }
});

    // 기존 메시지 전송
    socket.on('Chat', async (msg) => {
        console.log('받은 메시지:', msg);

        // 메시지 저장
        try {
            const connection = await pool.getConnection();
            const query = 'INSERT INTO chat (username, message, chatroom_id) VALUES (?, ?, ?)';
            const [result] = await connection.query(query, [msg.username, msg.message, msg.chatroom]);
            const newMessage = { id: result.insertId, username: msg.username, message: msg.message, chatroom: msg.chatroom, timestamp: new Date() };
            io.emit('Chat', newMessage); // 메시지를 모든 클라이언트에게 브로드캐스트
            connection.release();
        } catch (err) {
            console.error('메시지 저장 오류:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('클라이언트 연결 종료');
    });
});

// 모든 채팅방 목록을 가져오는 엔드포인트
app.get('/chatrooms', async (req, res) => {
    const query = `
      SELECT DISTINCT chatroom_id
      FROM chat
    `;
  
    try {
        const connection = await pool.getConnection();
        const [results] = await connection.query(query);
        const chatrooms = results.map(row => row.chatroom_id);
        res.json(chatrooms);
        connection.release();
    } catch (err) {
        console.error('채팅방 목록 조회 오류:', err);
        res.status(500).json({ error: err.message });
    }
});

// 특정 채팅방의 현재 채팅 중인 사용자 목록을 가져오는 엔드포인트
app.get('/chatrooms/:chatroomId/users', async (req, res) => {
    const { chatroomId } = req.params;

    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT DISTINCT username FROM chat WHERE chatroom_id = ?', [chatroomId]);
        connection.release();
        const users = rows.map(row => row.username);
        res.json(users);
    } catch (error) {
        console.error('채팅방 사용자 조회 오류:', error);
        res.status(500).json({ error: error.message });
    }
});

// 유저가 참여 중인 채팅방 목록을 가져오는 엔드포인트
app.get('/users/:username/chatrooms', async (req, res) => {
    const username = req.params.username;

    const query = `
      SELECT DISTINCT chatroom_id
      FROM chat
      WHERE username = ?
    `;

    try {
        const connection = await pool.getConnection();
        const [results] = await connection.query(query, [username]);
        const chatrooms = results.map(row => row.chatroom_id);
        res.json(chatrooms);
        connection.release();
    } catch (err) {
        console.error('유저의 채팅방 목록 조회 오류:', err);
        res.status(500).json({ error: err.message });
    }
});

// 회원가입 엔드포인트
app.post('/signup', async (req, res) => {
    const { username, password, email } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const connection = await pool.getConnection();
        const sql = 'INSERT INTO users (username, password, email) VALUES (?, ?, ?)';
        const values = [username, hashedPassword, email];
        await connection.execute(sql, values);
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
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
        connection.release();

        if (rows.length > 0) {
            const hashedPasswordFromDB = rows[0].password;
            const match = await bcrypt.compare(password, hashedPasswordFromDB);

            if (match) {
                console.log('로그인 성공:', rows[0].username);
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
        console.error('로그인 오류:', err);
        res.status(500).send('로그인 오류가 발생했습니다.');
    }
});

// 임시 저장소로 사용할 객체
const emailCodes = {};
const verifiedEmails = {}; // 인증이 완료된 이메일을 저장할 객체
const users = {
  'fly1043@naver.com': {
    passwordHash: '', // 실제 비밀번호 해시값을 저장할 공간
  },
};

// SMTP 설정
const transporter = nodemailer.createTransport({
  host: 'smtp.naver.com',
  port: 465,
  secure: true, // SSL 사용
  auth: {
    user: 'fly1043@naver.com',
    pass: 'PGGN1T2X6TVQ', // 네이버 계정의 앱 비밀번호
  },
});

// 인증번호 전송 엔드포인트
app.post('/send-code', (req, res) => {
    const { email } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6자리 인증번호 생성
    emailCodes[email] = code;
  
    const mailOptions = {
      from: 'fly1043@naver.com',
      to: email,
      subject: '[WKN] 인증번호를 안내해드립니다.',
      text: `인증번호는 ${code}입니다.`,
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).send('인증번호 발송에 실패했습니다.');
      }
      res.send({ message: '인증번호가 이메일로 발송되었습니다.' });
    });
  });
  
  // 인증번호 확인 엔드포인트
  app.post('/verify-code', (req, res) => {
    const { email, code } = req.body;
    if (emailCodes[email] && emailCodes[email] === code) {
      verifiedEmails[email] = true; // 인증 성공 시 인증 상태 저장
      delete emailCodes[email]; // 인증번호 삭제
      res.send({ message: '인증이 완료되었습니다.', verified: true });
    } else {
      res.status(400).send({ message: '인증번호가 일치하지 않습니다.' });
    }
  });
  
// 비밀번호 재설정 엔드포인트
app.post('/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;

    try {
        // 인증이 완료된 경우에만 비밀번호 재설정
        if (!verifiedEmails[email]) {
            return res.status(400).send('인증되지 않은 요청입니다.');
        }

        console.log('Before password reset:', users[email]); // 비밀번호 재설정 전 상태 확인

        // 비밀번호 해싱
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // MySQL 데이터베이스에서 비밀번호 업데이트 쿼리 실행
        console.log('Executing password update query...');
        await new Promise((resolve, reject) => {
            pool.query('UPDATE users SET password = ? WHERE email = ?', [passwordHash, email], (err, result) => {
                if (err) {
                    console.error('Database update failed:', err.message);
                    reject(err);
                } else {
                    console.log('After password reset:', { email, passwordHash }); // 비밀번호 재설정 후 상태 확인
                    resolve(result);
                }
            });
        });

        // 인증 완료 상태 삭제
        delete verifiedEmails[email];

        res.send({ message: '비밀번호가 성공적으로 재설정되었습니다.' });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send('비밀번호 재설정에 실패했습니다.');
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
    res.status(200).send('로그아웃 성공');
});

// 비밀번호 확인 및 회원 탈퇴 엔드포인트
app.post('/confirmPasswordAndWithdraw', async (req, res) => {
    const { email, password } = req.body;

    try {
        const connection = await pool.getConnection();
        const [users] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length > 0) {
            const user = users[0];
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (passwordMatch) {
                // 비밀번호가 맞으면 회원 탈퇴 처리
                await connection.query('DELETE FROM comments WHERE author = ?', [email]);
                await connection.query('DELETE FROM comments WHERE post_id IN (SELECT id FROM posts WHERE author = ?)', [email]);
                await connection.query('DELETE FROM posts WHERE author = ?', [email]);

                // 사용자가 만든 채팅방과 관련된 메시지 삭제
                await connection.query(`
                    DELETE FROM chat
                    WHERE chatroom_id IN (
                        SELECT chatroom_id FROM (
                            SELECT DISTINCT chatroom_id 
                            FROM chat 
                            WHERE username = ?
                        ) as temp
                    )
                `, [user.username]);

                // 사용자가 작성한 메시지 삭제
                await connection.query('DELETE FROM chat WHERE username = ?', [user.username]);

                const [result] = await connection.query('DELETE FROM users WHERE email = ?', [email]);

                connection.release();

                if (result.affectedRows > 0) {
                    console.log('회원 탈퇴 성공:', email);
                    res.status(200).json({ success: true });
                } else {
                    console.log('회원 탈퇴 실패: 해당 이메일이 존재하지 않습니다.');
                    res.status(404).json({ success: false, message: '회원 탈퇴 실패: 해당 이메일이 존재하지 않습니다.' });
                }
            } else {
                console.log('비밀번호 불일치');
                connection.release();
                res.status(401).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
            }
        } else {
            console.log('회원 탈퇴 실패: 해당 이메일이 존재하지 않습니다.');
            connection.release();
            res.status(404).json({ success: false, message: '회원 탈퇴 실패: 해당 이메일이 존재하지 않습니다.' });
        }
    } catch (err) {
        console.error('회원 탈퇴 오류:', err);
        res.status(500).json({ success: false, message: '회원 탈퇴 오류가 발생했습니다.' });
    }
});

// 정적 파일 서빙 설정
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 게시글 작성 엔드포인트
app.post('/posts', upload.single('image'), async (req, res) => {
    const { title, content, category, author } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        const connection = await pool.getConnection();
        const [user] = await connection.execute('SELECT * FROM users WHERE email = ?', [author]);

        if (user.length === 0) {
            connection.release();
            console.log('작성자 이메일이 사용자 테이블에 없습니다.');
            return res.status(400).send('작성자 이메일이 사용자 테이블에 없습니다.');
        }

        await connection.execute(
            'INSERT INTO posts (title, content, category, author, imageUrl, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [title, content, category, author, imageUrl]
        );

        connection.release();
        console.log('게시글이 성공적으로 저장되었습니다.');
        console.log('이미지 URL:', imageUrl); // 이미지 URL 로깅
        res.status(201).send('게시글이 성공적으로 저장되었습니다.');
    } catch (error) {
        console.error('게시글 저장 실패:', error);
        res.status(500).send('게시글 저장 실패');
    }
});

// 게시글 목록 조회 엔드포인트
app.get('/posts', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT id, title, author, category, created_at FROM posts');
        connection.release();

        console.log('게시글 정보를 성공적으로 가져왔습니다.', rows);
        res.status(200).json(rows);
    } catch (error) {
        console.error('게시글 정보 가져오기 실패:', error);
        res.status(500).send('게시글 정보 가져오기 실패');
    }
});

// 특정 게시글 조회 엔드포인트
app.get('/posts/:id', async (req, res) => {
    const postId = req.params.id;

    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT title, author, content, category, imageUrl, created_at FROM posts WHERE id = ?', [postId]);
        connection.release();

        if (rows.length > 0) {
            console.log('게시글 정보:', rows[0]);
            console.log('이미지 URL:', rows[0].imageUrl); // 이미지 URL 로깅
            res.status(200).json(rows[0]);
        } else {
            res.status(404).send('게시글을 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error('게시글 정보 가져오기 실패:', error);
        res.status(500).send('게시글 정보 가져오기 실패');
    }
});

// 게시글 수정 엔드포인트
app.put('/posts/:id', async (req, res) => {
    const postId = req.params.id;
    const { title, content } = req.body;

    try {
        const connection = await pool.getConnection();
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

// 게시글 삭제 엔드포인트
app.delete('/posts/:id', async (req, res) => {
    const postId = req.params.id;

    try {
        const connection = await pool.getConnection();
        await connection.execute('DELETE FROM comments WHERE post_id = ?', [postId]);
        const [result] = await connection.execute('DELETE FROM posts WHERE id = ?', [postId]);
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

// 댓글 삭제 엔드포인트 추가
app.delete('/posts/:postId/comments/:commentId', async (req, res) => {
    const postId = req.params.postId;
    const commentId = req.params.commentId;

    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT * FROM comments WHERE comment_id = ? AND post_id = ?', [commentId, postId]);
        
        if (rows.length === 0) {
            console.error('댓글이 존재하지 않습니다.');
            connection.release();
            res.status(404).send('댓글을 찾을 수 없습니다.');
            return;
        }

        await connection.execute('DELETE FROM comments WHERE comment_id = ? AND post_id = ?', [commentId, postId]);
        connection.release();
        console.log('댓글이 성공적으로 삭제되었습니다.');
        res.status(200).send('댓글이 성공적으로 삭제되었습니다.');
    } catch (error) {
        console.error('댓글 삭제 실패:', error);
        res.status(500).send('댓글 삭제 실패');
   }
});

// 서버 시작
server.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});