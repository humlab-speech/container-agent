library(emuR, warn.conflicts = FALSE)
library(jsonlite)
library(base64enc)

dbPath = file.path(Sys.getenv("PROJECT_PATH"), "Data", "VISP_emuDB")
VISPDB = load_emuDB(dbPath)

#decode envvar EMUDB_SESSIONS, it's a base64-encoded json-string
sessionsJson = rawToChar(base64decode(Sys.getenv("EMUDB_SESSIONS")))
sessions = fromJSON(sessionsJson, simplifyVector = TRUE)

for(i in 1:nrow(sessions)) {
  sessionId = sessions[i, "id"]
  sessionName = sessions[i, "name"]
  speakerGender = sessions[i, "speakerGender"]
  speakerAge = sessions[i, "speakerAge"]
  files = sessions[i, "files"]

  wavDir = file.path(Sys.getenv("UPLOAD_PATH"), "emudb-sessions", sessionId)

  print(paste("Importing session", sessionName, "using audio files from", wavDir))

  import_mediaFiles(VISPDB, dir = wavDir, targetSessionName = sessionName, verbose = FALSE)
}
