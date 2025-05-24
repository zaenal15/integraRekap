package rekap

import (
	"encoding/json"
	CONFIG "erekap/config"
	MODEL "erekap/module/model"
	STRUCTS "erekap/structs"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func LoadNilaiLomba(w http.ResponseWriter, r *http.Request) {
	// Koneksi ke database
	db, err := CONFIG.Connect_db()
	if err != nil {
		http.Error(w, "Failed to connect to database", http.StatusInternalServerError)
		return
	}
	defer db.Close()

	// Query SQL untuk mengambil data lomba
	q := `SELECT
			nl.nilai_lomba_id,
			nl.no_peserta,
			nl.lomba_id,
      nl.kategori_id,
			nl.nilai
		FROM
			nilai_lomba nl`


	// Menjalankan query
	rows, err := db.Query(q)
	CONFIG.CheckErr(err)
	defer rows.Close()

	// Menyimpan hasil query dalam slice
	var results []STRUCTS.NilaiLomba

	// Looping untuk mengambil hasil query
	for rows.Next() {
		var NilaiLombaId int
		var NoPeserta string
		var LombaID int
		var KategoriId int
		var Nilai float64  // Ubah menjadi float64

		// Men-scan hasil query ke dalam variabel
		err = rows.Scan(&NilaiLombaId, &NoPeserta, &LombaID, &KategoriId, &Nilai)
		if err != nil {
			panic(err)
		}

		// Menyimpan data lomba dalam struct NilaiLomba dan menambahkannya ke results
		results = append(results, STRUCTS.NilaiLomba{
			NilaiLombaId: NilaiLombaId,
			NoPeserta:    NoPeserta,
			LombaID:      LombaID,
			KategoriId:   KategoriId,
			Nilai:        Nilai,
		})
	}

	// Membuat response JSON
	response := STRUCTS.Response{
		Status:  "success",
		Message: "Get Master Nilai Lomba is success",
		Data:    results,
	}

	// Mengirimkan response dalam format JSON
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
func UpdateNilaiLomba(w http.ResponseWriter, r *http.Request) {
    db, err := CONFIG.Connect_db()
    if err != nil {
        http.Error(w, "Failed to connect to database", http.StatusInternalServerError)
        return
    }
    defer db.Close()

    // Mendapatkan data dari request
    act := r.FormValue("act")                  // Aksi yang dilakukan: add atau update
    nilaiLombaId := r.FormValue("nilai_lomba_id")  // ID nilai lomba (untuk update)
    noPeserta := r.FormValue("no_peserta")        // No Peserta
    mataLombaId := r.FormValue("lomba_id")        // ID Mata Lomba
    kategoriId := r.FormValue("kategori_id")      // ID Kategori
    nilai := r.FormValue("nilai")                 // Nilai lomba
    userId := r.FormValue("user_id")              // ID pengguna yang melakukan update

    table := "nilai_lomba"
    var result, logInfo string

    // Cek jika action adalah "add" (menambah nilai lomba baru)
    if act == "add" {
        // Kolom yang akan dimasukkan, mengganti peserta_id dengan no_peserta
        column := "no_peserta, lomba_id, kategori_id, nilai, user_id"
        values := "'" + noPeserta + "', '" + mataLombaId + "', '" + kategoriId + "', '" + nilai + "', '" + userId + "'"
        
        // Memanggil model untuk insert data
        insert := MODEL.Insert(column, values, table)
        if insert != nil {
            result = "failed"
        } else {
            result = "success"
        }
    } else {
        // Jika action adalah "update" (memperbarui nilai lomba)
        where := "nilai_lomba_id = '" + nilaiLombaId + "'"
        set := "no_peserta = '" + noPeserta + "', lomba_id = '" + mataLombaId + "', kategori_id = '" + kategoriId + "', nilai = '" + nilai + "', user_id = '" + userId + "'"
        
        // Memanggil model untuk update data
        update := MODEL.Update(set, where, table)
        if update != nil {
            result = "failed"
        } else {
            result = "success"
        }
    }

    // Menyusun informasi log
    if result == "failed" {
        logInfo = "Failed to " + act + " nilai lomba. No Peserta: " + noPeserta + " Mata Lomba ID: " + mataLombaId + " Kategori ID: " + kategoriId + " Nilai: " + nilai + " User ID: " + userId
    } else {
        logInfo = "Success to " + act + " nilai lomba. No Peserta: " + noPeserta + " Mata Lomba ID: " + mataLombaId + " Kategori ID: " + kategoriId + " Nilai: " + nilai + " User ID: " + userId
    }

    // Menyimpan log aktivitas
    session, _ := CONFIG.Store.Get(r, "cookie-name")
    MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "nilai lomba", act+" nilai lomba", logInfo, result)

    // Mengirimkan response dalam format JSON
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(result)
}

func UpdateNilai(w http.ResponseWriter, r *http.Request) {
    db, err := CONFIG.Connect_db()
    CONFIG.CheckErr(err)
    defer db.Close()

    act := r.FormValue("act")

    type NilaiJuri struct {
        ID       int     `json:"id"`      // ID untuk memeriksa apakah nilai_juri sudah ada
        NamaJuri string  `json:"nama_juri"`
        Nilai    float64 `json:"nilai"`
    }

    type NilaiData struct {
        NoPeserta           string      `json:"no_peserta"`
        LombaId             int         `json:"lomba_id"`
        KategoriSubPointId  int         `json:"kategori_sub_point_id"`
        KategoriPenialaianId int        `json:"kategori_id"`
        SubPointId          int         `json:"sub_point_id"`
        SubPointName        string      `json:"sub_point_name"`
        NilaiJuri           []NilaiJuri `json:"nilai_juri"`
    }

    var req struct {
        NilaiData []NilaiData `json:"nilai_data"`
    }

    err = json.NewDecoder(r.Body).Decode(&req)
    if err != nil || len(req.NilaiData) == 0 {
        w.WriteHeader(http.StatusBadRequest)
        json.NewEncoder(w).Encode(map[string]string{
            "result":  "failed",
            "message": "Invalid request data",
        })
        return
    }

    table := "nilai_juri"
    result := "success"
    var logInfo strings.Builder

    for _, nilai := range req.NilaiData {
        // Loop untuk memeriksa dan melakukan update nilai per juri
        for _, juri := range nilai.NilaiJuri {
            if juri.ID > 0 {
                // Jika ID nilai_juri lebih besar dari 0, lakukan update hanya pada nilai_juri
                updateQuery := fmt.Sprintf("UPDATE %s SET nilai_juri=%.2f WHERE id=%d AND no_peserta='%s' AND lomba_id=%d AND sub_point_id=%d",
                    table, juri.Nilai, juri.ID, nilai.NoPeserta, nilai.LombaId, nilai.SubPointId)
                
                _, err := db.Exec(updateQuery)
                if err != nil {
                    result = "failed"
                    break
                }
            } else {
                // Jika ID juri adalah 0, lakukan insert
                column := "no_peserta, lomba_id, sub_point_id, sub_point_name, nama_juri, nilai_juri, kategori_sub_point_id, kategori_penilaian_id"
                values := fmt.Sprintf("'%s', %d, %d, '%s', '%s', %.2f, %d, %d",
                    nilai.NoPeserta, nilai.LombaId, nilai.SubPointId, nilai.SubPointName, juri.NamaJuri, juri.Nilai, nilai.KategoriSubPointId, nilai.KategoriPenialaianId)

                insertErr := MODEL.Insert(column, values, table)
                if insertErr != nil {
                    result = "failed"
                    break
                }
            }
        }

        logInfo.WriteString(fmt.Sprintf("No Peserta: %s, Lomba ID: %d, Sub-Point: %s; ", nilai.NoPeserta, nilai.LombaId, nilai.SubPointName))

        if result == "failed" {
            break
        }
    }

    session, _ := CONFIG.Store.Get(r, "cookie-name")
    if result == "failed" {
        MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "nilai Lists", act+" nilai", "Failed to "+act+" nilai. Detail: "+logInfo.String(), result)
        w.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(w).Encode(map[string]string{
            "result":  "failed",
            "message": "Failed to " + act + " nilai",
        })
        return
    }

    MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "nilai Lists", act+" nilai", "Success to "+act+" nilai. Detail: "+logInfo.String(), result)

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{
        "result":  "success",
        "message": "Successfully " + act + " nilai",
    })
}


