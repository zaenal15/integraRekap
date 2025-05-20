package model

import (
	"database/sql"
	CONFIG "erekap/config"
	"fmt"
	"log"
	"time"
)

func CheckRow(where string, tables string) (int32, error) {
	db, err := CONFIG.Connect_db()
	if err != nil {
		panic(err.Error())
	}
	defer db.Close()

	q := `
		SELECT
			COUNT(*) as count
		FROM
			` + tables + `
		WHERE
			` + where + `
	`

	// fmt.Println(q)

	var count int32
	row := db.QueryRow(q)
	errScan := row.Scan(&count)
	if errScan != nil {
		panic(err.Error())
	}
	// fmt.Println(q)
	return count, err
}

func Insert(column string, values string, tables string) error {
	db, err := CONFIG.Connect_db()
	if err != nil {
		panic(err.Error())
	}
	defer db.Close()

	q := `
		INSERT INTO 
			` + tables + `
			(` + column + `)
		VALUES
			(` + values + `)
	`
	// fmt.Println(q)

	_, errExec := db.Exec(q)

	if errExec != nil {
		panic(errExec.Error())
	}
	return nil
}

func Update(set string, where string, tables string) error {
	db, err := CONFIG.Connect_db()
	if err != nil {
		panic(err.Error())
	}
	defer db.Close()

	q := `
		UPDATE 
			` + tables + `
		SET
			` + set + `
		WHERE
			` + where + `
	`

	// fmt.Println(q)
	_, errExec := db.Exec(q)

	if errExec != nil {
		panic(errExec.Error())
	}
	return nil
}

func Delete(where string, tables string) error {
	db, err := CONFIG.Connect_db()
	if err != nil {
		panic(err.Error())
	}
	defer db.Close()

	q := `
		DELETE FROM
			` + tables + `
		WHERE
			` + where + `
	`
	// fmt.Println(q)

	_, errExec := db.Exec(q)
	if errExec != nil {
		panic(errExec.Error())
	}
	return nil
}

func GetRow(get string, where string, tables string, order string) (string, error) {
	db, err := CONFIG.Connect_db()
	if err != nil {
		panic(err.Error())
	}
	defer db.Close()

	q := `
		SELECT
			` + get + `
		FROM
			` + tables + `
		WHERE
			` + where + `
			` + order + `
	`

	var scan string
	row := db.QueryRow(q)
	errScan := row.Scan(&scan)
	// fmt.Println(q)
	if errScan != nil {
		panic(err.Error())
	}
	return scan, err
}

func GetData(get string, where string, tables string, order string) (string, error) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	q := `
		SELECT
			` + get + `
		FROM
			` + tables + `
		WHERE	
			` + where + `
			` + order + `	
	`

	var scan string
	rows := db.QueryRow(q)
	errScan := rows.Scan(&scan)
	if errScan != nil {
		scan = ""
	}
	return scan, err
}

func Log(username string, name string, menu string, activity string, activity_desc string, info string) error {
	db, err := CONFIG.Connect_db()
	if err != nil {
		fmt.Println(err.Error())
	}
	defer db.Close()

	currentTime := time.Now()
	date := currentTime.Format("2006-01-02")
	time := currentTime.Format("15:04:05")

	// ORACLE FORMAT
	// date := currentTime.Format("2006-01-02")
	// date = "TO_DATE('" + date + "', 'YYYY-MM-DD')"
	// time := currentTime.Format("15:04:05")
	// time = "TO_TIMESTAMP('0001-01-01 " + time + "', 'YYYY-MM-DD hh24:mi:ss')"
	if username != "" {
		username = username
	} else {
		username = "-"
	}
	if activity_desc != "" {
		activity_desc = activity_desc
	} else {
		activity_desc = "-"
	}
	sql := `INSERT INTO log_trail(log_date, log_time, username, name, menu, activity, activity_desc, info) 
            VALUES('` + date + `','` + time + `','` + username + `','` + name + `','` + menu + `','` + activity + `','` + activity_desc + `','` + info + `')`

	// fmt.Println(sql)
	_, errLog := db.Exec(sql)
	CONFIG.CheckErr(errLog)
	return nil
}

func UpdateTx(tx *sql.Tx, set, where, table string) error {
	query := "UPDATE " + table + " SET " + set + " WHERE " + where
	log.Printf("Executing query: %s", query) // Log the query for debugging
	_, err := tx.Exec(query)
	return err
}
