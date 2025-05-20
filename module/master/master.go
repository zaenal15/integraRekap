package master

import (
	"database/sql"
	"encoding/json"
	CONFIG "erekap/config"
	"erekap/module/model"
	MODEL "erekap/module/model"
	STRUCTS "erekap/structs"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"
)

const PATH_TXT_test = "./assets/excel/"

func LoadSettings(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	q := `SELECT * FROM mst_general_settings LIMIT 1`

	rows, err := db.Query(q)
	CONFIG.CheckErr(err)

	results := map[int32]STRUCTS.SettingLists{}

	for rows.Next() {
		var (
			Timer_session     int32
			Countdown_session int32
			Default_password  string
			Running_text      string
		)

		err = rows.Scan(&Timer_session, &Countdown_session, &Default_password, &Running_text)
		if err != nil {
			panic(err)
		}
		results[0] = STRUCTS.SettingLists{
			Timer_session:     Timer_session,
			Countdown_session: Countdown_session,
			Default_password:  Default_password,
			Running_text:      Running_text,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(results)
}

func UpdateTimerSessionSetting(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	timeBefore := r.FormValue("timeBefore")
	timeAfter := r.FormValue("timeAfter")
	act := r.FormValue("act")
	textQ := r.FormValue("textQ")
	textTime := r.FormValue("textTime")

	table := "mst_general_settings"
	var result, logInfo string

	where := "1=1"
	set := "" + act + "_session = '" + timeAfter + "'"
	update := MODEL.Update(set, where, table)
	if update != nil {
		result = "failed"
		logInfo = "Failed to change " + textQ + " from " + timeBefore + " " + textTime + " to " + timeAfter + " " + textTime + "."
	} else {
		result = "success"
		logInfo = "Success to change " + textQ + " from " + timeBefore + " " + textTime + " to " + timeAfter + " " + textTime + "."
	}

	session, _ := CONFIG.Store.Get(r, "cookie-name")
	MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Auto Logout Session", "Set "+act+" session auto logout ", logInfo, result)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

func UpdateMainRunningText(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	runningTextBefore := r.FormValue("runningTextBefore")
	runningTextUpdate := r.FormValue("runningTextUpdate")
	textQ := r.FormValue("textQ")

	table := "mst_general_settings"
	var result, logInfo string

	where := "1=1"
	set := "running_text = '" + runningTextUpdate + "'"
	update := MODEL.Update(set, where, table)
	if update != nil {
		result = "failed"
		logInfo = "Failed to change " + textQ + " from " + runningTextBefore + " <br> to " + runningTextUpdate + "."
	} else {
		result = "success"
		logInfo = "Success to change " + textQ + " from " + runningTextBefore + " <br> to " + runningTextUpdate + "."
	}

	session, _ := CONFIG.Store.Get(r, "cookie-name")
	MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Running Text Dashboard", "Set running text on main dashboard ", logInfo, result)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

func handleError(w http.ResponseWriter, status, logInfo string, err error) {
	http.Error(w, err.Error(), http.StatusInternalServerError)
}

func LoadLogTrail(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	startDate := r.FormValue("startDate")
	endDate := r.FormValue("endDate")
	dateFilter := r.FormValue("dateFilter")
	currentTime := time.Now()
	today := currentTime.Format("2006-01-02")

	var whereDateFilter, whereLimit string
	if dateFilter == "" {
		whereDateFilter = `AND DATE(a.log_date) = '` + today + `'`
		whereLimit = `LIMIT 20`
	} else {
		whereDateFilter = "AND DATE( a.log_date ) BETWEEN '" + startDate + "' AND '" + endDate + "'"
	}

	q := `
		SELECT
			log_id,
			log_date,
			log_time,
			a.username,
			a.name,
			COALESCE(c.position_id, 'Guest') as position_id,
			COALESCE(c.position_name, 'Guest') as position_name,
			menu,
			activity,
			activity_desc,
			info 
		FROM log_trail a
		LEFT JOIN mst_user b ON a.username = b.username 
		LEFT JOIN mst_user_position c ON b.group_position = c.position_id 
		WHERE 
			1=1
			AND a.status != 'deleted'
			AND activity != 'Delete log'
			` + whereDateFilter + `
		ORDER BY 
			log_id DESC
		` + whereLimit + `
	`

	// fmt.Println(q)

	rows, err := db.Query(q)
	CONFIG.CheckErr(err)

	results := map[int32]STRUCTS.LogTrail{}

	var No int32
	for rows.Next() {
		No++
		var (
			Log_id        string
			Log_date      string
			Log_time      string
			Username      string
			Name          string
			Position_id   string
			Position_name string
			Menu          string
			Activity      string
			Activity_desc string
			Info          string
		)

		err = rows.Scan(&Log_id, &Log_date, &Log_time, &Username, &Name, &Position_id, &Position_name, &Menu, &Activity, &Activity_desc, &Info)
		if err != nil {
			panic(err)
		}

		results[No] = STRUCTS.LogTrail{
			No:            No,
			Log_id:        Log_id,
			Log_date:      Log_date,
			Log_time:      Log_time,
			Username:      Username,
			Name:          Name,
			Position_id:   Position_id,
			Position_name: Position_name,
			Menu:          Menu,
			Activity:      Activity,
			Activity_desc: Activity_desc,
			Info:          Info,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(results)
}

func DeleteLogTrail(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	interval := r.FormValue("interval")

	session, _ := CONFIG.Store.Get(r, "cookie-name")
	var status, logInfo string
	table := "log_trail"
	where := "log_date < DATE_SUB(now(), INTERVAL " + interval + " MONTH)"

	checkRow, err := MODEL.CheckRow(where, table)
	CONFIG.CheckErr(err)
	delete := MODEL.Delete(where, table)
	if delete != nil {
		status = "failed"
		logInfo = "Failed to delete log trail older than " + interval + " month."
	} else {
		status = "success-" + CONFIG.ConvertIntToString(int(checkRow))
		if checkRow > 0 {
			logInfo = "Success to delete log trail older than " + interval + " month. (" + CONFIG.ConvertIntToString(int(checkRow)) + " data(s))"
		} else {
			logInfo = "There are nothing to delete, there are no data older than " + interval + " month. "
			status = "info-" + CONFIG.ConvertIntToString(int(checkRow))
		}
	}
	MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Audit Trail", "Delete log", logInfo, status)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(status)
}

func LoadPeserta(w http.ResponseWriter, r *http.Request) {
    // Koneksi ke database
    db, err := CONFIG.Connect_db()
    if err != nil {
        http.Error(w, "Failed to connect to database", http.StatusInternalServerError)
        return
    }
    defer db.Close()

    // Query SQL untuk mengambil data peserta
    query := `
        SELECT 
            p.id,
            p.no_peserta,
            p.regu,
            p.pangkalan_id,
            pl.nama_pangkalan,
            ml.nama_lomba,
            ml.lomba_id
        FROM
            mst_peserta p
        LEFT JOIN 
            mst_pangkalan pl ON p.pangkalan_id = pl.id
        LEFT JOIN 
            mst_mata_lomba ml ON p.mata_lomba_id = ml.lomba_id;
    `

    // Menjalankan query
    rows, err := db.Query(query)
    if err != nil {
        http.Error(w, "Failed to execute query", http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    results := map[string]STRUCTS.Peserta{}
    var No int32

    // Looping untuk mengambil hasil query
    for rows.Next() {
        No++

        var peserta STRUCTS.Peserta
        err = rows.Scan(
            &peserta.Id,
            &peserta.NoPeserta,
            &peserta.Regu,
            &peserta.PangkalanId,
            &peserta.NamaPangkalan,
            &peserta.NamaLomba,
            &peserta.LombaId,
        )
        if err != nil {
            http.Error(w, "Failed to scan data", http.StatusInternalServerError)
            return
        }
        peserta.No = No
        results[peserta.Id] = peserta
    }

    // Format response JSON
    response := struct {
        Status  string                      `json:"status"`
        Message string                      `json:"message"`
        Data    map[string]STRUCTS.Peserta `json:"data"`
    }{
        Status:  "success",
        Message: "Get Master Peserta is success",
        Data:    results,
    }

    // Mengirimkan response dalam format JSON
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(response)
}

func LoadPesertaList(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	if err != nil {
		http.Error(w, "Failed to connect to database: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer db.Close()

	query := `
		SELECT 
			p.id,
			p.no_peserta,
			p.regu,
			COALESCE(p.jenis_regu, '') AS jenis_regu,
			COALESCE(p.tingkat_peserta, '') AS tingkat_peserta, -- tambahkan ini
			p.pangkalan_id,
			COALESCE(pl.nama_pangkalan, '') AS nama_pangkalan,
			COALESCE(ml.nama_lomba, '') AS nama_lomba,
			COALESCE(ml.lomba_id, 0) AS lomba_id,
			COALESCE(p.no_wa, '') AS no_wa
		FROM
			mst_peserta p
		LEFT JOIN 
			mst_pangkalan pl ON p.pangkalan_id = pl.id
		LEFT JOIN 
			mst_peserta_mata_lomba mpl ON p.id = mpl.peserta_id
		LEFT JOIN 
			mst_mata_lomba ml ON mpl.mata_lomba_id = ml.lomba_id
		ORDER BY p.no_peserta, ml.lomba_id;
	`

	rows, err := db.Query(query)
	if err != nil {
		http.Error(w, "Failed to execute query: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	results := make(map[int32]STRUCTS.PesertaData)
	var No int32
	var currentPesertaId int32
	var peserta STRUCTS.PesertaData
	mataLombaList := []STRUCTS.MataLombaData{}

	for rows.Next() {
		var pesertaId int32
		var noPeserta, regu, jenisRegu, tingkatPeserta string
		var namaPangkalan, namaLomba, noWa string
		var pangkalanId, lombaId int32

		err = rows.Scan(
			&pesertaId,
			&noPeserta,
			&regu,
			&jenisRegu,
			&tingkatPeserta, // tambahkan ini
			&pangkalanId,
			&namaPangkalan,
			&namaLomba,
			&lombaId,
			&noWa,
		)
		if err != nil {
			http.Error(w, "Failed to scan data: "+err.Error(), http.StatusInternalServerError)
			return
		}

		if currentPesertaId != pesertaId {
			if currentPesertaId != 0 {
				peserta.MataLomba = mataLombaList
				results[currentPesertaId] = peserta
			}

			No++
			peserta = STRUCTS.PesertaData{
				Id:             pesertaId,
				No:             No,
				NoPeserta:      noPeserta,
				Regu:           regu,
				JenisRegu:      jenisRegu,
				TingkatPeserta: tingkatPeserta, // tambahkan ini
				PangkalanId:    pangkalanId,
				NamaPangkalan:  namaPangkalan,
				NoWa:           noWa,
			}
			mataLombaList = []STRUCTS.MataLombaData{}
		}

		mataLombaList = append(mataLombaList, STRUCTS.MataLombaData{
			NamaLomba: namaLomba,
			LombaId:   lombaId,
		})

		currentPesertaId = pesertaId
	}

	if currentPesertaId != 0 {
		peserta.MataLomba = mataLombaList
		results[currentPesertaId] = peserta
	}

	if len(results) == 0 {
		http.Error(w, "No participants found", http.StatusNotFound)
		return
	}

	response := STRUCTS.Response{
		Status:  "success",
		Message: "Get Master Peserta is success",
		Data:    results,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}




func LoadPangkalan(w http.ResponseWriter, r *http.Request) {
	// Koneksi ke database
	db, err := CONFIG.Connect_db()
	if err != nil {
		http.Error(w, "Failed to connect to database", http.StatusInternalServerError)
		return
	}
	defer db.Close()

	// Query SQL untuk mengambil data pangkalan
	query := `SELECT 
				id,
				nama_pangkalan
			  FROM
				mst_pangkalan;`

	rows, err := db.Query(query)
	if err != nil {
		http.Error(w, "Failed to execute query", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	// Ubah map key menjadi int32 (sesuai dengan tipe pangkalan.Id)
	results := map[int32]STRUCTS.Pangkalan{}  // Key adalah int32, sesuai dengan tipe pangkalan.Id
	var No int32

	// Looping untuk mengambil hasil query
	for rows.Next() {
		No++
		var pangkalan STRUCTS.Pangkalan
		err = rows.Scan(
			&pangkalan.Id,
			&pangkalan.NamaPangkalan,
		)
		if err != nil {
			http.Error(w, "Failed to scan data", http.StatusInternalServerError)
			return
		}
		pangkalan.No = No
		results[pangkalan.Id] = pangkalan // Gunakan pangkalan.Id sebagai key
	}

	// Format response JSON
	response := STRUCTS.Response{
		Status:  "success",
		Message: "Get Master Pangkalan is success",
		Data:    results,
	}

	// Kirim response dalam format JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}


func LoadLomba(w http.ResponseWriter, r *http.Request) {
	// Koneksi ke database
	db, err := CONFIG.Connect_db()
	if err != nil {
		http.Error(w, "Failed to connect to database", http.StatusInternalServerError)
		return
	}
	defer db.Close()

	// Query SQL untuk mengambil data lomba
	q := `SELECT 
    ml.lomba_id,
    ml.nama_lomba,
    ml.jumlah_juri,
    kl.kategori_id,
    kl.nama_kategori
FROM
    mst_mata_lomba ml
LEFT JOIN
    kategori_lomba kl ON ml.kategori_id = kl.kategori_id;
`

	// Menjalankan query
	rows, err := db.Query(q)
	CONFIG.CheckErr(err)
	defer rows.Close()

	// Menyimpan hasil query
	results := map[int32]STRUCTS.MataLomba{}
	var No int32

	// Looping untuk mengambil hasil query
	for rows.Next() {
		No++

		var Lomba_id int32
		var jumlah_juri int32
		var Nama_lomba string
		var Kategori_id int32
		var Nama_kategori string

		// Men-scan hasil query ke dalam variabel dengan urutan yang benar
		err = rows.Scan(&Lomba_id, &Nama_lomba, &jumlah_juri, &Kategori_id, &Nama_kategori)
		if err != nil {
			panic(err)
		}

		// Menyimpan data lomba dalam map
		results[Lomba_id] = STRUCTS.MataLomba{
			No:          No,
			LombaId:     Lomba_id,
			NamaLomba:   Nama_lomba,
			JumlahJuri:  jumlah_juri,
			KategoriId:  Kategori_id,
			NamaKategori: Nama_kategori,
		}
	}

	// Membuat response JSON
	response := STRUCTS.Response{
		Status:  "success",
		Message: "Get Master Mata Lomba is success",
		Data:    results,
	}

	// Mengirimkan response dalam format JSON
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}


func UpdatePeserta(w http.ResponseWriter, r *http.Request) {
    db, err := CONFIG.Connect_db()
    CONFIG.CheckErr(err)
    defer db.Close()

    act := r.FormValue("act")
    noPeserta := r.FormValue("no_peserta")
    regu := r.FormValue("regu")
    pangkalanId := r.FormValue("pangkalan_id")
    jenisRegu := r.FormValue("jenis_regu")
    tingkatPeserta := r.FormValue("tingkat_peserta")
    noWa := r.FormValue("no_wa") // ✅ Ambil nomor WA dari form
    mataLombaIds := r.Form["mata_lomba_ids[]"]

    pesertaTable := "mst_peserta"
    mataLombaTable := "mst_peserta_mata_lomba"
    var result, logInfo string

    if act == "add" {
        column := "no_peserta, regu, pangkalan_id, jenis_regu, tingkat_peserta, no_wa"
        values := "'" + noPeserta + "', '" + regu + "', '" + pangkalanId + "', '" + jenisRegu + "', '" + tingkatPeserta + "', '" + noWa + "'"
        insertPeserta := MODEL.Insert(column, values, pesertaTable)
        if insertPeserta != nil {
            result = "failed"
        } else {
            for _, mataLombaId := range mataLombaIds {
                column := "peserta_id, mata_lomba_id"
                values := "(SELECT id FROM mst_peserta WHERE no_peserta = '" + noPeserta + "'), '" + mataLombaId + "'"
                insertMataLomba := MODEL.Insert(column, values, mataLombaTable)
                if insertMataLomba != nil {
                    result = "failed"
                    break
                } else {
                    result = "success"
                }
            }
        }

    } else if act == "update" {
        set := fmt.Sprintf("regu = '%s', pangkalan_id = '%s', jenis_regu = '%s', tingkat_peserta = '%s', no_wa = '%s'",
            regu, pangkalanId, jenisRegu, tingkatPeserta, noWa)
        where := fmt.Sprintf("no_peserta = '%s'", noPeserta)
        updatePeserta := MODEL.Update(set, where, pesertaTable)
        if updatePeserta != nil {
            result = "failed"
        } else {
            deleteQuery := fmt.Sprintf("DELETE FROM %s WHERE peserta_id = (SELECT id FROM %s WHERE no_peserta = '%s') AND mata_lomba_id NOT IN (%s)",
                mataLombaTable, pesertaTable, noPeserta, strings.Join(mataLombaIds, ","))
            _, err := db.Exec(deleteQuery)
            if err != nil {
                result = "failed"
                logInfo = "Failed to delete old mata lomba relations: " + err.Error()
            } else {
                for _, mataLombaId := range mataLombaIds {
                    checkQuery := fmt.Sprintf("SELECT COUNT(*) FROM %s WHERE peserta_id = (SELECT id FROM %s WHERE no_peserta = '%s') AND mata_lomba_id = '%s'",
                        mataLombaTable, pesertaTable, noPeserta, mataLombaId)
                    var count int
                    err := db.QueryRow(checkQuery).Scan(&count)
                    if err != nil {
                        result = "failed"
                        break
                    }
                    if count == 0 {
                        insertColumn := "peserta_id, mata_lomba_id"
                        insertValues := fmt.Sprintf("(SELECT id FROM %s WHERE no_peserta = '%s'), '%s'", pesertaTable, noPeserta, mataLombaId)
                        insertMataLomba := MODEL.Insert(insertColumn, insertValues, mataLombaTable)
                        if insertMataLomba != nil {
                            result = "failed"
                            break
                        }
                    }
                }
                result = "success"
            }
        }
    }

    if result == "failed" {
        logInfo = "Failed to " + act + " peserta. <br> No Peserta : " + noPeserta + " <br> Regu : " + regu + " <br> Pangkalan ID : " + pangkalanId + " <br> Jenis Regu : " + jenisRegu + " <br> Tingkat Peserta : " + tingkatPeserta + " <br> No WA : " + noWa + " <br> Mata Lomba IDs : " + strings.Join(mataLombaIds, ", ")
    } else {
        logInfo = "Success to " + act + " peserta. <br> No Peserta : " + noPeserta + " <br> Regu : " + regu + " <br> Pangkalan ID : " + pangkalanId + " <br> Jenis Regu : " + jenisRegu + " <br> Tingkat Peserta : " + tingkatPeserta + " <br> No WA : " + noWa + " <br> Mata Lomba IDs : " + strings.Join(mataLombaIds, ", ")
    }

    session, _ := CONFIG.Store.Get(r, "cookie-name")
    MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "peserta Lists", act+" peserta", logInfo, result)

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(result)
}


func DeletePeserta(w http.ResponseWriter, r *http.Request) {
	// Membuka koneksi ke database
	db, err := CONFIG.Connect_db()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer db.Close()

	// Mengambil parameter dari request
	noPeserta := r.FormValue("no_peserta")
	
	// Validasi parameter
	if noPeserta == "" {
		http.Error(w, "No Peserta harus disertakan", http.StatusBadRequest)
		return
	}

	// Menentukan tabel dan kondisi untuk menghapus data
	table := "mst_peserta"
	where := "no_peserta = '" + noPeserta + "'"

	// Menghapus data menggunakan model.Delete
	deleteErr := model.Delete(where, table)
	if deleteErr != nil {
		status := "failed"
		logInfo := "Failed to delete peserta. <br> No Peserta: " + noPeserta
		handleError(w, status, logInfo, deleteErr)
		return
	}

	// Jika berhasil menghapus data
	status := "success"
	logInfo := "Success to delete peserta. <br> No Peserta: " + noPeserta

	// Menyimpan log aktivitas
	session, _ := CONFIG.Store.Get(r, "cookie-name")
	model.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Peserta Lists", "Delete peserta", logInfo, status)

	// Menyiapkan response JSON
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(status)
}


func UpdatePangkalan(w http.ResponseWriter, r *http.Request) {
    db, err := CONFIG.Connect_db()
    CONFIG.CheckErr(err)
    defer db.Close()

    act := r.FormValue("act")
    id := r.FormValue("id")
    nama_pangkalan := r.FormValue("nama_pangkalan")
	table := "mst_pangkalan"
    var result, logInfo string

    if act == "add" {
        column := "nama_pangkalan"
        values := "'" + nama_pangkalan + "'"
        insert := MODEL.Insert(column, values, table)
        if insert != nil {
            result = "failed"
        } else {
            result = "success"
        }
    } else {
        where := "id = '" + id + "'"
        set := "nama_pangkalan = '" + nama_pangkalan + "'"
        update := MODEL.Update(set, where, table)
        if update != nil {
            result = "failed"
        } else {
            result = "success"
        }
    }

    if result == "failed" {
        logInfo = "Failed to " + act + " peserta. <br> Nama Pangkalan : " + nama_pangkalan + ""
    } else {
        logInfo = "Success to " + act + " peserta. <br> Nama Pangkalan : " + nama_pangkalan + ""
    }

    session, _ := CONFIG.Store.Get(r, "cookie-name")
    MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "pangkalan Lists", act+" pangkalan", logInfo, result)
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(result)
}

func DeletePangkalan(w http.ResponseWriter, r *http.Request) {
	// Membuka koneksi ke database
	db, err := CONFIG.Connect_db()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer db.Close()

	// Mengambil parameter dari request
	id := r.FormValue("id")
	namaPangkalan := r.FormValue("nama_pangkalan")

	// Menentukan tabel dan kondisi untuk menghapus data
	table := "mst_pangkalan"
	where := "id = '" + id + "' AND nama_pangkalan = '" + namaPangkalan + "'"

	// Menghapus data menggunakan model.Delete
	deleteErr := model.Delete(where, table)
	if deleteErr != nil {
		status := "failed"
		logInfo := "Failed to delete pangkalan. <br> Peserta ID: " + id + " <br> Pangkalan: " + namaPangkalan
		handleError(w, status, logInfo, deleteErr)
		return
	}

	// Jika berhasil menghapus data
	status := "success"
	logInfo := "Success to delete peserta. <br> Peserta ID: " + id + " <br> Pangkalan: " + namaPangkalan

	// Menyimpan log aktivitas
	session, _ := CONFIG.Store.Get(r, "cookie-name")
	model.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Peserta Lists", "Delete peserta", logInfo, status)

	// Menyiapkan response JSON
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(status)
}

func LoadKategoriLomba(w http.ResponseWriter, r *http.Request) {
	// Koneksi ke database
	db, err := CONFIG.Connect_db()
	if err != nil {
		http.Error(w, "Failed to connect to database", http.StatusInternalServerError)
		return
	}
	defer db.Close()

	// Query SQL untuk mengambil data pangkalan
	query := `SELECT 
				kategori_id,
				nama_kategori
			  FROM
				kategori_lomba;`

	rows, err := db.Query(query)
	if err != nil {
		http.Error(w, "Failed to execute query", http.StatusInternalServerError)
		return
	}
	defer rows.Close()


	results := map[int32]STRUCTS.KategoriLomba{}
	var No int32

	// Looping untuk mengambil hasil query
	for rows.Next() {
		No++
		var kategoriLomba STRUCTS.KategoriLomba
		err = rows.Scan(
			&kategoriLomba.KategoriId,
			&kategoriLomba.NamaKategori,
		)
		if err != nil {
			http.Error(w, "Failed to scan data", http.StatusInternalServerError)
			return
		}
		kategoriLomba.No = No
		results[kategoriLomba.KategoriId] = kategoriLomba // Gunakan pangkalan.Id sebagai key
	}

	// Format response JSON
	response := STRUCTS.Response{
		Status:  "success",
		Message: "Get Kategori Lomba is success",
		Data:    results,
	}

	// Kirim response dalam format JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func UpdateLomba(w http.ResponseWriter, r *http.Request) {
    db, err := CONFIG.Connect_db()
    CONFIG.CheckErr(err)
    defer db.Close()

    act := r.FormValue("act")
    id := r.FormValue("id")
    nama_lomba := r.FormValue("nama_lomba")
    kategori_id := r.FormValue("kategori_id") 
    jumlah_juri := r.FormValue("jumlah_juri") 
    table := "mst_mata_lomba"
    var result, logInfo string

    // Untuk menambah mata lomba baru
    if act == "add" {
        column := "nama_lomba, kategori_id, jumlah_juri"
        values := "'" + nama_lomba + "', '" + kategori_id + "', '" + jumlah_juri + "'"
        insert := MODEL.Insert(column, values, table)
        if insert != nil {
            result = "failed"
        } else {
            result = "success"
        }
    } else {
        // Untuk memperbarui data mata lomba yang sudah ada
        where := "lomba_id = '" + id + "'"
        set := "nama_lomba = '" + nama_lomba + "', kategori_id = '" + kategori_id + "', jumlah_juri = '" + jumlah_juri + "'"
        update := MODEL.Update(set, where, table)
        if update != nil {
            result = "failed"
        } else {
            result = "success"
        }
    }

    // Menyusun informasi untuk log
    if result == "failed" {
        logInfo = "Failed to " + act + " mata lomba. <br> Nama Lomba : " + nama_lomba + "<br> Kategori ID: " + kategori_id
    } else {
        logInfo = "Success to " + act + " mata lomba. <br> Nama Lomba : " + nama_lomba + "<br> Kategori ID: " + kategori_id
    }

    // Menyimpan log aktivitas
    session, _ := CONFIG.Store.Get(r, "cookie-name")
    MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "lomba Lists", act+" mata lomba", logInfo, result)

    // Mengirimkan response dalam format JSON
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(result)
}

func DeleteLomba(w http.ResponseWriter, r *http.Request) {
	// Membuka koneksi ke database
	db, err := CONFIG.Connect_db()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer db.Close()

	// Mengambil parameter dari request
	id := r.FormValue("id")
	namaLomba := r.FormValue("nama_lomba")

	// Menentukan tabel dan kondisi untuk menghapus data
	table := "mst_mata_lomba"
	where := "lomba_id = '" + id + "' AND nama_lomba = '" + namaLomba + "'"

	// Menghapus data menggunakan model.Delete
	deleteErr := model.Delete(where, table)
	if deleteErr != nil {
		status := "failed"
		logInfo := "Failed to delete mata lomba. <br> Lomba ID: " + id + " <br> Lomba: " + namaLomba
		handleError(w, status, logInfo, deleteErr)
		return
	}

	// Jika berhasil menghapus data
	status := "success"
	logInfo := "Success to delete mata lomba. <br> Lomba ID: " + id + " <br> Lomba: " + namaLomba

	// Menyimpan log aktivitas
	session, _ := CONFIG.Store.Get(r, "cookie-name")
	model.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Lomba Lists", "Delete mata lomba", logInfo, status)

	// Menyiapkan response JSON
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(status)
}
func UpdateKategori(w http.ResponseWriter, r *http.Request) {
    db, err := CONFIG.Connect_db()
    CONFIG.CheckErr(err)
    defer db.Close()

    act := r.FormValue("act")
    id := r.FormValue("id")
    namaKategori := r.FormValue("nama_kategori") // Nama kategori yang akan diupdate
    table := "kategori_lomba"
    var result, logInfo string

    // Untuk menambah kategori baru
    if act == "add" {
        column := "nama_kategori"
        values := "'" + namaKategori + "'"
        insert := MODEL.Insert(column, values, table)
        if insert != nil {
            result = "failed"
        } else {
            result = "success"
        }
    } else {
        // Untuk memperbarui data kategori yang sudah ada
        where := "kategori_id = '" + id + "'"
        set := "nama_kategori = '" + namaKategori + "'"
        update := MODEL.Update(set, where, table)
        if update != nil {
            result = "failed"
        } else {
            result = "success"
        }
    }

    // Menyusun informasi untuk log
    if result == "failed" {
        logInfo = "Failed to " + act + " kategori. <br> Nama Kategori : " + namaKategori
    } else {
        logInfo = "Success to " + act + " kategori. <br> Nama Kategori : " + namaKategori
    }

    // Menyimpan log aktivitas
    session, _ := CONFIG.Store.Get(r, "cookie-name")
    MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Kategori Lomba Lists", act+" kategori", logInfo, result)

    // Mengirimkan response dalam format JSON
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(result)
}

func DeleteKategori(w http.ResponseWriter, r *http.Request) {
    // Membuka koneksi ke database
    db, err := CONFIG.Connect_db()
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer db.Close()

    // Mengambil parameter dari request
    id := r.FormValue("id")
    namaKategori := r.FormValue("nama_kategori")

    // Menentukan tabel dan kondisi untuk menghapus data kategori
    table := "kategori_lomba"
    where := "kategori_id = '" + id + "' AND nama_kategori = '" + namaKategori + "'"

    // Menghapus data menggunakan model.Delete
    deleteErr := model.Delete(where, table)
    if deleteErr != nil {
        status := "failed"
        logInfo := "Failed to delete kategori lomba. <br> Kategori ID: " + id + " <br> Kategori: " + namaKategori
        handleError(w, status, logInfo, deleteErr)
        return
    }

    // Jika berhasil menghapus data
    status := "success"
    logInfo := "Success to delete kategori lomba. <br> Kategori ID: " + id + " <br> Kategori: " + namaKategori

    // Menyimpan log aktivitas
    session, _ := CONFIG.Store.Get(r, "cookie-name")
    model.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Kategori Lomba Lists", "Delete kategori lomba", logInfo, status)

    // Menyiapkan response JSON
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(status)
}

func LoadLombaKategori(w http.ResponseWriter, r *http.Request) {
    db, err := CONFIG.Connect_db()
    if err != nil {
        http.Error(w, "Failed to connect to database", http.StatusInternalServerError)
        return
    }
    defer db.Close()

    // Query to get Lomba and Kategori details
    query := `
        SELECT 
            kl.kategori_id,
            kl.nama_kategori,
            ml.lomba_id,
            ml.nama_lomba,
            ml.kategori_id
        FROM 
            kategori_lomba kl
        LEFT JOIN mst_mata_lomba ml ON kl.kategori_id = ml.kategori_id
        ORDER BY kl.kategori_id, ml.lomba_id
    `

    rows, err := db.Query(query)
    if err != nil {
        http.Error(w, "Error fetching data", http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    // Result map to hold categories with their lombas
    results := make(map[int]STRUCTS.Kategori)  // Use STRUCTS.Kategori here

    // Process each row to structure the data
    for rows.Next() {
        var kategoriID int
        var kategoriNama, namaLomba string
        var lombaID int

        err := rows.Scan(&kategoriID, &kategoriNama, &lombaID, &namaLomba, &kategoriID)
        if err != nil {
            http.Error(w, "Error scanning row", http.StatusInternalServerError)
            return
        }

        // If the category does not exist in the map, create a new entry
        if _, exists := results[kategoriID]; !exists {
            results[kategoriID] = STRUCTS.Kategori{
                Nama:  kategoriNama,
                Lomba: []STRUCTS.Lomba{},  // Initialize the lomba slice with STRUCTS.Lomba
            }
        }

        // Append the lomba data to the category's lomba list
        currentCategory := results[kategoriID]
        currentCategory.Lomba = append(currentCategory.Lomba, STRUCTS.Lomba{
            LombaID:   lombaID,
            NamaLomba: namaLomba,
            KategoriID: kategoriID,
        })
        
        // Update the map with the modified category
        results[kategoriID] = currentCategory
    }

    // Response with all the categories and lombas
    response := STRUCTS.Response{
        Status:  "success",
        Message: "Get Lomba by Kategori Successfully",
        Data:    results,
    }

    // Send the response as JSON
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(response)
}

func LoadSubPoint(w http.ResponseWriter, r *http.Request) {
    // Koneksi ke database
    db, err := CONFIG.Connect_db()
    CONFIG.CheckErr(err)
    defer db.Close()

    lomba_id := r.FormValue("lomba_id")

    if lomba_id == "" {
        http.Error(w, "Lomba ID is required", http.StatusBadRequest)
        return
    }

    // Query SQL untuk mengambil subpoint
    q := `
       SELECT 
			COALESCE(l.nama_lomba, '') as nama_lomba,
			COALESCE(k.nama_kategori, '') as nama_kategori,
			COALESCE(ks.kategori_sub_point_id, NULL) as kategori_sub_point_id,  -- Use NULL instead of empty string
			COALESCE(ks.nama_kategori_sub_point, '') as nama_kategori_sub_point,
			COALESCE(sp.nama_sub_point, '') as nama_sub_point
		FROM 
			mst_kategori_sub_point ks
		LEFT JOIN
			mst_kategori_penilaian k ON ks.kategori_id = k.kategori_id
		LEFT JOIN
			mst_mata_lomba l ON k.lomba_id = l.lomba_id
		LEFT JOIN
			mst_sub_point_penilaian sp ON ks.kategori_sub_point_id = sp.kategori_sub_point_id
		WHERE 
			l.lomba_id = ` + lomba_id + `  -- Menggunakan lomba_id sebagai filter
		ORDER BY 
			k.kategori_id, ks.kategori_sub_point_id, sp.sub_point_id;

    `

    fmt.Println("Query SubPoint: ", q)
    rows, err := db.Query(q)
    CONFIG.CheckErr(err)
    defer rows.Close()

    response := make([]STRUCTS.SubPoint, 0)
    for rows.Next() {
        var subPoint STRUCTS.SubPoint

        err := rows.Scan(
            &subPoint.NamaLomba,
            &subPoint.NamaKategori,
            &subPoint.KategoriSubPointId,
            &subPoint.NamaKategoriSubPoint,
            &subPoint.NamaSubPoint,
        )
        if err != nil {
            fmt.Println("Error scanning row:", err)
            http.Error(w, "Failed to scan data", http.StatusInternalServerError)
            return
        }

        response = append(response, subPoint)
    }

    // Menggunakan struktur respons sesuai permintaan
    responseStruct := struct {
        Status  string             `json:"status"`
        Message string             `json:"message"`
        Data    []STRUCTS.SubPoint `json:"data"`
    }{
        Status:  "success",
        Message: "SubPoints berhasil diambil",
        Data:    response,
    }

    // Mengonversi respons ke format JSON
    js, err := json.Marshal(responseStruct)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.Write(js)
}

func LoadKategoriPenilaian(w http.ResponseWriter, r *http.Request) {
	// Koneksi ke database
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	// Ambil parameter lomba_id dari request
	lomba_id := r.FormValue("lomba_id")

	if lomba_id == "" {
		http.Error(w, "Lomba ID is required", http.StatusBadRequest)
		return
	}

	// Query ambil data
	q := `
		SELECT 
			COALESCE(l.nama_lomba, '-') as nama_lomba,
			COALESCE(k.nama_kategori, '-') as nama_kategori,
			COALESCE(k.set_nilai, '-') as set_nilai,
			COALESCE(k.nilai_umum, '-') as nilai_umum,
			COALESCE(k.nilai_banding, '-') as nilai_banding, -- << TAMBAHAN di sini
			k.kategori_id
		FROM 
			mst_mata_lomba l
		JOIN 
			mst_kategori_penilaian k ON l.lomba_id = k.lomba_id
		WHERE 
			l.lomba_id = ` + lomba_id + `
		ORDER BY 
			k.kategori_id
	`

	fmt.Println("Query Kategori Penilaian: ", q)
	rows, err := db.Query(q)
	CONFIG.CheckErr(err)
	defer rows.Close()

	response := make([]STRUCTS.KategoriPenilaian, 0)
	for rows.Next() {
		var kategori STRUCTS.KategoriPenilaian

		err := rows.Scan(
			&kategori.NamaLomba,
			&kategori.NamaKategori,
			&kategori.SetNilai,
			&kategori.NilaiUmum,
			&kategori.NilaiBanding,  // << TAMBAHAN di sini juga
			&kategori.KategoriID,
		)
		if err != nil {
			fmt.Println("Error scanning row:", err)
			http.Error(w, "Failed to scan data", http.StatusInternalServerError)
			return
		}

		response = append(response, kategori)
	}

	responseStruct := struct {
		Status  string                   `json:"status"`
		Message string                   `json:"message"`
		Data    []STRUCTS.KategoriPenilaian `json:"data"`
	}{
		Status:  "success",
		Message: "Kategori Penilaian berhasil diambil",
		Data:    response,
	}

	js, err := json.Marshal(responseStruct)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(js)
}

func UpdateNilaiKategori(w http.ResponseWriter, r *http.Request) {
    db, err := CONFIG.Connect_db()
    CONFIG.CheckErr(err)
    defer db.Close()

    act := r.FormValue("act") // act = 'update_nilai'
    id := r.FormValue("kategori_id")
    tipeNilai := r.FormValue("tipe_nilai") // tipe_nilai = "utama", "umum", atau "banding"
    status := r.FormValue("status") // status = "active" atau "inactive"
    table := "mst_kategori_penilaian"
    var result, logInfo string

    if act == "update_nilai" {
        var set string
        switch tipeNilai {
        case "utama":
            set = "set_nilai = '" + status + "'"
        case "umum":
            set = "nilai_umum = '" + status + "'"
        case "banding":
            set = "nilai_banding = '" + status + "'"
        default:
            result = "failed"
        }

        if result != "failed" {
            where := "kategori_id = '" + id + "'"
            update := MODEL.Update(set, where, table)
            if update != nil {
                result = "failed"
            } else {
                result = "success"
            }
        }
    } else {
        result = "failed"
    }

    if result == "failed" {
        logInfo = "Failed to update nilai kategori. <br> ID : " + id
    } else {
        logInfo = "Success update nilai kategori. <br> ID : " + id
    }

    session, _ := CONFIG.Store.Get(r, "cookie-name")
    MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Kategori Lomba Lists", "Update nilai kategori", logInfo, result)

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{
        "result": result,
    })
}


func LoadKategoriPenilaianAll(w http.ResponseWriter, r *http.Request) {
    // Koneksi ke database
    db, err := CONFIG.Connect_db()
    if err != nil {
        log.Println("Error connecting to the database:", err)
        http.Error(w, "Failed to connect to database", http.StatusInternalServerError)
        return
    }
    defer db.Close()

    // Query SQL untuk mengambil semua kategori penilaian dengan kolom nilai_banding
    q := `
        SELECT 
            COALESCE(l.nama_lomba, '-') as nama_lomba,
            COALESCE(k.nama_kategori, '-') as nama_kategori,
            COALESCE(k.set_nilai, '-') as set_nilai,
            COALESCE(k.nilai_banding, '-') as nilai_banding,
            k.kategori_id,
            l.lomba_id  -- Menambahkan kolom lomba_id
        FROM 
            mst_kategori_penilaian k
        JOIN 
            mst_mata_lomba l ON l.lomba_id = k.lomba_id
        ORDER BY 
            k.kategori_id
    `

    fmt.Println("Query Kategori Penilaian: ", q)

    // Menjalankan query untuk mengambil semua data kategori penilaian
    rows, err := db.Query(q)  // Tidak perlu parameter args lagi
    if err != nil {
        log.Println("Error executing query:", err)
        http.Error(w, "Failed to execute query", http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    // Menyimpan hasil query
    response := make([]STRUCTS.KategoriPenilaianAll, 0)
    for rows.Next() {
        var kategori STRUCTS.KategoriPenilaianAll

        // Memindahkan hasil query ke dalam struct
        err := rows.Scan(
            &kategori.NamaLomba,
            &kategori.NamaKategori,
            &kategori.SetNilai,
            &kategori.NilaiBanding,  // Menambahkan kolom nilai_banding ke struct
            &kategori.KategoriID,
            &kategori.LombaID, // Menambahkan kolom lomba_id ke struct
        )
        if err != nil {
            log.Println("Error scanning row:", err)
            http.Error(w, "Failed to scan data", http.StatusInternalServerError)
            return
        }

        response = append(response, kategori)
    }

    // Menghandle jika tidak ada data
    if len(response) == 0 {
        http.Error(w, "No categories found", http.StatusNotFound)
        return
    }

    // Membuat struktur respons sesuai permintaan
    responseStruct := struct {
        Status  string                      `json:"status"`
        Message string                      `json:"message"`
        Data    []STRUCTS.KategoriPenilaianAll `json:"data"`
    }{
        Status:  "success",
        Message: "Kategori Penilaian berhasil diambil",
        Data:    response,
    }

    // Mengonversi respons ke format JSON
    js, err := json.Marshal(responseStruct)
    if err != nil {
        log.Println("Error marshalling JSON:", err)
        http.Error(w, "Failed to marshal response", http.StatusInternalServerError)
        return
    }

    // Menambahkan header Content-Type dan mengirimkan respons JSON
    w.Header().Set("Content-Type", "application/json")
    w.Write(js)
}


func UpdateKategoriPenilaian(w http.ResponseWriter, r *http.Request) {
    db, err := CONFIG.Connect_db()
    CONFIG.CheckErr(err)
    defer db.Close()

    act := r.FormValue("act")
    id := r.FormValue("kategori_id")
    lombaId := r.FormValue("lomba_id")
    namaKategori := r.FormValue("nama_kategori")
    setNilai := r.FormValue("set_nilai")
    table := "mst_kategori_penilaian"
    var result, logInfo string

    // Untuk menambah kategori baru
    if act == "add" {
        column := "lomba_id, nama_kategori"
        values := "'" + lombaId + "', '" + namaKategori + "'"
        insert := MODEL.Insert(column, values, table)
        if insert != nil {
            result = "failed"
        } else {
            result = "success"
        }

    } else if act == "update" {
        // Untuk memperbarui data kategori yang sudah ada
        where := "kategori_id = '" + id + "'"
        set := "nama_kategori = '" + namaKategori + "'"
        update := MODEL.Update(set, where, table)
        if update != nil {
            result = "failed"
        } else {
            result = "success"
        }
    }else{
        where := "kategori_id = '" + id + "'"
        set := "set_nilai = '" + setNilai + "'"
        update := MODEL.Update(set, where, table)
        if update != nil {
            result = "failed"
        } else {
            result = "success"
        }
    }

    // Menyusun informasi untuk log
    if result == "failed" {
        logInfo = "Failed to " + act + " kategori. <br> Nama Kategori : " + namaKategori
    } else {
        logInfo = "Success to " + act + " kategori. <br> Nama Kategori : " + namaKategori
    }

    // Menyimpan log aktivitas
    session, _ := CONFIG.Store.Get(r, "cookie-name")
    MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Kategori Lomba Lists", act+" kategori", logInfo, result)

    // Mengirimkan response dalam format JSON
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(result)
}


func DeleteKategoriPenilaian(w http.ResponseWriter, r *http.Request) {
    // Membuka koneksi ke database
    db, err := CONFIG.Connect_db()
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer db.Close()

    // Mengambil parameter dari request
    id := r.FormValue("id")
    namaKategori := r.FormValue("nama_kategori")

    // Menentukan tabel dan kondisi untuk menghapus data kategori
    table := "mst_kategori_penilaian"
    where := "kategori_id = '" + id + "' AND nama_kategori = '" + namaKategori + "'"

    // Menghapus data menggunakan model.Delete
    deleteErr := model.Delete(where, table)
    if deleteErr != nil {
        status := "failed"
        logInfo := "Failed to delete kategori lomba. <br> Kategori ID: " + id + " <br> Kategori: " + namaKategori
        handleError(w, status, logInfo, deleteErr)
        return
    }

    // Jika berhasil menghapus data
    status := "success"
    logInfo := "Success to delete kategori lomba. <br> Kategori ID: " + id + " <br> Kategori: " + namaKategori

    // Menyimpan log aktivitas
    session, _ := CONFIG.Store.Get(r, "cookie-name")
    model.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Kategori Lomba Lists", "Delete kategori lomba", logInfo, status)

    // Menyiapkan response JSON
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(status)
}

func UpdateKategoriSubPoint(w http.ResponseWriter, r *http.Request) {
    db, err := CONFIG.Connect_db()
    CONFIG.CheckErr(err)
    defer db.Close()

    act := r.FormValue("act")
    id := r.FormValue("kategori_id")
    idKategoriSubPoint := r.FormValue("kategori_sub_point_id")
    namaKategori := r.FormValue("kategori_sub_point")
    table := "mst_kategori_sub_point"
    var result, logInfo string

    // Menambahkan current timestamp untuk last_update
    currentTimestamp := "CURRENT_TIMESTAMP" // Menyimpan waktu sekarang

    // Untuk menambah kategori baru
    if act == "add" {
        column := "kategori_id, nama_kategori_sub_point, last_update"
        values := "'" + id + "', '" + namaKategori + "', " + currentTimestamp
        insert := MODEL.Insert(column, values, table)
        if insert != nil {
            result = "failed"
        } else {
            result = "success"
        }

    } else {
        // Untuk memperbarui data kategori yang sudah ada
        where := "kategori_sub_point_id = '" + idKategoriSubPoint + "'"
        set := "nama_kategori_sub_point = '" + namaKategori + "', last_update = " + currentTimestamp
        update := MODEL.Update(set, where, table)
        if update != nil {
            result = "failed"
        } else {
            result = "success"
        }
    }

    // Menyusun informasi untuk log
    if result == "failed" {
        logInfo = "Failed to " + act + " kategori. <br> Nama Kategori : " + namaKategori
    } else {
        logInfo = "Success to " + act + " kategori. <br> Nama Kategori : " + namaKategori
    }

    // Menyimpan log aktivitas
    session, _ := CONFIG.Store.Get(r, "cookie-name")
    MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Kategori Lomba Lists", act+" kategori", logInfo, result)

    // Mengirimkan response dalam format JSON
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(result)
}

func LoadIdSubPointKategoriLastUpdate(w http.ResponseWriter, r *http.Request) {
	// Koneksi ke database
	db, err := CONFIG.Connect_db()
	if err != nil {
		http.Error(w, "Failed to connect to database", http.StatusInternalServerError)
		return
	}
	defer db.Close()

	// Query SQL untuk mengambil kategori_sub_point_id terbaru berdasarkan last_update
	query := `
		SELECT 
			kategori_sub_point_id
		FROM 
			mst_kategori_sub_point
		ORDER BY 
			last_update DESC
		LIMIT 1;
	`

	// Menjalankan query
	row := db.QueryRow(query)

	// Menyimpan hasil query dalam variabel
	var kategoriSubPointId int32

	// Mengambil hasil dari query
	err = row.Scan(&kategoriSubPointId)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "No subpoint found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to scan data", http.StatusInternalServerError)
		return
	}

	// Format response JSON
	response := STRUCTS.Response{
		Status:  "success",
		Message: "Get latest Kategori Sub Point ID is success",
		Data:    map[string]int32{"kategori_sub_point_id": kategoriSubPointId},
	}

	// Kirim response dalam format JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func UpdateSubPointList(w http.ResponseWriter, r *http.Request) {
    db, err := CONFIG.Connect_db()
    CONFIG.CheckErr(err)
    defer db.Close()

    act := r.FormValue("act")
    id := r.FormValue("kategori_id")
    namaSubPoint := r.FormValue("nama_sub_point")
    idSubPoint := r.FormValue("sub_point_id")
    table := "mst_sub_point_penilaian"
    var result, logInfo string

    // Untuk menambah kategori baru
    if act == "add" {
        column := "kategori_sub_point_id, nama_sub_point"
        values := "'" + id + "', '" + namaSubPoint + "'"
        insert := MODEL.Insert(column, values, table)
        if insert != nil {
            result = "failed"
        } else {
            result = "success"
        }

    } else if act == "update" {
        // Untuk memperbarui data kategori yang sudah ada
        where := "sub_point_id = '" + idSubPoint + "'"
        set := "nama_sub_point = '" + namaSubPoint + "'"
        update := MODEL.Update(set, where, table)
        if update != nil {
            result = "failed"
        } else {
            result = "success"
        }

    } else if act == "delete" {
        // Untuk menghapus data berdasarkan sub_point_id
        where := "sub_point_id = '" + idSubPoint + "'"
        delete := MODEL.Delete(where, table)
        if delete != nil {
            result = "failed"
        } else {
            result = "success"
        }
    }

    // Menyusun informasi untuk log
    if result == "failed" {
        logInfo = "Failed to " + act + " sub point. <br> Nama Sub Point : " + namaSubPoint
    } else {
        logInfo = "Success to " + act + " sub point. <br> Nama Sub Point : " + namaSubPoint
    }

    // Menyimpan log aktivitas
    session, _ := CONFIG.Store.Get(r, "cookie-name")
    MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Sub Point Lists", act+" sub point", logInfo, result)

    // Mengirimkan response dalam format JSON
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(result)
}

func LoadSubPointList(w http.ResponseWriter, r *http.Request) {
	// Koneksi ke database
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	// Ambil nilai lomba_id dari request
	lomba_id := r.FormValue("lomba_id")

	// Validasi input lomba_id
	if lomba_id == "" {
		http.Error(w, "Lomba ID is required", http.StatusBadRequest)
		return
	}

	// Query SQL yang sudah diperbarui
	query := `
	SELECT 
		COALESCE(sp.nama_sub_point, '') AS nama_sub_point,
		COALESCE(ks.nama_kategori_sub_point, '') AS nama_kategori_sub_point,
		COALESCE(ks.kategori_id, NULL) AS kategori_id,
		COALESCE(k.nama_kategori, '') AS nama_kategori,
		COALESCE(l.nama_lomba, '') AS nama_lomba,
		COALESCE(sp.kategori_sub_point_id, NULL) AS kategori_sub_point_id,
		COALESCE(sp.sub_point_id, NULL) AS sub_point_id,
		COALESCE(k.lomba_id, NULL) AS lomba_id
	FROM 
		mst_sub_point_penilaian sp
	LEFT JOIN
		mst_kategori_sub_point ks ON sp.kategori_sub_point_id = ks.kategori_sub_point_id
	LEFT JOIN
		mst_kategori_penilaian k ON ks.kategori_id = k.kategori_id
	LEFT JOIN
		mst_mata_lomba l ON k.lomba_id = l.lomba_id
	WHERE 
		l.lomba_id = $1
	ORDER BY 
		k.kategori_id, ks.kategori_sub_point_id, sp.sub_point_id;
	`

	// Eksekusi query
	rows, err := db.Query(query, lomba_id)
	if err != nil {
		fmt.Println("Error executing query:", err)
		http.Error(w, "Failed to execute query", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	// Menyimpan hasil query
	var response []STRUCTS.SubPointList
	for rows.Next() {
		var subPoint STRUCTS.SubPointList

		// Memindahkan data hasil query ke dalam struct (sesuaikan dengan tambahan kategori_id)
		err := rows.Scan(
			&subPoint.NamaSubPoint,
			&subPoint.NamaKategoriSubPoint,
			&subPoint.KategoriId,             // kolom tambahan
			&subPoint.NamaKategori,
			&subPoint.NamaLomba,
			&subPoint.KategoriSubPointId,
			&subPoint.SubPointId,
			&subPoint.LombaId,
		)
		if err != nil {
			fmt.Println("Error scanning row:", err)
			http.Error(w, "Failed to scan data", http.StatusInternalServerError)
			return
		}

		// Menambahkan hasil ke response
		response = append(response, subPoint)
	}

	// Membuat response JSON
	responseStruct := struct {
		Status  string               `json:"status"`
		Message string               `json:"message"`
		Data    []STRUCTS.SubPointList `json:"data"`
	}{
		Status:  "success",
		Message: "SubPoints berhasil diambil",
		Data:    response,
	}

	// Mengirimkan respons JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(responseStruct)
}

func DeleteSubPointContent(w http.ResponseWriter, r *http.Request) {
    // Membuka koneksi ke database
    db, err := CONFIG.Connect_db()
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer db.Close()

    // Mengambil parameter dari request
    id := r.FormValue("id")
    namaKategori := r.FormValue("nama_kategori")

    // Menentukan tabel dan kondisi untuk menghapus data kategori
    table := "mst_kategori_sub_point"
    where := "kategori_sub_point_id = '" + id + "' AND nama_kategori_sub_point = '" + namaKategori + "'"

    // Menghapus data menggunakan model.Delete
    deleteErr := model.Delete(where, table)
    if deleteErr != nil {
        status := "failed"
        logInfo := "Failed to delete kategori lomba. <br> Kategori ID: " + id + " <br> Kategori: " + namaKategori
        handleError(w, status, logInfo, deleteErr)
        return
    }

    // Jika berhasil menghapus data
    status := "success"
    logInfo := "Success to delete kategori lomba. <br> Kategori ID: " + id + " <br> Kategori: " + namaKategori

    // Menyimpan log aktivitas
    session, _ := CONFIG.Store.Get(r, "cookie-name")
    model.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Kategori Lomba Lists", "Delete kategori lomba", logInfo, status)

    // Menyiapkan response JSON
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(status)
}

func UpdateKategoriPenguranganPoint(w http.ResponseWriter, r *http.Request) {
    db, err := CONFIG.Connect_db()
    CONFIG.CheckErr(err)
    defer db.Close()

    act := r.FormValue("act")
    id := r.FormValue("id")
    idKategori := r.FormValue("kategori_id")
    kriteriaPengurangan := r.FormValue("kriteria_point_pengurangan")
    table := "mst_kategori_pengurangan_point"
    var result, logInfo string

    currentTimestamp := "CURRENT_TIMESTAMP"

    if act == "add" {
        // Asumsi kategori_id bertipe INT, jadi tidak pakai tanda kutip
        column := "kategori_id, kriteria_point_pengurangan, last_update"
        values := idKategori + ", '" + kriteriaPengurangan + "', " + currentTimestamp
        insert := MODEL.Insert(column, values, table)
        if insert != nil {
            result = "failed"
        } else {
            result = "success"
        }
    } else if act == "update" {
        // Jika ingin update kategori_id juga
        set := "kategori_id = " + idKategori + ", kriteria_point_pengurangan = '" + kriteriaPengurangan + "', last_update = " + currentTimestamp
        where := "id = '" + id + "'"
        update := MODEL.Update(set, where, table)
        if update != nil {
            result = "failed"
        } else {
            result = "success"
        }
    } else if act == "delete" {
        where := "id = '" + id + "'"
        delete := MODEL.Delete(where, table)
        if delete != nil {
            result = "failed"
        } else {
            result = "success"
        }
    }

    if result == "failed" {
        logInfo = "Failed to " + act + " kategori. <br> Nama Kategori : " + kriteriaPengurangan
    } else {
        logInfo = "Success to " + act + " kategori. <br> Nama Kategori : " + kriteriaPengurangan
    }

    session, _ := CONFIG.Store.Get(r, "cookie-name")
    MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Kategori Lomba Lists", act+" kategori", logInfo, result)

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(result)
}


func LoadKategoriPenguranganPoint(w http.ResponseWriter, r *http.Request) {
    // Koneksi ke database
    db, err := CONFIG.Connect_db()
    CONFIG.CheckErr(err)
    defer db.Close()

    // Mendapatkan lomba_id dari parameter query
    lomba_id := r.FormValue("lomba_id")

    if lomba_id == "" {
        http.Error(w, "Lomba ID is required", http.StatusBadRequest)
        return
    }

    // Query SQL untuk mengambil kategori pengurangan point berdasarkan lomba_id
    q := `
        SELECT 
            COALESCE(kp.kriteria_point_pengurangan, '') AS kriteria_point_pengurangan,
            COALESCE(kp.id, 0) AS id,
            COALESCE(kp.kategori_id, 0) AS kategori_id,
            COALESCE(k.nama_kategori, '') AS nama_kategori,
            COALESCE(k.lomba_id, 0) AS lomba_id
        FROM 
            mst_kategori_pengurangan_point kp
        LEFT JOIN 
            mst_kategori_penilaian k ON kp.kategori_id = k.kategori_id
        WHERE 
            kp.lomba_id = $1  -- Filter berdasarkan lomba_id
        ORDER BY 
            kp.kategori_id;
    `

    fmt.Println("Query Kategori Pengurangan Point: ", q)
    rows, err := db.Query(q, lomba_id)
    CONFIG.CheckErr(err)
    defer rows.Close()

    response := make([]STRUCTS.KategoriPenguranganPoint, 0)
    for rows.Next() {
        var kategori STRUCTS.KategoriPenguranganPoint

        err := rows.Scan(
            &kategori.KriteriaPointPengurangan,
            &kategori.ID,           // Menambahkan ID untuk kategori pengurangan point
            &kategori.KategoriID,   // Menambahkan kategori_id
            &kategori.NamaKategori, // Nama kategori dari mst_kategori_penilaian
            &kategori.LombaID,      // Lomba ID dari mst_kategori_penilaian
        )
        if err != nil {
            fmt.Println("Error scanning row:", err)
            http.Error(w, "Failed to scan data", http.StatusInternalServerError)
            return
        }

        response = append(response, kategori)
    }

    // Menyusun respons dalam struktur yang diinginkan
    responseStruct := struct {
        Status  string                      `json:"status"`
        Message string                      `json:"message"`
        Data    []STRUCTS.KategoriPenguranganPoint `json:"data"`
    }{
        Status:  "success",
        Message: "Kategori Pengurangan Point berhasil diambil",
        Data:    response,
    }

    // Mengonversi respons ke format JSON
    js, err := json.Marshal(responseStruct)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.Write(js)
}

func LoadToken(w http.ResponseWriter, r *http.Request) {
	// Koneksi ke database
	db, err := CONFIG.Connect_db()
	if err != nil {
		http.Error(w, "Failed to connect to database", http.StatusInternalServerError)
		return
	}
	defer db.Close()

	// Query SQL untuk mengambil data token, nomor WA, dan nama pangkalan
	query := `
		SELECT 
			p.id,
			p.no_peserta,
			COALESCE(p.token, '') AS token,
			COALESCE(p.no_wa, '') AS no_wa,
			COALESCE(pl.nama_pangkalan, '') AS nama_pangkalan
		FROM
			mst_peserta p
		LEFT JOIN 
			mst_pangkalan pl ON p.pangkalan_id = pl.id
		ORDER BY p.id;
	`

	rows, err := db.Query(query)
	if err != nil {
		http.Error(w, "Failed to execute query", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	// Map hasil dengan key = ID peserta
	results := make(map[int32]STRUCTS.TokenPeserta)
	var No int32

	for rows.Next() {
		var peserta STRUCTS.TokenPeserta

		err = rows.Scan(
			&peserta.Id,
			&peserta.NoPeserta,
			&peserta.Token,
			&peserta.NoWa,
			&peserta.NamaPangkalan,
		)
		if err != nil {
			http.Error(w, "Failed to scan data", http.StatusInternalServerError)
			return
		}

		No++
		peserta.No = No
		results[peserta.Id] = peserta
	}

	// Format JSON response
	response := STRUCTS.Response{
		Status:  "success",
		Message: "Get Master Peserta is success",
		Data:    results,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}



func SaveTokenPeserta(w http.ResponseWriter, r *http.Request) {
    db, err := CONFIG.Connect_db()
    CONFIG.CheckErr(err)
    defer db.Close()

    token := r.FormValue("token")            // Token yang ingin disimpan
    tokenId := r.FormValue("id")             // ID token yang ingin diperbarui (jika update)
    table := "mst_peserta"                   // Tabel yang digunakan
    var result, logInfo string

    // Untuk memperbarui token yang sudah ada
    where := "id = '" + tokenId + "'"  // Menambahkan kutip yang hilang pada kondisi where
    set := "token = '" + token + "'"
    update := MODEL.Update(set, where, table)
    
    if update != nil {
        result = "failed"
    } else {
        result = "success"
    }

    // Menyusun informasi untuk log
    if result == "failed" {
        logInfo = "Failed to update token peserta. <br> Token : " + token
    } else {
        logInfo = "Success to update token peserta. <br> Token : " + token
    }

    // Menyimpan log aktivitas
    session, _ := CONFIG.Store.Get(r, "cookie-name")
    MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Token Peserta", "update token peserta", logInfo, result)

    // Mengirimkan response dalam format JSON
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(result)
}


func ValidateTokenPeserta(w http.ResponseWriter, r *http.Request) {
    db, err := CONFIG.Connect_db()
    if err != nil {
        http.Error(w, "Error connecting to database", http.StatusInternalServerError)
        fmt.Println("Database connection error:", err)
        return
    }
    defer db.Close()

    // Ambil token dari request body
    token := r.FormValue("token")

    // Validasi token
    if token == "" {
        http.Error(w, "Token tidak boleh kosong", http.StatusBadRequest)
        fmt.Println("Token is empty")
        return
    }

    // Query untuk mencari token dengan menggunakan parameterized query
    q := `
        SELECT 
            COALESCE(ms.no_peserta, NULL) AS no_peserta,
            COALESCE(ms.pangkalan_id, NULL) AS pangkalan_id,
            COALESCE(pl.nama_pangkalan, '-') AS nama_pangkalan
        FROM 
            mst_peserta ms
        LEFT JOIN 
            mst_pangkalan pl ON ms.pangkalan_id = pl.id
        WHERE
            ms.token = $1;
    `

    // Menggunakan QueryRow untuk mengambil satu row data
    row := db.QueryRow(q, token)

    var noPeserta, pangkalanId, namaPangkalan sql.NullString
    err = row.Scan(&noPeserta, &pangkalanId, &namaPangkalan)
    if err != nil {
        if err == sql.ErrNoRows {
            // Token tidak ditemukan
            http.Error(w, "Token tidak valid", http.StatusNotFound)
            fmt.Println("Token not found for:", token)
        } else {
            // Error lain
            http.Error(w, "Error querying database", http.StatusInternalServerError)
            fmt.Println("Error querying database:", err)
        }
        return
    }

    // Validasi jika noPeserta, pangkalanId, atau namaPangkalan kosong
    if !noPeserta.Valid || !pangkalanId.Valid || !namaPangkalan.Valid {
        http.Error(w, "Invalid data retrieved for no_peserta, pangkalan_id, or nama_pangkalan", http.StatusBadRequest)
        fmt.Println("Invalid data retrieved for no_peserta, pangkalan_id, or nama_pangkalan")
        return
    }

    // Jika token valid, kirimkan data no_peserta, pangkalan_id, dan nama_pangkalan
    response := struct {
        Status  string `json:"status"`
        Message string `json:"message"`
        Data    struct {
            NoPeserta   string `json:"no_peserta"`
            PangkalanId string `json:"pangkalan_id"`
            NamaPangkalan string `json:"nama_pangkalan"`
        } `json:"data"`
    }{
        Status:  "success",
        Message: "Token valid",
        Data: struct {
            NoPeserta   string `json:"no_peserta"`
            PangkalanId string `json:"pangkalan_id"`
            NamaPangkalan string `json:"nama_pangkalan"`
        }{
            NoPeserta:   noPeserta.String,
            PangkalanId: pangkalanId.String,
            NamaPangkalan: namaPangkalan.String,
        },
    }

    // Mengirimkan response JSON ke client
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    err = json.NewEncoder(w).Encode(response)
    if err != nil {
        fmt.Println("Error encoding response:", err)
    }
}




