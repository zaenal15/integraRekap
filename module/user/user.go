package user

import (
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	CONFIG "erekap/config"
	MODEL "erekap/module/model"
	STRUCTS "erekap/structs"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"
)

func CheckUser(username string) STRUCTS.User_info {
	db, err := CONFIG.Connect_db()
	if err != nil {
		fmt.Println(err.Error())
	}
	defer db.Close()

	var user = STRUCTS.User_info{}
	sql := `
		SELECT 
			a.*, 
			b.position_name 
		FROM mst_user a
			LEFT JOIN mst_user_position b ON a.group_position = b.position_id
    WHERE
    	username = '` + username + `' OR a.email = '` + username + `'
		ORDER BY a.id ASC 
		LIMIT 1`
	fmt.Println(sql)
	err = db.QueryRow(sql).
		Scan(&user.Id, &user.Name, &user.Username, &user.Email, &user.Password, &user.User_status, &user.Group_position, &user.Failed_attempts, &user.Last_login, &user.Last_failed_pass, &user.Position_name)
	if err != nil {
		fmt.Println(err.Error())
	}

	// RESET FAILED ATTEMTPS COUNTER IF LAST login ARE PAST 2 DAYS FOR ACTIVE USERS ONLY --ir
	dateFormat := "2006-01-02 15:04:05"
	dateNow, _ := time.Parse(dateFormat, time.Now().Format(dateFormat))
	dateLastLogin, _ := time.Parse(dateFormat, user.Last_failed_pass)
	diffDate := dateNow.Sub(dateLastLogin)
	hours := int(diffDate.Hours())
	if hours >= 48 {
		table := "mst_user"
		set := "failed_attempts = 0"
		where := "user_status = 'active'"
		update := MODEL.Update(set, where, table)
		if update != nil {
			fmt.Println(err.Error())
		}
	}

	return user
}

func UpdateFailedAttemtsLoggedIn(name string, username string, nik string, id int, attempts int) string {
	db, err := CONFIG.Connect_db()
	if err != nil {
		fmt.Println(err.Error())
	}
	defer db.Close()

	var status, statusBlock, logInfo, logInfoBlock string

	attempts++
	table := "mst_user"
	set := "failed_attempts = " + strconv.Itoa(attempts) + ""
	where := "id = " + strconv.Itoa(id) + ""
	update := MODEL.Update(set, where, table)
	if update != nil {
		status = "failed"
		logInfo = "Failed to update failed attempts counting. <br> Name : " + name + " <br> Username : " + username + " <br> Nik : " + nik + " <br> Failed Attempts : " + strconv.Itoa(attempts) + " attempt(s)"
	} else {
		status = "password-" + strconv.Itoa(attempts)
		logInfo = "Success to update failed attempts counting. <br> Name : " + name + " <br> Username : " + username + " <br> Nik : " + nik + " <br> Failed Attempts : " + strconv.Itoa(attempts) + " attempt(s)"

		if attempts >= 5 {
			set := "user_status = 'inactive'"
			where := "id = " + strconv.Itoa(id) + ""
			update := MODEL.Update(set, where, table)
			if update != nil {
				statusBlock = "failed"
				logInfoBlock = "Failed to block user after " + strconv.Itoa(attempts) + " login attempts with wrong password. <br> Name : " + name + " <br> Username : " + username + " <br> Nik : " + nik + ""
			} else {
				statusBlock = "block-" + strconv.Itoa(attempts)
				logInfoBlock = "Success to block user after " + strconv.Itoa(attempts) + " login attempts with wrong password. <br> Name : " + name + " <br> Username : " + username + " <br> Nik : " + nik + ""
			}
			MODEL.Log(username, name, "Block User", "Failed attempts on login", logInfoBlock, statusBlock)
		}
	}

	MODEL.Log(username, name, "Failed attempts on login", "Password incorrect", logInfo, status)
	if statusBlock != "" {
		status = statusBlock
	}
	return status
}

