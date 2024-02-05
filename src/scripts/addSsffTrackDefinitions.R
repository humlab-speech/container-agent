library(emuR, warn.conflicts = FALSE)
library(reindeer)
dbPath = file.path(Sys.getenv("PROJECT_PATH"), "Data", "VISP_emuDB")
VISPDB = load_emuDB(dbPath)

#add_trackDefinition(VISPDB, name = "FORMANTS", onTheFlyFunctionName = "forest")
#add_trackDefinition(VISPDB, name = "F0", onTheFlyFunctionName = "ksvF0")

emuR::add_ssffTrackDefinition(VISPDB, name = "FORMANTS", onTheFlyFunctionName = "forest")
emuR::add_ssffTrackDefinition(VISPDB, name = "F0", onTheFlyFunctionName = "ksvF0")
