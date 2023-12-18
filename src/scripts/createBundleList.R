library(emuR, warn.conflicts = FALSE)
library(reindeer)
dbPath = file.path(Sys.getenv("PROJECT_PATH"), "Data", "VISP_emuDB")
VISPDB = load_emuDB(dbPath)
bndls = list_bundles(VISPDB)

write_bundleList(VISPDB, name = "all", bndls)
write_bundleList(VISPDB, name = Sys.getenv("BUNDLE_LIST_NAME"), bndls)