func LoadNilaiJuriList(w http.ResponseWriter, r *http.Request) {
    db, err := CONFIG.Connect_db()
    CONFIG.CheckErr(err)
    defer db.Close()

    no_peserta := r.FormValue("no_peserta")
    nama_juri := r.FormValue("nama_juri")
    lomba_id := r.FormValue("lomba_id")
    sub_point_id := r.FormValue("sub_point_id")
    kategori_sub_point_id := r.FormValue("kategori_sub_point_id")
    kategori_penilaian_id := r.FormValue("kategori_penilaian_id")

    var whereNoPeserta, whereNamaJuri, whereLombaId, whereSubPointId, whereKategoriSubPointId, whereKategoriPenilaianId string

    if no_peserta != "" {
        whereNoPeserta = ` AND (nj.no_peserta = '` + no_peserta + `')`
    }

    if nama_juri != "" {
        whereNamaJuri = ` AND (nj.nama_juri = '` + nama_juri + `')`
    }

    if lomba_id != "" {
        whereLombaId = ` AND (nj.lomba_id = '` + lomba_id + `')`
    }

    if sub_point_id != "" {
        whereSubPointId = ` AND (nj.sub_point_id = '` + sub_point_id + `')`
    }

    if kategori_sub_point_id != "" {
        whereKategoriSubPointId = ` AND (sp.kategori_sub_point_id = '` + kategori_sub_point_id + `')`
    }

    if kategori_penilaian_id != "" {
        whereKategoriPenilaianId = ` AND (nj.kategori_penilaian_id = '` + kategori_penilaian_id + `')`
    }

    q := `
    SELECT 
        COALESCE(nj.id, null) AS id,
        COALESCE(nj.no_peserta, '') AS no_peserta,
        COALESCE(nj.nama_juri, '') AS nama_juri,
        COALESCE(nj.id, null) AS id_nilai_juri,
        COALESCE(nj.sub_point_id, null) AS sub_point_id,
        COALESCE(nj.lomba_id, null) AS lomba_id,
        COALESCE(sp.kategori_sub_point_id, null) AS kategori_sub_point_id,
        COALESCE(nj.kategori_penilaian_id, null) AS kategori_penilaian_id,
        COALESCE(nj.nilai_juri, 0) AS nilai_juri
    FROM 
        nilai_juri nj
    LEFT JOIN
        mst_sub_point_penilaian sp ON nj.sub_point_id = sp.sub_point_id
    WHERE
        1=1
        ` + whereNoPeserta + `
        ` + whereNamaJuri + `
        ` + whereLombaId + `
        ` + whereSubPointId + `
        ` + whereKategoriSubPointId + `
        ` + whereKategoriPenilaianId + `
    ORDER BY 
        nj.no_peserta, nj.nama_juri;
    `
    fmt.Println("Query Nilai Juri:", q)
    rows, err := db.Query(q)
    CONFIG.CheckErr(err)
    defer rows.Close()

    var nilaiJuris []STRUCTS.NilaiJuri

    for rows.Next() {
        var nilaiJuri STRUCTS.NilaiJuri

        err := rows.Scan(
            &nilaiJuri.ID,
            &nilaiJuri.NoPeserta,
            &nilaiJuri.NamaJuri,
            &nilaiJuri.IDNilaiJuri,
            &nilaiJuri.SubPointID,
            &nilaiJuri.LombaID,
            &nilaiJuri.KategoriSubPointID,
            &nilaiJuri.KategoriPenilaianID,
            &nilaiJuri.NilaiJuri,
        )
        if err != nil {
            http.Error(w, "Failed to scan data", http.StatusInternalServerError)
            fmt.Println("Error scanning row:", err)
            return
        }
        nilaiJuris = append(nilaiJuris, nilaiJuri)
    }

    if err = rows.Err(); err != nil {
        http.Error(w, "Error during rows iteration", http.StatusInternalServerError)
        fmt.Println("Rows iteration error:", err)
        return
    }

    response := STRUCTS.Response{
        Status:  "success",
        Message: "Get Nilai Juri List is success",
        Data:    nilaiJuris,
    }
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    err = json.NewEncoder(w).Encode(response)
    if err != nil {
        fmt.Println("Error encoding response:", err)
    }
}

