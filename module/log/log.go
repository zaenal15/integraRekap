package log

import (
	"encoding/json"
	CONFIG "erekap/config"
	STRUCTS "erekap/structs"
	"fmt"
	"net/http"
)

func LoadLogs(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	q := `SELECT a.*, b.room_name, c.floor_id, c.floor_name 
		FROM logs_in_out a, mst_room b, mst_floor c 
		WHERE 1=1
		AND a.room_id = b.room_id
		AND b.floor_id = c.floor_id
		`
	fmt.Println(q)
	rows, err := db.Query(q)
	CONFIG.CheckErr(err)

	results := map[string]STRUCTS.LogsInOut{}

	var No int32
	for rows.Next() {
		No++

		var Log_id, Room_id, Room_name, Floor_id, Floor_name, Id_no, Username, Name, Datetime, Desc_code, Description string
		err = rows.Scan(&Log_id, &Room_id, &Id_no, &Username, &Name, &Datetime, &Desc_code, &Description, &Room_name, &Floor_id, &Floor_name)

		if err != nil {
			panic(err)
		}
		results[Log_id] = STRUCTS.LogsInOut{
			No:          No,
			Log_id:      Log_id,
			Room_id:     Room_id,
			Room_name:   Room_name,
			Floor_id:    Floor_id,
			Floor_name:  Floor_name,
			Id_no:       Id_no,
			Username:    Username,
			Name:        Name,
			Datetime:    Datetime,
			Desc_code:   Desc_code,
			Description: Description,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(results)
}
