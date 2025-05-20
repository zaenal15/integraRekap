package structs

type Map map[string]interface{}
type Response struct {
	Status  string      `json:"status"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

type SettingLists struct {
	Timer_session     int32  `json:"timer_session"`
	Countdown_session int32  `json:"countdown_session"`
	Default_password  string `json:"default_password"`
	Running_text      string `json:"running_text"`
}
type UserSettingLists struct {
	Username            string `json:"username"`
	Selected_slideshow  string `json:"selected_slideshow"`
	Selected_theme      string `json:"selected_theme"`
	Selected_sidebar    string `json:"selected_sidebar"`
	Selected_type_chart string `json:"selected_type_chart"`
}

type Group_Position struct {
	Position_id     string
	Position_name   string
	Position_status string
}
type User_info struct {
	Id               int
	Name             string
	Username         string
	Email            string
	Password         string
	User_status      string
	Group_position   string
	Branch_code      string
	Position_name    string
	Branch_name      string
	Failed_attempts  int
	Last_login       string
	Last_failed_pass string
}

type Menu_level struct {
	Id                    int
	UserGroup             string
	MenuId                string
	View                  string
	Insert                string
	Update                string
	Delete                string
	Approve               string
	Print                 string
	Upload                string
	Reason                string
	Auth                  string
	Allow_view_for_all    string
	Allow_update_for_all  string
	Allow_delete_for_all  string
	Allow_approve_for_all string
	Position_name         string
	Menu_name             string
	Menu_type             string
}

type Menu struct {
	Id     int8   `json:"id"`
	Order  int8   `json:"order"`
	Code   string `json:"code"`
	Name   string `json:"name"`
	Icon   string `json:"icon"`
	Status bool   `json:"status"`
	Parent int8   `json:"parent"`
	Type   string `json:"type"`
}

type Province struct {
	No            int32  `json:"no"`
	Province_id   string `json:"province_id"`
	Province_name string `json:"province_name"`
	Icon          string `json:"icon"`
}
type Category struct {
	No             int32  `json:"no"`
	Category_id    string `json:"category_id"`
	Category_name  string `json:"category_name"`
	Type_file      string `json:"type_file"`
	Icon           string `json:"icon"`
	Last_update    string `json:"last_update"`
	Last_update_by string `json:"last_update_by"`
}
type Material struct {
	No       int32  `json:"no"`
	Material string `json:"material"`
}
type Customer struct {
	No               int32  `json:"no"`
	Customer_id      string `json:"customer_id"`
	Customer_name    string `json:"customer_name"`
	Customer_type    string `json:"customer_type"`
	Customer_alias   string `json:"customer_alias"`
	Country_code     string `json:"country_code"`
	Country_name     string `json:"country_name"`
	Customer_address string `json:"customer_address"`
	Customer_npwp    string `json:"customer_npwp"`
	Customer_npwp16  string `json:"customer_npwp16"`
	Customer_telp    string `json:"customer_telp"`
	Customer_fax     string `json:"customer_fax"`
	Customer_website string `json:"customer_website"`
	Customer_att     string `json:"customer_att"`
	Customer_email   string `json:"customer_email"`
}
type Country struct {
	No                  int32  `json:"no"`
	Country_code        string `json:"country_code"`
	Country_name        string `json:"country_name"`
	Country_curr        string `json:"country_curr"`
	Country_curr_symbol string `json:"country_curr_symbol"`
	Country_curr_name   string `json:"country_curr_name"`
	Customer_address    string `json:"customer_address"`
	Customer_npwp       string `json:"customer_npwp"`
	Customer_npwp16     string `json:"customer_npwp16"`
	Customer_telp       string `json:"customer_telp"`
	Customer_website    string `json:"customer_website"`
}
type Kurs struct {
	No                  int32   `json:"no"`
	Id                  int32   `json:"id"`
	Kurs                string  `json:"kurs"`
	Kurs_before         float32 `json:"kurs_before"`
	Kurs_after          float32 `json:"kurs_after"`
	Kurs_update         string  `json:"kurs_update"`
	Kurs_update_by      string  `json:"kurs_update_by"`
	Country_name        string  `json:"country_name"`
	Country_curr        string  `json:"country_curr"`
	Country_curr_symbol string  `json:"country_curr_symbol"`
	Country_curr_name   string  `json:"country_curr_name"`
}
type SalesListsShort struct {
	No             int32  `json:"no"`
	Id             int32  `json:"id"`
	View           string `json:"view"`
	Status_order   string `json:"status_order"`
	Customer_alias string `json:"customer_alias"`
	Job_number     string `json:"job_number"`
	Drawing_id     string `json:"drawing_id"`
	New_job_number string `json:"new_job_number"`
	Reprocess_id   string `json:"reprocess_id"`
	Qty            int32  `json:"qty"`
	Order_date     string `json:"order_date"`
	Due_date       string `json:"due_date"`
	Delivery_date  string `json:"delivery_date"`
	Customer_name  string `json:"customer_name"`
	Po_no          string `json:"po_no"`
	Product_name   string `json:"product_name"`
	Drawing_count  string `json:"drawing_count"`
	Product_size   string `json:"product_size"`
}

type OrderProcessSelect struct {
	No               int32  `json:"no"`
	Id               int32  `json:"id"`
	Status_process   string `json:"status_process"`
	Customer_alias   string `json:"customer_alias"`
	Reprocess_id     string `json:"reprocess_id"`
	Process_id       string `json:"process_id"`
	Process_alias    string `json:"process_alias"`
	Qty              int32  `json:"qty"`
	Target_date      string `json:"target_date"`
	Due_date_order   string `json:"due_date_order"`
	Leftover_process string `json:"leftover_process"`
	Job_number       string `json:"job_number"`
	Drawing_id       string `json:"drawing_id"`
	New_job_number   string `json:"new_job_number"`
	Qty_process      int32  `json:"qty_process"`
	Status_order     string `json:"status_order"`
}

type SalesLists struct {
	No                int32   `json:"no"`
	Id                int32   `json:"id"`
	View              string  `json:"view"`
	Status_order      string  `json:"status_order"`
	Customer_alias    string  `json:"customer_alias"`
	Job_number        string  `json:"job_number"`
	Drawing_id        string  `json:"drawing_id"`
	New_job_number    string  `json:"new_job_number"`
	Reprocess_id      string  `json:"reprocess_id"`
	Qty               int32   `json:"qty"`
	Order_date        string  `json:"order_date"`
	Due_date          string  `json:"due_date"`
	Delivery_date     string  `json:"delivery_date"`
	Customer_id       string  `json:"customer_id"`
	Customer_name     string  `json:"customer_name"`
	Po_no             string  `json:"po_no"`
	Product_name      string  `json:"product_name"`
	Price             float64 `json:"price"`
	Amount            float64 `json:"amount"`
	Product_type      string  `json:"product_type"`
	Product_type_name string  `json:"product_type_name"`
	Product_size      string  `json:"product_size"`
	Treatment         string  `json:"treatment"`
	Special_treatment string  `json:"special_treatment"`
	Material          string  `json:"material"`
	Spec              string  `json:"spec"`
	Drawing_count     int32   `json:"drawing_count"`
	Drawing_image     string  `json:"drawing_image"`
	Reprocess_no      int32   `json:"reprocess_no"`
	Reprocess_remark  string  `json:"reprocess_remark"`
	Reprocess         string  `json:"reprocess"`
}

type ProductList struct {
	No             int32  `json:"no"`
	Id             int32  `json:"id"`
	View           string `json:"view"`
	Job_number     string `json:"job_number"`
	New_job_number string `json:"new_job_number"`
	Reprocess_id   string `json:"reprocess_id"`
	Due_date       string `json:"due_date"`
	Product_name   string `json:"product_name"`
	Qty            int32  `json:"qty"`
	Status_order   string `json:"status_order"`
	Drawing_id     string `json:"drawing_id"`
	Customer_alias string `json:"customer_alias"`
}
type SalesReportOverview struct {
	No                          int32   `json:"no"`
	Total_month_sales           float64 `json:"total_month_sales"`
	Leftover_month_sales        float64 `json:"leftover_month_sales"`
	Total_period_sales          float64 `json:"total_period_sales"`
	Leftover_accumulative_sales float64 `json:"leftover_accumulative_sales"`
	CN                          float64 `json:"CN"`
	ID                          float64 `json:"ID"`
	JP                          float64 `json:"JP"`
	KR                          float64 `json:"KR"`
	ML                          float64 `json:"ML"`
	MX                          float64 `json:"MX"`
	TH                          float64 `json:"TH"`
}
type ProcessAggregation struct {
	No             int32  `json:"no"`
	Period_date    string `json:"period_date"`
	Process_id     string `json:"process_id"`
	Total_quantity int32  `json:"qty"`
	Total_product  int32  `json:"drawing"`
}
type SalesReportDetail struct {
	No             int32   `json:"no"`
	Period_date    string  `json:"period_date"`
	Country_code   string  `json:"country_code"`
	Total_sales    float64 `json:"order"`
	Total_quantity int32   `json:"qty"`
	Total_product  int32   `json:"drawing"`
}
type OrderProcess struct {
	No                int32   `json:"no"`
	Id                int32   `json:"id"`
	Job_number        string  `json:"job_number"`
	Drawing_id        string  `json:"drawing_id"`
	New_job_number    string  `json:"new_job_number"`
	Reprocess_id      string  `json:"reprocess_id"`
	Process_id        string  `json:"process_id"`
	Target_date       string  `json:"target_date"`
	Act_date          string  `json:"act_date"`
	Status_process    string  `json:"status_process"`
	Remark            string  `json:"remark"`
	Order_process     int32   `json:"order_process"`
	Scan_by           string  `json:"scan_by"`
	Process_name      string  `json:"process_name"`
	Process_alias     string  `json:"process_alias"`
	Order_date        string  `json:"order_date"`
	Delivery_date     string  `json:"delivery_date"`
	Due_date_order    string  `json:"due_date_order"`
	Customer_id       string  `json:"customer_id"`
	Product_name      string  `json:"product_name"`
	Product_type      string  `json:"product_type"`
	Product_type_name string  `json:"product_type_name"`
	Product_size      string  `json:"product_size"`
	Po_no             string  `json:"po_no"`
	Qty               int32   `json:"qty"`
	Price             float64 `json:"price"`
	Amount            float64 `json:"amount"`
	Spec              string  `json:"spec"`
	Status_order      string  `json:"status_order"`
	Treatment         string  `json:"treatment"`
	Special_treatment string  `json:"special_treatment"`
	Material          string  `json:"material"`
	Drawing_image     string  `json:"drawing_image"`
	Customer_name     string  `json:"customer_name"`
	Customer_alias    string  `json:"customer_alias"`
	Qty_process       int32   `json:"qty_process"`
	Block             string  `json:"block"`
	Print             string  `json:"print"`
	Reprocess_no      int32   `json:"reprocess_no"`
	Drawing_count     int32   `json:"drawing_count"`
	Leftover_process  string  `json:"leftover_process"`
}
type ProcessLists struct {
	Id          string `json:"id"`
	Job_number  string `json:"job_number"`
	Drawing_id  string `json:"drawing_id"`
	Order       string `json:"order"`
	Status      string `json:"status"`
	Process     string `json:"process"`
	Target_date string `json:"target_date"`
	Qty_process string `json:"qty_process"`
}
type CheckboxData struct {
	ValueDrawing string `json:"valueDrawing"`
	ValueProcess string `json:"valueProcess"`
	ValueOrder   string `json:"valueOrder"`
	IsChecked    bool   `json:"isChecked"`
}
type Process struct {
	No            int32  `json:"no"`
	Process_id    string `json:"process_id"`
	Process_name  string `json:"process_name"`
	Process_alias string `json:"process_alias"`
}
type ProductTypes struct {
	Product_type      string `json:"product_type"`
	Product_type_name string `json:"product_type_name"`
}
type Machine struct {
	No           int32  `json:"no"`
	Machine_id   string `json:"machine_id"`
	Machine_name string `json:"machine_name"`
	Prod_plan    int64  `json:"prod_plan"`
	Ratio_good   int64  `json:"ratio_good"`
	Ratio_reject int64  `json:"ratio_reject"`
	Icon         string `json:"icon"`
}

type Floor struct {
	No            int32  `json:"no"`
	Floor_id      string `json:"floor_id"`
	Floor_name    string `json:"floor_name"`
	Building_id   string `json:"building_id"`
	Building_name string `json:"building_name"`
}
type Room struct {
	No            int32  `json:"no"`
	Room_id       string `json:"room_id"`
	Room_name     string `json:"room_name"`
	Floor_id      string `json:"floor_id"`
	Show          string `json:"show"`
	Floor_name    string `json:"floor_name"`
	Building_id   string `json:"building_id"`
	Building_name string `json:"building_name"`
}
type LogsInOut struct {
	No          int32  `json:"no"`
	Log_id      string `json:"log_id"`
	Room_id     string `json:"room_id"`
	Room_name   string `json:"room_name"`
	Floor_id    string `json:"floor_id"`
	Floor_name  string `json:"floor_name"`
	Id_no       string `json:"id_no"`
	Username    string `json:"username"`
	Name        string `json:"name"`
	Datetime    string `json:"datetime"`
	Desc_code   string `json:"desc_code"`
	Description string `json:"description"`
}
type CCTV struct {
	No        int32  `json:"no"`
	Cctv_id   string `json:"cctv_id"`
	Cctv_name string `json:"cctv_name"`
	Cctv_link string `json:"cctv_link"`
	Room_id   string `json:"room_id"`
	Nvr_id    string `json:"nvr_id"`
	Room_name string `json:"room_name"`
	Nvr_name  string `json:"nvr_name"`
}
type LogProdPlan struct {
	No           int32  `json:"no"`
	Machine_id   string `json:"machine_id"`
	Date_prod    string `json:"date_prod"`
	Prod_plan    int64  `json:"prod_plan"`
	Ratio_good   int64  `json:"ratio_good"`
	Ratio_reject int64  `json:"ratio_reject"`
}

type LogTrail struct {
	No            int32  `json:"no"`
	Log_id        string `json:"log_id"`
	Log_date      string `json:"log_date"`
	Log_time      string `json:"log_time"`
	Username      string `json:"username"`
	Name          string `json:"name"`
	Position_id   string `json:"position_id"`
	Position_name string `json:"position_name"`
	Menu          string `json:"menu"`
	Activity      string `json:"activity"`
	Activity_desc string `json:"activity_desc"`
	Info          string `json:"info"`
}
type trxProcess struct {
	No_management int32  `json:"no_management"`
	No_process    string `json:"no_process"`
	Name_process  string `json:"name_process"`
	Amount_job    string `json:"amount_job"`
	Startdate     string `json:"start_date"`
	Duedate       string `json:"due_date"`
	Customer      string `json:"customer"`
	Rest_process  string `json:"rest_process"`
	Status        string `json:"status"`
}
type Quotation struct {
	No               int32             `json:"no"`
	Quotation_No     string            `json:"quotation_no"`
	Customer_Id      string            `json:"customer_id"`
	Quotation_Name   string            `json:"quotation_name"`
	Quotation_Date   string            `json:"quotation_date"`
	Quotation_Due    string            `json:"quotation_due"`
	Quotation_Rev    string            `json:"quotation_rev"`
	Customer_Name    string            `json:"customer_name"`
	Customer_Telp    string            `json:"customer_telp"`
	Customer_Fax     string            `json:"customer_fax"`
	Quo_noted        string            `json:"quo_noted"`
	Quo_Up           string            `json:"quo_up"`
	Quo_Cc           string            `json:"quo_cc"`
	Quo_Approv       string            `json:"quo_approv"`
	Quo_Approv_Pos   string            `json:"quo_approv_pos"`
	Quo_Check        string            `json:"quo_check"`
	Quo_Check_Pos    string            `json:"quo_check_pos"`
	Quo_Made         string            `json:"quo_made"`
	Quo_Made_Pos     string            `json:"quo_made_pos"`
	Quo_pph          string            `json:"quo_pph"`
	Quo_ppn          string            `json:"quo_ppn"`
	Quo_Sub_Tll      string            `json:"quo_sub_tll"`
	Quo_pph_value    string            `json:"quo_pph_value"`
	Quo_ppn_value    string            `json:"quo_ppn_value"`
	Quo_Ttl          string            `json:"quo_ttl"`
	Quo_kurs         string            `json:"quo_kurs"`
	Quo_kurs_rate    float64           `json:"quo_kurs_rate"`
	Quo_title        string            `json:"quo_title"`
	Quo_estimate     string            `json:"quo_estimate"`
	Quo_email        string            `json:"quo_email"`
	Quo_discount     float64           `json:"quo_discount"`
	Quo_discount_ttl float64           `json:"quo_discount_ttl"`
	Details          []QuotationDetail `json:"details"` // Add this field
}

type QuotationTable struct {
	No             int32   `json:"no"`
	Action         string  `json:"action"`
	Customer_Id    string  `json:"customer_id"`
	Customer_Name  string  `json:"customer_name"`
	Quotation_Date string  `json:"quo_date"`
	Quotation_Due  string  `json:"quo_due_date"`
	Quotation_Id   int32   `json:"quo_id"`
	Quotation_No   string  `json:"quo_no"`
	Quotation_Name string  `json:"quo_name"`
	Revision       string  `json:"revision"`
	Status         string  `json:"status"`
	Total          string  `json:"total"`
	Total_kurs     string  `json:"total_kurs"`
	Kurs           string  `json:"kurs"`
	Kurs_rate      float32 `json:"kurs_rate"`
	Total_Price    string  `json:"total_price"`
}

type QuotationDetail struct {
	No           int32   `json:"no"`
	Description  string  `json:"description"`
	Size         string  `json:"size"`
	Qty          string  `json:"qty"`
	Material     string  `json:"material"`
	Unit_price   string  `json:"unit_price"`
	Price        string  `json:"price"`
	Quotation_no string  `json:"quotation_no"`
	Status       string  `json:"status"`
	Kurs         string  `json:"kurs"`
	Kurs_rate    float32 `json:"kurs_rate"`
}

type SalesOrder struct {
	No           int32  `json:"no"`
	Action       string `json:"action"`
	View         string `json:"view"`
	JobNumber    string `json:"job_number"`
	OrderDate    string `json:"order_date"`
	DeliveryDate string `json:"delivery_date"`
	DueDate      string `json:"due_date"`
	Customer     string `json:"customer"`
	QuoNo        string `json:"quo_no"`
	PoNo         string `json:"po_no"`
}

type OrderDetail struct {
	No               int32  `json:"no"`
	ProductName      string `json:"product_name"`
	ProductType      string `json:"product_type"`
	ProductSize      string `json:"product_size"`
	Qty              string `json:"qty"`
	Price            string `json:"price"`
	Spec             string `json:"spec"`
	Treatment        string `json:"treatment"`
	SpecialTreatment string `json:"special_treatment"`
	Material         string `json:"material"`
	JobNumber        string `json:"job_number"`
}

type Count struct {
	CountSumAll          float64 `json:"count_sum"`
	CountRemainingAmount float64 `json:"count_remaining"`
	CountAmountPo        float64 `json:"count_amount"`
}
type SalesList struct {
	PoNo         string `json:"po_no"`
	IdQuotation  string `json:"id_quotation"`
	CustomerId   string `json:"customer_id"`
	CustomerName string `json:"customer_name"`
	OrderDate    string `json:"order_date"`
	DueDate      string `json:"due_date"`
}
type PoData struct {
	No           int32  `json:"no"`
	JobNumber    string `json:"job_number"`
	OrderDate    string `json:"order_date"`
	DeliveryDate string `json:"delivery_date"`
	DueDate      string `json:"due_date"`
	CustomerName string `json:"customer_name"`
	ProductName  string `json:"product_name"`
	ProductType  string `json:"product_type"`
	ProductSize  string `json:"product_size"`
	PoNo         string `json:"po_no"`
	Qty          string `json:"qty"`
	Price        string `json:"price"`
	Spec         string `json:"spec"`
	StatOrder    string `json:"status_order"`
	Drawingid    string `json:"drawing_id"`
	DrawingImag  string `json:"drawing_image"`
	Treatment    string `json:"treatment"`
	SpecTreat    string `json:"special_treatment"`
	Material     string `json:"material"`
	QuoNo        string `json:"quotation_no"`
	QuoId        string `json:"id_quotation"`
}

type PoDataHd struct {
	No           int32  `json:"no"`
	OrderDate    string `json:"order_date"`
	DueDate      string `json:"due_date"`
	CustomerName string `json:"customer_name"`
	CustomerId   string `json:"customer_id"`
	ProductName  string `json:"product_name"`
}

type ExcelPrint struct {
	No                int32  `json:"no"`
	QuoName           string `json:"quotation_name"`
	CustId            string `json:"customer_id"`
	CustName          string `json:"customer_name"`
	Desc              string `json:"description"`
	SizeLength        string `json:"size_length"`
	SizeWide          string `json:"size_wide"`
	Qty               string `json:"qty"`
	UnitPrice         string `json:"unit_price"`
	Price             string `json:"price"`
	ProcessDate       string `json:"process_date"`
	DescriptionResult string `json:"description_result"`
	Result            string `json:"result"`
}

type ExcelPrintPo struct {
	No          int32  `json:"no"`
	OrderDate   string `json:"order_date"`
	JobNumber   string `json:"job_number"`
	CustId      string `json:"customer_id"`
	CustName    string `json:"customer_name"`
	ProductName string `json:"product_name"`
	Size_length string `json:"size_length"`
	Size_wide   string `json:"size_wide"`
	Qty         string `json:"qty"`
	Price       string `json:"price"`
	TtlPrice    string `json:"tll_price"`
	DueDate     string `json:"due_date"`
	ProductType string `json:"product_type"`
	PoNo        string `json:"po_no"`
}

type Peserta struct {
	No            int32  `json:"no"`
	Id            string `json:"id"`
	NoPeserta     string `json:"no_peserta"`
	Regu          string `json:"regu"`
	PangkalanId   string `json:"pangkalan_id"`
	NamaPangkalan string `json:"nama_pangkalan"`
	NamaLomba     string `json:"nama_lomba"`
	LombaId       int32  `json:"lomba_id"`
}

type MataLombaData struct {
	NamaLomba string `json:"nama_lomba"`
	LombaId   int32  `json:"lomba_id"`
}

// PesertaData struct now has MataLomba as a slice of MataLombaData
type PesertaData struct {
	Id             int32           `json:"id"`
	No             int32           `json:"no"`
	NoPeserta      string          `json:"no_peserta"`
	Regu           string          `json:"regu"`
	JenisRegu      string          `json:"jenis_regu"`
	TingkatPeserta string          `json:"tingkat_peserta"`
	PangkalanId    int32           `json:"pangkalan_id"`
	NamaPangkalan  string          `json:"nama_pangkalan"`
	NoWa           string          `json:"no_wa"`
	MataLomba      []MataLombaData `json:"mata_lomba"` // <== ubah tag json ke lowercase
}

type Pangkalan struct {
	No            int32  `json:"no"`
	Id            int32  `json:"id"`
	NamaPangkalan string `json:"nama_pangkalan"`
}

type MataLomba struct {
	No           int32  `json:"no"`
	LombaId      int32  `json:"lomba_id"`
	NamaLomba    string `json:"nama_lomba"`
	JumlahJuri   int32  `json:"jumlah_juri"`
	KategoriId   int32  `json:"kategori_id"`
	NamaKategori string `json:"nama_kategori"`
}

type KategoriLomba struct {
	No           int32  `json:"no"`
	KategoriId   int32  `json:"kategori_id"`
	NamaKategori string `json:"nama_kategori"`
}

type ReportNilai struct {
	Kategori      string             `json:"kategori"`
	NoPeserta     string             `json:"no_peserta"`
	NamaPangkalan string             `json:"nama_pangkalan"`
	Regu          string             `json:"regu"`
	Lomba         map[string]float64 `json:"lomba"` // This map will dynamically store lomba names and scores
}

type Lomba struct {
	LombaID    int    `json:"lomba_id"`
	NamaLomba  string `json:"nama_lomba"`
	KategoriID int    `json:"kategori_id"`
}

// Struct for Kategori (Category) with its lomba list
type Kategori struct {
	Nama  string  `json:"nama"`
	Lomba []Lomba `json:"lomba"`
}

type NilaiLomba struct {
	NilaiLombaId int     `json:"nilai_lomba_id"`
	NoPeserta    string  `json:"no_peserta"`
	LombaID      int     `json:"lomba_id"`
	KategoriId   int     `json:"kategori_id"`
	Nilai        float64 `json:"nilai"` // Ubah tipe data menjadi float64
}

type SubPoint struct {
	NamaLomba            string `json:"nama_lomba"`
	NamaKategori         string `json:"nama_kategori"`
	KategoriSubPointId   int    `json:"kategori_sub_point_id"`
	NamaKategoriSubPoint string `json:"nama_kategori_sub_point"`
	NamaSubPoint         string `json:"nama_sub_point"`
}

// Struktur untuk kategori penilaian
type KategoriPenilaian struct {
	NamaLomba    string `json:"nama_lomba"`
	NamaKategori string `json:"nama_kategori"`
	SetNilai     string `json:"set_nilai"`
	NilaiUmum    string `json:"nilai_umum"`
	NilaiBanding string `json:"nilai_banding"` // << TAMBAHAN ini
	KategoriID   int    `json:"kategori_id"`
}

type KategoriPenilaianAll struct {
	NamaLomba    string `json:"nama_lomba"`
	NamaKategori string `json:"nama_kategori"`
	SetNilai     string `json:"set_nilai"`
	NilaiBanding string `json:"nilai_banding"` // Menambahkan nilai_banding
	KategoriID   int    `json:"kategori_id"`
	LombaID      int    `json:"lomba_id"`
}

type SubPointList struct {
	NamaSubPoint         string `json:"nama_sub_point"`
	NamaKategoriSubPoint string `json:"nama_kategori_sub_point"`
	KategoriId           int    `json:"kategori_id"`
	NamaKategori         string `json:"nama_kategori"`
	NamaLomba            string `json:"nama_lomba"`
	KategoriSubPointId   int    `json:"kategori_sub_point_id"`
	SubPointId           int    `json:"sub_point_id"`
	LombaId              int    `json:"lomba_id"`
}

type NilaiJuri struct {
	ID                  int     `json:"id"`
	NoPeserta           string  `json:"no_peserta"`
	NamaJuri            string  `json:"nama_juri"`
	IDNilaiJuri         int     `json:"id_nilai_juri"`
	SubPointID          int     `json:"sub_point_id"`
	LombaID             int     `json:"lomba_id"`
	KategoriSubPointID  int     `json:"kategori_sub_point_id"`
	KategoriPenilaianID int     `json:"kategori_penilaian_id"`
	NilaiJuri           float64 `json:"nilai_juri"`
}

// KategoriPenguranganPoint adalah struktur data untuk kategori pengurangan point.
type KategoriPenguranganPoint struct {
	KriteriaPointPengurangan string `json:"kriteria_point_pengurangan"` // Nama kategori pengurangan point
	ID                       int    `json:"id"`                         // ID dari kategori pengurangan point
	KategoriID               int    `json:"kategori_id"`                // ID kategori
	NamaKategori             string `json:"nama_kategori"`              // Nama kategori dari mst_kategori_penilaian
	LombaID                  int    `json:"lomba_id"`                   // Lomba ID dari mst_kategori_penilaian
}

type PointPenguranganPeserta struct {
	ID               int     `json:"id"`
	NoPeserta        string  `json:"no_peserta"`
	KategoriID       string  `json:"kategori_id"`
	LombaID          int     `json:"lomba_id"`
	KriteriaPointID  int     `json:"kriteria_point_id"`
	PointPengurangan float64 `json:"point_pengurangan"`
}

type NilaiRekap struct {
	NoPeserta           string  `json:"no_peserta"`
	LombaID             string  `json:"lomba_id"`
	KategoriPenilaianID int     `json:"kategori_penilaian_id"`
	NamaKategori        string  `json:"nama_kategori"`
	SetNilai            string  `json:"set_nilai"`
	NilaiBanding        string  `json:"nilai_banding"` // New field
	TotalNilaiJuri      float64 `json:"total_nilai_juri"`
}

type KategoriJuara struct {
	ID            int    `json:"id"`
	KategoriJuara string `json:"kategori_juara"`
	TotalJuara    int    `json:"total_juara"`
}

type KategoriPenilaianJuara struct {
	KategoriJuaraID       string `json:"kategori_juara_id"`
	KategoriJuara         string `json:"kategori_juara"`
	NamaKategoriPenilaian string `json:"nama_kategori_penilaian"`
	TotalJuara            *int   `json:"total_juara"` // Pointer to handle possible NULL values in the database
	KategoriPenilaianID   string `json:"kategori_penilaian_id"`
	LombaID               string `json:"lomba_id"`
	NamaLomba             string `json:"nama_lomba"`
}

type TokenPeserta struct {
	Id            int32  `json:"id"`
	No            int32  `json:"no"`
	NoPeserta     string `json:"no_peserta"`
	Token         string `json:"token"`
	NoWa          string `json:"no_wa"`
	NamaPangkalan string `json:"nama_pangkalan"`
}

type RekapBandingKategoriJuara struct {
	ID                  int    `json:"id"` // <-- id primary key
	KategoriJuaraID     int    `json:"kategori_juara_id"`
	KategoriJuara       string `json:"kategori_juara"`
	ValueBanding        int    `json:"value_banding"`
	RakapBanding        string `json:"rakap_banding"`
	SetValueBanding     bool   `json:"set_value_banding"`
	TipePenilaianLomba  string `json:"tipe_penilaian_lomba"`
	AkumulasiRekapNilai string `json:"akumulasi_rekap_nilai"`
}

type FotoPenilaian struct {
	ID         int    `json:"id"`
	NoPeserta  string `json:"no_peserta"`
	LombaID    string `json:"lomba_id"`
	FilePath   string `json:"file_path"`
	UploadedAt string `json:"uploaded_at"`
}
