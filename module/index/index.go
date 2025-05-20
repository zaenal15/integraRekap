package Index

import (
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	CONFIG "erekap/config"
	MODEL "erekap/module/model"
	USER "erekap/module/user"
	STRUCTS "erekap/structs"
	"fmt"
	"net/http"
	"strconv"
	"text/template"
)

func setupCorsResponse(w *http.ResponseWriter, _ *http.Request) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
	(*w).Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Authorization")
}

func GetMenus(w http.ResponseWriter, _ *http.Request) {
	db, err := CONFIG.Connect_db()
	if err != nil {
		panic(err)
	}
	defer db.Close()

	rows, err := db.Query("SELECT * FROM mst_menu a WHERE a.status = 'TRUE' ORDER BY a.order ASC, a.parent ASC, a.id ASC")
	if err != nil {
		panic(err)
	}

	response := make([]STRUCTS.Menu, 0)
	for rows.Next() {
		var Id, Order, Parent int8
		var Code, Name, Icon, Type string
		var Status bool

		err = rows.Scan(&Id, &Order, &Code, &Name, &Icon, &Status, &Parent, &Type)
		if err != nil {
			panic(err)
		}
		response = append(response, STRUCTS.Menu{
			Id:     Id,
			Order:  Order,
			Code:   Code,
			Name:   Name,
			Icon:   Icon,
			Status: Status,
			Parent: Parent,
			Type:   Type,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func Login(w http.ResponseWriter, r *http.Request) {
	setupCorsResponse(&w, r)
	login := template.Must(template.ParseFiles("views/login/login.html"))
	token, er := CONFIG.GenerateToken(32)
	if er != nil {
		panic(er)
	}
	session, _ := CONFIG.Store.Get(r, CONFIG.StoreName)
	isTimeout := "-"
	if session.Values["isTimeout"] == "yes" {
		isTimeout = "yes"
	}
	if session.Values["isTimeout"] == "no" {
		isTimeout = "no"
	}
	session.Values["isTimeout"] = "-"
	session.Values["Token"] = token
	session.Save(r, w)

	data := STRUCTS.Map{"token": token, "isTimeout": isTimeout}
	execute := login.ExecuteTemplate(w, "login", data)
	if execute != nil {
		http.Error(w, execute.Error(), http.StatusInternalServerError)
	}
}

func CheckLogin(w http.ResponseWriter, r *http.Request) {
	token := r.FormValue("token")
	username := r.FormValue("username")
	password := r.FormValue("password")
	guest := r.FormValue("guest")
	password_encrypt := md5.New()
	password_encrypt.Write([]byte(password))
	var status, logInfo, checkBlock string
	session, _ := CONFIG.Store.Get(r, CONFIG.StoreName)
	user := USER.CheckUser(username)

	if session.Values["Token"] == token {
		status = "success"
		if guest == "" {
			if user.Username != "" {
				if user.User_status == "active" {
					if hex.EncodeToString(password_encrypt.Sum(nil)) == user.Password {
						status = "success"
						logInfo = `Login success!`
						USER.UpdateLoggedDateTime(strconv.Itoa(user.Id), "last_login")
					} else {
						logInfo = `Login failed! Password incorrect!`
						status = "password-" + strconv.Itoa(user.Failed_attempts)
						USER.UpdateLoggedDateTime(strconv.Itoa(user.Id), "last_failed_pass")
						checkBlock = USER.UpdateFailedAttemtsLoggedIn(user.Name, user.Username, user.Email, user.Id, user.Failed_attempts)
						if checkBlock != "failed" {
							status = checkBlock
						}
					}
				} else {
					if user.Failed_attempts < 5 {
						status = "user"
						logInfo = `Login failed! User not active!`
					} else {
						status = "block-" + strconv.Itoa(user.Failed_attempts)
						logInfo = `Login failed! User are block because failed attempts on logged in with wrong password!`
					}
				}
			} else {
				status = "not-found"
				logInfo = `User not found!`
			}
		}
	} else {
		status = "token"
		logInfo = `Login failed! Token expired!`
	}

	if status == "success" {
		session, _ := CONFIG.Store.Get(r, CONFIG.StoreName)
		if guest != "" {
			session.Values["Id"] = "0"
			session.Values["Name"] = "Guest"
			session.Values["Username"] = "guest"
			session.Values["Nik"] = "-"
			session.Values["Group_position"] = "guest"
			session.Values["Branch_code"] = "-"
			session.Values["Position_name"] = "Guest"
			session.Values["Branch_name"] = "-"
			session.Values["Token"] = nil
		} else {
			session.Values["Id"] = user.Id
			session.Values["Name"] = user.Name
			session.Values["Username"] = user.Username
			session.Values["Nik"] = user.Email
			session.Values["Group_position"] = user.Group_position
			session.Values["Branch_code"] = user.Branch_code
			session.Values["Position_name"] = user.Position_name
			session.Values["Branch_name"] = user.Branch_name
			session.Values["Token"] = nil
		}
		session.Save(r, w)
	}

	MODEL.Log(user.Username, user.Name, `Login`, `User Login`, logInfo, status)
	js, err := json.Marshal(status)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(js)
}

func Index(w http.ResponseWriter, r *http.Request) {
	session, _ := CONFIG.Store.Get(r, CONFIG.StoreName)
	if session.Values["Username"] == nil {
		http.Redirect(w, r, "/", 302)
		return
	}

	setupCorsResponse(&w, r)
	index := template.Must(template.ParseFiles("views/template/mainHtml.html"))
	data := STRUCTS.Map{
		"Id":             session.Values["Id"],
		"Name":           session.Values["Name"],
		"Username":       session.Values["Username"],
		"Email":          session.Values["Email"],
		"Group_position": session.Values["Group_position"],
		"Position_name":  session.Values["Position_name"],
		"Branch_code":    session.Values["Branch_code"],
		"Branch_name":    session.Values["Branch_name"],
	}
	execute := index.ExecuteTemplate(w, "index", data)
	if execute != nil {
		http.Error(w, execute.Error(), http.StatusInternalServerError)
	}
}

func Logout(w http.ResponseWriter, r *http.Request) {
	isTimeout := r.FormValue("isTimeout")
	statusLogout := `Logout by timeout session.`
	if isTimeout == "" {
		isTimeout = "no"
		statusLogout = `Logout success!`
	}

	session, _ := CONFIG.Store.Get(r, CONFIG.StoreName)
	MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), `Logout`, `User logout`, statusLogout, "success")

	session.Values["Id"] = nil
	session.Values["Name"] = nil
	session.Values["Username"] = nil
	session.Values["Email"] = nil
	session.Values["Group_position"] = nil
	session.Values["Position_name"] = nil
	session.Values["isTimeout"] = isTimeout
	session.Save(r, w)
	http.Redirect(w, r, "/", 302)
}

func Home_page(w http.ResponseWriter, r *http.Request) {
	setupCorsResponse(&w, r)
	login := template.Must(template.ParseFiles("../views/home_page/home_page.html"))
	menu := r.FormValue("menu")
	session, _ := CONFIG.Store.Get(r, CONFIG.StoreName)
	fmt.Println(session.Values["Username"])

	data := STRUCTS.Map{
		"Id":             session.Values["Id"],
		"Name":           session.Values["Name"],
		"Username":       session.Values["Username"],
		"Email":          session.Values["Email"],
		"Group_position": session.Values["Group_position"],
		"Position_name":  session.Values["Position_name"],
		"Branch_code":    session.Values["Branch_code"],
		"Branch_name":    session.Values["Branch_name"],
		"Menu":           menu,
	}
	execute := login.ExecuteTemplate(w, "home_page", data)
	if execute != nil {
		http.Error(w, execute.Error(), http.StatusInternalServerError)
	}
}
