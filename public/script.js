// משתנה גלובלי לשמירת מצב התצוגה (האם המשתמש ביקש לראות מוסתרות)
let isShowingHidden = false;

// ========================================================
// 🎨 פונקציית עזר: חישוב צבע כרטיסיית המטלה לפי הזמן הנותר
// ========================================================
function getColor(dateString) {
    if (!dateString) return "time-long"; 

    const taskDate = new Date(dateString);
    const today = new Date();
    
    if (isNaN(taskDate.getTime())) return "time-long";

    taskDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const daysDiff = Math.ceil((taskDate - today) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 3) return "time-short";   
    if (daysDiff <= 7) return "time-medium";  
    return "time-long";                       
}

// ========================================================
// 📥 1. שליפת מטלות מהשרת והצגתן במסך (פתרון הפרשים מוחלט)
// ========================================================
async function showTasks(includeHidden = false) {
    const tasksContainer = document.getElementById("tasksContainer");
    if (!tasksContainer) return; 

    try {
        // א. נשלוף תמיד קודם את המטלות הפעילות בלבד כדי לדעת בוודאות את ה-IDs שלהן
        const activeResponse = await fetch('/api/tasks');
        if (activeResponse.status === 401) {
            window.location.href = "Index.html";
            return;
        }
        const activeData = await activeResponse.json();
        const activeTasks = activeData.tasks || [];
        
        // ניצור סט (Set) של כל ה-IDs של המטלות הפעילות לצורך בדיקה מהירה
        const activeIds = new Set(activeTasks.map(t => t.taskId));

        // ב. כעת נשלוף את המטלות לפי הבקשה הנוכחית (עם או בלי המוסתרות)
        const url = includeHidden ? '/api/tasks?includeHidden=true' : '/api/tasks';
        const response = await fetch(url);
        const data = await response.json();
        const tasks = data.tasks || [];

        let activeTasksHTML = ""; 
        let hiddenTasksHTML = ""; 

        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            const formattedDate = new Date(task.date).toISOString().split('T')[0];

            // 🎯 בדיקה לוגית מוחלטת: אם ה-ID של המטלה לא קיים ברשימת הפעילות, היא בהכרח מוסתרת!
            const isTaskHidden = !activeIds.has(task.taskId);

            if (isTaskHidden) {
                // רינדור כמלבן אפור ודק (רק מקצוע, תאריך ופרטים) - מופיע רק אם כפתור ההצגה פעיל
                if (isShowingHidden) {
                    hiddenTasksHTML += "<div class='col-12 mb-2' id='task-" + task.taskId + "'>" +
                    "<div class='hidden-task-strip d-flex justify-content-between align-items-center p-2 border rounded bg-light'>" +
                        "<div>" +
                            "<strong>מקצוע:</strong> " + task.subject + " | " +
                            "<strong>תאריך:</strong> " + formattedDate + " | " +
                            "<strong>פרטים:</strong> " + task.details +
                        "</div>" +
                        "<button class='btn btn-outline-secondary btn-sm ms-2' onclick='unhideTask(" + task.taskId + ")'>בטל הסתרה</button>" +
                    "</div>" +
                    "</div>";
                }
            } else {
                // מטלה רגילה ופעילה (כותרת מודגשת ב-bold, ערך ב-not bold)
                const TaskColor = getColor(task.date);
                const isChecked = task.status === 'סיימתי' ? 'checked' : '';

                activeTasksHTML += "<div class='col-md-6 mb-3' id='task-" + task.taskId + "'>" +
                    "<div class='task-card " + TaskColor + "'>" +
                        "<h3>" + task.subject + "</h3>" +
                        "<p><strong>תאריך הגשה:</strong> " + formattedDate + "</p>" +
                        "<p><strong>רמת קושי:</strong> " + task.difficulty + "</p>" +
                        "<p><strong>פרטים:</strong> " + task.details + "</p>" +
                        "<div class='mb-2'>" +
                            "<input type='checkbox' class='task-checkbox' id='check-" + task.taskId + "' " + isChecked + " onchange='toggleTaskStatus(" + task.taskId + ")'>" +
                            "<label for='check-" + task.taskId + "'>האם השלמת את המשימה?</label>" +
                        "</div>" +
                        "<button class='btn btn-dark btn-sm' onclick='hideTask(" + task.taskId + ")'>הסתר מטלה</button>" +
                    "</div>" +
                "</div>";
            }
        }

        const totalHTML = activeTasksHTML + hiddenTasksHTML;
        tasksContainer.innerHTML = totalHTML || "<p id='noTasksMessage' class='text-center mt-4'>אין מטלות זמינות עבור המגמה והסמסטר שלך כרגע.</p>";

    } catch (error) {
        console.error("שגיאה בטעינת המטלות:", error);
    }
}

