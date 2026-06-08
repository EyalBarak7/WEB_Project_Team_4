
// מערך דמוי בסיס נתונים 
var sampleTasks = [
    { id: 1, subject: "פיזיקה 2", date: "2026-06-09", difficulty: "קשה", details: "להגיש תרגילי בית 1 עד 4 בפורטל.", isHidden: false },
    { id: 2, subject: "חקר ביצועים", date: "2026-06-15", difficulty: "קל", details: "לפתור את שאלות הסימולציה.", isHidden: false },
    { id: 3, subject: "בסיסי נתונים", date: "2026-07-20", difficulty: "בינוני", details: "פרויקט הגשה מסכם.", isHidden: false }
];

// פונקציה לחישוב זמן נותק להגשה עבור שינוי צבע בהתאם
function getColor(dateString) {
    var daysDiff = Math.ceil((new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 3) {
        return "time-short"; 
    }
    if (daysDiff <= 7) {
        return "time-medium"; 
    }
    return "time-long";       
}
//הפונקציה הראשית שאחראית על הצגת כלל התיבות בהתאם למערך
function showTasks() {
    var tasksContainer = document.getElementById("tasksContainer");
    var hiddenTasksList = document.getElementById("hiddenTasksList");

    // בודק שאנחנו בעמוד הנכון
    if (tasksContainer && hiddenTasksList) {
        
        // ניקוי התוכן הקודם
        tasksContainer.innerHTML = "";
        hiddenTasksList.innerHTML = "";

        // לולאה שעוברת על כל המטלות במערך
        for (var i = 0; i < sampleTasks.length; i++) {
            var task = sampleTasks[i];

            // בודק אם המטלה לא מוסתרת ומציג אותה בהתאם
            if (task.isHidden === false) {
                var TaskColor = getColor(task.date);

                var TaskCard = "<div class='col-md-6 mb-3' id='task-" + task.id + "'>" +
                    "<div class='task-card " + TaskColor + "'>" +
                        "<h3>" + task.subject + "</h3>" +
                        "<p>תאריך הגשה: <strong>" + task.date + "</strong></p>" +
                        "<p>רמת קושי: " + task.difficulty + "</p>" +
                        "<p><strong>פרטים:</strong> " + task.details + "</p>" +
                        "<div class='mb-2'>" +
                            "<input type='checkbox' class='task-checkbox' id='check-" + task.id + "'>" +
                            "<label for='check-" + task.id + "'>האם השלמת את המשימה?</label>" +
                        "</div>" +
                        "<button class='btn btn-dark btn-sm' onclick='hideTask(" + task.id + ")'>הסתר מטלה</button>" +
                    "</div>" +
                "</div>";

                tasksContainer.innerHTML = tasksContainer.innerHTML + TaskCard;
            } 
            // אם המטלה מוסתרת
            else {
                var stripHtml = "<div id='strip-" + task.id + "' class='hidden-task-strip d-flex justify-content-between align-items-center mb-2' style='padding: 10px; border: 1px solid #ccc; background: #f9f9f9;'>" +
                    "<div>" +
                        "<h5 class='mb-0'>" + task.subject + "</h5>" +
                        "<small class='text-muted'>פרטים: " + task.details + "</small>" +
                    "</div>" +
                    "<button type='button' class='btn btn-secondary btn-sm' onclick='undoHide(" + task.id + ")'>בטל הסתרה</button>" +
                "</div>";

                hiddenTasksList.innerHTML = hiddenTasksList.innerHTML + stripHtml;
            }
        }
    }
}

//כפתור הסתרה
function hideTask(id) {
    var checkBox = document.getElementById("check-" + id);
    if (checkBox && checkBox.checked == true) {
        
        for (var i = 0; i < sampleTasks.length; i++) {
            if (sampleTasks[i].id === id) {
                sampleTasks[i].isHidden = true;
            }
        }
        showTasks(); 
    } else {
        alert("לא ניתן להסתיר מטלה שלא הושלמה");
    }
}

// ביטול הסתרה
function undoHide(id) {
    for (var i = 0; i < sampleTasks.length; i++) {
        if (sampleTasks[i].id === id) {
            sampleTasks[i].isHidden = false;
        }
    }
    showTasks(); 
}



window.addEventListener("load", function() {

 // הפעלת דף הmain
    showTasks();

    // כפתור הצגת והסתרת המטלות שהוסתרו
    var btnShowHidden = document.getElementById("btnShowHidden");
    var hiddenSection = document.getElementById("hiddenSection");
    if (btnShowHidden && hiddenSection) {
        btnShowHidden.addEventListener("click", function() {
            if (hiddenSection.style.display === "none") {
                hiddenSection.style.display = "block";
                btnShowHidden.innerText = "הסתר את המטלות שהוסתרו";
            } else {
                hiddenSection.style.display = "none";
                btnShowHidden.innerText = "הצג על המטלות שהוסתרו";
            }
        });
    }

    // עמוד התחברות
    var btnNewUser = document.getElementById("btnNewUser");
    var loginForm = document.getElementById("loginForm");
    var isNewUserMode = false; 

    if (btnNewUser) {
        btnNewUser.addEventListener("click", function() {
            isNewUserMode = true;
            document.getElementById("registerFields").style.display = "block"; 
            document.getElementById("formTitle").innerHTML = "רישום משתמש חדש";
            document.getElementById("btnSubmitForm").innerHTML = " הירשמות";
            btnNewUser.style.display = "none"; 
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", function(event) {
            event.preventDefault(); 
            
            var email = document.getElementById("email").value;
            var password = document.getElementById("password").value;
            var errorMsg = document.getElementById("loginError");

            if (email.indexOf("@post.bgu.ac.il") == -1) {
                errorMsg.innerHTML = "שגיאה: המייל חייב להכיל @post.bgu.ac.il";
                return;
            }
            if (password.length < 6) {
                errorMsg.innerHTML = "שגיאה: סיסמה חייבת להיות לפחות 6 תווים";
                return;
            }

            if (isNewUserMode == true) {
                var fullName = document.getElementById("fullName").value;
                var department = document.getElementById("departmentSelect").value;
                var semester = document.getElementById("semesterSelect").value;

                if (fullName == "" || department == "" || semester == "") {
                    errorMsg.innerHTML = "שגיאה: חובה למלא שם מלא, מגמה וסמסטר לרישום";
                    return;
                }
                alert("הרישום בוצע בהצלחה עבור צוער במגמת " + department + "!");
            } else {
                alert("התחברת בהצלחה!");
            }
            window.location.href = "main.html"; 
        });
    }

    // עמוד הוספת מטלה
    var btnSaveTask = document.getElementById("btnSaveTask");
    if (btnSaveTask) {
        btnSaveTask.addEventListener("click", function() {
            var subject = document.getElementById("subject").value;
            var details = document.getElementById("taskDetailsInput").value;
            
            if (subject == "" || details == "") {
                alert("שגיאה: חובה למלא גם את שם המקצוע וגם את פרטי המטלה");
                return;
            }
            alert("המטלה נקלטה בהצלחה במערכת");
            // בהוספת בסיס נתונים הפרטים יקלטו לתוכו בהתאם לממגמת וסמסטר המשתמש
            window.location.href = "main.html";
        });
    }

    // עמוד יצירת קשר עם המרצים
    var contactForm = document.getElementById("contactForm");
    if (contactForm) {
        contactForm.addEventListener("submit", function(event) {
            event.preventDefault(); 
            
            var lecturer = document.getElementById("lecturerSelect").value;
            var subject = document.getElementById("contactSubject").value;
            var details = document.getElementById("contactDetails").value;

            alert("פנייתך בנושא '" + subject + "' נשלחה בהצלחה למרצה!");
            contactForm.reset();
            window.location.href = "main.html";
        });
    }

});