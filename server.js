import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// טעינת משתני הסביבה מקובץ .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// הגדרות תשתית 
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // מאפשר קריאה וכתיבה של עוגיות (Cookies)

//  חיבור לבסיס הנתונים 
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// בדיקת חיבור ראשונית ל-DB
db.getConnection()
    .then(conn => {
        console.log("✅ החיבור למסד הנתונים MySQL הצליח!");
        conn.release();
    })
    .catch(err => {
        console.error("❌ שגיאה בחיבור למסד הנתונים. ודא שהפרטים ב-.env נכונים ושבסיס הנתונים פעיל:", err.message);
    });


// 🚀 Routes - נתיבי API לטיפול בבקשות

// 1. התחברות משתמש (Login)
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "חובה להזין אימייל וסיסמה." });
    }
    if (!email.endsWith("@post.bgu.ac.il")) {
        return res.status(400).json({ error: "המייל חייב להסתיים ב- @post.bgu.ac.il" });
    }

    try {
        // שליפת המשתמש לפי אימייל
        const [users] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(401).json({ error: "אימייל או סיסמה שגויים." });
        }

        const user = users[0];

        // בדיקת סיסמה (השוואה פשוטה לצורך פיתוח, במציאות נשתמש ב-bcrypt)
        if (user.password_hash !== password) {
            return res.status(401).json({ error: "אימייל או סיסמה שגויים." });
        }

        // עדכון זמן התחברות אחרון
        await db.query('UPDATE Users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?', [user.user_id]);

        // שמירת פרטי המשתמש בעוגיה למשך 24 שעות כדי "לזכור" אותו
        res.cookie('user_session', JSON.stringify({
            userId: user.user_id,
            departmentId: user.department_id,
            semesterId: user.semester_id,
            fullName: user.full_name
        }), { maxAge: 48 * 60 * 60 * 1000, httpOnly: true });

        return res.status(200).json({ message: "התחברת בהצלחה!", user: { fullName: user.full_name } });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "שגיאת שרת פנימית." });
    }
});

// 2. הרשמת משתמש חדש (Register)
app.post('/api/register', async (req, res) => {

    // הוסף את ההדפסות האלו כדי לראות מה באמת מגיע מהלקוח
console.log("Received Department:", `"${req.body.department}"`);
console.log("Received Semester:", `"${req.body.semester}"`);

const departmentSelect = req.body.department ? req.body.department.trim() : "";
const semesterSelect = req.body.semester ? req.body.semester.trim() : "";

    const { email, password, fullName} = req.body;
    console.log("Received Email:", `"${email}"+"${password}"+"${fullName}"+"${departmentSelect}"+"${semesterSelect}"`);
    if (!email || !password || !fullName || !departmentSelect || !semesterSelect) {
        return res.status(400).json({ error: "חובה למלא את כל השדות." });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: "הסיסמה חייבת להכיל לפחות 6 תווים." });
    }

    try {
        // בדיקה האם המייל כבר תפוס
        const [existing] = await db.query('SELECT user_id FROM Users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: "משתמש עם אימייל זה כבר קיים במערכת." });
        }

    const [deptResult] = await db.query('SELECT department_id FROM Departments WHERE department_name = ?', [departmentSelect]);
    const [semResult] = await db.query('SELECT semester_id FROM Semesters WHERE semester_name = ?', [semesterSelect]);

    console.log("Rows found in Departments:", JSON.stringify(deptResult));
    console.log("Rows found in Semesters:", JSON.stringify(semResult));

    if (deptResult.length === 0 || semResult.length === 0) {
        return res.status(400).json({ error: "מגמה או סמסטר לא תקינים." });
    }

    const deptId = deptResult[0].department_id;
    const semId = semResult[0].semester_id;

        await db.query(
            'INSERT INTO Users (email, password_hash, full_name, department_id, semester_id) VALUES (?, ?, ?, ?, ?)',
            [email, password, fullName, deptId, semId]
        );

        return res.status(201).json({ message: "המשתמש נרשם בהצלחה! כעת ניתן להתחבר." });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "שגיאת שרת פנימית ברישום המשתמש." });
    }
});

