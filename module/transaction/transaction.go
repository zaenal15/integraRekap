package transaction

import (
	"net/http"
)

func LoadTxrProcess(w http.ResponseWriter, r *http.Request) {
	// 	db, err := CONFIG.Connect_db()
	// 	CONFIG.CheckErr(err)
	// 	defer db.Close()

	// 	q := `SELECT * FROM trx_process WHERE 1=1`

	// 	fmt.Println(q)
	// 	rows, err := db.Query(q)
	// 	CONFIG.CheckErr(err)

	// 	results := map[string]STRUCTS.trxProcess{}

	// 	var No_management int32
	// 	for rows.Next() {
	// 		No_management++

	// 		var No_process, Name_process, Amount_job, Startdate, Duedate, Customer, Status string
	// 		var Rest_process sql.NullString

	// 		err = rows.Scan(&No_management, &No_process, &Name_process, &Amount_job, &Startdate, &Duedate, &Customer, &Rest_process, &Status)
	// 		if err != nil {
	// 			panic(err)
	// 		}
	// 		Rest_processString := ""
	// 		if Rest_process.Valid {
	// 			Rest_processString = Rest_process.String
	// 		}
	// 		results[No_process] = STRUCTS.trxProcess{
	// 			No_management: No_management,
	// 			No_process:    No_process,
	// 			Name_process:  Name_process,
	// 			Amount_job:    Amount_job,
	// 			Startdate:     Startdate,
	// 			Duedate:       Duedate,
	// 			Customer:      Customer,
	// 			Rest_process:  Rest_processString,
	// 			Status:        Status,
	// 		}
	// 	}

	// 	response := STRUCTS.Response{
	// 		Status:  "success",
	// 		Message: "Get All Process is success",
	// 		Data:    results,
	// 	}

	// 	w.Header().Set("Content-Type", "application/json")
	// 	w.WriteHeader(http.StatusOK)
	// 	json.NewEncoder(w).Encode(response)
}