func LoadUserMenu(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	var level = STRUCTS.Menu_level{}
	userGroup := r.FormValue("userGroup")

	q := `
		SELECT 
			a.*, b.position_name, c.name as menu_name, c.type as menu_type 
		FROM 
			mst_menu_level a, mst_user_position b, mst_menu c 
		WHERE 
			a.user_group = b.position_id
			AND a.menu_id = c.code
			AND b.position_status = 'active'
			AND a.user_group = '` + userGroup + `'
	`

	fmt.Println(q)

	rows, err := db.Query(q)
	CONFIG.CheckErr(err)

	results := STRUCTS.Map{}

	for rows.Next() {
		err = rows.Scan(
			&level.Id,
			&level.UserGroup,
			&level.MenuId,
			&level.View,
			&level.Insert,
			&level.Update,
			&level.Delete,
			&level.Approve,
			&level.Print,
			&level.Upload,
			&level.Reason,
			&level.Auth,
			&level.Position_name,
			&level.Menu_name,
			&level.Menu_type,
		)

		if err != nil {
			panic(err)
		}
		results[level.MenuId] = STRUCTS.Map{
			"Id":            level.Id,
			"UserGroup":     level.UserGroup,
			"Position_name": level.Position_name,
			"MenuId":        level.MenuId,
			"Menu_name":     level.Menu_name,
			"Menu_type":     level.Menu_type,
			"View":          level.View,
			"Insert":        level.Insert,
			"Update":        level.Update,
			"Delete":        level.Delete,
			"Approve":       level.Approve,
			"Print":         level.Print,
			"Upload":        level.Upload,
			"Reason":        level.Reason,
			"Auth":          level.Auth,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(results)
}

func LoadGroupPositon(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	var whereUserGroup string
	var position = STRUCTS.Group_Position{}
	userGroup := r.FormValue("userGroup")

	if userGroup != "" {
		whereUserGroup = ` AND a.position_id = "` + userGroup + `"`

	}

	q := `
		SELECT a.* 
		FROM mst_user_position a 
		WHERE 1=1
		AND position_status = 'active'
			` + whereUserGroup + `
	`

	rows, err := db.Query(q)
	CONFIG.CheckErr(err)

	results := STRUCTS.Map{}

	for rows.Next() {
		err = rows.Scan(
			&position.Position_id,
			&position.Position_name,
			&position.Position_status,
		)

		if err != nil {
			panic(err)
		}
		results[position.Position_id] = STRUCTS.Map{
			"position_id":     position.Position_id,
			"position_name":   position.Position_name,
			"position_status": position.Position_status,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(results)
}

func LoadUserLists(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	var whereUserGroup string
	var user = STRUCTS.User_info{}
	userGroup := r.FormValue("userGroup")

	if userGroup != "" {
		whereUserGroup = ` AND b.position_id = '` + userGroup + `'`

	}

	q := `
		SELECT a.*, b.position_name 
		FROM mst_user a, mst_user_position b 
		WHERE 1=1
		AND a.GROUP_POSITION = b.POSITION_ID
			` + whereUserGroup + `
	`

	fmt.Println(q)

	rows, err := db.Query(q)
	CONFIG.CheckErr(err)

	results := STRUCTS.Map{}

	for rows.Next() {
		err = rows.Scan(
			&user.Id,
			&user.Name,
			&user.Username,
			&user.Email,
			&user.Password,
			&user.User_status,
			&user.Group_position,
			&user.Failed_attempts,
			&user.Last_login,
			&user.Last_failed_pass,
			&user.Position_name,
		)

		if err != nil {
			panic(err)
		}
		results[user.Username] = STRUCTS.Map{
			"id":               user.Id,
			"name":             user.Name,
			"username":         user.Username,
			"email":            user.Email,
			"password":         user.Password,
			"user_status":      user.User_status,
			"group_position":   user.Group_position,
			"failed_attempts":  user.Failed_attempts,
			"last_login":       user.Last_login,
			"last_failed_pass": user.Last_failed_pass,
			"position_name":    user.Position_name,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(results)
}

func AddGroup(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()
	table := "mst_user_position"
	countGroup, err := MODEL.CheckRow("position_id != 'guest'", table)
	CONFIG.CheckErr(err)
	position_id := "EP" + CONFIG.PadZero(strconv.Itoa(int(countGroup)), 2)
	position_name := r.FormValue("position_name")

	var status, logInfo string

	column := "position_id, "
	column += "position_name"
	values := "'" + position_id + "', "
	values += "'" + position_name + "'"
	insert := MODEL.Insert(column, values, table)
	if insert != nil {
		status = "failed"
		logInfo = "Failed to add new group. <br> ID : " + position_id + " <br> Position Name : " + position_name + ""
	} else {
		status = "success"
		logInfo = "Success to add new group. <br> ID : " + position_id + " <br> Position Name : " + position_name + ""

		rows, err := db.Query(`SELECT code FROM mst_menu WHERE 1=1 ORDER BY "order" ASC, PARENT ASC, id ASC`)
		if err != nil {
			panic(err)
		}

		for rows.Next() {
			var Code string

			err = rows.Scan(&Code)
			if err != nil {
				panic(err)
			}

			table := "mst_menu_level"
			column := `user_group, menu_id, "view", "insert", "update", "delete", "approve", "print", "upload", "reason", "auth"`
			values := "'" + position_id + "', '" + Code + "', 1, 1, 1, 1, 1, 1, 1, 1, 1"
			insert := MODEL.Insert(column, values, table)
			if insert != nil {
				status = "failed"
				logInfo = "Failed to add privilages on this menu : " + position_id + ""
			} else {
				status = "success|" + position_id
				logInfo = "Success to add privilages on this menu : " + position_id + ""
			}
		}
	}

	session, _ := CONFIG.Store.Get(r, "cookie-name")
	MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "User Lists", "Add Group", logInfo, status)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(status)
}

func RenameGroup(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	position_id := r.FormValue("position_id")
	old_position_name := r.FormValue("old_position_name")
	new_position_name := r.FormValue("new_position_name")

	var status, logInfo string

	table := "mst_user_position"
	where := "position_id = '" + position_id + "'"
	set := "position_name = '" + new_position_name + "'"
	update := MODEL.Update(set, where, table)
	if update != nil {
		status = "failed"
		logInfo = "Failed to rename group : " + old_position_name + " to " + new_position_name + ""
	} else {
		status = "success"
		logInfo = "Success to rename group : " + old_position_name + " to " + new_position_name + ""
	}

	session, _ := CONFIG.Store.Get(r, "cookie-name")
	MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "User Lists", "Rename Group", logInfo, status)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(status)
}

func DeleteGroup(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	position_id := r.FormValue("position_id")
	position_name := r.FormValue("position_name")

	var status, logInfo string

	table := "mst_user_position"
	where := "position_id = '" + position_id + "'"
	set := `position_status = 'deleted'`
	delete := MODEL.Update(set, where, table)
	if delete != nil {
		status = "failed"
		logInfo = "Failed to delete group : " + position_id + " <br> Group Name : " + position_name + ""
	} else {
		status = "success"
		logInfo = "Success to delete group : " + position_id + " <br> Group Name : " + position_name + ""
	}

	session, _ := CONFIG.Store.Get(r, "cookie-name")
	MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "User Lists", "Delete Group", logInfo, status)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(status)
}

func AddUser(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	nameUser := r.FormValue("nameUser")
	username := r.FormValue("username")
	email := r.FormValue("email")
	position := r.FormValue("position")
	positionText := r.FormValue("positionText")
	password := GetDefaultPassword()

	var status, logInfo, statusSetting, logInfoSetting string
	session, _ := CONFIG.Store.Get(r, "cookie-name")

	checkUsername := CheckUser(username)
	checkEmail := CheckUser(email)
	if checkEmail.Email == email {
		status = "exist-email"
	} else if checkUsername.Username == username {
		status = "exist-username"
	} else {
		table := "mst_user"
		column := "name, "
		column += "username, "
		column += "email, "
		column += "password, "
		column += "group_position, "
		column += "user_status"
		values := "'" + nameUser + "', "
		values += "'" + username + "', "
		values += "'" + email + "', "
		values += "'" + password + "', "
		values += "'" + position + "', "
		values += "'active'"
		insert := MODEL.Insert(column, values, table)
		if insert != nil {
			status = "failed"
			logInfo = "Failed to add new user <br> Name : " + nameUser + " <br> Username : " + username + " <br> Email : " + email + " <br> Position : " + positionText + ""
		} else {
			table := "user_settings"
			column := "username"
			values := "'" + username + "'"
			insert := MODEL.Insert(column, values, table)
			status = "success"
			logInfo = "Success to add new user <br> Name : " + nameUser + " <br> Username : " + username + " <br> Email : " + email + " <br> Position : " + positionText + ""
			if insert != nil {
				statusSetting = "failed"
				logInfoSetting = "Failed to add setting for new user <br> Name : " + nameUser + " <br> Username : " + username + " <br> Email : " + email + " <br> Position : " + positionText + ""
			} else {
				statusSetting = "success"
				logInfoSetting = "Success to add setting for new user <br> Name : " + nameUser + " <br> Username : " + username + " <br> Email : " + email + " <br> Position : " + positionText + ""
			}
			MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "User Lists", "Add User Setting", logInfoSetting, statusSetting)
		}

		MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "User Lists", "Add User", logInfo, status)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(status)
}

func UpdateUser(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	id := r.FormValue("id")
	nameUser := r.FormValue("nameUser")
	username := r.FormValue("username")
	email := r.FormValue("email")
	position := r.FormValue("position")
	statusUser := r.FormValue("statusUser")
	positionText := r.FormValue("positionText")
	statusUserText := r.FormValue("statusUserText")

	var status, logInfo string

	table := "mst_user"
	set := "name = '" + nameUser + "', "
	set += "username = '" + username + "', "
	set += "email = '" + email + "', "
	set += "group_position = '" + position + "', "
	set += "user_status = '" + statusUser + "'"
	where := "id = '" + id + "'"
	update := MODEL.Update(set, where, table)
	if update != nil {
		status = "failed"
		logInfo = "Failed to update Name : " + nameUser + ". Username : " + username + ". Email : " + email + ". Position : " + positionText + ". Status : " + statusUserText + "."
	} else {
		status = "success"
		logInfo = "Success to update Name : " + nameUser + ". Username : " + username + ". Email : " + email + ". Position : " + positionText + ". Status : " + statusUserText + "."
	}

	session, _ := CONFIG.Store.Get(r, "cookie-name")
	MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "User Lists", "Update User", logInfo, status)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(status)
}

func DeleteUser(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	id := r.FormValue("id")
	name := r.FormValue("name")
	username := r.FormValue("username")
	email := r.FormValue("email")

	var status, logInfo, statusSetting, logInfoSetting string
	session, _ := CONFIG.Store.Get(r, "cookie-name")

	table := "mst_user"
	where := "id = '" + id + "'"
	delete := MODEL.Delete(where, table)
	if delete != nil {
		status = "failed"
		logInfo = "Failed to delete username : " + username + ". Name : " + name + ". Email : " + email + "."
	} else {
		table := "user_settings"
		where := "username = '" + username + "'"
		delete := MODEL.Delete(where, table)

		status = "success"
		logInfo = "Success to delete username : " + username + ". Name : " + name + ". Email : " + email + "."

		table = "log_trail"
		set := "status = 'deleted'"
		where = "username = '" + username + "'"
		update := MODEL.Update(set, where, table)
		if delete != nil || update != nil {
			statusSetting = "failed"
			logInfoSetting = "Failed to delete setting or log trail for username : " + username + ". Name : " + name + ". Email : " + email + "."
		} else {
			statusSetting = "success"
			logInfoSetting = "Success to delete setting and log trail for username : " + username + ". Name : " + name + ". Email : " + email + "."
		}
		MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "User Lists", "Delete User Setting", logInfoSetting, statusSetting)
	}

	MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "User Lists", "Delete User", logInfo, status)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(status)
}

