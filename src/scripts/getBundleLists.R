library(emuR, warn.conflicts = FALSE)
#library(reindeer)
dbPath = file.path(Sys.getenv("PROJECT_PATH"), "Data", "VISP_emuDB")
VISPDB = load_emuDB(dbPath)