func SavePointPenguranganPeserta(w http.ResponseWriter, r *http.Request) {
    db, err := CONFIG.Connect_db()
    CONFIG.CheckErr(err)
    defer db.Close()

    act := r.FormValue("act")
    noPeserta := r.FormValue("no_peserta")
    idKategori := r.FormValue("kategori_id")
    lombaId := r.FormValue("lomba_id")
    kriteriaPointId := r.FormValue("kriteria_point_id")
    pointPenguranganId := r.FormValue("id")
    pointPengurangan := r.FormValue("point_pengurangan")
    table := "point_pengurangan_peserta"
    var result, logInfo string

    // Menambahkan current timestamp untuk last_update
    currentTimestamp := "CURRENT_TIMESTAMP" // Menyimpan waktu sekarang

    // Untuk menambah point pengurangan baru
    if act == "add" {
        column := "no_peserta, kategori_id, lomba_id, kriteria_point_id, point_pengurangan, last_update"
        values := "'" + noPeserta + "', '" + idKategori + "', '" + lombaId + "', '" + kriteriaPointId + "', '" + pointPengurangan + "', " + currentTimestamp
        insert := MODEL.Insert(column, values, table)
        if insert != nil {
            result = "failed"
        } else {
            result = "success"
        }

    } else {
    // Untuk memperbarui point pengurangan yang sudah ada
        where := "id = '" + pointPenguranganId + "'" // Menambahkan kutip yang hilang
        set := "point_pengurangan = '" + pointPengurangan + "', last_update = " + currentTimestamp
        update := MODEL.Update(set, where, table)
        
        if update != nil {
            result = "failed"
        } else {
            result = "success"
        }
    }


    // Menyusun informasi untuk log
    if result == "failed" {
        logInfo = "Failed to " + act + " point pengurangan. <br> No Peserta : " + noPeserta + ", Nama Kategori : " + pointPengurangan
    } else {
        logInfo = "Success to " + act + " point pengurangan. <br> No Peserta : " + noPeserta + ", Nama Kategori : " + pointPengurangan
    }

    // Menyimpan log aktivitas
    session, _ := CONFIG.Store.Get(r, "cookie-name")
    MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Point Pengurangan Peserta", act+" point pengurangan", logInfo, result)

    // Mengirimkan response dalam format JSON
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(result)
}

func LoadPointPenguranganPeserta(w http.ResponseWriter, r *http.Request) {
    db, err := CONFIG.Connect_db()
    CONFIG.CheckErr(err)
    defer db.Close()

    no_peserta := r.FormValue("no_peserta")
    kategori_id := r.FormValue("kategori_id")
    lomba_id := r.FormValue("lomba_id")
    kriteria_point_id := r.FormValue("kriteria_point_id")

    var whereNoPeserta, whereKategoriId, whereLombaId, whereKriteriaPointId string

    if no_peserta != "" {
        whereNoPeserta = ` AND (pp.no_peserta = '` + no_peserta + `')`
    }

    if kategori_id != "" {
        whereKategoriId = ` AND (pp.kategori_id = '` + kategori_id + `')`
    }

    if lomba_id != "" {
        whereLombaId = ` AND (pp.lomba_id = '` + lomba_id + `')`
    }

    if kriteria_point_id != "" {
        whereKriteriaPointId = ` AND (pp.kriteria_point_id = '` + kriteria_point_id + `')`
    }

    q := `
    SELECT 
        COALESCE(pp.id, null) AS id,
        COALESCE(pp.no_peserta, '') AS no_peserta,
        COALESCE(pp.kategori_id, null) AS kategori_id,
        COALESCE(pp.lomba_id, null) AS lomba_id,
        COALESCE(pp.kriteria_point_id, null) AS kriteria_point_id,
        COALESCE(pp.point_pengurangan, 0) AS point_pengurangan
    FROM 
        point_pengurangan_peserta pp
    WHERE
        1=1
        ` + whereNoPeserta + `
        ` + whereKategoriId + `
        ` + whereLombaId + `
        ` + whereKriteriaPointId + `
    ORDER BY 
        pp.no_peserta, pp.kategori_id;
    `
    fmt.Println("Query Point Pengurangan Peserta:", q)
    rows, err := db.Query(q)
    CONFIG.CheckErr(err)
    defer rows.Close()

    var pointPengurangans []STRUCTS.PointPenguranganPeserta

    for rows.Next() {
        var pointPengurangan STRUCTS.PointPenguranganPeserta

        err := rows.Scan(
            &pointPengurangan.ID,
            &pointPengurangan.NoPeserta,
            &pointPengurangan.KategoriID,
            &pointPengurangan.LombaID,
            &pointPengurangan.KriteriaPointID,
            &pointPengurangan.PointPengurangan,
        )
        if err != nil {
            http.Error(w, "Failed to scan data", http.StatusInternalServerError)
            fmt.Println("Error scanning row:", err)
            return
        }
        pointPengurangans = append(pointPengurangans, pointPengurangan)
    }

    if err = rows.Err(); err != nil {
        http.Error(w, "Error during rows iteration", http.StatusInternalServerError)
        fmt.Println("Rows iteration error:", err)
        return
    }

    response := STRUCTS.Response{
        Status:  "success",
        Message: "Get Point Pengurangan Peserta List is success",
        Data:    pointPengurangans,
    }
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    err = json.NewEncoder(w).Encode(response)
    if err != nil {
        fmt.Println("Error encoding response:", err)
    }
}

