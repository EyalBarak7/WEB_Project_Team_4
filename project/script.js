window.addEventListener("load", function() {

    // ==========================================
    // עמוד 1: התחברות ורישום (index.html)
    // ==========================================
    var btnNewUser = document.getElementById("btnNewUser");
    var loginForm = document.getElementById("loginForm");
    var isNewUserMode = false; 

    if (btnNewUser) {
        btnNewUser.addEventListener("click", function() {
            isNewUserMode = true;
            document.getElementById("registerFields").style.display = "block"; // מציג שדות רישום
            document.getElementById("formTitle").innerHTML = "רישום משתמש חדש";
            document.getElementById("btnSubmitForm").innerHTML = "הרשם והכנס";
            btnNewUser.style.display = "none"; 
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", function(event) {
            event.preventDefault(); // עוצר רענון דף
            
            var email = document.getElementById("email").value;
            var password = document.getElementById("password").value;
            var errorMsg = document.getElementById("loginError");

            // בדיקות חובה לכולם (אימייל וסיסמה)
            if (email.indexOf("@") == -1) {
                errorMsg.innerHTML = "שגיאה: המייל חייב להכיל @";
                return;
            }
            if (password.length < 6) {
                errorMsg.innerHTML = "שגיאה: סיסמה חייבת להיות לפחות 6 תווים";
                return;
            }

            // בדיקות מורחבות אך ורק אם הוא משתמש חדש ברישום
            if (isNewUserMode == true) {
                var fullName = document.getElementById("fullName").value;
                var department = document.getElementById("departmentSelect").value;
                var semester = document.getElementById("semesterSelect").value;

                if (fullName == "" || department == "" || semester == "") {
                    errorMsg.innerHTML = "שגיאה: חובה למלא שם מלא, מגמה וסמסטר לרישום!";
                    return;
                }
                alert("הרישום בוצע בהצלחה עבור צוער במגמת " + department + "!");
            } else {
                alert("התחברת בהצלחה!");
            }
            window.location.href = "main.html"; 
        });
    }

    // ==========================================
    // עמוד 2: עמוד המטלות הראשי (main.html)
    // ==========================================
    
    var btnShowHidden = document.getElementById("btnShowHidden");
    if (btnShowHidden) {
        btnShowHidden.addEventListener("click", function() {
            var hiddenSection = document.getElementById("hiddenSection");
            if (hiddenSection.style.display == "none") {
                hiddenSection.style.display = "block";
                btnShowHidden.innerHTML = "סגור את אזור המטלות המוסתרות";
            } else {
                hiddenSection.style.display = "none";
                btnShowHidden.innerHTML = "הסתכל על המטלות שהוסתרו";
            }
        });
    }

    var btnHide1 = document.getElementById("btnHide1");
    if (btnHide1) {
        btnHide1.addEventListener("click", function() {
            var check1 = document.getElementById("check1");
            if (check1.checked == true) {
                document.getElementById("task1").style.display = "none";  
                document.getElementById("strip1").style.display = "flex"; 
            } else {
                alert("שגיאה: לא ניתן להסתיר משימה שלא סומנה כ'הושלמה'!");
            }
        });
    }
    var btnUndo1 = document.getElementById("btnUndo1");
    if (btnUndo1) {
        btnUndo1.addEventListener("click", function() {
            document.getElementById("task1").style.display = "block";    
            document.getElementById("strip1").style.display = "none";     
            document.getElementById("check1").checked = false;            
        });
    }

    var btnHide2 = document.getElementById("btnHide2");
    if (btnHide2) {
        btnHide2.addEventListener("click", function() {
            var check2 = document.getElementById("check2");
            if (check2.checked == true) {
                document.getElementById("task2").style.display = "none";
                document.getElementById("strip2").style.display = "flex";
            } else {
                alert("שגיאה: לא ניתן להסתיר משימה שלא סומנה כ'הושלמה'!");
            }
        });
    }
    var btnUndo2 = document.getElementById("btnUndo2");
    if (btnUndo2) {
        btnUndo2.addEventListener("click", function() {
            document.getElementById("task2").style.display = "block";
            document.getElementById("strip2").style.display = "none";
            document.getElementById("check2").checked = false;
        });
    }

    // ==========================================
    // עמוד 3: הוספת מטלה (add-task.html)
    // ==========================================
    var btnSaveTask = document.getElementById("btnSaveTask");
    if (btnSaveTask) {
        btnSaveTask.addEventListener("click", function() {
            var subject = document.getElementById("subject").value;
            var details = document.getElementById("taskDetailsInput").value;
            
            if (subject == "" || details == "") {
                alert("שגיאה: חובה למלא גם את שם המקצוע וגם את פרטי המטלה!");
                return;
            }
            alert("המטלה נקלטה בהצלחה בסימולציה של מערכת הלקוח!");
            window.location.href = "main.html";
        });
    }

    // ==========================================
    // עמוד 4: יצירת קשר (contact.html)
    // ==========================================
    var contactForm = document.getElementById("contactForm");
    if (contactForm) {
        contactForm.addEventListener("submit", function(event) {
            event.preventDefault(); 
            
            var lecturer = document.getElementById("lecturerSelect").value;
            var subject = document.getElementById("contactSubject").value;
            var details = document.getElementById("contactDetails").value;

            alert("פנייתך בנושא '" + subject + "' נשלחה בהצלחה למרצה!");
            contactForm.reset();
        });
    }

});