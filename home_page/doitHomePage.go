package main

import (
	CONFIG "erekap/config"
	INDEX "erekap/module/index"
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

func main() {
	// Initialize a new router
	r := mux.NewRouter()

	// Serve static files from specific directories
	r.PathPrefix("/views/").Handler(http.StripPrefix("/views/", http.FileServer(http.Dir("../views"))))
	r.PathPrefix("/assets/").Handler(http.StripPrefix("/assets/", http.FileServer(http.Dir("../assets"))))
	r.PathPrefix("/file/").Handler(http.StripPrefix("/file/", http.FileServer(http.Dir("../file"))))

	// Connect to the database
	db, err := CONFIG.Connect_db()
	// Check if there's an error in database connection
	if err != nil {
		log.Fatal("Error connecting to the database:", err)
	}
	defer db.Close()

	r.HandleFunc("/", INDEX.Home_page)
	r.HandleFunc("/logout", INDEX.Logout)
	// Print the startup message
	fmt.Println("Go Gallery JR, do it")

	// CORS Setup
	headersOk := handlers.AllowedHeaders([]string{"*"})
	originsOk := handlers.AllowedOrigins([]string{"*"})
	methodsOk := handlers.AllowedMethods([]string{"GET", "HEAD", "POST", "PUT", "OPTIONS"})

	// Start the server on port 1178 with CORS enabled
	log.Fatal(http.ListenAndServe(":1178", handlers.CORS(originsOk, headersOk, methodsOk)(r)))
}
