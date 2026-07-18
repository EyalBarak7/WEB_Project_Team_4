-- יצירת מסד הנתונים עם תמיכה מלאה בעברית

CREATE DATABASE IF NOT EXISTS checklist_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE checklist_db;

-- ביטול זמני של בדיקת מפתחות זרים כדי לאפשר מחיקה חלקה
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS User_Task_State;
DROP TABLE IF EXISTS Tasks;
DROP TABLE IF EXISTS Course_Faculty;
DROP TABLE IF EXISTS Contact_Inquiries;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Courses;
DROP TABLE IF EXISTS Faculty;
DROP TABLE IF EXISTS Semesters;
DROP TABLE IF EXISTS Departments;

-- החזרת בדיקת מפתחות זרים לפעולה
SET FOREIGN_KEY_CHECKS = 1;

-- מכאן והלאה יבואו פקודות ה-CREATE TABLE שלך...
-- ==========================================
-- 1. טבלאות תשתית (ללא מפתחות זרים)
-- ==========================================

-- טבלת סמסטרים
CREATE TABLE Semesters (
    semester_id INT AUTO_INCREMENT PRIMARY KEY,
    semester_name VARCHAR(50) UNIQUE NOT NULL
);

-- טבלת מגמות לימוד
CREATE TABLE Departments (
    department_id INT AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(100) UNIQUE NOT NULL
);

-- טבלת סגל אקדמי (מרצים ומתרגלים)
CREATE TABLE Faculty (
    faculty_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) NULL,
    role_type ENUM('מרצה', 'מתרגל') NOT NULL DEFAULT 'מרצה'
);

-- ==========================================
-- 2. טבלאות תלויות (כוללות מפתחות זרים)
-- ==========================================

-- טבלת משתמשים (צוערי קורס טיס)
CREATE TABLE Users (
    user_id CHAR(36) DEFAULT (UUID()) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    department_id INT NOT NULL,
    semester_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    
    -- אילוץ המבטיח רישום רק עם מייל אוניברסיטאי
    CONSTRAINT chk_email_domain CHECK (email LIKE '%@post.bgu.ac.il'),
    
    FOREIGN KEY (department_id) REFERENCES Departments(department_id),
    FOREIGN KEY (semester_id) REFERENCES Semesters(semester_id)
);

-- טבלת קורסים ומקצועות
CREATE TABLE Courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    course_name VARCHAR(100) UNIQUE NOT NULL,
    department_id INT NULL,
    semester_id INT NULL,
    FOREIGN KEY (department_id) REFERENCES Departments(department_id),
    FOREIGN KEY (semester_id) REFERENCES Semesters(semester_id)
);

-- טבלת גישור: שיוך סגל לקורסים (קשר רבים לרבים)
CREATE TABLE Course_Faculty (
    course_id INT NOT NULL,
    faculty_id INT NOT NULL,
    is_primary_lecturer BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (course_id, faculty_id),
    FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES Faculty(faculty_id) ON DELETE CASCADE
);

-- ==========================================
-- 3. טבלאות ליבה תפעוליות (מתוקן)
-- ==========================================

-- טבלת מטלות בית (גלובלית - רק פרטי המטלה)
CREATE TABLE Tasks (
    task_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL, -- הסטודנט שהעלה ויצר את המטלה המקורית
    course_id INT NOT NULL,
    due_date DATE NOT NULL,
    difficulty_level ENUM('קל', 'בינוני', 'קשה') NOT NULL DEFAULT 'קל',
    task_details TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES Courses(course_id)
);

-- טבלת מצב מטלה למשתמש (פרסונלית - כאן קורה הקסם של ההסתרה והסטטוס הפרטי)
CREATE TABLE User_Task_State (
    user_id CHAR(36) NOT NULL,
    task_id BIGINT NOT NULL,
    status ENUM('לא התחלתי', 'בעבודה', 'סיימתי') NOT NULL DEFAULT 'לא התחלתי',
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (user_id, task_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES Tasks(task_id) ON DELETE CASCADE,
    
    -- הלוגיקה העסקית שלך נשמרת כאן ברמה האישית!
    CONSTRAINT chk_hidden_status CHECK (is_hidden = FALSE OR (is_hidden = TRUE AND status = 'סיימתי'))
);

-- טבלת פניות למרצים (ללא שינוי)
CREATE TABLE Contact_Inquiries (
    inquiry_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    faculty_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES Faculty(faculty_id)
);

-- ==========================================
-- 4. הכנסת נתוני תשתית בסיסיים (אופציונלי - לבדיקה)
-- ==========================================

INSERT INTO Semesters (semester_name) VALUES ("semD"), ("semH"), ("semV");
INSERT INTO Departments (department_name) VALUES ("data-base"), ("politics"), ("computer-science");

INSERT IGNORE INTO Faculty (faculty_id, full_name, email, role_type) 
VALUES (1, 'אייל ברק', 'eyalbarak6@gmail.com', null);
INSERT IGNORE INTO Faculty (faculty_id, full_name, email, role_type) 
VALUES (2, 'איציק גורביץ', 'XXXXXX@post.bgu.ac.il', null);
