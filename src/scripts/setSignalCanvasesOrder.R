library(emuR, warn.conflicts = FALSE)
library(reindeer)
library(jsonlite)
library(base64enc)
dbPath = file.path(Sys.getenv("PROJECT_PATH"), "Data", "VISP_emuDB")
VISPDB = load_emuDB(dbPath)

levelOrder = c("OSCI", "SPEC", "F0")

set_signalCanvasesOrder(VISPDB, perspectiveName = "default", order = levelOrder)
set_signalCanvasesOrder(VISPDB, perspectiveName = "Formants", order = levelOrder)
set_signalCanvasesOrder(VISPDB, perspectiveName = "Formants+F0", order = levelOrder)
