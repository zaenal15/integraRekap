package sales

import (
	"database/sql"
	"encoding/json"
	CONFIG "erekap/config"
	"erekap/module/model"
	MODEL "erekap/module/model"
	STRUCTS "erekap/structs"
	"fmt"
	"net/http"
	"strconv"
	"strings"
)

func LastJobNumber(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	orderDate := r.FormValue("orderDate")
	var where string

	if orderDate != "" {
		where = `TO_CHAR(order_date, 'YYYY-MM') LIKE '%` + orderDate + `%'`
	}

	q := `
		SELECT
			COUNT(*) as count
		FROM ( 
			SELECT DISTINCT job_number 
			FROM sales_lists 
			WHERE ` + where + ` 
		) AS lastJobNumber
	`

	fmt.Println(q)

	var JobNumberOrder int32
	row := db.QueryRow(q)
	errScan := row.Scan(&JobNumberOrder)
	if errScan != nil {
		panic(err.Error())
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(JobNumberOrder)
}

func LoadSales(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()
	results := []STRUCTS.SalesLists{}
	resultsShort := []STRUCTS.SalesListsShort{}

	startPeriod := r.FormValue("startPeriod")
	endPeriod := r.FormValue("endPeriod")
	setDrawing := r.FormValue("setDrawing")
	jobNumber := r.FormValue("jobNumber")
	delivery := r.FormValue("delivery")
	monitoring := r.FormValue("monitoring")
	printBasket := r.FormValue("printBasket")
	drawing_id_up := r.FormValue("drawing_id_up")
	selectQuery := r.FormValue("selectQuery")
	id := r.FormValue("id")
	var wherePeriod, whereDrawingImage, whereId, whereDelivery, statusCondition, whereDrawingID, whereSelectQuery, wherejobNumber string

	if startPeriod != "" || endPeriod != "" {
		wherePeriod = ` AND ( DATE(order_date) BETWEEN '` + startPeriod + `' AND '` + endPeriod + `' `
		wherePeriod += ` OR DATE(due_date) BETWEEN '` + startPeriod + `' AND '` + endPeriod + `' `
		if monitoring != "" {
			wherePeriod += ` OR status_order = 'production' OR status_order = 'open'`
		}
		if delivery != "" {
			wherePeriod += ` OR status_order = 'delivery'`
		}
		wherePeriod += ` OR DATE(delivery_date) BETWEEN '` + startPeriod + `' AND '` + endPeriod + `' )`
	}

	if jobNumber != "" {
		wherejobNumber = `AND a.job_number = '` + jobNumber + `'`
	}

	leftJoinDrawingImage := ``
	whereDrawingImage = ` '-' as drawing_image,`
	if setDrawing != "" {
		whereDrawingImage = ` COALESCE(z.drawing_image, '-') as drawing_image,`
		leftJoinDrawingImage = ` LEFT JOIN sales_lists_drawing z ON a.drawing_id = z.drawing_id`
	}
	if drawing_id_up != "" {
		whereDrawingID = `AND z.drawing_id = '` + drawing_id_up + `'`
	}
	if id != "" {
		whereId = ` AND a.id = '` + id + `'`
	}
	if delivery != "" {
		whereDelivery = ` AND status_order IN ('open', 'production', 'delivery', 'completed')`
	} else {
		whereDelivery = ""
		statusCondition = "AND status_order != 'completed' AND status_order != 'delivery'"
	}

	defaultFrom := `
	sales_lists a
	LEFT JOIN mst_customer b ON a.customer_id = b.customer_id 
	LEFT JOIN mst_type_product e ON a.product_type = e.product_type 
`

	if printBasket != "" {
		defaultFrom = `
		process_drawing_print x
		LEFT JOIN sales_lists a ON x.drawing_id = a.drawing_id
		LEFT JOIN mst_customer b ON a.customer_id = b.customer_id 
		LEFT JOIN mst_type_product e ON a.product_type = e.product_type 
	`
	}
	if selectQuery != "" {
		whereSelectQuery = `
		SELECT
        	COALESCE(a.id, 0) as id,
        	COALESCE(a.job_number, '-') as job_number,
        	COALESCE(a.manu_job_number, a.new_job_number) as new_job_number,
        	CONCAT(COALESCE(a.manu_job_number, a.new_job_number), '-', a.reprocess_no) reprocess_id,
        	COALESCE(a.due_date, '0001-01-01 00:00:00') as due_date,
        	COALESCE(a.product_name, '-') as product_name,
        	COALESCE(a.qty, 0) as qty,
        	COALESCE(a.status_order, '-') as status_order,
        	COALESCE(a.drawing_id, '-') as drawing_id,
        	COALESCE(b.customer_alias, '-') as customer_alias,
			COALESCE(b.customer_name, '-') as customer_name,
			COALESCE(a.order_date, '0001-01-01 00:00:00') as order_date,
			COALESCE(a.delivery_date, '0001-01-01 00:00:00') as delivery_date,
			COALESCE(a.po_no, '-') as po_no,
			(SELECT COUNT(*) FROM sales_lists x WHERE x.job_number = a.job_number) as drawing_count,
			COALESCE(a.product_size, '-') product_size`
	} else {
		whereSelectQuery = `
		SELECT 
			COALESCE(a.id, 0) as id,
			COALESCE(a.job_number, '-') as job_number,
			COALESCE(a.manu_job_number, a.new_job_number) as new_job_number,
			CONCAT(COALESCE(a.manu_job_number, a.new_job_number), '-', a.reprocess_no) reprocess_id,			COALESCE(a.order_date, '0001-01-01 00:00:00') as order_date,
			COALESCE(a.delivery_date, '0001-01-01 00:00:00') as delivery_date,
			COALESCE(a.due_date, '0001-01-01 00:00:00') as due_date,
			COALESCE(a.customer_id, '-') as customer_id,
			COALESCE(a.product_name, '-') as product_name,
			COALESCE(a.product_type, '-') as product_type,
			COALESCE(e.product_type_name, '-') as product_type_name,
			COALESCE(a.product_size, '-') as product_size,
			COALESCE(a.po_no, '-') as po_no,
			COALESCE(a.qty, 0) as qty,
			COALESCE(a.price, 0) as price,
			COALESCE((a.qty * a.price), 0) as amount,
			COALESCE(a.spec, '-') as spec,
			COALESCE(a.status_order, '-') as status_order,
			COALESCE(a.drawing_id, '-') as drawing_id,
			` + whereDrawingImage + `
			COALESCE(b.customer_name, '-') as customer_name,
			COALESCE(b.customer_alias, '-') as customer_alias,
			(SELECT COUNT(*) FROM sales_lists x WHERE x.job_number = a.job_number) as drawing_count, 
			COALESCE(a.treatment, '-') as treatment,
			COALESCE(a.special_treatment, '-') as special_treatment,
			COALESCE(a.material, '-') as material,
			COALESCE(a.reprocess_no, 0) as reprocess_no,
			COALESCE(a.reprocess_remark, '-') as reprocess_remark,
			COALESCE(a.reprocess, '-') as reprocess`
	}

	q := `` + whereSelectQuery + `
			FROM 
				` + defaultFrom + `
				` + leftJoinDrawingImage + `
			WHERE 1=1 
				` + wherePeriod + `
				` + whereId + `
				` + whereDelivery + `
				` + whereDrawingID + `
				` + whereDrawingID + `
				` + wherejobNumber + `
				AND status_order != 'cancel'
				` + statusCondition + `
				AND status_order != 'po'
			ORDER BY a.new_job_number DESC, CONCAT(a.new_job_number, '-', a.reprocess_no) ASC`

	fmt.Println(printBasket)
	fmt.Println("Production", q)

	rows, err := db.Query(q)
	CONFIG.CheckErr(err)

	var (
		No             int32
		Id             int32
		Job_number     string
		New_job_number string
		Reprocess_id   string
		Due_date       string
		Product_name   string
		Qty            int32
		Status_order   string
		Drawing_id     string
		Customer_alias string
		Customer_name  string
		Order_date     string
		Delivery_date  string
		Po_no          string
		Drawing_count  string
		Product_size   string
	)

	if selectQuery != "" {
		for rows.Next() {
			No++

			err = rows.Scan(
				&Id,
				&Job_number,
				&New_job_number,
				&Reprocess_id,
				&Due_date,
				&Product_name,
				&Qty,
				&Status_order,
				&Drawing_id,
				&Customer_alias,
				&Customer_name,
				&Order_date,
				&Delivery_date,
				&Po_no,
				&Drawing_count,
				&Product_size,
			)
			if err != nil {
				panic(err)
			}

			viewBtn := `
            <div class="btn-action">
                <button title="View" class='button-set view-btn' action='view' onclick='viewDetail(this)'>
                    <i class='fas fa-eye'></i>
                </button>
            </div>
        `

			resultsShort = append(resultsShort, STRUCTS.SalesListsShort{
				No:             No,
				Id:             Id,
				View:           viewBtn,
				Job_number:     Job_number,
				New_job_number: New_job_number,
				Reprocess_id:   Reprocess_id,
				Due_date:       Due_date,
				Product_name:   Product_name,
				Qty:            Qty,
				Status_order:   Status_order,
				Drawing_id:     Drawing_id,
				Customer_alias: Customer_alias,
				Customer_name:  Customer_name,
				Order_date:     Order_date,
				Delivery_date:  Delivery_date,
				Po_no:          Po_no,
				Drawing_count:  Drawing_count,
				Product_size:   Product_size,
			})
		}
	} else {
		var (
			Order_date        string
			Delivery_date     string
			Customer_id       string
			Product_name      string
			Product_type      string
			Product_type_name string
			Product_size      string
			Po_no             string
			Qty               int32
			Price             float64
			Amount            float64
			Spec              string
			Status_order      string
			Drawing_id        string
			Drawing_image     string
			Customer_name     string
			Drawing_count     int32
			Treatment         string
			Special_treatment string
			Material          string
			Reprocess_no      int32
			Reprocess_remark  string
			Reprocess         string
		)

		for rows.Next() {
			No++

			err = rows.Scan(
				&Id,
				&Job_number,
				&New_job_number,
				&Reprocess_id,
				&Order_date,
				&Delivery_date,
				&Due_date,
				&Customer_id,
				&Product_name,
				&Product_type,
				&Product_type_name,
				&Product_size,
				&Po_no,
				&Qty,
				&Price,
				&Amount,
				&Spec,
				&Status_order,
				&Drawing_id,
				&Drawing_image,
				&Customer_name,
				&Customer_alias,
				&Drawing_count,
				&Treatment,
				&Special_treatment,
				&Material,
				&Reprocess_no,
				&Reprocess_remark,
				&Reprocess,
			)
			if err != nil {
				panic(err)
			}

			viewBtn := `
            <div class="btn-action">
                <button title="View" class='button-set view-btn' action='view' onclick='viewDetail(this)'>
                    <i class='fas fa-eye'></i>
                </button>
            </div>
        `

			results = append(results, STRUCTS.SalesLists{
				No:                No,
				Id:                Id,
				View:              viewBtn,
				Job_number:        Job_number,
				New_job_number:    New_job_number,
				Reprocess_id:      Reprocess_id,
				Order_date:        Order_date,
				Delivery_date:     Delivery_date,
				Due_date:          Due_date,
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
				Drawing_id:        Drawing_id,
				Drawing_image:     Drawing_image,
				Customer_name:     Customer_name,
				Customer_alias:    Customer_alias,
				Drawing_count:     Drawing_count,
				Treatment:         Treatment,
				Special_treatment: Special_treatment,
				Material:          Material,
				Reprocess_no:      Reprocess_no,
				Reprocess_remark:  Reprocess_remark,
				Reprocess:         Reprocess,
			})
		}
	}

	response := map[string]interface{}{
		"draw":            1,
		"recordsTotal":    len(results),
		"recordsFiltered": len(results),
		"data":            results,
	}

	if selectQuery != "" {
		response = map[string]interface{}{
			"draw":            1,
			"recordsTotal":    len(results),
			"recordsFiltered": len(results),
			"data":            resultsShort,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func LoadCustReportOverview(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	country := r.FormValue("country")
	periodFiscalStart := r.FormValue("periodFiscalStart")
	periodFiscalEnd := r.FormValue("periodFiscalEnd")
	var whereCountryReport, whereFiscalPeriod string

	whereFiscalPeriod = ` AND DATE(a.order_date) BETWEEN '` + periodFiscalStart + `' AND '` + periodFiscalEnd + `'`
	if country != "" {
		whereCountryReport = ` AND b.country_code = '` + country + `'`
	}

	qCountry := `SELECT b.*, c.country_name FROM sales_lists a LEFT JOIN mst_customer b ON a.customer_id = b.customer_id LEFT JOIN mst_country c ON b.country_code = c.country_code WHERE 1=1 ` + whereCountryReport + ` ` + whereFiscalPeriod + ``
	fmt.Println("qCountry", qCountry)

	rows, err := db.Query(qCountry)
	CONFIG.CheckErr(err)

	results := map[string]STRUCTS.Customer{}

	var No int32
	for rows.Next() {
		No++

		var Customer_id, Customer_name, Customer_type, Customer_alias, Country_code, Country_name string

		err = rows.Scan(&Customer_id, &Customer_name, &Customer_type, &Customer_alias, &Country_code, &Country_name)
		if err != nil {
			panic(err)
		}
		results[Customer_id] = STRUCTS.Customer{
			No:             No,
			Customer_id:    Customer_id,
			Customer_name:  Customer_name,
			Customer_type:  Customer_type,
			Customer_alias: Customer_alias,
			Country_code:   Country_code,
			Country_name:   Country_name,
		}
	}

	response := STRUCTS.Response{
		Status:  "success",
		Message: "Get Sales Report Overview",
		Data:    results,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func LoadSalesReportOverview(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()
	results := map[int32]STRUCTS.SalesReportOverview{}

	period := r.FormValue("period")
	startPeriod := r.FormValue("startPeriod")
	endPeriod := r.FormValue("endPeriod")
	periodFiscalStart := r.FormValue("periodFiscalStart")
	periodFiscalEnd := r.FormValue("periodFiscalEnd")
	var wherePeriod, whereFiscalPeriod string

	if period != "" {
		wherePeriod = ` AND DATE(z.order_date) BETWEEN '` + startPeriod + `' AND '` + endPeriod + `'`
	}
	whereFiscalPeriod = ` AND DATE(z.order_date) BETWEEN '` + periodFiscalStart + `' AND '` + periodFiscalEnd + `'`
	defaultWhere := ` 1=1`
	// defaultWhere += ` AND x.country_code = c.country_code`
	queryAmount := `SELECT COALESCE(SUM(z.price * z.qty), 0) FROM sales_lists z`
	queryAmount += ` LEFT JOIN mst_customer x ON z.customer_id = x.customer_id LEFT JOIN order_process y ON z.drawing_id = y.drawing_id`
	whereCountryReport := ``

	qCountry := `SELECT country_code FROM mst_country WHERE country_code != 'OT' ORDER BY country_code`

	countryLists, err := db.Query(qCountry)
	CONFIG.CheckErr(err)

	var (
		Country_code string
	)

	for countryLists.Next() {
		err = countryLists.Scan(
			&Country_code,
		)

		whereCountryReport += `SUM((` + queryAmount + ` WHERE ` + defaultWhere + ` ` + wherePeriod + ` AND z.status_order IN ('production', 'delivery', 'completed') AND y.process_id  = '35' AND y.status_process = 'complete' AND x.country_code = '` + Country_code + `')) as ` + Country_code + `, `

		if err != nil {
			panic(err)
		}
	}

	var (
		No                          int32
		Total_month_sales           float64
		Leftover_month_sales        float64
		Total_period_sales          float64
		Leftover_accumulative_sales float64
		CN                          float64
		ID                          float64
		JP                          float64
		KR                          float64
		ML                          float64
		MX                          float64
		TH                          float64
	)

	Total_month_sales = 0
	Leftover_month_sales = 0
	Total_period_sales = 0
	Leftover_accumulative_sales = 0
	CN = 0
	ID = 0
	JP = 0
	KR = 0
	ML = 0
	MX = 0
	TH = 0

	q := `
		SELECT
		` + whereCountryReport + `
			(` + queryAmount + ` WHERE ` + defaultWhere + ` ` + wherePeriod + ` AND z.status_order IN ('production', 'delivery', 'completed') AND y.process_id  = '35' AND y.status_process = 'complete') as total_month_sales,
			(` + queryAmount + ` WHERE ` + defaultWhere + ` ` + whereFiscalPeriod + ` AND z.status_order IN ('production', 'delivery', 'completed') AND y.process_id  = '35' AND y.status_process = 'complete') as total_period_sales
	`
	fmt.Println(q)

	row := db.QueryRow(q)

	errScan := row.Scan(
		&CN,
		&ID,
		&JP,
		&KR,
		&ML,
		&MX,
		&TH,
		&Total_month_sales,
		&Total_period_sales,
	)
	fmt.Println("row scan", errScan)
	// CONFIG.CheckErr(errScan)

	q = `
	SELECT
		(` + queryAmount + ` WHERE ` + defaultWhere + ` ` + wherePeriod + ` ` + whereFiscalPeriod + ` AND z.status_order != 'cancel' AND z.status_order = 'open' OR y.process_id  = '35' AND y.status_process = 'open') as leftover_month_sales,
		(` + queryAmount + ` WHERE ` + defaultWhere + ` ` + whereFiscalPeriod + ` AND z.status_order != 'cancel' AND z.status_order = 'open' OR y.process_id  = '35' AND y.status_process = 'open') as leftover_period_sales
	FROM 
		sales_lists a
		LEFT JOIN mst_customer b ON a.customer_id = b.customer_id 
		LEFT JOIN mst_country c ON b.country_code = c.country_code
		LEFT JOIN order_process y ON a.drawing_id = y.drawing_id
	WHERE 
		date_part('year', order_date) = '` + strings.Split(period, "-")[0] + `'
		AND a.status_order = 'open'
		OR y.process_id  = '35'
		AND y.status_process = 'open'
		AND a.status_order != 'cancel'
		LIMIT 1
`
	fmt.Println("loadSalesReportOverview", q)

	row = db.QueryRow(q)

	errScan = row.Scan(
		&Leftover_month_sales,
		&Leftover_accumulative_sales,
	)
	fmt.Println("row scan", errScan)

	if err == sql.ErrNoRows {
		fmt.Println("No data found.")
		Leftover_month_sales = 0
		Leftover_accumulative_sales = 0
	}

	results[1] = STRUCTS.SalesReportOverview{
		No:                          No,
		Total_month_sales:           Total_month_sales,
		Total_period_sales:          Total_period_sales,
		Leftover_month_sales:        Leftover_month_sales,
		Leftover_accumulative_sales: Leftover_accumulative_sales,
		CN:                          CN,
		ID:                          ID,
		JP:                          JP,
		KR:                          KR,
		ML:                          ML,
		MX:                          MX,
		TH:                          TH,
	}

	response := STRUCTS.Response{
		Status:  "success",
		Message: "Get Sales Report Overview",
		Data:    results,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func LoadSalesReportDetail(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()
	results := map[string]STRUCTS.SalesReportDetail{}

	period := r.FormValue("period")
	startPeriod := r.FormValue("startPeriod")
	endPeriod := r.FormValue("endPeriod")
	country := r.FormValue("country")
	var wherePeriod, whereCountry, whereCountry2 string

	if period != "" {
		wherePeriod = ` AND DATE(a.order_date) BETWEEN '` + startPeriod + `' AND '` + endPeriod + `'`
	}

	defaultColKey := `COALESCE(b.country_code, '-') as country_code,`
	whereGroup := `GROUP BY b.country_code, c.country_code, a.order_date, a.status_order`
	whereJoin := `x.country_code = c.country_code`

	if country != "" {
		whereCountry = `AND x.country_code = '` + country + `'`
		whereCountry2 = `AND c.country_code = '` + country + `'`
		defaultColKey = `COALESCE(b.customer_id, '-') as customer_id,`
		whereGroup = `GROUP BY b.customer_id, b.customer_name, a.order_date, a.status_order`
		whereJoin = `x.customer_id= b.customer_id`
	}
	defaultWhere := `
		FROM 
			sales_lists z 
			LEFT JOIN mst_customer x ON z.customer_id = x.customer_id 
			LEFT JOIN order_process u  ON z.drawing_id = u.drawing_id
			WHERE 
				` + whereJoin + ` 
				` + whereCountry + `
			AND 
				TO_CHAR(a.order_date, 'YYYY-MM') = TO_CHAR(z.order_date, 'YYYY-MM')
			AND      u.process_id = '35'
			AND 	 u.status_process = 'complete'
			AND z.status_order IN ('production', 'delivery', 'completed')
	`

	q := `
		SELECT
			TO_CHAR(a.order_date, 'YYYY-MM') as period_date,	 
			` + defaultColKey + `
			(SELECT COALESCE(SUM(z.qty * z.price), 0) ` + defaultWhere + `) as total_sales,
			(SELECT COALESCE(SUM(z.qty), 0) ` + defaultWhere + `) as total_quantity,
			(SELECT COALESCE(COUNT(*), 0) ` + defaultWhere + `) as total_product
		FROM 
			sales_lists a
			LEFT JOIN mst_customer b ON a.customer_id = b.customer_id 
			LEFT JOIN mst_country c ON b.country_code = c.country_code
			LEFT JOIN order_process u  ON a.drawing_id = u.drawing_id
		WHERE 1=1
			` + wherePeriod + `
			` + whereCountry2 + `
			AND u.process_id = '35'
			AND u.status_process = 'complete'
			AND a.status_order IN ('production', 'delivery', 'completed')
		` + whereGroup + `
	`
	fmt.Println("loadSalesReportDetail", q)

	rows, err := db.Query(q)
	CONFIG.CheckErr(err)

	var (
		No             int32
		Period_date    string
		Country_code   string
		Total_sales    float64
		Total_quantity int32
		Total_product  int32
	)

	fmt.Println("rows", err)
	if err == sql.ErrNoRows {
		fmt.Println("NO Data")
	}

	for rows.Next() {
		No++

		err = rows.Scan(
			&Period_date,
			&Country_code,
			&Total_sales,
			&Total_quantity,
			&Total_product,
		)
		if err != nil {
			panic(err)
		}
		results[Period_date+"-"+Country_code] = STRUCTS.SalesReportDetail{
			No:             No,
			Period_date:    Period_date,
			Country_code:   Country_code,
			Total_sales:    Total_sales,
			Total_quantity: Total_quantity,
			Total_product:  Total_product,
		}
	}
	if err != nil {
	}

	response := STRUCTS.Response{
		Status:  "success",
		Message: "Get Sales Report Detail",
		Data:    results,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func LoadProcessAggregations(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()
	results := map[string]STRUCTS.ProcessAggregation{}

	period := r.FormValue("period")
	startPeriod := r.FormValue("startPeriod")
	endPeriod := r.FormValue("endPeriod")
	var wherePeriod string

	if period != "" {
		wherePeriod = ` AND DATE(a.order_date) BETWEEN '` + startPeriod + `' AND '` + endPeriod + `'`
	}
	defaultWhere := `
		FROM 
			sales_lists z 
			LEFT JOIN order_process x ON z.drawing_id = x.drawing_id 
			WHERE 
				x.process_id = b.process_id 
			AND 
				TO_CHAR(a.order_date, 'YYYY-MM') = TO_CHAR(z.order_date, 'YYYY-MM')
			AND 
				x.status_process = 'complete'
	`

	q := `
		SELECT
			TO_CHAR(a.order_date, 'YYYY-MM') as period_date,	 
			COALESCE(b.process_id, '-') as process_id,
			(SELECT COALESCE(SUM(z.qty), 0) ` + defaultWhere + ` GROUP BY x.process_id, b.process_id) as total_quantity,
			(SELECT COALESCE(COUNT(*), 0) ` + defaultWhere + ` GROUP BY x.process_id, b.process_id) as total_process,
			(SELECT COALESCE(COUNT(*), 0) ` + defaultWhere + `) as total_product
		FROM 
			sales_lists a
			LEFT JOIN order_process b ON a.drawing_id = b.drawing_id 
		WHERE 1=1
			` + wherePeriod + `
		AND b.status_process = 'complete'
		GROUP BY b.process_id, a.order_date, a.status_order
	`
	fmt.Println(q)

	rows, err := db.Query(q)
	CONFIG.CheckErr(err)

	var (
		No             int32
		Period_date    string
		Process_id     string
		Total_quantity sql.NullInt32
		Total_process  sql.NullInt32
		Total_product  int32
	)

	fmt.Println("rows", err)
	if err == sql.ErrNoRows {
		fmt.Println("NO Data")
	}

	for rows.Next() {
		No++

		err = rows.Scan(
			&Period_date,
			&Process_id,
			&Total_quantity,
			&Total_process,
			&Total_product,
		)
		if err != nil {
			panic(err)
		}

		// Check if the values are null and set them to 0 if they are
		if !Total_quantity.Valid {
			Total_quantity.Int32 = 0
		}
		if !Total_process.Valid {
			Total_process.Int32 = 0
		}
		results[Period_date+"-"+Process_id] = STRUCTS.ProcessAggregation{
			No:             No,
			Period_date:    Period_date,
			Process_id:     Process_id,
			Total_quantity: Total_quantity.Int32,
			Total_product:  Total_product,
		}
	}
	if err != nil {
		fmt.Println("Error:", err)
	}

	response := STRUCTS.Response{
		Status:  "success",
		Message: "Get Process Aggregation Detail",
		Data:    results,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func SetDrawingProcessPrint(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	drawing_id := r.FormValue("drawing_id")

	table := "process_drawing_print"
	var result, logInfo string

	column := `
		drawing_id
	`
	values := "'" + drawing_id + "'"
	insert := MODEL.Insert(column, values, table)
	if insert != nil {
		result = "failed"
	} else {
		result = "success"
	}

	if result == "failed" {
		result = "failed"
		logInfo = "Failed to set print process for drawing id : " + drawing_id + ""
	} else {
		logInfo = "Success to set print process for drawing id : " + drawing_id + ""
		result = "success"
	}

	session, _ := CONFIG.Store.Get(r, "cookie-name")
	MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Sales Menu", "Set Print Process Drawing", logInfo, result)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

func ClearDrawingProcessPrint(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	table := "process_drawing_print"
	where := "1 = 1"
	deleteErr := model.Delete(where, table)
	var result, logInfo string

	if deleteErr != nil {
		result = "failed"
	} else {
		result = "success"
	}

	if result == "failed" {
		result = "failed"
		logInfo = "Failed to cleared print drawing processes lists."
	} else {
		logInfo = "Print drawing processes lists has been cleared."
		result = "success"
	}

	session, _ := CONFIG.Store.Get(r, "cookie-name")
	MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Sales Menu", "Clear Print Process Drawing", logInfo, result)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

func AddSales(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	act := r.FormValue("act")
	job_number := r.FormValue("job_number")
	po_no := r.FormValue("po_no")
	order_date := r.FormValue("order_date")
	due_date := r.FormValue("due_date")
	customer_id := r.FormValue("customer_id")
	customer_name := r.FormValue("customer_name")
	product_name := r.FormValue("product_name")
	product_type := r.FormValue("product_type")
	product_size := r.FormValue("product_size")
	qty := r.FormValue("qty")
	price := r.FormValue("price")
	spec := r.FormValue("spec")
	drawing_id := r.FormValue("drawing_id")
	drawing_image := r.FormValue("drawing_image")
	treatment := r.FormValue("treatment")
	material := r.FormValue("material")
	special_treatment := r.FormValue("special_treatment")

	table := "sales_lists"
	var result, logInfo string
	result = "wait"
	where := "job_number = '" + job_number + "'"
	checkRow, err := MODEL.CheckRow(where, table)
	CONFIG.CheckErr(err)
	if checkRow == 0 {
		result = "success"
	}

	if act != "check" {
		column := `
			job_number, 
			po_no, 
			order_date, 
			due_date, 
			customer_id, 
			product_name, 
			product_type, 
			product_size, 
			qty, 
			price, 
			spec, 
			drawing_id, 
			treatment, 
			special_treatment, 
			material, 
			delivery_date
		`
		values := "'" + job_number + "', "
		values += "'" + po_no + "', "
		values += "'" + order_date + "', "
		values += "'" + due_date + "', "
		values += "'" + customer_id + "', "
		values += "'" + product_name + "', "
		values += "'" + product_type + "', "
		values += "'" + product_size + "', "
		values += "'" + qty + "', "
		values += "'" + price + "', "
		values += "'" + spec + "', "
		values += "'" + drawing_id + "', "
		values += "'" + treatment + "', "
		values += "'" + special_treatment + "', "
		values += "'" + material + "', "
		values += "'0001-01-01 00:00:00'"
		insert := MODEL.Insert(column, values, table)
		if insert != nil {
			result = "failed"
		} else {
			result = "success"
			table := "sales_lists_drawing"
			column := `
				drawing_id, 
				drawing_image 
			`
			values := "'" + drawing_id + "', "
			values += "'" + drawing_image + "'"
			insert := MODEL.Insert(column, values, table)
			if insert != nil {
				result = "failed"
			} else {
				result = "success"
			}
		}

		if result == "failed" {
			result = "failed"
			logInfo = "Failed to " + act + " new order. <br> Job Number : " + job_number + " <br> Customer : " + customer_name + " <br> Product Name : " + product_name + " <br> Order Date : " + order_date + " <br> Due Date : " + due_date + ""
		} else {
			logInfo = "Success to " + act + " new order. <br> Job Number : " + job_number + " <br> Customer : " + customer_name + " <br> Product Name : " + product_name + " <br> Order Date : " + order_date + " <br> Due Date : " + due_date + ""
			result = "success"
		}

		session, _ := CONFIG.Store.Get(r, "cookie-name")
		MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Sales Menu", act+" new order", logInfo, result)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

func UpdateSales(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	act := r.FormValue("act")
	job_number := r.FormValue("job_number")
	po_no := r.FormValue("po_no")
	po_no_before := r.FormValue("po_no_before")
	due_date := r.FormValue("due_date")
	due_date_before := r.FormValue("due_date_before")
	customer_id := r.FormValue("customer_id")
	customer_name := r.FormValue("customer_name")
	customer_name_before := r.FormValue("customer_name_before")

	table := "sales_lists"
	var result, logInfo string

	where := "1=1 AND job_number = '" + job_number + "'"
	set := "po_no = '" + po_no + "', "
	set += "due_date = '" + due_date + "', "
	set += "customer_id = '" + customer_id + "'"
	update := MODEL.Update(set, where, table)
	if update != nil {
		result = "failed"
	} else {
		result = "success"
	}

	if result == "failed" {
		result = "failed"
		logInfo = "Failed to " + act + " order with Job Number : " + job_number + ". <br> Customer Before : " + customer_name_before + " <br>. Customer : " + customer_name + " <br>. PO No Before : " + po_no_before + " <br>. PO No : " + po_no + " <br>. Due Date Before : " + due_date_before + " <br> Due Date : " + due_date + ""
	} else {
		logInfo = "Success to " + act + " order with Job Number : " + job_number + ". <br> Customer Before : " + customer_name_before + " <br>. Customer : " + customer_name + " <br>. PO No Before : " + po_no_before + " <br>. PO No : " + po_no + " <br>. Due Date Before : " + due_date_before + " <br> Due Date : " + due_date + ""
		result = "success"
	}

	session, _ := CONFIG.Store.Get(r, "cookie-name")
	MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Sales Menu", act+" order "+job_number+"", logInfo, result)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

func UpdateProductOrder(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	act := r.FormValue("act")
	job_number := r.FormValue("job_number")
	drawing_id := r.FormValue("drawing_id")
	drawing_image := r.FormValue("drawing_image")
	id := r.FormValue("id")
	po_no := r.FormValue("po_no")
	customer_name := r.FormValue("customer_name")
	product_name := r.FormValue("product_name")
	product_type := r.FormValue("product_type")
	product_size := r.FormValue("product_size")
	qty := r.FormValue("qty")
	price := r.FormValue("price")
	spec := r.FormValue("spec")
	treatment := r.FormValue("treatment")
	special_treatment := r.FormValue("special_treatment")
	material := r.FormValue("material")
	product_name_before := r.FormValue("product_name_before")
	product_type_before := r.FormValue("product_type_before")
	product_size_before := r.FormValue("product_size_before")
	qty_before := r.FormValue("qty_before")
	price_before := r.FormValue("price_before")
	spec_before := r.FormValue("spec_before")
	treatment_before := r.FormValue("treatment_before")
	special_treatment_before := r.FormValue("special_treatment_before")
	material_before := r.FormValue("material_before")
	status_order := r.FormValue("status_order")
	proceed := r.FormValue("proceed")
	delivery_date := r.FormValue("delivery_date")
	manualJobNumber := r.FormValue("manualJobNumber")

	table := "sales_lists"
	var result, logInfo, set string
	fmt.Println(id, drawing_id, status_order)

	updateDrawing := "no"
	where := "1=1 AND job_number = '" + job_number + "' AND id = '" + id + "' AND drawing_id = '" + drawing_id + "'"
	if proceed != "" && status_order != "" && status_order != "delivery" {
		set += "status_order = '" + status_order + "'"
	} else if proceed != "" && status_order != "" && status_order == "delivery" {
		set += "status_order = '" + status_order + "', "
		set += "delivery_date = '" + delivery_date + "'"
	} else if proceed != "" && status_order != "" && status_order == "cancel" {
		set += "status_order = '" + status_order + "'"
	} else {
		set += "product_name = '" + product_name + "', "
		set += "product_type = '" + product_type + "', "
		set += "product_size = '" + product_size + "', "
		set += "qty = '" + qty + "', "
		set += "price = '" + price + "', "
		set += "spec = '" + spec + "', "
		set += "treatment = '" + treatment + "', "
		set += "special_treatment = '" + special_treatment + "', "
		set += "material = '" + material + "',"
		set += "manu_job_number = '" + manualJobNumber + "'"
		updateDrawing = "yes"
	}
	update := MODEL.Update(set, where, table)
	if proceed != "" && status_order == "production" {
		act = "proceed to production for"
	}
	if proceed != "" && status_order == "delivery" {
		act = "change delivery date"
	}
	if proceed != "" && status_order == "completed" {
		act = "set completed on"
	}
	if update != nil {
		result = "failed"
		logInfo = "Failed to " + act + " product order with Job Number : " + job_number + ". Drawing ID : " + drawing_id + ". Customer : " + customer_name + ". PO No : " + po_no + ". <br>"
	} else {
		result = "success"
		logInfo = "Success to " + act + " product order with Job Number : " + job_number + ". Drawing ID : " + drawing_id + ". Customer : " + customer_name + ". PO No : " + po_no + ". <br>"
		if updateDrawing == "yes" {
			where = "1=1 AND drawing_id = '" + drawing_id + "'"
			set = "drawing_image = '" + drawing_image + "'"
			table = "sales_lists_drawing"
			update = MODEL.Update(set, where, table)
			if update != nil {
				result = "failed"
				logInfo = "Failed update drawing image"
			} else {
				result = "success"
				logInfo = "Success update drawing image"
			}
		}
	}

	if proceed == "" || status_order == "" {
		logInfo += "Product Name Before : " + product_name_before + " <br>. Product Name : " + product_name + ". <br>"
		logInfo += "Product Type Before : " + product_type_before + " <br>. Product Type : " + product_type + ". <br>"
		logInfo += "Product Size Before : " + product_size_before + " <br>. Product Size : " + product_size + ". <br>"
		logInfo += "Qty Before : " + qty_before + " <br>. Qty : " + qty + ". <br>"
		logInfo += "Price Before : " + price_before + " <br>. Price : " + price + ". <br>"
		logInfo += "Marking Before : " + spec_before + " <br>. Marking : " + spec + ". <br>"
		logInfo += "Treatment Before : " + treatment_before + " <br>. Treatment : " + treatment + ". <br>"
		logInfo += "Special Treatment : " + special_treatment_before + " <br>. Special Treatment : " + special_treatment + ". <br>"
		logInfo += "Material Before : " + material_before + " <br>. Material : " + material + ". <br>"
	}

	session, _ := CONFIG.Store.Get(r, "cookie-name")
	MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Sales Menu", act+" product order "+drawing_id+"", logInfo, result)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

type Product struct {
	ProductDesc   string `json:"ProductDesc"`
	ProductSize   string `json:"ProductSize"`
	ProductSize2  string `json:"ProductSize2"`
	ProductSizeX  string `json:"ProductSizeX"`
	ProductMat    string `json:"ProductMat"`
	ProductQty    string `json:"ProductQty"`
	ProductPrice  string `json:"ProductPrice"`
	ProductAmount string `json:"ProductAmount"`
	ProductStatus string `json:"ProductStatus"`
}

func UpdateQuo(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	if err != nil {
		CONFIG.CheckErr(err)
		return
	}
	defer db.Close()

	var payload struct {
		Act            string    `json:"act"`
		QuoId          string    `json:"quo_id"`
		QuoName        string    `json:"quo_name"`
		CompanyId      string    `json:"company_id"`
		CompanyName    string    `json:"company_name"`
		QuoUp          string    `json:"quo_up"`
		QuoCc          string    `json:"quo_cc"`
		CustTelp       string    `json:"customer_phone"`
		CustFax        string    `json:"customer_fax"`
		QuoNo          string    `json:"quo_no"`
		QuoRev         string    `json:"quo_rev"`
		QuoDate        string    `json:"quo_date"`
		QuoDue         string    `json:"quo_due_date"`
		QuoPosApprov   string    `json:"quo_approv_pos"`
		QuoApprov      string    `json:"quo_approv"`
		QuoPosCheck    string    `json:"quo_check_pos"`
		QuoCheck       string    `json:"quo_check"`
		QuoPosMade     string    `json:"quo_made_pos"`
		QuoMade        string    `json:"quo_made"`
		ProductNote    string    `json:"product_note"`
		QuoPph         string    `json:"quo_pph"`
		QuoPpn         string    `json:"quo_ppn"`
		QuoKurs        string    `json:"kurs"`
		QuoKursRate    float32   `json:"kurs_rate"`
		QuoSubTtl      string    `json:"quo_sub_ttl"`
		QuoPphValue    string    `json:"quo_pph_value"`
		QuoPpnValue    string    `json:"quo_ppn_value"`
		QuoTtl         string    `json:"quo_ttl"`
		QuoTitle       string    `json:"quo_title"`
		QuoEstimate    string    `json:"quo_estimate"`
		QuoEmail       string    `json:"quo_email"`
		QuoDiscount    string    `json:"quo_discount"`
		QuoDiscountTtl string    `json:"quo_discount_ttl"`
		Products       []Product `json:"products"`
	}

	err = json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	var result, logInfo string
	continueQuo := "success"
	table := "quotation_header"
	statusQuo := "open"
	if payload.Act == "revision" {
		statusQuo = payload.Act
		where := "1=1 AND id = '" + payload.QuoId + "'"
		set := "status = 'old_version'"
		update := MODEL.Update(set, where, table)
		if update != nil {
			continueQuo = "failed"
		} else {
			continueQuo = "success"
		}
		fmt.Println(continueQuo, " to update revision.")
	}

	// Start transaction
	tx, err := db.Begin()
	if err != nil {
		CONFIG.CheckErr(err)
		http.Error(w, "Failed to begin transaction", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Insert into first table
	firstTable := "quotation_header"
	firstColumns := `
		quotation_no, 
		customer_id, 
		customer_name, 
		quotation_date, 
		quotation_due_date, 
		up, 
		cc, 
		pph, 
		ppn, 
		quotation_name, 
		revision, 
		customer_telp, 
		customer_fax, 
		approve_by, 
		approve_pos, 
		check_by, 
		check_pos, 
		made_by, 
		made_pos, 
		sub_price, 
		ppn_price, 
		pph_price, 
		total, 
		noted, 
		status, 
		kurs, 
		kurs_rate,
		quo_title,
		quo_estimate,
		quo_email,
		quo_discount,
		quo_discount_ttl
	`
	firstValues :=
		fmt.Sprintf(`
			'%s',
			'%s',
			'%s',
			'%s',
			'%s',
			'%s',
			'%s',
			'%s',
			'%s',
			'%s',
			'%s',
			'%s',
			'%s',
			'%s',
			'%s',
			'%s',
			'%s',
			'%s',
			'%s',
			'%s',
			'%s',
			'%s',
			'%s',
			'%s',
			'%s',
			'%s',
			'%f',
			'%s',
			'%s',
			'%s',
			'%s',
			'%s'
		`,
			payload.QuoNo,
			payload.CompanyId,
			payload.CompanyName,
			payload.QuoDate,
			payload.QuoDue,
			payload.QuoUp,
			payload.QuoCc,
			payload.QuoPph,
			payload.QuoPpn,
			payload.QuoName,
			payload.QuoRev,
			payload.CustTelp,
			payload.CustFax,
			payload.QuoApprov,
			payload.QuoPosApprov,
			payload.QuoCheck,
			payload.QuoPosCheck,
			payload.QuoMade,
			payload.QuoPosMade,
			payload.QuoSubTtl,
			payload.QuoPpnValue,
			payload.QuoPphValue,
			payload.QuoTtl,
			payload.ProductNote,
			statusQuo,
			payload.QuoKurs,
			payload.QuoKursRate,
			payload.QuoTitle,
			payload.QuoEstimate,
			payload.QuoEmail,
			payload.QuoDiscount,
			payload.QuoDiscountTtl,
		)

	fmt.Println(firstValues)

	firstInsert := fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s) RETURNING id", firstTable, firstColumns, firstValues)
	fmt.Println(firstInsert)

	var newID int
	err = tx.QueryRow(firstInsert).Scan(&newID)
	if err != nil {
		CONFIG.CheckErr(err)
		result = "failed"
		logInfo = "Failed to add Quotation to first table. <br> Quotation Name : " + payload.QuoName + " <br> Quotation No : " + payload.QuoNo + " <br> Customer : " + payload.CompanyName + ""
		http.Error(w, logInfo, http.StatusInternalServerError)
		return
	}

	// Insert into second table
	for _, product := range payload.Products {
		secondTable := "quotation_detail"
		secondColumns := "description, size, qty, unit_price, quotation_no, material, price, status, id_quotation"
		// Gabungkan dua nilai dengan 'x' di tengahnya
		combinedSize := fmt.Sprintf("CONCAT('%s', '%s', '%s')", product.ProductSize, product.ProductSizeX, product.ProductSize2)
		secondValues := fmt.Sprintf("'%s',%s,'%s','%s','%s','%s','%s','%s','%d'",
			product.ProductDesc, combinedSize, product.ProductQty, product.ProductPrice, payload.QuoNo, product.ProductMat, product.ProductAmount, product.ProductStatus, newID)
		secondInsert := fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s)", secondTable, secondColumns, secondValues)

		fmt.Println(secondInsert)

		_, err = tx.Exec(secondInsert)
		if err != nil {
			CONFIG.CheckErr(err)
			result = "failed"
			logInfo = "Failed to add Quotation to second table. <br> Quotation Name : " + payload.QuoName + " <br> Quotation No : " + payload.QuoNo + " <br> Customer : " + payload.CompanyName + ""
			http.Error(w, logInfo, http.StatusInternalServerError)
			return
		}
	}

	// Commit the transaction
	err = tx.Commit()
	if err != nil {
		CONFIG.CheckErr(err)
		result = "failed"
		logInfo = "Failed to commit transaction. <br> Quotation Name : " + payload.QuoName + " <br> Quotation No : " + payload.QuoNo + " <br> Customer : " + payload.CompanyName + ""
		http.Error(w, logInfo, http.StatusInternalServerError)
		return
	}

	result = "success"
	logInfo = "Success to add Quotation"
	fmt.Println(firstValues)

	session, _ := CONFIG.Store.Get(r, "cookie-name")
	MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "class Lists", "add class", logInfo, result)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

func LoadQuo(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	quo_no := r.FormValue("quo_no")
	startPeriod := r.FormValue("startPeriod")
	endPeriod := r.FormValue("endPeriod")
	allFilter := r.FormValue("all")
	var whereQuo, whereAll string

	if quo_no != "" {
		whereQuo = ` AND b.quotation_no = '` + quo_no + `'`
	}
	if startPeriod != "" && endPeriod != "" {
		whereQuo += ` AND b.quotation_date BETWEEN '` + startPeriod + `' AND '` + endPeriod + `'`
	}
	if allFilter != "true" {
		whereAll = `AND (b.status = 'open' OR b.status = 'revision' OR b.status = 'approve')`
	} else {
		whereAll = ""
	}

	q := `WITH total_sum_all AS (
			    SELECT
			        d.id_quotation,
			        SUM(d.price) AS total_sum_all
			    FROM
			        quotation_detail d
			        LEFT JOIN quotation_header b ON d.id_quotation = b.ID
			    WHERE
			        d.status = 'approve'
			        ` + whereQuo + `
			    GROUP BY
			        d.id_quotation
			)
			SELECT
			    COALESCE(d.customer_id, b.customer_id) AS customer_id,
			    COALESCE(d.customer_alias, '-') AS customer_name,
			    b.quotation_date,
			    b.quotation_due_date,
			    COALESCE(b.id, 0) as quotation_id,
			    COALESCE(b.quotation_name,'-') as quotation_name,
			    COALESCE(b.quotation_no, '-') as quotation_no,
			    COALESCE(b.revision, '-') as revision,
			    COALESCE(b.status,'-') as status,
			    COALESCE(b.kurs,'-') as kurs,
			    COALESCE(b.kurs_rate,0) as kurs_rate,
			    COALESCE(b.total,0) as total,
			    0 as total_kurs,
			    COALESCE(t.total_sum_all, 0) AS total_price_product
			FROM
			    quotation_header b
			    LEFT JOIN mst_customer d ON d.customer_name = b.customer_name
			    LEFT JOIN total_sum_all t ON t.id_quotation = b.id
			WHERE 1=1
			` + whereAll + `
			` + whereQuo + `
			ORDER BY
			CASE
				WHEN b.status = 'open' THEN 1
				WHEN b.status = 'revision' THEN 2
				ELSE 3
			END,
			id DESC`

	fmt.Println(q)
	rows, err := db.Query(q)
	CONFIG.CheckErr(err)

	var results []STRUCTS.QuotationTable

	var No int32
	for rows.Next() {
		No++

		var Customer_id, Customer_name, Quo_name, Quo_no, Revision, Status, Total, Total_kurs, Kurs, Total_Price string
		var Kurs_rate float32
		var Quo_date, Quo_due sql.NullString
		var Quo_id int32

		err = rows.Scan(&Customer_id, &Customer_name, &Quo_date, &Quo_due, &Quo_id, &Quo_name, &Quo_no, &Revision, &Status, &Kurs, &Kurs_rate, &Total, &Total_kurs, &Total_Price)
		if err != nil {
			panic(err)
		}

		actionColField := `
			<div class="btn-action">
				<button title="Revision" class='button-set' action='revision' data-quo_id='` + strconv.Itoa(int(Quo_id)) + `' data-quo_no='` + Quo_no + `' onclick='setStatusQuotation(this, "revision")'>
					<i class='fas far fa-edit'></i>
				</button>
				<button title="Cancel" class='button-set' action='cancel' data-quo_id='` + strconv.Itoa(int(Quo_id)) + `' data-quo_no='` + Quo_no + `' onclick='setApprove(this, "cancel")'>
					<i class='fas fa-times'></i>
				</button>
				<button title="Reorder" class='button-set' action='reorder' data-quo_id='` + strconv.Itoa(int(Quo_id)) + `' data-quo_no='` + Quo_no + `' onclick='setStatusQuotation(this, "reorder")'>
					<i class='fas fa-undo-alt'></i>
				</button>
				<button title="Approve" class='button-set' action='approve' data-quo_id='` + strconv.Itoa(int(Quo_id)) + `' data-quo_no='` + Quo_no + `' onclick='setApprove(this, "approve")'>
					<i class="fas fa-check-circle"></i>
				</button>
				<button title="View" class='button-set view-btn' action='view' id='view-desc' data-quo_id='` + strconv.Itoa(int(Quo_id)) + `' data-quo_no='` + Quo_no + `' onclick='viewDetailProduct(this, "open")'>
					<i class='fas fa-eye'></i>
				</button>
				<button  title="Print" class='button-set' action='view' print-id='print-preview-box"' data-quo_id='` + strconv.Itoa(int(Quo_id)) + `' data-quo_no='` + Quo_no + `'  onclick='setStatusQuotation(this, "view")'>
					<i class='fas fas fa-print'></i>
				</button>
			</div>
			`

		quotation := STRUCTS.QuotationTable{
			No:             No,
			Action:         actionColField,
			Customer_Id:    Customer_id,
			Customer_Name:  Customer_name,
			Quotation_Id:   Quo_id,
			Quotation_No:   Quo_no,
			Quotation_Name: Quo_name,
			Revision:       Revision,
			Status:         Status,
			Total:          Total,
			Total_kurs:     Total_kurs,
			Kurs:           Kurs,
			Kurs_rate:      Kurs_rate,
			Total_Price:    Total_Price,
		}

		if Quo_date.Valid {
			quotation.Quotation_Date = Quo_date.String
		} else {
			quotation.Quotation_Date = "0001-01-01"
		}

		if Quo_due.Valid {
			quotation.Quotation_Due = Quo_due.String
		} else {
			quotation.Quotation_Due = "0001-01-01"
		}

		results = append(results, quotation)
	}

	response := STRUCTS.Response{
		Status:  "success",
		Message: "Get Quotation List is success",
		Data:    results,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func LoadQuotationDetail(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	quo_id := r.FormValue("quo_id")
	quo_no := r.FormValue("quo_no")
	var whereQuo, whereQuoId string

	if quo_id != "" {
		whereQuoId = ` AND a.id_quotation = '` + quo_id + `'`
	}

	if quo_no != "" {
		whereQuo = ` AND a.quotation_no = '` + quo_no + `'`
	}

	q := `SELECT 
					COALESCE(a.id, 0) as id,
					COALESCE(MAX(a.description), '-') as description,
					COALESCE(MAX(a.size), '-') as size,
					COALESCE(MAX(a.qty), 0) as qty,
					COALESCE(MAX(a.unit_price), 0) as unit_price,
					COALESCE(MAX(a.quotation_no), '-') as quotation_no,
					COALESCE(MAX(a.material), '-') as material,
					COALESCE(MAX(a.price), 0) as price,
					COALESCE(MAX(a.status), '-') as status,
					COALESCE(MAX(b.kurs), '-') as kurs,
					COALESCE(MAX(b.kurs_rate), 0) as kurs_rate
				FROM
				quotation_detail a 
				LEFT JOIN quotation_header b ON a.quotation_no = b.quotation_no
				WHERE 1=1
				` + whereQuo + `
				` + whereQuoId + `
				GROUP BY a.id
			`

	fmt.Println(q)

	rows, err := db.Query(q)
	CONFIG.CheckErr(err)

	results := map[int32]STRUCTS.QuotationDetail{}

	var No int32
	for rows.Next() {
		No++

		var (
			Id           int32
			Description  string
			Size         string
			Qty          string
			Material     string
			Unit_price   string
			Price        string
			Quotation_no string
			Status       string
			Kurs         string
			Kurs_rate    float32
		)

		err = rows.Scan(
			&Id,
			&Description,
			&Size,
			&Qty,
			&Unit_price,
			&Quotation_no,
			&Material,
			&Price,
			&Status,
			&Kurs,
			&Kurs_rate,
		)
		if err != nil {
			panic(err)
		}

		results[No] = STRUCTS.QuotationDetail{
			No:           No,
			Description:  Description,
			Size:         Size,
			Qty:          Qty,
			Unit_price:   Unit_price,
			Quotation_no: Quotation_no,
			Material:     Material,
			Price:        Price,
			Status:       Status,
			Kurs:         Kurs,
			Kurs_rate:    Kurs_rate,
		}

	}

	response := STRUCTS.Response{
		Status:  "success",
		Message: "Get Quotation List is success",
		Data:    results,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func LoadQuoView(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	quo_no := r.FormValue("quo_no")
	quo_id := r.FormValue("quo_id")
	var whereQuo, whereQuoId string

	if quo_id != "" {
		whereQuoId = ` AND b.id = '` + quo_id + `'`
	}

	if quo_no != "" {
		whereQuo = ` AND b.quotation_no = '` + quo_no + `'`
	}

	q := `SELECT
			COALESCE(b.quotation_no, '-') AS quotation_no,
			COALESCE(b.customer_id, '-') AS customer_id,
			COALESCE(b.customer_name, '-') AS customer_name,
			COALESCE(b.quotation_date::text, '0001-01-01') AS quotation_date,
			COALESCE(b.quotation_due_date::text, '0001-01-01') AS quotation_due_date,
			COALESCE(b.up, '-') AS up,
			COALESCE(b.cc, '-') AS cc,
			COALESCE(b.pph, '-') AS pph,
			COALESCE(b.ppn, '-') AS ppn,
			COALESCE(b.quotation_name, '-') AS quotation_name,
			COALESCE(b.revision, '-') AS revision,
			COALESCE(b.customer_telp, '-') AS customer_telp,
			COALESCE(b.customer_fax, '-') AS customer_fax,
			COALESCE(b.approve_by, '-') AS approve_by,
			COALESCE(b.approve_pos, '-') AS approve_pos,
			COALESCE(b.check_by, '-') AS check_by,
			COALESCE(b.check_pos, '-') AS check_pos,
			COALESCE(b.made_by, '-') AS made_by,
			COALESCE(b.made_pos, '-') AS made_pos,
			COALESCE(d.description, '-') AS description,
			COALESCE(d."size", '-') AS "size",
			COALESCE(d.qty, 0) AS qty,
			COALESCE(d.unit_price, 0) AS unit_price,
			COALESCE(d.material, '-') AS material,
			COALESCE(b.sub_price, 0) AS sub_price,
			COALESCE(b.ppn_price, 0) AS ppn_price,
			COALESCE(b.pph_price, 0) AS pph_price,
			COALESCE(b.total, 0) AS total,
			COALESCE(b.noted, '-') AS noted,
			COALESCE(d.price, 0) AS price,
			COALESCE(b.kurs, '-') AS kurs,
			COALESCE(b.kurs_rate, 0) AS kurs_rate,
			COALESCE(b.quo_title, '-') AS quo_title,
			COALESCE(b.quo_estimate, '-') AS quo_estimate,
			COALESCE(b.quo_email, '-') AS quo_email,
			COALESCE(b.quo_discount, '0') AS quo_discount,
			COALESCE(b.quo_discount_ttl, '0') AS quo_discount_ttl
		FROM
			quotation_header b
			LEFT JOIN quotation_detail d ON b.quotation_no = d.quotation_no AND b.id = d.id_quotation
		WHERE 1=1
		` + whereQuo + `
		` + whereQuoId + `
		`

	fmt.Println(q)
	rows, err := db.Query(q)
	CONFIG.CheckErr(err)
	defer rows.Close()

	results := make(map[string]STRUCTS.Quotation)

	for rows.Next() {
		var Quotation_No, Customer_Id, Customer_Name, Quotation_Date, Quotation_Due, Up, Cc, Pph, Ppn, Quotation_Name, Revision, Customer_Telp, Customer_Fax, Approve_By, Approve_Pos, Check_By, Check_Pos, Made_By, Made_Pos, Description, Size, Material, Noted, Kurs, Quo_title, Quo_estimate, Quo_email string
		var Qty, Unit_Price, Sub_Price, Ppn_Price, Pph_Price, Total, Price, Kurs_rate, Quo_discount, Quo_discount_ttl float64

		err = rows.Scan(
			&Quotation_No,
			&Customer_Id,
			&Customer_Name,
			&Quotation_Date,
			&Quotation_Due,
			&Up,
			&Cc,
			&Pph,
			&Ppn,
			&Quotation_Name,
			&Revision,
			&Customer_Telp,
			&Customer_Fax,
			&Approve_By,
			&Approve_Pos,
			&Check_By,
			&Check_Pos,
			&Made_By,
			&Made_Pos,
			&Description,
			&Size,
			&Qty,
			&Unit_Price,
			&Material,
			&Sub_Price,
			&Ppn_Price,
			&Pph_Price,
			&Total,
			&Noted,
			&Price,
			&Kurs,
			&Kurs_rate,
			&Quo_title,
			&Quo_estimate,
			&Quo_email,
			&Quo_discount,
			&Quo_discount_ttl,
		)
		if err != nil {
			panic(err)
		}

		if quotation, ok := results[Quotation_No]; ok {
			quotation.Details = append(quotation.Details, STRUCTS.QuotationDetail{
				Description: Description,
				Size:        Size,
				Qty:         fmt.Sprintf("%.0f", Qty),
				Material:    Material,
				Unit_price:  fmt.Sprintf("%.2f", Unit_Price),
				Price:       fmt.Sprintf("%.2f", Price),
			})
			results[Quotation_No] = quotation
		} else {
			results[Quotation_No] = STRUCTS.Quotation{
				No:               int32(len(results) + 1),
				Quotation_No:     Quotation_No,
				Customer_Id:      Customer_Id,
				Quotation_Name:   Quotation_Name,
				Quotation_Date:   Quotation_Date,
				Quotation_Due:    Quotation_Due,
				Quotation_Rev:    Revision,
				Customer_Name:    Customer_Name,
				Customer_Telp:    Customer_Telp,
				Customer_Fax:     Customer_Fax,
				Quo_noted:        Noted,
				Quo_Up:           Up,
				Quo_Cc:           Cc,
				Quo_Approv:       Approve_By,
				Quo_Approv_Pos:   Approve_Pos,
				Quo_Check:        Check_By,
				Quo_Check_Pos:    Check_Pos,
				Quo_Made:         Made_By,
				Quo_Made_Pos:     Made_Pos,
				Quo_pph:          Pph,
				Quo_ppn:          Ppn,
				Quo_Sub_Tll:      fmt.Sprintf("%.2f", Sub_Price),
				Quo_pph_value:    fmt.Sprintf("%.2f", Pph_Price),
				Quo_ppn_value:    fmt.Sprintf("%.2f", Ppn_Price),
				Quo_Ttl:          fmt.Sprintf("%.2f", Total),
				Quo_kurs:         Kurs,
				Quo_kurs_rate:    Kurs_rate,
				Quo_title:        Quo_title,
				Quo_estimate:     Quo_estimate,
				Quo_email:        Quo_email,
				Quo_discount:     Quo_discount,
				Quo_discount_ttl: Quo_discount_ttl,
				Details: []STRUCTS.QuotationDetail{
					{
						Description: Description,
						Size:        Size,
						Qty:         fmt.Sprintf("%.0f", Qty),
						Material:    Material,
						Unit_price:  fmt.Sprintf("%.2f", Unit_Price),
						Price:       fmt.Sprintf("%.2f", Price),
					},
				},
			}
		}
	}

	response := STRUCTS.Response{
		Status:  "success",
		Message: "Get Quotation List is success",
		Data:    results,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func LoadSalesHeader(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	status_order := r.FormValue("statusOrder")
	startPeriod := r.FormValue("startPeriod")
	endPeriod := r.FormValue("endPeriod")
	var whereStatus, whereDate string

	if status_order != "" {
		// whereStatus = ` AND (b.status_order = '` + status_order + `')`
		whereStatus = ` AND b.status_order IN ('` + status_order + `', 'open', 'production','completed')	`
	}

	if startPeriod != "" && endPeriod != "" {
		whereDate = ` AND b.order_date BETWEEN '` + startPeriod + `' AND '` + endPeriod + `'`
	}

	q := `SELECT
		    COALESCE(b.new_job_number, '00000') AS job_number,
			COALESCE(b.order_date, '0001-01-01 00:00:00') as order_date,
			COALESCE(b.delivery_date, '0001-01-01 00:00:00') as delivery_date,
			COALESCE(b.due_date, '0001-01-01 00:00:00') as due_date,
		    COALESCE(f.customer_alias, '-') AS customer_name,
		    COALESCE(b.quotation_no, '-') AS quotation_no,
		    COALESCE(b.id_quotation, 0) AS id_quotation,
		    COALESCE(b.po_no, '-') AS po_no
		FROM
		    sales_lists b
		    LEFT JOIN mst_customer f ON b.customer_id = f.customer_id
		    LEFT JOIN quotation_header d ON b.quotation_no = d.quotation_no AND b.id_quotation = d.id
		    LEFT JOIN quotation_detail s ON b.quotation_no = s.quotation_no AND b.id_quotation = s.id_quotation
		WHERE 1=1
			` + whereDate + `
			` + whereStatus + `
		GROUP BY
			b.id,
		    b.job_number,
		    b.order_date,
		    b.delivery_date,
		    b.due_date,
		    f.customer_alias,
		    b.id_quotation,
		    b.po_no
		ORDER BY
			b.job_number ASC
		LIMIT 100`
	fmt.Println(q)

	rows, err := db.Query(q)
	CONFIG.CheckErr(err)
	defer rows.Close()

	results := map[string]STRUCTS.SalesOrder{}

	var No int32
	for rows.Next() {
		No++

		var JobNumber, OrderDate, DeliveryDate, DueDate, Customer, QuoNo, PoNo string
		var QuoId int32

		err = rows.Scan(&JobNumber, &OrderDate, &DeliveryDate, &DueDate, &Customer, &QuoNo, &QuoId, &PoNo)
		if err != nil {
			panic(err)
		}

		actionColField := `
			<div class="basic-flex">
				<button class='button-set' action='view' data-quo_no='` + QuoNo + `' onclick='printPreviewQuotation(this, "print-preview-box")'>
					<i class='fas fas fa-print'></i>
				</button>
				<button class='button-set' action='revision' data-quo_no='` + QuoNo + `' onclick='setStatusQuotation(this, "revision")'>
					<i class='fas far fa-edit'></i>
				</button>
				<button class='button-set' action='cancel' data-quo_no='` + QuoNo + `' onclick='setStatusQuotation(this, "cancel")'>
					<i class='fas fa-times'></i>
				</button>
				<button class='button-set' action='reorder' data-quo_no='` + QuoNo + `' onclick='setStatusQuotation(this, "reorder")'>
					<i class='fas fa-undo-alt'></i>
				</button>
				<button class='button-set' action='approve' data-quo_no='` + QuoNo + `' onclick='setStatusQuotation(this, "approve")'>
						<i class="fas fa-check-circle"></i>
				</button>
			</div>
		`

		results[QuoNo] = STRUCTS.SalesOrder{
			No:           No,
			Action:       actionColField,
			View:         "<button class='button-set' action='view' id='view-desc' data-quo_id='" + strconv.Itoa(int(QuoId)) + "' data-quo_no='" + QuoNo + "' data-po_no='" + PoNo + "' onclick='viewDetailOrder(this, \"open\")'><i class='fas fa-eye'></i> View</button>",
			JobNumber:    JobNumber,
			OrderDate:    OrderDate,
			DeliveryDate: DeliveryDate,
			DueDate:      DueDate,
			Customer:     Customer,
			QuoNo:        QuoNo,
			PoNo:         PoNo,
		}

	}

	response := STRUCTS.Response{
		Status:  "success",
		Message: "Get Quotation List is success",
		Data:    results,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func ApproveQuo(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	QuoId := r.FormValue("quo_id")
	QuoNo := r.FormValue("quo_no")
	po_no := r.FormValue("po_no")
	order_date := r.FormValue("order_date")
	due_date := r.FormValue("due_date")
	Act := r.FormValue("act")
	var whereIdQuo, whereQuo, result, messageResult string

	var numberRow int64
	numberRow++

	table := "quotation_header"
	where := "1=1 AND id = '" + QuoId + "'"
	set := "status = '" + Act + "'"
	update := MODEL.Update(set, where, table)
	if update != nil {
		result = "failed"
	} else {
		result = "success"
	}
	if Act == "cancel" {
		messageResult = fmt.Sprintf("Cancelled quotation %s, rows affected: %d", QuoNo, numberRow)
	} else {
		if QuoNo != "" {
			whereQuo = ` AND b.quotation_no = '` + QuoNo + `'`
		}
		if QuoId != "" {
			whereIdQuo = ` AND b.id_quotation = '` + QuoId + `'`
		}

		q := `
			INSERT INTO sales_lists (
				job_number, id_quotation, quotation_no, customer_id, product_name, product_size, qty, price, material, status_order, po_no, order_date, due_date, delivery_date
			)
			SELECT
				'00000' AS job_number,
				d.id,
				d.quotation_no,
				e.customer_id,
				b.description,
				b.size,
				b.qty,
				b.unit_price,
				b.material,
				'po' as status_order,
				'` + po_no + `' as po_no,
				'` + order_date + `' as order_date,
				'` + due_date + `' as due_date,
				'` + due_date + `' as delivery_date
			FROM
				quotation_detail b
				LEFT JOIN quotation_header d ON b.quotation_no = d.quotation_no AND b.id_quotation = d.id
				LEFT JOIN mst_customer e ON d.customer_name = e.customer_name
				WHERE 1=1 
				AND b.status = 'approve'
				` + whereQuo + `
				` + whereIdQuo + `
				`

		fmt.Println(q)

		messageResult = fmt.Sprintf("Approved quotation %s, rows affected: %d", QuoNo, numberRow)

		result, err := db.Exec(q)
		if err != nil {
			http.Error(w, fmt.Sprintf("Error generating stock: %v", err), http.StatusInternalServerError)
			return
		}

		// Get the number of affected rows
		rowsAffected, err := result.RowsAffected()
		numberRow = rowsAffected
		if err != nil {
			http.Error(w, fmt.Sprintf("Error fetching result: %v", err), http.StatusInternalServerError)
			return
		}
	}

	session, _ := CONFIG.Store.Get(r, "cookie-name")
	MODEL.Log(
		session.Values["Username"].(string),
		session.Values["Name"].(string),
		"Quotation Approval",
		messageResult,
		"Info",
		"Additional log information",
	)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":      result,
		"rowsAffected": numberRow,
	})
}

func CountQuotation(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	startPeriod := r.FormValue("startPeriod")
	endPeriod := r.FormValue("endPeriod")
	var whereQuo string

	if startPeriod != "" && endPeriod != "" {
		whereQuo += ` AND d.quotation_date BETWEEN  '` + startPeriod + `' AND '` + endPeriod + `'`
	}

	q := ` SELECT
    		total_sum_all,
    		total_sum_approved,
    		(total_sum_all - total_sum_approved) AS total_sum_revision_open
		   FROM (
		       SELECT
		           COALESCE((SELECT SUM
		                                   ( b.price )
		                           FROM
		                                   quotation_detail b
		                                   LEFT JOIN quotation_header d ON b.id_quotation = d.ID
		                           WHERE
		                                   (b.status = 'approve')
		                                    ` + whereQuo + `), 0) AS total_sum_all,
		           COALESCE((SELECT SUM
		                                   ( b.price )
		                           FROM
		                                   quotation_detail b
		                                   LEFT JOIN quotation_header d ON b.id_quotation = d.ID
		                           WHERE
		                                   (b.status = 'approve'
		                                   AND d.status = 'approve')
										   ` + whereQuo + `), 0) AS total_sum_approved) AS subquery`
	fmt.Println(q)

	rows, err := db.Query(q)
	CONFIG.CheckErr(err)
	defer rows.Close()

	var countResult STRUCTS.Count

	if rows.Next() {
		err := rows.Scan(&countResult.CountSumAll, &countResult.CountAmountPo, &countResult.CountRemainingAmount)
		CONFIG.CheckErr(err)
	} else {
		http.Error(w, "No results found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(countResult); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func CountSalesOrder(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	startPeriod := r.FormValue("startPeriod")
	endPeriod := r.FormValue("endPeriod")
	var whereQuo string

	if startPeriod != "" && endPeriod != "" {
		whereQuo += ` AND order_date BETWEEN  '` + startPeriod + `' AND '` + endPeriod + `'`
	}

	q := `SELECT
			COALESCE((SELECT SUM
				( price )
			FROM
				sales_lists 
			WHERE
			  status_order IN ('po', 'open', 'production', 'delivery', 'completed')
				` + whereQuo + `), 0) AS total_sum_all,
			COALESCE((SELECT COUNT
				( DISTINCT job_number )
			FROM
				sales_lists
		   	WHERE
			  status_order IN ('po', 'open', 'production')
				` + whereQuo + `), 0) AS total_sum_approved,
			COALESCE((SELECT COUNT
				( DISTINCT job_number )
			FROM
				sales_lists
		 	WHERE
				  status_order IN ('po', 'open', 'production', 'delivery', 'completed')
				` + whereQuo + `), 0) AS total_sum_revision_open`
	fmt.Println(q)

	rows, err := db.Query(q)
	CONFIG.CheckErr(err)
	defer rows.Close()

	var countResult STRUCTS.Count

	if rows.Next() {
		err := rows.Scan(&countResult.CountSumAll, &countResult.CountAmountPo, &countResult.CountRemainingAmount)
		CONFIG.CheckErr(err)
	} else {
		http.Error(w, "No results found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(countResult); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func LoadPoList(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer db.Close()

	q := `
		SELECT b.po_no, b.id_quotation, f.customer_id, f.customer_name, b.order_date, b.due_date AS po_list
		FROM sales_lists b
		LEFT JOIN mst_customer f ON b.customer_id = f.customer_id
		WHERE status_order = 'po'
		GROUP BY b.po_no, b.id_quotation, f.customer_id, f.customer_name, b.order_date, b.due_date 
    `

	fmt.Println(q)

	rows, err := db.Query(q)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var poList []STRUCTS.SalesList

	for rows.Next() {
		var sales STRUCTS.SalesList
		err := rows.Scan(&sales.PoNo, &sales.IdQuotation, &sales.CustomerId, &sales.CustomerName, &sales.OrderDate, &sales.DueDate)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		poList = append(poList, sales)
	}

	// Set response headers
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	// Encode dan kirim response JSON
	if err := json.NewEncoder(w).Encode(poList); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func GetPoData(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	po_no := r.FormValue("po_no")
	id_quotation := r.FormValue("id_quotation")
	fmt.Println(id_quotation)
	var wherePoId, whereIdQuo string

	if po_no != "" {
		wherePoId = ` AND po_no = '` + po_no + `'`
	}

	if id_quotation != "" {
		whereIdQuo = ` AND id_quotation = '` + id_quotation + `'`
	}

	q := `SELECT
			b.job_number,
			COALESCE(b.order_date::text, '0001-01-01') AS order_date,
			COALESCE(b.delivery_date::text, '0001-01-01') AS delivery_date,
			b.due_date,
			f.customer_name,
			b.product_name,
			b.product_type,
			b.product_size,
			b.po_no,
			b.qty,
			b.price,
			b.spec,
			b.status_order,
			b.drawing_id,
			COALESCE(d.drawing_image, '-') AS drawing_image,
			b.treatment,
			b.special_treatment,
			COALESCE(b.material, '-') AS material,
			b.quotation_no,
			b.id_quotation 
		FROM
			sales_lists b
			LEFT JOIN sales_lists_drawing d ON b.drawing_id = d.drawing_id
		LEFT JOIN mst_customer f ON b.customer_id = f.customer_id
		WHERE status_order = 'po'
		` + wherePoId + `
		` + whereIdQuo + ``

	fmt.Println(q)

	rows, err := db.Query(q)
	CONFIG.CheckErr(err)

	results := map[int32]STRUCTS.PoData{}

	var No int32
	for rows.Next() {
		No++

		var (
			JobNumber    string
			OrderDate    sql.NullString
			DeliveryDate string
			DueDate      sql.NullString
			CustomerName string
			ProductName  string
			ProductType  string
			ProductSize  string
			PoNo         string
			qty          string
			price        string
			Spec         string
			StatOrder    string
			Drawingid    string
			DrawingImag  string
			Treatment    string
			SpecTreat    string
			Material     string
			QuoNo        string
			QuoId        string
		)

		err = rows.Scan(
			&JobNumber,
			&OrderDate,
			&DeliveryDate,
			&DueDate,
			&CustomerName,
			&ProductName,
			&ProductType,
			&ProductSize,
			&PoNo,
			&qty,
			&price,
			&Spec,
			&StatOrder,
			&Drawingid,
			&DrawingImag,
			&Treatment,
			&SpecTreat,
			&Material,
			&QuoNo,
			&QuoId,
		)
		if err != nil {
			panic(err)
		}

		// Convert due date to '01-01-0001' if it is empty
		formattedDueDate := "01-01-0001"
		if DueDate.Valid {
			formattedDueDate = DueDate.String
		}
		formattedOrderDate := "01-01-0001"
		if OrderDate.Valid {
			formattedOrderDate = OrderDate.String
		}

		results[No] = STRUCTS.PoData{
			No:           No,
			JobNumber:    JobNumber,
			OrderDate:    formattedOrderDate,
			DeliveryDate: DeliveryDate,
			DueDate:      formattedDueDate,
			CustomerName: CustomerName,
			ProductName:  ProductName,
			ProductType:  ProductType,
			ProductSize:  ProductSize,
			PoNo:         PoNo,
			Qty:          qty,
			Price:        price,
			Spec:         Spec,
			StatOrder:    StatOrder,
			Drawingid:    Drawingid,
			DrawingImag:  DrawingImag,
			Treatment:    Treatment,
			SpecTreat:    SpecTreat,
			Material:     Material,
			QuoNo:        QuoNo,
			QuoId:        QuoId,
		}

	}

	response := STRUCTS.Response{
		Status:  "success",
		Message: "Get Quotation List is success",
		Data:    results,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func LoadOrderDetail(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	quoNo := r.FormValue("quo_no")
	poNo := r.FormValue("po_no")
	idQuo := r.FormValue("quo_id")
	var whereQuo, whereQuoId, wherePoNo string

	if idQuo != "" {
		whereQuoId = ` AND id_quotation = '` + idQuo + `'`
	}

	if quoNo != "" {
		whereQuo = ` AND quotation_no = '` + quoNo + `'`
	}

	if poNo != "" {
		wherePoNo = ` AND po_no = '` + poNo + `'`
	}

	q := `SELECT
			COALESCE (product_name,'-') AS product_name,
			COALESCE (product_type, '-') AS product_type,
			COALESCE (product_size, '-') AS product_size,
			COALESCE (qty, 0) AS qty,
			COALESCE (price, 0) AS price,
			COALESCE (spec, '-') AS spec,
			COALESCE (treatment, '-') AS treatment,
			COALESCE (special_treatment, '-') AS special_treatment,
			COALESCE (material, '-') AS material,
			COALESCE (job_number, '-') AS job_number
		  FROM sales_lists 
			WHERE 1=1 
				` + whereQuo + `
				` + whereQuoId + `
				` + wherePoNo + ``

	fmt.Println(q)

	rows, err := db.Query(q)
	CONFIG.CheckErr(err)

	results := map[int32]STRUCTS.OrderDetail{}

	var No int32
	for rows.Next() {
		No++

		var (
			ProductName      string
			ProductType      string
			ProductSize      string
			Qty              string
			Price            string
			Spec             string
			Treatment        string
			SpecialTreatment string
			Material         string
			JobNumber        string
		)

		err = rows.Scan(
			&ProductName,
			&ProductType,
			&ProductSize,
			&Qty,
			&Price,
			&Spec,
			&Treatment,
			&SpecialTreatment,
			&Material,
			&JobNumber,
		)
		if err != nil {
			panic(err)
		}

		results[No] = STRUCTS.OrderDetail{
			No:               No,
			ProductName:      ProductName,
			ProductType:      ProductType,
			ProductSize:      ProductSize,
			Qty:              Qty,
			Price:            Price,
			Spec:             Spec,
			Treatment:        Treatment,
			SpecialTreatment: SpecialTreatment,
			Material:         Material,
			JobNumber:        JobNumber,
		}
	}

	response := STRUCTS.Response{
		Status:  "success",
		Message: "Get Quotation List is success",
		Data:    results,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func GetPohd(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	po_no := r.FormValue("po_no")
	id_quotation := r.FormValue("id_quotation")
	fmt.Println(id_quotation)
	var wherePoId, whereIdQuo string

	if po_no != "" {
		wherePoId = ` AND po_no = '` + po_no + `'`
	}

	if id_quotation != "" {
		whereIdQuo = ` AND id_quotation = '` + id_quotation + `'`
	}

	q := `SELECT
			COALESCE(b.order_date::text, '0001-01-01') AS order_date,
			COALESCE(b.due_date::text, '0001-01-01') AS due_date,
			COALESCE(f.customer_name, '-') AS customer_name,
			COALESCE(b.customer_id, '-') AS customer_id,
			COALESCE(b.product_name, '-') AS product_name
		FROM
			sales_lists b
			LEFT JOIN mst_customer f ON b.customer_id = f.customer_id
		WHERE status_order = 'po'
		` + wherePoId + `
		` + whereIdQuo + `
		GROUP BY
    	b.order_date,
    	b.due_date,
   		f.customer_name,
		b.customer_id,
		b.product_name`

	fmt.Println(q)

	rows, err := db.Query(q)
	CONFIG.CheckErr(err)

	results := map[int32]STRUCTS.PoDataHd{}

	var No int32
	for rows.Next() {
		No++

		var (
			OrderDate    sql.NullString
			DueDate      sql.NullString
			CustomerName string
			CustomerId   string
			ProductName  string
		)

		err = rows.Scan(
			&OrderDate,
			&DueDate,
			&CustomerName,
			&CustomerId,
			&ProductName,
		)
		if err != nil {
			panic(err)
		}

		formattedDueDate := "01-01-0001"
		if DueDate.Valid {
			formattedDueDate = DueDate.String
		}
		formattedOrderDate := "01-01-0001"
		if OrderDate.Valid {
			formattedOrderDate = OrderDate.String
		}

		results[No] = STRUCTS.PoDataHd{
			No:           No,
			OrderDate:    formattedOrderDate,
			DueDate:      formattedDueDate,
			CustomerName: CustomerName,
			CustomerId:   CustomerId,
			ProductName:  ProductName,
		}

	}

	response := STRUCTS.Response{
		Status:  "success",
		Message: "Get Quotation List is success",
		Data:    results,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func GenHdSales(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	if err != nil {
		CONFIG.CheckErr(err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	defer db.Close()

	jobNumber := r.FormValue("jobNumber")
	poNo := r.FormValue("poNo")
	idQuo := r.FormValue("idQuo")
	orderDate := r.FormValue("orderDate")

	year := orderDate[:4]
	month := orderDate[5:7]

	table := "sales_lists"
	where := "id_quotation = '" + idQuo + "' AND po_no = '" + poNo + "'"
	set := "job_number = '" + jobNumber + "'"

	update := MODEL.Update(set, where, table)
	if update != nil {
		http.Error(w, "Failed to update database", http.StatusInternalServerError)
		return
	}

	productCountQuery := `SELECT COUNT(product_name) FROM sales_lists WHERE id_quotation = $1`
	fmt.Println("Executing query:", productCountQuery, "with parameter:", idQuo)

	var productCount int
	err = db.QueryRow(productCountQuery, idQuo).Scan(&productCount)
	if err != nil {
		CONFIG.CheckErr(err)
		http.Error(w, "Failed to count products", http.StatusInternalServerError)
		return
	}

	countQuery := `SELECT COUNT(*) FROM sales_lists WHERE TO_CHAR(order_date, 'YYYY-MM') = $1 AND status_order != 'po'`
	fmt.Println("Executing query:", countQuery, "with parameter:", year+"-"+month)

	var currentCount int
	err = db.QueryRow(countQuery, year+"-"+month).Scan(&currentCount)
	if err != nil {
		CONFIG.CheckErr(err)
		http.Error(w, "Failed to count rows", http.StatusInternalServerError)
		return
	}

	if currentCount == 0 {
		currentCount = 1
	} else {
		currentCount++
	}

	tx, err := db.Begin()
	if err != nil {
		CONFIG.CheckErr(err)
		http.Error(w, "Failed to begin transaction", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	getIdsQuery := `SELECT id FROM sales_lists WHERE id_quotation = $1 AND po_no = $2 ORDER BY id LIMIT $3`
	rows, err := tx.Query(getIdsQuery, idQuo, poNo, productCount)
	if err != nil {
		tx.Rollback()
		CONFIG.CheckErr(err)
		http.Error(w, "Failed to retrieve IDs", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var ids []int
	for rows.Next() {
		var id int
		if err := rows.Scan(&id); err != nil {
			tx.Rollback()
			CONFIG.CheckErr(err)
			http.Error(w, "Failed to scan IDs", http.StatusInternalServerError)
			return
		}
		ids = append(ids, id)
	}

	for _, id := range ids {
		newJobNumber := fmt.Sprintf("%s%s%04d", year[3:], month, currentCount)
		currentCount++
		updateQuery := `UPDATE sales_lists SET new_job_number = $1 WHERE id = $2`
		fmt.Println("Executing update query:", updateQuery, "with new job number:", newJobNumber)

		_, err = tx.Exec(updateQuery, newJobNumber, id)
		if err != nil {
			tx.Rollback()
			CONFIG.CheckErr(err)
			http.Error(w, "Failed to update database", http.StatusInternalServerError)
			return
		}
	}

	err = tx.Commit()
	if err != nil {
		CONFIG.CheckErr(err)
		http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
		return
	}

	result := "success"
	logInfo := fmt.Sprintf("Success to generate new job numbers starting from %s and added %d new job numbers. PO No: %s", fmt.Sprintf("%s%s%04d", year[2:], month, currentCount-productCount), productCount, poNo)

	session, _ := CONFIG.Store.Get(r, "cookie-name")
	MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Sales Menu", "Generate new orders", logInfo, result)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

type DrawingIDPayload struct {
	DrawingID   string `json:"drawing_id"`
	ProductName string `json:"product_name"`
	QuoId       string `json:"quo_id"`
}

func GenDrawId(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	if err != nil {
		fmt.Println("Error connecting to the database:", err)
		CONFIG.CheckErr(err)
		http.Error(w, "Failed to connect to the database", http.StatusInternalServerError)
		return
	}
	defer db.Close()
	fmt.Println("Successfully connected to the database")

	var payload []DrawingIDPayload

	err = json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		fmt.Println("Error decoding JSON request body:", err)
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}
	fmt.Println("Successfully decoded JSON request body:", payload)

	tx, err := db.Begin()
	if err != nil {
		fmt.Println("Error beginning transaction:", err)
		CONFIG.CheckErr(err)
		http.Error(w, "Failed to begin transaction", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()
	fmt.Println("Transaction started")

	for _, drawing := range payload {
		updateQuery := fmt.Sprintf(
			"UPDATE sales_lists SET drawing_id = '%s', status_order = 'open' WHERE product_name = '%s' AND id_quotation = '%s'",
			drawing.DrawingID, drawing.ProductName, drawing.QuoId,
		)
		fmt.Println("Prepared update query for sales_lists:", updateQuery)

		_, err = tx.Exec(updateQuery)
		if err != nil {
			fmt.Println("Error executing update query for drawing ID", drawing.DrawingID, ":", err)
			CONFIG.CheckErr(err)
			http.Error(w, "Failed to update sales_lists", http.StatusInternalServerError)
			return
		}
		fmt.Println("Successfully executed update query for drawing ID:", drawing.DrawingID)
	}

	insertQuery := "INSERT INTO sales_lists_drawing (drawing_id) VALUES ($1)"
	fmt.Println("Prepared insert query for sales_list_drawing:", insertQuery)

	for _, drawing := range payload {
		_, err = tx.Exec(insertQuery, drawing.DrawingID)
		if err != nil {
			fmt.Println("Error executing insert query for drawing ID", drawing.DrawingID, ":", err)
			CONFIG.CheckErr(err)
			http.Error(w, "Failed to insert into sales_list_drawing", http.StatusInternalServerError)
			return
		}
		fmt.Println("Successfully executed insert query for drawing ID:", drawing.DrawingID)
	}

	err = tx.Commit()
	if err != nil {
		fmt.Println("Error committing transaction:", err)
		CONFIG.CheckErr(err)
		http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
		return
	}
	fmt.Println("Transaction committed successfully")

	session, _ := CONFIG.Store.Get(r, "cookie-name")
	MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "class Lists", "add class", "Success to add Quotation", "success")
	fmt.Println("Successfully logged the action")

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode("success")
	fmt.Println("Response sent to client: success")
}

func LoadPrintExcel(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	startPeriod := r.FormValue("startPeriod")
	endPeriod := r.FormValue("endPeriod")
	var whereDate string

	if startPeriod != "" && endPeriod != "" {
		whereDate += ` AND d.quotation_date BETWEEN '` + startPeriod + `' AND '` + endPeriod + `'`
	}

	q := `SELECT
		    d.quotation_no,
		    CONCAT('''', b.customer_id) AS customer_id,
		    d.customer_name,
		    f.description,
		    SPLIT_PART(f."size", 'x', 1) AS size_length,
		    SPLIT_PART(f."size", 'x', 2) AS size_wide,
		    f.qty,
		    f.unit_price,
		    f.price,
		    COALESCE(h.process_date, '-') AS process_date,
		    COALESCE(h.description, '-') AS description,
		    COALESCE(h.result, '-') AS result
		 FROM
		    quotation_header d
		    LEFT JOIN mst_customer b ON d.customer_name = b.customer_name
		    LEFT JOIN quotation_detail f ON d.id = f.id_quotation
		    LEFT JOIN mst_noted h ON d.id = h.id
		 WHERE 1=1
		` + whereDate + ``
	fmt.Println(q)

	rows, err := db.Query(q)
	CONFIG.CheckErr(err)
	defer rows.Close()

	var results []STRUCTS.ExcelPrint

	var No int32
	for rows.Next() {
		No++

		var Quotation_name,
			Customer_id,
			Customer_name,
			Description,
			Size_length,
			Size_wide,
			Qty,
			Unit_price,
			Price,
			Process_date,
			Description_result,
			Result sql.NullString

		err = rows.Scan(
			&Quotation_name,
			&Customer_id,
			&Customer_name,
			&Description,
			&Size_length,
			&Size_wide,
			&Qty,
			&Unit_price,
			&Price,
			&Process_date,
			&Description_result,
			&Result,
		)
		if err != nil {
			panic(err)
		}

		results = append(results, STRUCTS.ExcelPrint{
			No:                No,
			QuoName:           Quotation_name.String,
			CustId:            Customer_id.String,
			CustName:          Customer_name.String,
			Desc:              Description.String,
			SizeLength:        Size_length.String,
			SizeWide:          Size_wide.String,
			Qty:               Qty.String,
			UnitPrice:         Unit_price.String,
			Price:             Price.String,
			ProcessDate:       Process_date.String,
			DescriptionResult: Description_result.String,
			Result:            Result.String,
		})
	}

	response := STRUCTS.Response{
		Status:  "success",
		Message: "Get Data Print Excel is success",
		Data:    results,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func UpdateReprocess(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	if err != nil {
		errMsg := fmt.Errorf("failed to connect to database: %v", err)
		CONFIG.CheckErr(errMsg)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	defer db.Close()

	jobNumber := r.FormValue("job_number")
	drawingId := r.FormValue("drawing_id")
	reprocess := r.FormValue("reprocess")
	reprocessBefore := r.FormValue("reprocess_before")
	reprocessRemark := r.FormValue("reprocess_remark")
	reprocessRemarkBefore := r.FormValue("reprocess_remark_before")
	act := r.FormValue("act")

	if act == "update" {
		var lastReprocessNo int
		query := "SELECT COALESCE(reprocess_no, 0) FROM sales_lists WHERE job_number = '" + jobNumber + "' AND drawing_id = '" + drawingId + "' ORDER BY reprocess_no DESC LIMIT 1"
		err := db.QueryRow(query).Scan(&lastReprocessNo)
		if err != nil {
			if err != sql.ErrNoRows {
				errMsg := fmt.Errorf("failed to retrieve last reprocess number: %v", err)
				CONFIG.CheckErr(errMsg)
				http.Error(w, "Failed to retrieve last reprocess number", http.StatusInternalServerError)
				return
			}
			lastReprocessNo = -1
		}

		newReprocessNo := lastReprocessNo + 1

		table := "sales_lists"
		where := "job_number = '" + jobNumber + "' AND drawing_id = '" + drawingId + "'"
		set := "reprocess_no = '" + strconv.Itoa(newReprocessNo) + "', reprocess_remark = '" + reprocessRemark + "', reprocess = '" + reprocess + "'"

		updateErr := MODEL.Update(set, where, table)
		if updateErr != nil {
			errMsg := fmt.Errorf("failed to update sales_lists: %v", updateErr)
			CONFIG.CheckErr(errMsg)
			http.Error(w, "Failed to update database", http.StatusInternalServerError)
			return
		}

		otherTable := "order_process"
		otherWhere := "status_process = 'ongoing' AND job_number = '" + jobNumber + "' AND drawing_id = '" + drawingId + "'"
		otherSet := "status_process = 'reprocess'"
		otherUpdateErr := MODEL.Update(otherSet, otherWhere, otherTable)
		if otherUpdateErr != nil {
			errMsg := fmt.Errorf("failed to update other_table: %v", otherUpdateErr)
			CONFIG.CheckErr(errMsg)
			http.Error(w, "Failed to update status in other table", http.StatusInternalServerError)
			return
		}

		result := "success"
		logInfo := "Success to Reprocess with Job Number : " + jobNumber + ". <br> drawing_id : " + drawingId + " <br>."
		logInfo += "Reprocess Before : " + reprocessBefore + " <br>. Reprocess : " + reprocess + ". <br>"
		logInfo += "Reprocess Number Before : " + strconv.Itoa(lastReprocessNo) + " <br>. Reprocess Number : " + strconv.Itoa(newReprocessNo) + ". <br>"
		logInfo += "Reprocess Remark Before : " + reprocessRemarkBefore + " <br>. Reprocess Remark : " + reprocessRemark + ". <br>"

		session, _ := CONFIG.Store.Get(r, "cookie-name")
		MODEL.Log(session.Values["Username"].(string), session.Values["Name"].(string), "Sales Menu", "Generate order "+jobNumber, logInfo, result)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(result)
	} else {
		result := "no update performed"
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(result)
	}
}

func LoadPrintExcelPo(w http.ResponseWriter, r *http.Request) {
	db, err := CONFIG.Connect_db()
	CONFIG.CheckErr(err)
	defer db.Close()

	startPeriod := r.FormValue("startPeriod")
	endPeriod := r.FormValue("endPeriod")
	var whereDate string

	if startPeriod != "" && endPeriod != "" {
		whereDate += ` AND d.order_date BETWEEN '` + startPeriod + `' AND '` + endPeriod + `'`
	}

	q := `SELECT
		      COALESCE(d.order_date::text, '0001-01-01') AS order_date,
			  CONCAT(d.new_job_number, '-', d.reprocess_no) drawing_id,
			  CONCAT('''', d.customer_id) AS customer_id,
		      COALESCE(b.customer_name, '-') AS customer_name,
		      COALESCE(d.product_name, '-') AS product_name,
		  	  SPLIT_PART(d.product_size, 'x', 1) AS size_length,
			  SPLIT_PART(d.product_size, 'x', 2) AS size_wide,
		      COALESCE(d.qty, 0) AS qty,
		      COALESCE(d.price, 0) AS price,
		      COALESCE(d.qty * d.price, 0) AS total_price,
		      COALESCE(d.due_date::text, '0001-01-01') AS due_date,
		  	  COALESCE(d.product_type, '-') AS product_type,
		      COALESCE(d.po_no, '-') AS po_no
		  FROM
		      sales_lists d
		      LEFT JOIN mst_customer b ON d.customer_id = b.customer_id
		  WHERE 1=1
		  ` + whereDate + `
		  Order By d.new_job_number ASC`
	fmt.Println(q)

	rows, err := db.Query(q)
	CONFIG.CheckErr(err)
	defer rows.Close()

	var results []STRUCTS.ExcelPrintPo

	var No int32
	for rows.Next() {
		No++

		var OrderDate sql.NullString
		var JobNumber string
		var CustId string
		var CustName string
		var ProductName string
		var Size_length string
		var Size_wide string
		var Qty string
		var Price string
		var TtlPrice string
		var DueDate sql.NullString
		var ProductType string
		var PoNo string

		err = rows.Scan(
			&OrderDate,
			&JobNumber,
			&CustId,
			&CustName,
			&ProductName,
			&Size_length,
			&Size_wide,
			&Qty,
			&Price,
			&TtlPrice,
			&DueDate,
			&ProductType,
			&PoNo,
		)
		if err != nil {
			panic(err)
		}

		formattedDueDate := "01-01-0001"
		if DueDate.Valid {
			formattedDueDate = DueDate.String
		}
		formattedOrderDate := "01-01-0001"
		if OrderDate.Valid {
			formattedOrderDate = OrderDate.String
		}

		results = append(results, STRUCTS.ExcelPrintPo{
			No:          No,
			OrderDate:   formattedOrderDate,
			JobNumber:   JobNumber,
			CustId:      CustId,
			CustName:    CustName,
			ProductName: ProductName,
			Size_length: Size_length,
			Size_wide:   Size_wide,
			Qty:         Qty,
			Price:       Price,
			TtlPrice:    TtlPrice,
			DueDate:     formattedDueDate,
			ProductType: ProductType,
			PoNo:        PoNo,
		})
	}

	response := STRUCTS.Response{
		Status:  "success",
		Message: "Get Data Print Excel is success",
		Data:    results,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