async function cleanOldTasks() {
    try {
        const findOldTasksQuery = `SELECT task_id FROM Tasks WHERE due_date < NOW() - INTERVAL 3 DAY`;
        const [oldTasks] = await db.query(findOldTasksQuery);

        if (oldTasks.length > 0) {
            const taskIds = oldTasks.map(task => task.task_id);
            // מחיקה מטבלת הקשר קודם
            await db.query(`DELETE FROM User_Task_State WHERE task_id IN (?)`, [taskIds]);
            // מחיקת המטלות עצמן
            await db.query(`DELETE FROM Tasks WHERE task_id IN (?)`, [taskIds]);
            console.log(`${taskIds.length} מטלות ישנות נמחקו אוטומטית.`);
        }
    } catch (error) {
        console.error('שגיאה בתהליך הניקוי האוטומטי:', error);
    }
}

// 3. קבלת מטלות מסוננות (שיתופי + מניעת הצגת מוסתרות + ניקוי אוטומטי של ישנות)
app.get('/api/tasks', async (req, res) => {
    const sessionCookie = req.cookies.user_session;
    if (!sessionCookie) {
        return res.status(401).json({ error: "משתמש אינו מחובר." });
    }

    const { userId, departmentId, semesterId } = JSON.parse(sessionCookie);
    
    //  בדיקה האם הלקוח ביקש לראות גם משימות מוסתרות 
    const includeHidden = req.query.includeHidden === 'true';

    // קריאה לפונקציית הניקוי האוטומטי לפני ששולפים את הנתונים ללקוח
    await cleanOldTasks();

    try {
        let query = `
            SELECT 
                t.task_id AS taskId, 
                c.course_name AS subject, 
                t.due_date AS date, 
                t.difficulty_level AS difficulty, 
                t.task_details AS details,
                COALESCE(uts.status, 'לא התחלתי') AS status
            FROM Tasks t
            JOIN Courses c ON t.course_id = c.course_id
            LEFT JOIN User_Task_State uts ON t.task_id = uts.task_id AND uts.user_id = ?
            WHERE c.department_id = ? AND c.semester_id = ?
        `;

        // אם המשתמש לא ביקש במפורש לראות מוסתרות, נסנן אותן החוצה כמו קודם
        if (!includeHidden) {
            query += ` AND (uts.is_hidden IS NULL OR uts.is_hidden = FALSE) `;
        }

        query += ` ORDER BY t.due_date ASC `;

        const [tasks] = await db.query(query, [userId, departmentId, semesterId]);
        return res.status(200).json({ tasks });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "שגיאה בשליפת המטלות." });
    }
});

// 4. הוספת מטלה חדשה (שיתופית לכל החברים במגמה ובסמסטר)
app.post('/api/tasks', async (req, res) => {
    const sessionCookie = req.cookies.user_session;
    if (!sessionCookie) {
        return res.status(401).json({ error: "משתמש אינו מחובר." });
    }

    const { userId, departmentId, semesterId } = JSON.parse(sessionCookie);
    const { subject, date, difficulty, details } = req.body;

    if (!subject || !date || !details) {
        return res.status(400).json({ error: "חובה למלא שם קורס, תאריך ופרטי מטלה." });
    }

    try {
        // בדיקה האם הקורס קיים כבר עבור המגמה והסמסטר האלו
        let [courseResult] = await db.query(
            'SELECT course_id FROM Courses WHERE course_name = ? AND department_id = ? AND semester_id = ?',
            [subject, departmentId, semesterId]
        );

        let courseId;
        if (courseResult.length === 0) {
            // אם הקורס לא קיים - ניצור אותו אוטומטית לטובת המגמה הזו
            const [insertCourse] = await db.query(
                'INSERT INTO Courses (course_name, department_id, semester_id) VALUES (?, ?, ?)',
                [subject, departmentId, semesterId]
            );
            courseId = insertCourse.insertId;
        } else {
            courseId = courseResult[0].course_id;
        }

        // הכנסת המטלה החדשה לרמת המקרו (גלובלית למגמה)
        await db.query(
            'INSERT INTO Tasks (user_id, course_id, due_date, difficulty_level, task_details) VALUES (?, ?, ?, ?, ?)',
            [userId, courseId, date, difficulty || 'קל', details]
        );

        return res.status(201).json({ message: "המטלה נוספה בהצלחה ופתוחה כעת לכל חברי המגמה שלך!" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "שגיאה בהוספת המטלה." });
    }
});

