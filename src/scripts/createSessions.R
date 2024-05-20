library(emuR, warn.conflicts = FALSE)
#library(reindeer)
library(jsonlite)
library(base64enc)

dbPath = file.path(Sys.getenv("PROJECT_PATH"), "Data", "VISP_emuDB")
VISPDB = load_emuDB(dbPath)

#decode envvar EMUDB_SESSIONS, it's a base64-encoded json-string
sessionsJson = rawToChar(base64decode(Sys.getenv("EMUDB_SESSIONS")))
sessions = fromJSON(sessionsJson, simplifyVector = TRUE)

for(i in 1:nrow(sessions)) {
  newSession = sessions[i, "new"]
  #deletedSession = sessions[i, "deleted"]
  deletedSession = ifelse("deleted" %in% colnames(sessions), sessions[i, "deleted"], FALSE)
  sessionId = sessions[i, "id"]
  sessionName = sessions[i, "name"]
  sessionSlug = sessions[i, "slug"]
  speakerGender = sessions[i, "speakerGender"]
  speakerAge = sessions[i, "speakerAge"]
  files = sessions[i, "files"]

  #if this is a deleted session, do nothing more here
  if(deletedSession) {
    next
  }

  if(Sys.getenv("SIMULATION") == "true") {
    wavDir = file.path("/tmp/wavs")
  }
  else {
    wavDir = file.path(Sys.getenv("UPLOAD_PATH"), "emudb-sessions", sessionId)
  }

  print(paste("Importing session", sessionSlug, "using audio files from", wavDir))

  if (dir.exists(wavDir) && length(list.files(wavDir)) > 0) {
    print(paste("Importing session", sessionSlug, "using audio files from", wavDir))
    #import_recordings(VISPDB, dir = wavDir, targetSessionName = sessionSlug, verbose = FALSE)
    import_mediaFiles(VISPDB, dir = wavDir, targetSessionName = sessionName, verbose = FALSE)
  } else {
    print(paste("No audio files found in", wavDir, "- skipping import for session", sessionSlug))
  }
}
