library(emuR)
library(jsonlite)
library(base64enc)

dbPath = file.path(Sys.getenv("PROJECT_PATH"), "Data", "VISP_emuDB")
dbHandle = load_emuDB(dbPath)
wavDir = file.path("/home", "uploads", "emudb-sessions")

sessionDirs = list.files(wavDir)

for(sessDir in sessionDirs) {
  wavDir = file.path("/home", "uploads", "emudb-sessions", sessDir)
  import_mediaFiles(dbHandle, dir = wavDir, targetSessionName = sessDir)
}

#Create file sessDir.meta_json

#decode envvar EMUDB_SESSIONS, it's a base64-encoded json-string
sessionsJson = rawToChar(base64decode(Sys.getenv("EMUDB_SESSIONS")))
sessions = fromJSON(sessionsJson)

for(session in sessions) {
    
}

# This file should contain: [{"Gender":"Male","Age":32}]