func LoadNilaiRekap(w http.ResponseWriter, r *http.Request) {
    db, err := CONFIG.Connect_db()
    CONFIG.CheckErr(err)
    defer db.Close()

    noPeserta := r.FormValue("no_peserta")
    lombaId := r.FormValue("lomba_id")

    var whereNoPeserta, whereLombaId string

    // Menambahkan kondisi pencarian untuk no_peserta dan lomba_id
    if noPeserta != "" {
        whereNoPeserta = ` AND (nj.no_peserta = '` + noPeserta + `')`
    }

    if lombaId != "" {
        whereLombaId = ` AND (nj.lomba_id = '` + lombaId + `')`
    }

    // Query SQL terbaru untuk mendapatkan rekap nilai juri berdasarkan lomba_id dan no_peserta
    query := `
    SELECT 
        nj.no_peserta,
        nj.lomba_id,
        nj.kategori_penilaian_id,
        kp.nama_kategori,
        kp.set_nilai,
        kp.nilai_banding,
        SUM(nj.nilai_juri) AS total_nilai_juri
    FROM 
        nilai_juri nj
    LEFT JOIN 
        mst_kategori_penilaian kp ON nj.kategori_penilaian_id = kp.kategori_id
    WHERE
        1=1
        ` + whereNoPeserta + `
        ` + whereLombaId + `
    GROUP BY 
        nj.no_peserta, nj.lomba_id, nj.kategori_penilaian_id, kp.nama_kategori, kp.set_nilai, kp.nilai_banding
    ORDER BY 
        nj.no_peserta, nj.kategori_penilaian_id;
    `
    fmt.Println("Query Nilai Rekap:", query)
    rows, err := db.Query(query)
    CONFIG.CheckErr(err)
    defer rows.Close()

    // Menyimpan hasil rekap nilai
    var nilaiRekaps []STRUCTS.NilaiRekap

    for rows.Next() {
        var nilaiRekap STRUCTS.NilaiRekap

        err := rows.Scan(
            &nilaiRekap.NoPeserta,
            &nilaiRekap.LombaID,
            &nilaiRekap.KategoriPenilaianID,
            &nilaiRekap.NamaKategori,
            &nilaiRekap.SetNilai,
            &nilaiRekap.NilaiBanding,  // Scan nilai_banding
            &nilaiRekap.TotalNilaiJuri,
        )
        if err != nil {
            http.Error(w, "Failed to scan data", http.StatusInternalServerError)
            fmt.Println("Error scanning row:", err)
            return
        }
        nilaiRekaps = append(nilaiRekaps, nilaiRekap)
    }

    // Periksa apakah ada error saat iterasi baris
    if err = rows.Err(); err != nil {
        http.Error(w, "Error during rows iteration", http.StatusInternalServerError)
        fmt.Println("Rows iteration error:", err)
        return
    }

    // Mengirimkan response
    response := STRUCTS.Response{
        Status:  "success",
        Message: "Get Nilai Rekap is success",
        Data:    nilaiRekaps,
    }
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    err = json.NewEncoder(w).Encode(response)
    if err != nil {
        fmt.Println("Error encoding response:", err)
    }
}


