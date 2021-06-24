library(emuR, warn.conflicts = FALSE)
dbPath = file.path(Sys.getenv("PROJECT_PATH"), "Data", "VISP_emuDB")
VISPDB = load_emuDB(dbPath)

add_ssffTrackDefinition(VISPDB, name = "FORMANTS", onTheFlyFunctionName = "forest")
add_ssffTrackDefinition(VISPDB, name = "F0", onTheFlyFunctionName = "ksvF0")
