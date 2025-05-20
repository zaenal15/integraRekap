package process

import (
	"database/sql"
	"encoding/json"
	CONFIG "erekap/config"
	MODEL "erekap/module/model"
	STRUCTS "erekap/structs"
	"fmt"
	"net/http"
	"strings"
	"time"
)

func SetProcesses(w http.ResponseWriter, r *http.Request) {
	var updatedItems []STRUCTS.ProcessLists
	err := json.NewDecoder(r.Body).Decode(&updatedItems)
	fmt.Println(err, r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	table := `order_process`
	where := "1=1 AND job_number = '" + updatedItems[0].Job_number + "' AND drawing_id = '" + updatedItems[0].Drawing_id + "'"
	where += " AND status_process = 'ongoing'"

	var result, logInfo string

	delete := MODEL.Delete(where, table)
	if delete != nil {
		result = "failed"
		logInfo = "Failed to alter process for Job Number : " + updatedItems[0].Job_number + " And Drawing ID : " + updatedItems[0].Drawing_id + "."
	} else {
		result = "success"
		logInfo = "Success to alter process for Job Number : " + updatedItems[0].Job_number + " And Drawing ID : " + updatedItems[0].Drawing_id + "."
		for _, item := range updatedItems {
			if item.Status == "ongoing" {
				qtyProcessValue := "NULL"
				if item.Qty_process != "" {
					qtyProcessValue = `'` + item.Qty_process + `'`
				}
				column := `"job_number",`
				column += `"drawing_id",`
				column += `"order_process",`
				column += `"status_process",`
				column += `"process_id",`
				column += `"target_date",`
				column += `"qty_process"`

				values := `'` + item.Job_number + `',`
				values += `'` + item.Drawing_id + `',`
				values += `'` + item.Order + `',`
				values += `'` + item.Status + `',`
				values += `'` + item.Process + `',`
				values += `'` + item.Target_date + `',`
				values += `` + qtyProcessValue + ``
				insert := MODEL.Insert(column, values, table)
				if insert != nil {
					result = "failed"
					break
				} else {
					result = "success"
				}
			} else {
				where := "1=1 AND id = '" + item.Id + "'"
				set := "order_process = '" + item.Order + "'"
				update := MODEL.Update(set, where, table)

				if item.Qty_process == "" {
					set += ", qty_process = NULL"
				} else {
					set += ", qty_process = '" + item.Qty_process + "'"
				}

				if update != nil {
					result = "failed"
				} else {
					result = "success"
				}
			}

			if result != "success" {
				logInfo = "Failed to alter process for Job Number : " + updatedItems[0].Job_number + " And Drawing ID : " + updatedItems[0].Drawing_id + "."
				break
			} else {
				logInfo = "Success to alter process for Job Number : " + updatedItems[0].Job_number + " And Drawing ID : " + updatedItems[0].Drawing_id + "."
			}
		}
	}

	session, _ := CONFIG.Store.Get(r, "cookie-name")
	MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Processes Lists", "Alter Processes Lists", logInfo, result)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func LoadOrderProcess(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	results := map[int32]STRUCTS.OrderProcess{}
	resultsShort := map[int32]STRUCTS.OrderProcessSelect{}

	startPeriod := r.FormValue("startPeriod")
	endPeriod := r.FormValue("endPeriod")
	id := r.FormValue("id")
	job_number := r.FormValue("job_number")
	drawing_id := r.FormValue("drawing_id")
	jobDrawingNumber := r.FormValue("jobDrawingNumber")
	process := r.FormValue("process")
	customer := r.FormValue("customer")
	id_process := r.FormValue("id_process")
	setDrawing := r.FormValue("setDrawing")
	byOrderOnly := r.FormValue("byOrderOnly")
	monitoring := r.FormValue("monitoring")
	drawing_lists := r.FormValue("drawing_lists")
	basket := r.FormValue("basket")
	print_select := r.FormValue("print")
	querySelected := r.FormValue("querySelected")

	var whereDrawingLists, whereJobDrawing, whereCustomer, wherePeriod, whereId, whereJobNumber, whereDrawingId, whereDrawingImage, whereIdProcess, whereProcess, whereOrder, wherePrintSelect, whereSelectedQuery string

	if print_select == "true" {
		wherePrintSelect = `AND a.print = 'true'`
	}

	if basket != "" {
		whereDrawingLists = ` AND a.drawing_id IN (` + drawing_lists + `)`
	}

	whereDrawingImage = ` '-' as drawing_image,`
	if setDrawing != "" {
		whereDrawingImage = ` COALESCE(u.drawing_image, '-') as drawing_image,`
	}

	if startPeriod != "" || endPeriod != "" {
		wherePeriod = ` AND ( DATE(b.order_date) BETWEEN '` + startPeriod + `' AND '` + endPeriod + `' `
		wherePeriod += ` OR DATE(b.due_date) BETWEEN '` + startPeriod + `' AND '` + endPeriod + `' `
		if monitoring != "" {
			wherePeriod += ` OR status_process = 'ongoing' AND b.status_order != 'cancel'`
		}
		wherePeriod += ` OR DATE(b.delivery_date) BETWEEN '` + startPeriod + `' AND '` + endPeriod + `' )`
	}

	if id != "" {
		whereId = ` AND a.id = '` + id + `'`
	}
	if jobDrawingNumber != "" {
		whereJobDrawing = ` AND ( b.new_job_number = '` + jobDrawingNumber + `' OR CONCAT(COALESCE(b.new_job_number, ''), '-', COALESCE(b.reprocess_no, '0')) = '` + jobDrawingNumber + `')`
	}
	if job_number != "" {
		whereJobNumber = ` AND a.job_number = '` + job_number + `'`
	}
	if drawing_id != "" {
		whereDrawingId = ` AND a.drawing_id = '` + drawing_id + `'`
	}
	if id_process != "" {
		whereIdProcess = ` AND a.id = '` + id_process + `'`
	}
	if process != "" {
		processSplit := strings.Split(process, ",")
		processesFilter := []string{}
		whereProcessBetween := ``

		for _, processValue := range processSplit {
			if strings.Contains(processValue, "-") {
				process1 := strings.Split(processValue, "-")[0]
				process2 := strings.Split(processValue, "-")[1]
				whereProcessBetween += ` OR a.process_id BETWEEN '` + process1 + `' AND '` + process2 + `' `
			} else {
				processesFilter = append(processesFilter, `'`+processValue+`'`)
			}
		}

		whereProcessConditions := []string{}

		if len(processesFilter) > 0 {
			processesFilterString := strings.Join(processesFilter, ",")
			whereProcessConditions = append(whereProcessConditions, `a.process_id IN (`+processesFilterString+`)`)
		}

		if whereProcessBetween != "" {
			whereProcessBetween = strings.TrimPrefix(whereProcessBetween, " OR ")
			whereProcessConditions = append(whereProcessConditions, whereProcessBetween)
		}

		if len(whereProcessConditions) > 0 {
			whereProcess += ` AND (` + strings.Join(whereProcessConditions, " OR ") + `)`
		}
	}

	if customer != "" {
		whereCustomer = ` AND b.customer_id = '` + customer + `'`
	}
	whereOrder = `ORDER BY a.job_number DESC, a.drawing_id ASC, a.order_process ASC`
	if byOrderOnly != "" {
		whereOrder = `ORDER BY a.order_process ASC`
	}
	if byOrderOnly == "drawing" {
		whereOrder = `ORDER BY a.drawing_id ASC`
	}
	if byOrderOnly == "yes" {
		whereOrder = `ORDER BY a.target_date ASC`
	}

	if querySelected != "" {
		whereSelectedQuery = `
		SELECT 
            COALESCE(a.id, 0) as id,
            COALESCE(a.job_number, '-') as job_number,
            COALESCE(a.drawing_id, '-') as drawing_id,
            COALESCE(b.manu_job_number, b.new_job_number) as new_job_number,
			CONCAT(COALESCE(b.manu_job_number, b.new_job_number), '-', b.reprocess_no) reprocess_id,
            COALESCE(a.process_id, '-') as process_id,
            COALESCE(a.target_date, '0001-01-01 00:00:00') as target_date,
            COALESCE(a.status_process, '-') as status_process,
            COALESCE(c.process_alias, '-') as process_alias,
            COALESCE(b.due_date, '0001-01-01 00:00:00') as due_date_order,
            COALESCE(b.qty, 0) as qty,
            COALESCE(d.customer_alias,'-') as customer_alias,
            COALESCE(a.qty_process, b.qty) as qty_process,
            COALESCE((
                    SELECT string_agg ( process_id, ' &#8592; ' ORDER BY z.order_process DESC) AS process_lists
                    FROM  order_process z
                    WHERE z.drawing_id = a.drawing_id AND z.order_process < a.order_process  AND z.status_process = 'ongoing'
                    GROUP BY drawing_id
            ), '-') as leftover_process,
			COALESCE(b.status_order,'-') as status_order`
	} else {
		whereSelectedQuery = `
		SELECT 
			COALESCE(a.id, 0) as id,
			COALESCE(a.job_number, '-') as job_number,
			COALESCE(a.drawing_id, '-') as drawing_id,
			COALESCE(b.manu_job_number, b.new_job_number) as new_job_number,
			CONCAT(COALESCE(b.manu_job_number, b.new_job_number), '-', b.reprocess_no) reprocess_id,
			COALESCE(a.process_id, '-') as process_id,
			COALESCE(a.target_date, '0001-01-01 00:00:00') as target_date,
			COALESCE(a.act_date, '0001-01-01 00:00:00') as act_date,
			COALESCE(a.status_process, '-') as status_process,
			COALESCE(a.remark, '-') as remark,
			COALESCE(a.order_process, 0) as order_process,
			COALESCE(a.scan_by, '-') as scan_by,
			COALESCE(c.process_name, '-') as process_name,
			COALESCE(c.process_alias, '-') as process_alias,
			COALESCE(b.order_date, '0001-01-01 00:00:00') as order_date,
			COALESCE(b.delivery_date, '0001-01-01 00:00:00') as delivery_date,
			COALESCE(b.due_date, '0001-01-01 00:00:00') as due_date_order,
			COALESCE(b.customer_id, '-') as customer_id,
			COALESCE(b.product_name, '-') as product_name,
			COALESCE(b.product_type, '-') as product_type,
			COALESCE(e.product_type_name, '-') as product_type_name,
			COALESCE(b.product_size, '-') as product_size,
			COALESCE(b.po_no, '-') as po_no,
			COALESCE(b.qty, 0) as qty,
			COALESCE(b.price, 0) as price,
			COALESCE((b.qty * b.price), 0) as amount,
			COALESCE(b.spec, '-') as spec,
			COALESCE(b.status_order, '-') as status_order,
			COALESCE(b.treatment, '-') as treatment,
			COALESCE(b.special_treatment, '-') as special_treatment,
			COALESCE(b.material, '-') as material,
			` + whereDrawingImage + `
			COALESCE(d.customer_name,'-') as customer_name,
			COALESCE(d.customer_alias,'-') as customer_alias,
			COALESCE(a.qty_process, b.qty) as qty_process,
	    	COALESCE(a.block, 'false') as block,
	    	COALESCE(a.print, 'true') as print,
			COALESCE(b.reprocess_no, 0) as reprocess_no,
			(SELECT COUNT(*) FROM sales_lists z WHERE z.job_number = a.job_number) as drawing_count, 
			COALESCE((
				SELECT string_agg ( process_id, ' &#8592; ' ORDER BY z.order_process DESC) AS process_lists
				FROM  order_process z
				WHERE z.drawing_id = a.drawing_id AND z.order_process < a.order_process  AND z.status_process = 'ongoing'
				GROUP BY drawing_id
			), '-') as leftover_process`
	}

	q := `` + whereSelectedQuery + ` 
		FROM 
			order_process a
			LEFT JOIN sales_lists b ON a.job_number = b.job_number AND a.drawing_id = b.drawing_id
			LEFT JOIN sales_lists_drawing u ON a.drawing_id = u.drawing_id
			LEFT JOIN mst_process c ON a.process_id = c.process_id 
			LEFT JOIN mst_customer d ON b.customer_id = d.customer_id 
			LEFT JOIN mst_type_product e ON b.product_type = e.product_type 
		WHERE 1=1 
			` + wherePeriod + `
			` + whereId + ` 
			` + whereJobNumber + ` 
			` + whereDrawingId + ` 
			` + whereIdProcess + ` 
			` + whereProcess + ` 
			` + whereCustomer + ` 
			` + whereJobDrawing + ` 
			` + whereDrawingLists + ` 
			` + wherePrintSelect + `
		GROUP BY 
			a.id, a.job_number, a.drawing_id, b.new_job_number, a.process_id, a.target_date, a.act_date, a.status_process, a.remark, a.order_process, a.scan_by, c.process_name, c.process_alias,
			b.order_date, b.delivery_date, b.due_date, b.customer_id, b.product_name, b.product_type, e.product_type_name, b.product_size, b.po_no, b.qty, b.price, b.spec, b.status_order,
			b.treatment, b.special_treatment, b.material, drawing_image, d.customer_name, d.customer_alias, b.reprocess_no, a.qty_process, a.block, a.print, b.manu_job_number
		` + whereOrder + ``

	fmt.Println("dashboard", q)

	rows, err := db.Query(q)
	CONFIG.CheckErr(err)

	var No, Id int32
	var Job_number, Drawing_id, New_job_number, Reprocess_id, Process_id, Target_date, Status_process, Process_alias, Due_date_order, Customer_alias, Leftover_process, Status_order string
	var Qty int32
	var Qty_process sql.NullInt32

	if querySelected != "" {
		for rows.Next() {
			No++
			err = rows.Scan(
				&Id, &Job_number, &Drawing_id, &New_job_number, &Reprocess_id, &Process_id, &Target_date, &Status_process,
				&Process_alias, &Due_date_order, &Qty, &Customer_alias, &Qty_process, &Leftover_process, &Status_order,
			)
			if err != nil {
				panic(err)
			}

			var qtyProcessValue int32
			if Qty_process.Valid {
				qtyProcessValue = Qty_process.Int32
			} else {
				qtyProcessValue = 0
			}

			resultsShort[No] = STRUCTS.OrderProcessSelect{
				No:               No,
				Id:               Id,
				Job_number:       Job_number,
				Drawing_id:       Drawing_id,
				New_job_number:   New_job_number,
				Reprocess_id:     Reprocess_id,
				Process_id:       Process_id,
				Target_date:      Target_date,
				Status_process:   Status_process,
				Process_alias:    Process_alias,
				Due_date_order:   Due_date_order,
				Qty:              Qty,
				Customer_alias:   Customer_alias,
				Qty_process:      qtyProcessValue,
				Leftover_process: Leftover_process,
				Status_order:     Status_order,
			}
		}
		response := STRUCTS.Response{
			Status:  "success",
			Message: "Get Order Processes is success",
			Data:    resultsShort,
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(response)
	} else {

		var No, Id, Order_process, Drawing_count, Reprocess_no int32
		var Job_number, Drawing_id, New_job_number, Reprocess_id, Process_id, Target_date, Act_date, Status_process, Remark, Scan_by, Process_name, Process_alias, Order_date, Delivery_date, Due_date_order, Customer_id, Product_name, Product_type, Product_type_name, Product_size, Po_no, Spec, Status_order, Treatment, Special_treatment, Material, Drawing_image, Customer_name, Customer_alias, Block, Print, Leftover_process string
		var Qty int32
		var Price, Amount float64
		var Qty_process sql.NullInt32

		for rows.Next() {
			No++
			err = rows.Scan(
				&Id, &Job_number, &Drawing_id, &New_job_number, &Reprocess_id, &Process_id, &Target_date, &Act_date, &Status_process, &Remark, &Order_process, &Scan_by,
				&Process_name, &Process_alias, &Order_date, &Delivery_date, &Due_date_order, &Customer_id, &Product_name, &Product_type, &Product_type_name, &Product_size,
				&Po_no, &Qty, &Price, &Amount, &Spec, &Status_order, &Treatment, &Special_treatment, &Material, &Drawing_image, &Customer_name, &Customer_alias,
				&Qty_process, &Block, &Print, &Reprocess_no, &Drawing_count, &Leftover_process,
			)
			if err != nil {
				panic(err)
			}

			var qtyProcessValue int32
			if Qty_process.Valid {
				qtyProcessValue = Qty_process.Int32
			} else {
				qtyProcessValue = 0
			}

			results[No] = STRUCTS.OrderProcess{
				No:                No,
				Id:                Id,
				Job_number:        Job_number,
				Drawing_id:        Drawing_id,
				New_job_number:    New_job_number,
				Reprocess_id:      Reprocess_id,
				Process_id:        Process_id,
				Target_date:       Target_date,
				Act_date:          Act_date,
				Status_process:    Status_process,
				Remark:            Remark,
				Order_process:     Order_process,
				Scan_by:           Scan_by,
				Process_name:      Process_name,
				Process_alias:     Process_alias,
				Order_date:        Order_date,
				Delivery_date:     Delivery_date,
				Due_date_order:    Due_date_order,
				Customer_id:       Customer_id,
				Product_name:      Product_name,
				Product_type:      Product_type,
				Product_type_name: Product_type_name,
				Product_size:      Product_size,
				Po_no:             Po_no,
				Qty:               Qty,
				Price:             Price,
				Amount:            Amount,
				Spec:              Spec,
				Status_order:      Status_order,
				Treatment:         Treatment,
				Special_treatment: Special_treatment,
				Material:          Material,
				Drawing_image:     Drawing_image,
				Customer_name:     Customer_name,
				Customer_alias:    Customer_alias,
				Qty_process:       qtyProcessValue,
				Block:             Block,
				Print:             Print,
				Reprocess_no:      Reprocess_no,
				Drawing_count:     Drawing_count,
				Leftover_process:  Leftover_process,
			}
		}

		response := STRUCTS.Response{
			Status:  "success",
			Message: "Get Order Processes is success",
			Data:    results,
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(response)
	}
}

func ScanProcess(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	var Id_process, Target_date_scan, Status_process, logInfo, result, return_status string
	scan_process := r.FormValue("scan_process")
	scan_process_split := strings.Split(scan_process, "-")
	job_number := scan_process_split[0]
	session, _ := CONFIG.Store.Get(r, "cookie-name")

	if len(scan_process_split) < 4 {
		result = "failed"
		logInfo = `Code are not detected!`
		return_status = Id_process
	} else {
		drawing_id := job_number + "-" + scan_process_split[1]
		process_id := scan_process_split[2]
		order_process := scan_process_split[3]

		whereScan := `
			job_number = '` + job_number + `'
			AND drawing_id = '` + drawing_id + `'
			AND process_id = '` + process_id + `'
			AND order_process = '` + order_process + `'
		`

		q := `
			SELECT
				id,
				TO_CHAR(target_date,'YYYY-MM-DD') target_date
			FROM
				order_process
			WHERE
				` + whereScan + `
		`

		fmt.Println(q)

		row := db.QueryRow(q)
		errScan := row.Scan(&Id_process, &Target_date_scan)

		// Target_date, error := time.Parse("2006-01-02", Target_date_scan)

		// if error != nil {
		// 	fmt.Println(error)
		// 	return
		// }

		if errScan != nil {
			panic(err.Error())
		}

		if Id_process != "" {
			logInfo = `Scan successfully!`
			currentTime := time.Now()
			timeNow := currentTime.Format("2006-01-02")
			// timeNowCheck, error := time.Parse("2006-01-02", timeNow)

			// if error != nil {
			// 	fmt.Println(error)
			// 	return
			// }

			// checkDate := timeNowCheck.Before(Target_date)

			// if !checkDate {
			// 	Status_process = "late"
			// } else {
			// }
			Status_process = "complete"

			set := "status_process = '" + Status_process + "', "
			set += "act_date = '" + timeNow + "', "
			set += "scan_by = '" + session.Values["Username"].(string) + "'"
			update := MODEL.Update(set, whereScan, "order_process")
			if update != nil {
				result = "failed"
				logInfo = `Scan failed!`
			} else {
				result = "success"
				logInfo = `Scan successfully!`
			}
			return_status = Id_process + "-" + result + "-" + Status_process + "-" + session.Values["Username"].(string)

		} else {
			result = "failed"
			logInfo = `Code are not detected!`
			return_status = Id_process
		}
	}

	MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Scan Process", "Scan process with barcode code :  "+scan_process+"", logInfo, result)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(return_status)
}

func RetractProcess(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	var logInfo, result string
	barcode_process := r.FormValue("barcode_process")
	process_name := r.FormValue("process_name")
	process_alias := r.FormValue("process_alias")
	customer_name := r.FormValue("customer_name")
	po_no := r.FormValue("po_no")
	reason := r.FormValue("reason")
	barcode_process_split := strings.Split(barcode_process, "-")
	job_number := barcode_process_split[0]
	drawing_id := job_number + "-" + barcode_process_split[1]
	process_id := barcode_process_split[2]
	order_process := barcode_process_split[3]

	whereScan := `
		job_number = '` + job_number + `'
		AND drawing_id = '` + drawing_id + `'
		AND process_id = '` + process_id + `'
		AND order_process = '` + order_process + `'
	`

	set := "status_process = 'ongoing', "
	set += "act_date = '0001-01-01', "
	set += "scan_by = '-'"
	update := MODEL.Update(set, whereScan, "order_process")
	if update != nil {
		result = "failed"
		logInfo = `Retract failed!`
	} else {
		result = "success"
		logInfo = `Retract successfully!`
	}

	logInfo += "<br> Customer : " + customer_name + " <br> Process Name : " + process_name + " <br> Process Alias : " + process_alias + " <br> PO No : " + po_no + " <br> Reason to retract : " + reason + ""

	session, _ := CONFIG.Store.Get(r, "cookie-name")
	MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Retract Process", "Retract process with barcode code :  "+barcode_process+"", logInfo, result)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

func UpdateCheckboxReproses(w http.ResponseWriter, r *http.Request) {
	var checkboxesData []STRUCTS.CheckboxData
	err := json.NewDecoder(r.Body).Decode(&checkboxesData)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	var result string

	for _, checkbox := range checkboxesData {
		whereBlock := `
			drawing_id = '` + checkbox.ValueDrawing + `'
			AND process_id = '` + checkbox.ValueProcess + `'
			AND order_process = '` + checkbox.ValueOrder + `'
		`

		set := "block = "
		if checkbox.IsChecked {
			set += "'true'"
		} else {
			set += "'false'"
		}

		update := MODEL.Update(set, whereBlock, "order_process")
		if update != nil {
			result = "failed"
		} else {
			result = "success"
		}

		session, _ := CONFIG.Store.Get(r, "cookie-name")
		MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Update Checkbox Block", "Checkbox block updated successfully!", result, "")

	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

func UpdateCheckboxPrint(w http.ResponseWriter, r *http.Request) {
	var checkboxesData []STRUCTS.CheckboxData
	err := json.NewDecoder(r.Body).Decode(&checkboxesData)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	var result string

	for _, checkbox := range checkboxesData {
		wherePrint := `
			drawing_id = '` + checkbox.ValueDrawing + `'
			AND process_id = '` + checkbox.ValueProcess + `'
			AND order_process = '` + checkbox.ValueOrder + `'
		`

		set := "print = "
		if checkbox.IsChecked {
			set += "'true'"
		} else {
			set += "'false'"
		}

		update := MODEL.Update(set, wherePrint, "order_process")
		if update != nil {
			result = "failed"
		} else {
			result = "success"
		}

		session, _ := CONFIG.Store.Get(r, "cookie-name")
		MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Update Checkbox Block", "Checkbox block updated successfully!", result, "")

	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}