func UpdateKategoriJuara(w http.ResponseWriter, r *http.Request) {
    // Koneksi ke database
    db, err := CONFIG.Connect_db()
    CONFIG.CheckErr(err)
    defer db.Close()

    // Mendapatkan nilai parameter dari request
    act := r.FormValue("act")            // Aksi yang diambil (add, update, dsb)
    totalJuara := r.FormValue("total_juara") // Total jumlah juara
    kategoriJuara := r.FormValue("kategori_juara") // Akumulasi nilai terkait kategori juara
    id := r.FormValue("id") // Akumulasi nilai terkait kategori juara
    table := "kategori_juara"           // Nama tabel yang akan diupdate
    var result, logInfo string          // Variabel untuk hasil dan informasi log

    // Untuk menambah kategori baru
    if act == "add" {
        // Menentukan kolom dan nilai untuk insert
        column := "kategori_juara, total_juara"
        values := "'" + kategoriJuara + "', '" + totalJuara + "'"
        insert := MODEL.Insert(column, values, table)
        
        // Mengecek hasil insert
        if insert != nil {
            result = "failed"
        } else {
            result = "success"
        }

    } else if act == "update" {
        // Untuk memperbarui kategori juara yang sudah ada
        where := "id = '" + id + "'"
        set := "kategori_juara = '" + kategoriJuara+ "', total_juara = '" + totalJuara + "'"
        update := MODEL.Update(set, where, table)

        // Mengecek hasil update
        if update != nil {
            result = "failed"
        } else {
            result = "success"
        }
    }else if act == "delete" {
        // Untuk menghapus data kategori juara berdasarkan kategori_juara_id dan kategori_penilaian_id
        where := "id = '" + id + "'"
        delete := MODEL.Delete(where, table)

        if delete != nil {
            result = "failed"
        } else {
            result = "success"
        }

    } else {
        // Jika aksi tidak dikenali, kembalikan error
        result = "failed"
        logInfo = "Invalid action specified"
    }

    // Menyusun informasi untuk log
    if result == "failed" {
        logInfo = "Failed to " + act + " kategori juara. <br> Nama Kategori: " + kategoriJuara
    } else {
        logInfo = "Success to " + act + " kategori juara. <br> Nama Kategori: " + kategoriJuara
    }

    // Menyimpan log aktivitas
    session, _ := CONFIG.Store.Get(r, "cookie-name")
    MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Kategori Juara", act+" kategori juara", logInfo, result)

    // Mengirimkan response dalam format JSON
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(result)
}
func LoadKategoriJuara(w http.ResponseWriter, r *http.Request) {
    db, err := CONFIG.Connect_db()
    CONFIG.CheckErr(err)
    defer db.Close()

    kategoriJuara := r.FormValue("kategori_juara") // Ambil parameter kategori juara
    totalJuara := r.FormValue("total_juara") // Ambil parameter total juara

    var whereKategoriJuara, whereTotalJuara string

    // Menambahkan kondisi pencarian untuk kategori_juara dan total_juara
    if kategoriJuara != "" {
        whereKategoriJuara = ` AND (kj.kategori_juara = '` + kategoriJuara + `')`
    }

    if totalJuara != "" {
        whereTotalJuara = ` AND (kj.total_juara = '` + totalJuara + `')`
    }

    // Query SQL untuk mendapatkan data kategori juara
    query := `
    SELECT 
        kj.id,
        kj.kategori_juara,
        kj.total_juara
    FROM 
        kategori_juara kj
    WHERE
        1=1
        ` + whereKategoriJuara + `
        ` + whereTotalJuara + `
    ORDER BY 
        kj.id;
    `
    fmt.Println("Query Kategori Juara:", query)
    rows, err := db.Query(query)
    if err != nil {
        http.Error(w, "Failed to execute query: "+err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    var kategoriJuaraList []STRUCTS.KategoriJuara

    for rows.Next() {
        var kategori STRUCTS.KategoriJuara

        err := rows.Scan(
            &kategori.ID,
            &kategori.KategoriJuara,
            &kategori.TotalJuara,
        )
        if err != nil {
            http.Error(w, "Failed to scan data", http.StatusInternalServerError)
            fmt.Println("Error scanning row:", err)
            return
        }
        kategoriJuaraList = append(kategoriJuaraList, kategori)
    }

    // Periksa apakah ada error saat iterasi baris
    if err = rows.Err(); err != nil {
        http.Error(w, "Error during rows iteration", http.StatusInternalServerError)
        fmt.Println("Rows iteration error:", err)
        return
    }

    // Mengirimkan response
    response := STRUCTS.Response{
        Status:  "success",
        Message: "Get Kategori Juara List is success",
        Data:    kategoriJuaraList,
    }
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    err = json.NewEncoder(w).Encode(response)
    if err != nil {
        fmt.Println("Error encoding response:", err)
    }
}

func UpdateKategoriPenilaianJuara(w http.ResponseWriter, r *http.Request) {
    db, err := CONFIG.Connect_db()
    CONFIG.CheckErr(err)
    defer db.Close()

    // Mendapatkan nilai parameter dari request
    act := r.FormValue("act")               // Aksi yang diambil (add, update, delete, dsb)
    kategoriJuaraId := r.FormValue("kategori_juara_id")  // ID kategori juara
    kategoriPenilaianId := r.FormValue("kategori_penilaian_id")  // ID kategori penilaian
    lombaId := r.FormValue("lomba_id")      // ID lomba
    table := "kategori_juara_kategori_penilaian"  // Nama tabel yang akan diupdate
    var result, logInfo string              // Variabel untuk hasil dan informasi log

    // Untuk menambah kategori juara baru
    if act == "add" {
        column := "kategori_juara_id, kategori_penilaian_id, lomba_id"
        values := "'" + kategoriJuaraId + "', '" + kategoriPenilaianId + "', '" + lombaId + "'"
        insert := MODEL.Insert(column, values, table)

        if insert != nil {
            result = "failed"
        } else {
            result = "success"
        }

    } else if act == "update" {
        // Untuk memperbarui data kategori juara yang sudah ada
        where := "kategori_juara_id = '" + kategoriJuaraId + "'"
        set := "kategori_penilaian_id = '" + kategoriPenilaianId + "', lomba_id = '" + lombaId + "'"
        update := MODEL.Update(set, where, table)
        if update != nil {
            result = "failed"
        } else {
            result = "success"
        }

    } else if act == "delete" {
        // Untuk menghapus data kategori juara berdasarkan kategori_juara_id dan kategori_penilaian_id
        where := "kategori_juara_id = '" + kategoriJuaraId + "' AND kategori_penilaian_id = '" + kategoriPenilaianId + "'"
        delete := MODEL.Delete(where, table)

        if delete != nil {
            result = "failed"
        } else {
            result = "success"
        }

    } else {
        result = "failed"
        logInfo = "Invalid action specified"
    }

    // Menyusun informasi untuk log
    if result == "failed" {
        logInfo = "Failed to " + act + " kategori juara. <br> Kategori Juara : " + kategoriJuaraId
    } else {
        logInfo = "Success to " + act + " kategori juara. <br> Kategori Juara : " + kategoriJuaraId
    }

    // Menyimpan log aktivitas
    session, _ := CONFIG.Store.Get(r, "cookie-name")
    MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Kategori Juara", act+" kategori juara", logInfo, result)

    // Mengirimkan response dalam format JSON
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(result)
}
func LoadKategoriPenilaianJuara(w http.ResponseWriter, r *http.Request) {
    db, err := CONFIG.Connect_db()
    CONFIG.CheckErr(err)
    defer db.Close()

    kategoriJuaraId := r.FormValue("kategori_juara_id")
    kategoriPenilaianId := r.FormValue("kategori_penilaian_id")
    lombaId := r.FormValue("lomba_id")

    var whereKategoriJuaraId, whereKategoriPenilaianId, whereLombaId string

    if kategoriJuaraId != "" {
        whereKategoriJuaraId = ` AND (kp.kategori_juara_id = '` + kategoriJuaraId + `')`
    }

    if kategoriPenilaianId != "" {
        whereKategoriPenilaianId = ` AND (kp.kategori_penilaian_id = '` + kategoriPenilaianId + `')`
    }

    if lombaId != "" {
        whereLombaId = ` AND (kp.lomba_id = '` + lombaId + `')`
    }

    q := `
    SELECT 
        COALESCE(kp.kategori_juara_id, null) AS kategori_juara_id,
        COALESCE(kj.kategori_juara, '') AS kategori_juara,
        COALESCE(kn.nama_kategori, '') AS nama_kategori_penilaian,
        COALESCE(kj.total_juara, NULL) AS total_juara,
        COALESCE(kp.kategori_penilaian_id, NULL) AS kategori_penilaian_id,
        COALESCE(kp.lomba_id, null) AS lomba_id,
        COALESCE(mb.nama_lomba, '') AS nama_lomba
    FROM 
        kategori_juara_kategori_penilaian kp
    LEFT JOIN
        kategori_juara kj ON kp.kategori_juara_id = kj.id
    LEFT JOIN
        mst_mata_lomba mb ON kp.lomba_id = mb.lomba_id
    LEFT JOIN
        mst_kategori_penilaian kn ON kp.kategori_penilaian_id = kn.kategori_id
    WHERE
        1=1
        ` + whereKategoriJuaraId + `
        ` + whereKategoriPenilaianId + `
        ` + whereLombaId + `
    ORDER BY 
        kp.kategori_juara_id, kp.kategori_penilaian_id;
    `
    
    fmt.Println("Query Kategori Penilaian:", q)
    rows, err := db.Query(q)
    CONFIG.CheckErr(err)
    defer rows.Close()

    var kategoriPenilaians []STRUCTS.KategoriPenilaianJuara

    for rows.Next() {
        var kategoriPenilaian STRUCTS.KategoriPenilaianJuara

        err := rows.Scan(
            &kategoriPenilaian.KategoriJuaraID,
            &kategoriPenilaian.KategoriJuara,
            &kategoriPenilaian.NamaKategoriPenilaian,
            &kategoriPenilaian.TotalJuara,
            &kategoriPenilaian.KategoriPenilaianID,
            &kategoriPenilaian.LombaID,
            &kategoriPenilaian.NamaLomba,
        )
        if err != nil {
            http.Error(w, "Failed to scan data", http.StatusInternalServerError)
            fmt.Println("Error scanning row:", err)
            return
        }
        kategoriPenilaians = append(kategoriPenilaians, kategoriPenilaian)
    }

    if err = rows.Err(); err != nil {
        http.Error(w, "Error during rows iteration", http.StatusInternalServerError)
        fmt.Println("Rows iteration error:", err)
        return
    }

    response := STRUCTS.Response{
        Status:  "success",
        Message: "Get Kategori Penilaian List is success",
        Data:    kategoriPenilaians,
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    err = json.NewEncoder(w).Encode(response)
    if err != nil {
        fmt.Println("Error encoding response:", err)
    }
}

func SaveKuesioner(w http.ResponseWriter, r *http.Request) {
    db, err := CONFIG.Connect_db()
    CONFIG.CheckErr(err)
    defer db.Close()

    // Mengambil input dari form
    isi := r.FormValue("isi_kuesioner") // pastikan name/ID dari textarea-nya sesuai
    table := "kuesioner_rekap"
    var result, logInfo string

    if isi != "" {
        // Kolom dan nilai yang akan disimpan
        column := "isi, tanggal_submit"
        values := "'" + isi + "', CURRENT_TIMESTAMP"

        insert := MODEL.Insert(column, values, table)

        if insert != nil {
            result = "failed"
        } else {
            result = "success"
        }
    } else {
        result = "failed"
    }

    // Menyusun log aktivitas
    logInfo = "Submit kuesioner: " + isi

    // Menyimpan log aktivitas
    session, _ := CONFIG.Store.Get(r, "cookie-name")
    MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Kuesioner", "submit", logInfo, result)

    // Mengirimkan response JSON
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(result)
}

func UpdateRekapBandingKategoriJuara(w http.ResponseWriter, r *http.Request) {
    db, err := CONFIG.Connect_db()
    if err != nil {
        http.Error(w, "Database connection failed", http.StatusInternalServerError)
        return
    }
    defer db.Close()

    act := r.FormValue("act")
    kategoriJuaraId := r.FormValue("kategori_juara_id")
    valueBanding := r.FormValue("value_banding")
    rakapBanding := r.FormValue("rakap_banding")
    setValueBanding := r.FormValue("set_value_banding")
    tipePenilaianLomba := r.FormValue("tipe_penilaian_lomba")
    akumulasiRekapNilai := r.FormValue("akumulasi_rekap_nilai")
    table := "rekap_banding"

    var result string
    var logInfo string

    if act == "add" {
        column := "kategori_juara_id, value_banding, rakap_banding, set_value_banding, tipe_penilaian_lomba, akumulasi_rekap_nilai"
        values := fmt.Sprintf("'%s', '%s', '%s', '%s', '%s', '%s'", kategoriJuaraId, valueBanding, rakapBanding, setValueBanding, tipePenilaianLomba, akumulasiRekapNilai)
        err := MODEL.Insert(column, values, table)

        if err != nil {
            result = "failed"
            logInfo = fmt.Sprintf("Failed to add rekap banding kategori juara. Error: %v", err)
        } else {
            result = "success"
            logInfo = fmt.Sprintf("Success to add rekap banding kategori juara. Kategori Juara ID: %s", kategoriJuaraId)
        }

    } else if act == "update" {
        where := fmt.Sprintf("kategori_juara_id = '%s'", kategoriJuaraId)
        set := fmt.Sprintf(
            "value_banding = '%s', rakap_banding = '%s', set_value_banding = '%s', tipe_penilaian_lomba = '%s', akumulasi_rekap_nilai = '%s'",
            valueBanding, rakapBanding, setValueBanding, tipePenilaianLomba, akumulasiRekapNilai,
        )
        err := MODEL.Update(set, where, table)

        if err != nil {
            result = "failed"
            logInfo = fmt.Sprintf("Failed to update rekap banding kategori juara. Error: %v", err)
        } else {
            result = "success"
            logInfo = fmt.Sprintf("Success to update rekap banding kategori juara. Kategori Juara ID: %s", kategoriJuaraId)
        }

    } else {
        result = "failed"
        logInfo = "Invalid action specified"
    }

    // Simpan log aktivitas
    session, _ := CONFIG.Store.Get(r, "cookie-name")
    if sessionErr := MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Rekap Banding Kategori Juara", act+" rekap banding kategori juara", logInfo, result); sessionErr != nil {
        log.Println("Log saving error:", sessionErr)
    }

    // Kirimkan response JSON YANG BENAR
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{
        "result":  result,  // success atau failed
        "message": logInfo, // pesan tambahan
    })
}

func LoadRekapBandingKategoriJuara(w http.ResponseWriter, r *http.Request) {
    db, err := CONFIG.Connect_db()
    if err != nil {
        http.Error(w, "Database connection failed", http.StatusInternalServerError)
        return
    }
    defer db.Close()

    kategoriJuaraId := r.FormValue("kategori_juara_id")

    var whereKategoriJuaraId string
    if kategoriJuaraId != "" {
        whereKategoriJuaraId = ` AND (rb.kategori_juara_id = '` + kategoriJuaraId + `')`
    }

    q := `
    SELECT 
        COALESCE(rb.id, 0) AS id, -- <-- ambil ID
        COALESCE(rb.kategori_juara_id, NULL) AS kategori_juara_id,
        COALESCE(kj.kategori_juara, '') AS kategori_juara,
        COALESCE(rb.value_banding, NULL) AS value_banding,
        COALESCE(rb.rakap_banding, '') AS rakap_banding,
        COALESCE(rb.set_value_banding, FALSE) AS set_value_banding,
        COALESCE(rb.tipe_penilaian_lomba, '') AS tipe_penilaian_lomba,
        COALESCE(rb.akumulasi_rekap_nilai, '') AS akumulasi_rekap_nilai
    FROM 
        rekap_banding rb
    LEFT JOIN
        kategori_juara kj ON rb.kategori_juara_id = kj.id
    WHERE
        1=1
        ` + whereKategoriJuaraId + `
    ORDER BY 
        rb.kategori_juara_id;
    `

    fmt.Println("Query Load Rekap Banding:", q)
    rows, err := db.Query(q)
    if err != nil {
        http.Error(w, "Failed to query database", http.StatusInternalServerError)
        fmt.Println("Error query:", err)
        return
    }
    defer rows.Close()

    var rekapBandings []STRUCTS.RekapBandingKategoriJuara

    for rows.Next() {
        var rekapBanding STRUCTS.RekapBandingKategoriJuara

        err := rows.Scan(
            &rekapBanding.ID, // <-- tambahan ID
            &rekapBanding.KategoriJuaraID,
            &rekapBanding.KategoriJuara,
            &rekapBanding.ValueBanding,
            &rekapBanding.RakapBanding,
            &rekapBanding.SetValueBanding,
            &rekapBanding.TipePenilaianLomba,
            &rekapBanding.AkumulasiRekapNilai,
        )
        if err != nil {
            http.Error(w, "Failed to scan data", http.StatusInternalServerError)
            fmt.Println("Error scanning row:", err)
            return
        }
        rekapBandings = append(rekapBandings, rekapBanding)
    }

    if err = rows.Err(); err != nil {
        http.Error(w, "Error during rows iteration", http.StatusInternalServerError)
        fmt.Println("Rows iteration error:", err)
        return
    }

    response := STRUCTS.Response{
        Status:  "success",
        Message: "Get Rekap Banding List is success",
        Data:    rekapBandings,
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    err = json.NewEncoder(w).Encode(response)
    if err != nil {
        fmt.Println("Error encoding response:", err)
    }
}

func UploadPenilaian(w http.ResponseWriter, r *http.Request) {
    db, err := CONFIG.Connect_db()
    if err != nil {
        log.Println("Gagal koneksi DB:", err)
        http.Error(w, "Gagal koneksi database", http.StatusInternalServerError)
        return
    }
    defer db.Close()

    // Batasi maksimal ukuran file upload (20 MB)
    err = r.ParseMultipartForm(20 << 20) // 20 MB
    if err != nil {
        http.Error(w, "Gagal memproses form-data", http.StatusBadRequest)
        return
    }

    noPeserta := r.FormValue("no_peserta")
    lombaID := r.FormValue("lomba_id")
    files := r.MultipartForm.File["penilaian_foto"]

    uploadDir := "assets/img/penilaian"
    os.MkdirAll(uploadDir, os.ModePerm)

    var uploaded []string
    var failed []string

    log.Printf("[UPLOAD] Mulai upload %d file untuk peserta %s, lomba %s", len(files), noPeserta, lombaID)

    for _, fileHeader := range files {
        src, err := fileHeader.Open()
        if err != nil {
            failed = append(failed, fmt.Sprintf("%s (gagal dibuka)", fileHeader.Filename))
            continue
        }

        fileName := fileHeader.Filename
        filePath := filepath.Join(uploadDir, fileName)

        dst, err := os.Create(filePath)
        if err != nil {
            failed = append(failed, fmt.Sprintf("%s (gagal disimpan)", fileName))
            src.Close()
            continue
        }

        if _, err := io.Copy(dst, src); err != nil {
            failed = append(failed, fmt.Sprintf("%s (gagal menyalin file)", fileName))
            dst.Close()
            src.Close()
            continue
        }

        dst.Close()
        src.Close()

        // Simpan ke database
        column := "no_peserta, lomba_id, file_path"
        values := fmt.Sprintf("'%s', '%s', '%s'", noPeserta, lombaID, filePath)
        if err := MODEL.Insert(column, values, "penilaian_foto"); err != nil {
            log.Printf("Gagal insert DB untuk file %s: %v", fileName, err)
            failed = append(failed, fmt.Sprintf("%s (gagal simpan DB)", fileName))
            continue
        }

        uploaded = append(uploaded, filePath)
    }

    result := "success"
    if len(uploaded) == 0 {
        result = "failed"
    }

    // Ambil session user (pastikan aman dari panic)
    session, _ := CONFIG.Store.Get(r, "cookie-name")
    username, ok1 := session.Values["Username"].(string)
    name, ok2 := session.Values["Name"].(string)
    if !ok1 || !ok2 {
        log.Println("Session tidak valid, tidak bisa menyimpan log aktivitas")
    } else {
        logInfo := fmt.Sprintf("Upload %d file penilaian untuk no peserta %s, lomba %s", len(uploaded), noPeserta, lombaID)
        MODEL.Log(username, name, "Upload Penilaian", "upload", logInfo, result)
    }

    // Kirim respon JSON
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]interface{}{
        "result":   result,
        "uploaded": uploaded,
        "failed":   failed,
    })

    log.Printf("[UPLOAD] Selesai. Sukses: %d, Gagal: %d", len(uploaded), len(failed))
}