// ========================================================
// 🔎 3. פונקציית החלפת מצב משימות מוסתרות (עבור הכפתור)
// ========================================================
function toggleHiddenTasks() {
    isShowingHidden = !isShowingHidden;
    
    const toggleBtn = document.getElementById("btnToggleHidden") || document.getElementById("toggleHiddenBtn");
    if (toggleBtn) {
        toggleBtn.innerHTML = isShowingHidden ? "הסתר מטלות שהוסתרו" : "הצג מטלות שהוסתרו";
    }
    
    showTasks(isShowingHidden);
}

// חשיפת הפונקציות לחלון הגלובלי עבור ה-HTML
window.hideTask = hideTask;
window.toggleTaskStatus = toggleTaskStatus;
window.toggleHiddenTasks = toggleHiddenTasks;

// ========================================================
// 🔄 2. עדכון סטטוס מטלה (כשלוחצים על ה-Checkbox)
// ========================================================
async function toggleTaskStatus(taskId) {
    const checkBox = document.getElementById("check-" + taskId);
    const newStatus = checkBox.checked ? 'סיימתי' : 'לא התחלתי';

    try {
        await fetch('/api/tasks/' + taskId, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
    } catch (error) {
        console.error("שגיאה בעדכון הסטטוס בשרת:", error);
    }
}

// ========================================================
// 👁️ 3. הסתרת מטלה (שליחת כל השמות האפשריים לשרת)
// ========================================================
function hideTask(taskId) {
    fetch('/api/tasks/' + taskId, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            isHidden: true, 
            hidden: true, 
            is_hidden: true 
        }) 
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('השרת החזיר שגיאה: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        console.log('המטלה הוסתרה בהצלחה בשרת');
        alert("המטלה הוסתרה בהצלחה.");
        showTasks(isShowingHidden);
    })
    .catch(error => {
        console.error('שגיאה בהסתרת המטלה:', error);
        alert('אירעה שגיאה בעת ניסיון להסתיר את המטלה. ודא שסימנת את המטלה כ"סיימתי".');
    });
}

// ========================================================
// 🔓 ביטול הסתרת מטלה והחזרתה לרשימה הפעילה
// ========================================================
function unhideTask(taskId) {
    fetch('/api/tasks/' + taskId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            isHidden: false, 
            hidden: false, 
            is_hidden: false,
            active: true,
            visible: true
        }) 
    })
    .then(response => {
        if (!response.ok) throw new Error('שגיאת שרת');
        return response.json();
    })
    .then(data => {
        console.log('הסתרת המטלה בוטלה');
        alert("המטלה חזרה לרשימה הפעילה.");
        showTasks(isShowingHidden); // רענון המסך
    })
    .catch(error => {
        console.error('שגיאה בביטול ההסתרה:', error);
        alert('אירעה שגיאה. נסה שוב.');
    });
}
window.unhideTask = unhideTask; // חשיפה ל-HTML

// ========================================================
// 🔎 4. פונקציית החלפת מצב משימות מוסתרות (עבור הכפתור)
// ========================================================
function toggleHiddenTasks() {
    isShowingHidden = !isShowingHidden;
    
    const toggleBtn = document.getElementById("btnToggleHidden") || document.getElementById("toggleHiddenBtn");
    if (toggleBtn) {
        toggleBtn.innerHTML = isShowingHidden ? "הסתר מטלות שהוסתרו" : "הצג מטלות שהוסתרו";
    }
    
    showTasks(isShowingHidden);
}

// חשיפת הפונקציות לחלון הגלובלי עבור ה-HTML
window.hideTask = hideTask;
window.toggleTaskStatus = toggleTaskStatus;
window.toggleHiddenTasks = toggleHiddenTasks;