func CheckPass(w http.ResponseWriter, r *http.Request) {
	var passwordEncode, checkPass string
	username := r.FormValue("username")
	password := r.FormValue("oldPass")
	password_encrypt := md5.New()
	password_encrypt.Write([]byte(password))
	passwordEncode = hex.EncodeToString(password_encrypt.Sum(nil))

	if username == "default-password" {
		defaultPass := GetDefaultPassword()
		checkPass = defaultPass
	} else {
		users := CheckUser(username)
		checkPass = users.Password
	}
	var status string

	// fmt.Println(hex.EncodeToString(password_encrypt.Sum(nil)) == checkPass)
	if passwordEncode == checkPass {
		status = "correct"
	} else {
		status = "incorrect"
	}

	js, err := json.Marshal(status)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(js)
}

func ChangePass(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	if err != nil {
		panic(err.Error())
	}
	defer db.Close()

	id := r.FormValue("id")
	username := r.FormValue("username")
	password := r.FormValue("newPass")
	var setPass string
	if password == "reset-pass" {
		setPass = GetDefaultPassword()
	} else {
		password_encrypt := md5.New()
		password_encrypt.Write([]byte(password))
		setPass = hex.EncodeToString(password_encrypt.Sum(nil))
	}

	var status, logInfo string
	table := "mst_user"
	where := `
			 id = '` + id + `'
			 AND username = '` + username + `'
		`
	set := `password = '` + setPass + `'`

	if username == "default-password" {
		table = "mst_general_settings"
		where = `1=1`
		set = `default_password = '` + setPass + `'`
	}

	update := MODEL.Update(set, where, table)
	if update != nil {
		status = "failed"
		logInfo = `Failed to change password for ` + username + ` !`
	} else {
		status = "success"
		logInfo = `Success to change password for ` + username + ` !`
	}

	session, _ := CONFIG.Store.Get(r, "cookie-name")
	MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), `Change Password`, `Change Password`, logInfo, status)

	response, err := json.Marshal(status)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-type", "application/json")
	w.Write(response)
}