func LoadFotoPenilaian(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	noPeserta := r.FormValue("no_peserta")
	lombaID := r.FormValue("lomba_id")

	if noPeserta == "" {
		http.Error(w, "no_peserta diperlukan", http.StatusBadRequest)
		return
	}

	// Bangun query dan args dinamis
	query := `
		SELECT 
			id,
			no_peserta,
			lomba_id,
			file_path,
			uploaded_at
		FROM 
			penilaian_foto
		WHERE 
			no_peserta = $1
	`
	args := []interface{}{noPeserta}

	if lombaID != "" {
		query += " AND lomba_id = $2"
		args = append(args, lombaID)
	}

	query += " ORDER BY uploaded_at DESC"

	rows, err := db.Query(query, args...)
	if err != nil {
		fmt.Println("Error executing query:", err)
		http.Error(w, "Gagal mengambil data foto", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var fotoList []STRUCTS.FotoPenilaian
	for rows.Next() {
		var foto STRUCTS.FotoPenilaian
		if err := rows.Scan(&foto.ID, &foto.NoPeserta, &foto.LombaID, &foto.FilePath, &foto.UploadedAt); err != nil {
			fmt.Println("Error scanning row:", err)
			http.Error(w, "Gagal membaca data", http.StatusInternalServerError)
			return
		}
		fotoList = append(fotoList, foto)
	}

	response := struct {
		Status  string                   `json:"status"`
		Message string                   `json:"message"`
		Data    []STRUCTS.FotoPenilaian `json:"data"`
	}{
		Status:  "success",
		Message: "Data foto berhasil diambil",
		Data:    fotoList,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}


func DeleteFotoPenilaian(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	id := r.FormValue("id")
	if id == "" {
		http.Error(w, "Parameter id diperlukan", http.StatusBadRequest)
		return
	}

	// Ambil path file dulu
	var filePath string
	query := "SELECT file_path FROM penilaian_foto WHERE id = $1"
	err = db.QueryRow(query, id).Scan(&filePath)
	if err != nil {
		http.Error(w, "Data tidak ditemukan atau gagal ambil path", http.StatusNotFound)
		return
	}

	// Hapus file dari sistem
	if err := os.Remove(filePath); err != nil && !os.IsNotExist(err) {
		http.Error(w, "Gagal menghapus file", http.StatusInternalServerError)
		return
	}

	// Hapus dari database
	deleteQuery := "DELETE FROM penilaian_foto WHERE id = $1"
	_, err = db.Exec(deleteQuery, id)
	if err != nil {
		http.Error(w, "Gagal menghapus data dari database", http.StatusInternalServerError)
		return
	}

	// Response sukses
	response := map[string]interface{}{
		"status":  "success",
		"message": "Foto berhasil dihapus",
		"id":      id,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