// ========================================================
// ⚡ טעינת מאזינים לאירועים ברגע שהדף מוכן (מניעת קריסות לוגין)
// ========================================================
window.addEventListener("load", function() {

    // טעינה ראשונית של המטלות
    showTasks(false);

    // הגדרת כפתור החלפת מוסתרות
    const toggleBtn = document.getElementById("btnToggleHidden") || document.getElementById("toggleHiddenBtn");
    if (toggleBtn) {
        toggleBtn.onclick = toggleHiddenTasks;
    }

    // 🔐 עמוד התחברות ורישום (Index.html)
    const btnNewUser = document.getElementById("btnNewUser");
    const loginForm = document.getElementById("loginForm");
    let isNewUserMode = false; 

    if (btnNewUser) {
        btnNewUser.addEventListener("click", function() {
            isNewUserMode = true;
            document.getElementById("registerFields").style.display = "block"; 
            document.getElementById("formTitle").innerHTML = "רישום משתמש חדש";
            document.getElementById("btnSubmitForm").innerHTML = "הירשמות";
            btnNewUser.style.display = "none"; 
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", async function(event) {
            event.preventDefault(); // מונע מהדפדפן לקרוס לדף לבן (Cannot POST /login)
            
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            const errorMsg = document.getElementById("loginError");
            if(errorMsg) errorMsg.innerHTML = ""; 

            if (!email.endsWith("@post.bgu.ac.il")) {
                if(errorMsg) errorMsg.innerHTML = "שגיאה: המייל חייב להסתיים ב- @post.bgu.ac.il";
                return;
            }
            if (password.length < 6) {
                if(errorMsg) errorMsg.innerHTML = "שגיאה: סיסמה חייבת להיות לפחות 6 תווים";
                return;
            }

            if (isNewUserMode === true) {
                const fullName = document.getElementById("fullName").value;
                const departmentSelect = document.getElementById("departmentSelect").value;
                const semesterSelect = document.getElementById("semesterSelect").value;

                if (fullName == "" || departmentSelect == "" || semesterSelect == "") {
                    if(errorMsg) errorMsg.innerHTML = "שגיאה: חובה למלא שם מלא, מגמה וסמסטר לרישום";
                    return;
                }

                try {
                    const response = await fetch('/api/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            email, password, fullName, department: departmentSelect, semester: semesterSelect      
                        })
                    });
                    
                    const data = await response.json();

                    if (response.ok) {
                        alert(data.message); 
                        isNewUserMode = false;
                        document.getElementById("registerFields").style.display = "none"; 
                        document.getElementById("formTitle").innerHTML = "התחברות למערכת";
                        document.getElementById("btnSubmitForm").innerHTML = "התחברות";
                        btnNewUser.style.display = "block";
                        loginForm.reset();
                    } else {
                        if(errorMsg) errorMsg.innerHTML = "שגיאה מהשרת: " + data.error;
                    }
                } catch (err) {
                    if(errorMsg) errorMsg.innerHTML = "שגיאת תקשורת: לא ניתן להתחבר לשרת.";
                }
            } else {
                try {
                    const response = await fetch('/api/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        alert("שלום " + data.user.fullName + ", התחברת בהצלחה!");
                        window.location.href = "main.html"; 
                    } else {
                        if(errorMsg) errorMsg.innerHTML = "שגיאה: " + data.error;
                    }
                } catch (err) {
                    if(errorMsg) errorMsg.innerHTML = "שגיאת תקשורת: לא ניתן להתחבר לשרת.";
                }
            }
        });
    }

    // ➕ עמוד הוספת מטלה
    const btnSaveTask = document.getElementById("btnSaveTask");
    if (btnSaveTask) {
        btnSaveTask.addEventListener("click", async function() {
            const subject = document.getElementById("subject").value;
            const date = document.getElementById("taskDate").value;
            const difficulty = document.getElementById("taskDifficulty").value;
            const details = document.getElementById("taskDetailsInput").value;
            
            if (subject == "" || details == "" || date == "") {
                alert("שגיאה: חובה למלא את כל השדות ההכרחיים (שם מקצוע, תאריך ופרטים)");
                return;
            }

            try {
                const response = await fetch('/api/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ subject, date, difficulty, details })
                });

                const data = await response.json();

                if (response.ok) {
                    alert(data.message);
                    window.location.href = "main.html";
                } else {
                    alert("שגיאה בהוספת המטלה: " + data.error);
                }
            } catch (error) {
                alert("שגיאה בתקשורת עם השרת.");
            }
        });
    }

    // ✉️ עמוד יצירת קשר עם המרצים
    const contactForm = document.getElementById("contactForm");
    if (contactForm) {
        contactForm.addEventListener("submit", async function(event) {
            event.preventDefault(); 
            
            const lecturer = document.getElementById("lecturerSelect").value;
            const subject = document.getElementById("contactSubject").value;
            const details = document.getElementById("contactDetails").value;

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lecturer, subject, details })
                });

                const data = await response.json();
                console.log(data);

                if (response.ok) {
                    alert(data.message);
                    contactForm.reset();
                    window.location.href = "main.html";
                } else {
                    alert("שגיאה בשליחת הפנייה: " + data.error);
                }
            } catch (error) {
                alert("שגיאה בתקשורת עם השרת.");
            }
        });
    }
});