library(tidyverse, warn.conflicts = FALSE)
library(emuR, warn.conflicts = FALSE)
#library(reindeer)
library(jsonlite, warn.conflicts = FALSE)
dbPath = file.path(Sys.getenv("PROJECT_PATH"), "Data", "VISP_emuDB")
VISPDB = load_emuDB(dbPath)

bundleList = fromJSON(Sys.getenv("BUNDLE_LIST"))
bundleList = as_tibble(bundleList)

write_bundleList(VISPDB, name = Sys.getenv("BUNDLE_LIST_NAME"), bundleList)