func UpdateMenuLevel(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	groupValue := r.FormValue("groupValue")
	groupValueText := r.FormValue("groupValueText")
	menuCode := r.FormValue("menuCode")
	act := r.FormValue("act")
	statusValue := r.FormValue("statusValue")
	menuName := r.FormValue("menuName")

	statusValueText := ""
	if statusValue == "1" {
		statusValueText = "allow"
	} else {
		statusValueText = "disabled"
	}

	var status, logInfo string
	table := "mst_menu_level"
	set := "" + strings.ToUpper(act) + "" + " = '" + statusValue + "'"
	where := "user_group = '" + groupValue + "' AND menu_id = '" + menuCode + "'"
	update := MODEL.Update(set, where, table)
	if update != nil {
		status = "failed"
		logInfo = "Failed to " + statusValueText + " auth \"" + act + "\" on menu " + menuName + " for " + groupValueText + "."
	} else {
		status = "success"
		logInfo = "Success to " + statusValueText + " auth \"" + act + "\" on menu " + menuName + " for " + groupValueText + "."
	}

	session, _ := CONFIG.Store.Get(r, "cookie-name")
	MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "User Management", "Set authorization menu", logInfo, status)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(status)
}

func LoadUserSettings(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	id := r.FormValue("id")
	username := r.FormValue("username")

	q := `SELECT a.* FROM user_settings a, mst_user b WHERE b.id = '` + id + `' AND b.username = '` + username + `' AND a.username = b.username LIMIT 1`

	fmt.Println(q)

	rows, err := db.Query(q)
	CONFIG.CheckErr(err)

	results := map[int32]STRUCTS.UserSettingLists{}

	for rows.Next() {
		var (
			Username            string
			Selected_slideshow  string
			Selected_theme      string
			Selected_sidebar    string
			Selected_type_chart string
		)

		err = rows.Scan(&Username, &Selected_slideshow, &Selected_theme, &Selected_sidebar, &Selected_type_chart)
		if err != nil {
			panic(err)
		}
		results[0] = STRUCTS.UserSettingLists{
			Username:            Username,
			Selected_slideshow:  Selected_slideshow,
			Selected_theme:      Selected_theme,
			Selected_sidebar:    Selected_sidebar,
			Selected_type_chart: Selected_type_chart,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(results)
}

func UpdateDefaultSlideshow(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	username := r.FormValue("username")
	slideshowBefore := r.FormValue("slideshowBefore")
	selectedSlideshow := r.FormValue("selectedSlideshow")
	textQ := r.FormValue("textQ")

	table := "user_settings"
	var result, logInfo string

	where := "1=1 AND username = '" + username + "'"
	set := "selected_slideshow = '" + selectedSlideshow + "'"
	update := MODEL.Update(set, where, table)
	if update != nil {
		result = "failed"
		logInfo = "Failed to change " + textQ + " from " + slideshowBefore + " to " + selectedSlideshow + "."
	} else {
		result = "success"
		logInfo = "Success to change " + textQ + " from " + slideshowBefore + " to " + selectedSlideshow + "."
	}

	session, _ := CONFIG.Store.Get(r, "cookie-name")
	MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Default Slideshow Dashboard", "Set default slideshow on dashboard ", logInfo, result)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

func UpdateUserSetting(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	username := r.FormValue("username")
	valueBefore := r.FormValue("valueBefore")
	valueAfter := r.FormValue("valueAfter")
	textQ := r.FormValue("textQ")
	act := r.FormValue("act")

	table := "user_settings"
	var result, logInfo string

	where := "1=1 AND username = '" + username + "'"
	set := "selected_" + act + " = '" + valueAfter + "'"
	update := MODEL.Update(set, where, table)
	if update != nil {
		result = "failed"
		logInfo = "Failed to change " + textQ + " from " + valueBefore + " to " + valueAfter + "."
	} else {
		result = "success"
		logInfo = "Success to change " + textQ + " from " + valueBefore + " to " + valueAfter + "."
	}

	session, _ := CONFIG.Store.Get(r, "cookie-name")
	MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Selected "+act, "Set "+textQ, logInfo, result)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

func UpdateLoggedDateTime(id string, col string) {
	db, err := CONFIG.Connect_db()
	if err != nil {
		fmt.Println(err.Error())
	}
	defer db.Close()

	table := "mst_user"
	currentTimeStamp := time.Now()
	date := currentTimeStamp.Format("2006-01-02 15:04:05")
	set := col + " = '" + date + "'"
	where := "id = '" + id + "'"
	update := MODEL.Update(set, where, table)
	if update != nil {
		fmt.Println(err.Error())
	}
}

func CheckUsername(w http.ResponseWriter, r *http.Request) {
	username := r.FormValue("field")
	var status string

	users := CheckUser(username)
	if users.Username == username || users.Email == username {
		status = "exist"
	} else {
		status = "none"
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(status)
}

func GetDefaultPassword() string {
	db, err := CONFIG.Connect_db()
	if err != nil {
		fmt.Println(err.Error())
	}
	defer db.Close()

	var defaultPass string
	sql := `SELECT default_password FROM mst_general_settings`
	err = db.QueryRow(sql).
		Scan(&defaultPass)
	if err != nil {
		fmt.Println(err.Error())
	}

	return defaultPass
}
