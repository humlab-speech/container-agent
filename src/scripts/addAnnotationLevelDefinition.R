library(emuR, warn.conflicts = FALSE)
dbPath = file.path(Sys.getenv("PROJECT_PATH"), "Data", "VISP_emuDB")
VISPDB = load_emuDB(dbPath)
add_levelDefinition(VISPDB, name = Sys.getenv("ANNOT_LEVEL_DEF_NAME"), type = Sys.getenv("ANNOT_LEVEL_DEF_TYPE"))
