library(emuR)
library(jsonlite)
dbPath = file.path(Sys.getenv("PROJECT_PATH"), "Data", "VISP_emuDB")
VISPDB = load_emuDB(dbPath)
levels = fromJSON(Sys.getenv("ANNOT_LEVELS"))

segments = c()
events = c()

#Filter out all levels of type SEGMENT and EVENT - ignore ITEM
for(index in 1:nrow(levels)) {
    levelName <- levels[index, 1]
    levelType <- levels[index, 2]

    if(levelType == "SEGMENT") {
        segments <- c(segments, levelName)
    }

    if(levelType == "EVENT") {
        events <- c(events, levelName)
    }
}

#Compose an "levelOrder" character vector containing names of levels
levelOrder = c()

for(seg in segments) {
    levelOrder <- c(levelOrder, seg)
}

for(evt in events) {
    levelOrder <- c(levelOrder, evt)
}

#Apply to emuDB
set_levelCanvasesOrder(VISPDB, perspectiveName = "default", order = levelOrder)