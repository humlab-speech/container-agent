library(emuR, warn.conflicts = FALSE)
dbPath = file.path(Sys.getenv("PROJECT_PATH"), "Data", "VISP_emuDB")
VISPDB = load_emuDB(dbPath)
add_linkDefinition(VISPDB, type = Sys.getenv("ANNOT_LEVEL_LINK_DEF_TYPE"), superlevelName = Sys.getenv("ANNOT_LEVEL_LINK_SUPER"), sublevelName = Sys.getenv("ANNOT_LEVEL_LINK_SUB"))
