package main

import (
	CONFIG "erekap/config"
	INDEX "erekap/module/index"
	MASTER "erekap/module/master"
	REKAP "erekap/module/rekap"
	USER "erekap/module/user"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

func main() {
	r := mux.NewRouter()

	// Serve HTML & CSS from /views/
	r.PathPrefix("/views/").Handler(http.StripPrefix("/views/", http.FileServer(http.Dir("views"))))

	// Serve JS from /obfuscated_views/ (only file access)
	r.PathPrefix("/obfuscated_views/").HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := filepath.Join("obfuscated_views", r.URL.Path[len("/obfuscated_views/"):])
		fi, err := os.Stat(path)
		if err != nil {
			http.NotFound(w, r)
			return
		}
		if fi.IsDir() {
			http.Error(w, "403 Forbidden - Directory access is not allowed", http.StatusForbidden)
			return
		}
		http.StripPrefix("/obfuscated_views/", http.FileServer(http.Dir("obfuscated_views"))).ServeHTTP(w, r)
	})

	// Secure /assets/ - Allow only files, block directory listing
	r.PathPrefix("/assets/").HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := filepath.Join("assets", r.URL.Path[len("/assets/"):])
		fi, err := os.Stat(path)
		if err != nil {
			http.NotFound(w, r)
			return
		}
		if fi.IsDir() {
			http.Error(w, "403 Forbidden - Directory access is not allowed", http.StatusForbidden)
			return
		}
		http.StripPrefix("/assets/", http.FileServer(http.Dir("assets"))).ServeHTTP(w, r)
	})

	// Serve /file/ normally
	r.PathPrefix("/file/").Handler(http.StripPrefix("/file/", http.FileServer(http.Dir("file"))))

	// Connect DB
	db, err := CONFIG.Connect_db()
	if err != nil {
		panic(err)
	}
	defer db.Close()

	// ===================== ROUTES =====================

	// INDEX
	r.HandleFunc("/", INDEX.Login)
	r.HandleFunc("/erekap", INDEX.Index)
	r.HandleFunc("/checkLogin", INDEX.CheckLogin)
	r.HandleFunc("/getMenus", INDEX.GetMenus)
	r.HandleFunc("/logout", INDEX.Logout)

	// USER
	r.HandleFunc("/checkUsername", USER.CheckUsername)
	r.HandleFunc("/loadUserMenu", USER.LoadUserMenu)
	r.HandleFunc("/loadUserLists", USER.LoadUserLists)
	r.HandleFunc("/loadGroupPositon", USER.LoadGroupPositon)
	r.HandleFunc("/deleteUser", USER.DeleteUser)
	r.HandleFunc("/updateUser", USER.UpdateUser)
	r.HandleFunc("/addUser", USER.AddUser)
	r.HandleFunc("/addGroup", USER.AddGroup)
	r.HandleFunc("/deleteGroup", USER.DeleteGroup)
	r.HandleFunc("/renameGroup", USER.RenameGroup)
	r.HandleFunc("/checkPass", USER.CheckPass)
	r.HandleFunc("/changePass", USER.ChangePass)
	r.HandleFunc("/updateMenuLevel", USER.UpdateMenuLevel)
	r.HandleFunc("/updateDefaultSlideshow", USER.UpdateDefaultSlideshow)
	r.HandleFunc("/updateUserSetting", USER.UpdateUserSetting)
	r.HandleFunc("/loadUserSettings", USER.LoadUserSettings)

	// MASTER
	r.HandleFunc("/loadPeserta", MASTER.LoadPeserta)
	r.HandleFunc("/loadPesertaList", MASTER.LoadPesertaList)
	r.HandleFunc("/updatePeserta", MASTER.UpdatePeserta)
	r.HandleFunc("/deletePeserta", MASTER.DeletePeserta)
	r.HandleFunc("/loadPangkalan", MASTER.LoadPangkalan)
	r.HandleFunc("/updatePangkalan", MASTER.UpdatePangkalan)
	r.HandleFunc("/deletePangkalan", MASTER.DeletePangkalan)
	r.HandleFunc("/loadLomba", MASTER.LoadLomba)
	r.HandleFunc("/loadKategoriLomba", MASTER.LoadKategoriLomba)
	r.HandleFunc("/updateLomba", MASTER.UpdateLomba)
	r.HandleFunc("/deleteLomba", MASTER.DeleteLomba)
	r.HandleFunc("/updateKategori", MASTER.UpdateKategori)
	r.HandleFunc("/deleteKategori", MASTER.DeleteKategori)
	r.HandleFunc("/loadLombaKategori", MASTER.LoadLombaKategori)
	r.HandleFunc("/loadSubPoint", MASTER.LoadSubPoint)
	r.HandleFunc("/loadKategoriPenilaian", MASTER.LoadKategoriPenilaian)
	r.HandleFunc("/loadKategoriPenilaianAll", MASTER.LoadKategoriPenilaianAll)
	r.HandleFunc("/updateKategoriPenilaian", MASTER.UpdateKategoriPenilaian)
	r.HandleFunc("/deleteKategoriPenilaian", MASTER.DeleteKategoriPenilaian)
	r.HandleFunc("/updateKategoriSubPoint", MASTER.UpdateKategoriSubPoint)
	r.HandleFunc("/loadIdSubPointKategoriLastUpdate", MASTER.LoadIdSubPointKategoriLastUpdate)
	r.HandleFunc("/updateSubPointList", MASTER.UpdateSubPointList)
	r.HandleFunc("/loadSubPointList", MASTER.LoadSubPointList)
	r.HandleFunc("/deleteSubPointContent", MASTER.DeleteSubPointContent)
	r.HandleFunc("/updateKategoriPenguranganPoint", MASTER.UpdateKategoriPenguranganPoint)
	r.HandleFunc("/loadKategoriPenguranganPoint", MASTER.LoadKategoriPenguranganPoint)
	r.HandleFunc("/loadToken", MASTER.LoadToken)
	r.HandleFunc("/saveTokenPeserta", MASTER.SaveTokenPeserta)
	r.HandleFunc("/validateTokenPeserta", MASTER.ValidateTokenPeserta)
	r.HandleFunc("/updateNilaiKategori", MASTER.UpdateNilaiKategori)

	// REKAP
	r.HandleFunc("/loadNilaiLomba", REKAP.LoadNilaiLomba)
	r.HandleFunc("/updateNilaiLomba", REKAP.UpdateNilaiLomba)
	r.HandleFunc("/updateNilai", REKAP.UpdateNilai)
	r.HandleFunc("/loadNilaiJuriList", REKAP.LoadNilaiJuriList)
	r.HandleFunc("/savePointPenguranganPeserta", REKAP.SavePointPenguranganPeserta)
	r.HandleFunc("/loadPointPenguranganPeserta", REKAP.LoadPointPenguranganPeserta)
	r.HandleFunc("/loadNilaiRekap", REKAP.LoadNilaiRekap)
	r.HandleFunc("/updateKategoriJuara", REKAP.UpdateKategoriJuara)
	r.HandleFunc("/loadKategoriJuara", REKAP.LoadKategoriJuara)
	r.HandleFunc("/updateKategoriPenilaianJuara", REKAP.UpdateKategoriPenilaianJuara)
	r.HandleFunc("/loadKategoriPenilaianJuara", REKAP.LoadKategoriPenilaianJuara)
	r.HandleFunc("/saveKuesioner", REKAP.SaveKuesioner)
	r.HandleFunc("/updateRekapBandingKategoriJuara", REKAP.UpdateRekapBandingKategoriJuara)
	r.HandleFunc("/loadRekapBandingKategoriJuara", REKAP.LoadRekapBandingKategoriJuara)
	r.HandleFunc("/uploadPenilaian", REKAP.UploadPenilaian)
	r.HandleFunc("/loadFotoPenilaian", REKAP.LoadFotoPenilaian)
	r.HandleFunc("/deleteFotoPenilaian", REKAP.DeleteFotoPenilaian)

	// ===================== START SERVER =====================
	fmt.Println("go SayakaRekap running...")

	headersOk := handlers.AllowedHeaders([]string{"*"})
	originsOk := handlers.AllowedOrigins([]string{"*"})
	methodsOk := handlers.AllowedMethods([]string{"GET", "HEAD", "POST", "PUT", "OPTIONS"})
	log.Fatal(http.ListenAndServe(CONFIG.Server(), handlers.CORS(originsOk, headersOk, methodsOk)(r)))

	// log.Fatal(http.ListenAndServeTLS(CONFIG.Server(), "server.crt", "server.key", handlers.CORS(originsOk, headersOk, methodsOk)(r)))
}