// 5. עדכון סטטוס מטלה או העברה להסתרה (אישי בלבד!)
app.put('/api/tasks/:id', async (req, res) => {
    const sessionCookie = req.cookies.user_session;
    if (!sessionCookie) {
        return res.status(401).json({ error: "משתמש אינו מחובר." });
    }

    const { userId } = JSON.parse(sessionCookie);
    const taskId = req.params.id;
    const { status, isHidden } = req.body;

    try {
        // שליפת המצב הקיים של המשתמש למטלה זו
        const [existing] = await db.query(
            'SELECT * FROM User_Task_State WHERE user_id = ? AND task_id = ?',
            [userId, taskId]
        );

        let currentStatus = status || (existing.length > 0 ? existing[0].status : 'לא התחלתי');
        let currentHidden = isHidden !== undefined ? isHidden : (existing.length > 0 ? existing[0].is_hidden : false);

        if (currentHidden === true && currentStatus !== 'סיימתי') {
            return res.status(400).json({ error: "חובה לסמן את המטלה כ'סיימתי' לפני שניתן להסתיר אותה." });
        }

        const query = `
            INSERT INTO User_Task_State (user_id, task_id, status, is_hidden)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE status = VALUES(status), is_hidden = VALUES(is_hidden)
        `;

        await db.query(query, [userId, taskId, currentStatus, currentHidden]);
        return res.status(200).json({ message: "מצב המטלה האישי שלך עודכן בהצלחה!" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "שגיאה בעדכון מצב המטלה." });
    }
});

// 6. יצירת קשר עם מרצה (סימולציית שליחת אימייל ושמירה ב-DB)
app.post('/api/contact', async (req, res) => {
    const sessionCookie = req.cookies.user_session;
    if (!sessionCookie) {
        return res.status(401).json({ error: "משתמש אינו מחובר." });
    }

    const { userId } = JSON.parse(sessionCookie);
    const { lecturer, subject, details } = req.body;

    if (!lecturer || !subject || !details) {
        return res.status(400).json({ error: "חובה למלא את כל שדות הפנייה." });
    }

    try {
        // מציאת ה-ID של המרצה מתוך טבלת Faculty לפי השם שלו
        const [faculty] = await db.query('SELECT faculty_id, email FROM Faculty WHERE faculty_id = ?', [lecturer]);
        if (faculty.length === 0) {
            return res.status(400).json({ error: "המרצה המבוקש לא נמצא במערכת." });
        }

        const facultyId = faculty[0].faculty_id;
        const facultyEmail = faculty[0].email;

        // שמירת הפנייה בבסיס הנתונים (הטבלה שיצרת ב-SQL)
        await db.query(
            'INSERT INTO Contact_Inquiries (user_id, faculty_id, subject, details) VALUES (?, ?, ?, ?)',
            [userId, facultyId, subject, details]
        );

        // סימולציית שליחת מייל אמיתי לקונסול
        console.log(` מייל נשלח בהצלחה אל המרצה בכתובת: ${facultyEmail}`);
        console.log(`נושא: ${subject}`);
        console.log(`תוכן: ${details}`);

        return res.status(201).json({ message: `פנייתך נשמרה ונשלחה בהצלחה למרצה בדוא"ל: ${facultyEmail}` });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "שגיאה בשליחת הפנייה למרצה." });
    }
});

// 7. התנתקות משתמש (Logout)
app.get('/api/logout', (req, res) => {
    res.clearCookie('user_session'); // מחיקת עוגיית ההתחברות
    return res.status(200).json({ message: "התנתקת בהצלחה!" });
});

// נתיב דף הבית

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Index.html'));
});



// הפעלת השרת
app.listen(PORT, () => {
    console.log(` השרת פועל בהצלחה!`);
    console.log(`כנס בדפדפן לכתובת: http://localhost:${PORT}`);
});