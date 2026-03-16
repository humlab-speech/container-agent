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
  sessionId = sessions[i, "id"]
  sessionName = sessions[i, "name"]
  speakerGender = sessions[i, "speakerGender"]
  speakerAge = sessions[i, "speakerAge"]
  files = sessions[i, "files"]


  if(Sys.getenv("SIMULATION") == "true") {
    wavDir = file.path("/tmp/wavs")
  }
  else {
    wavDir = file.path(Sys.getenv("FILE_PATH"), "emudb-sessions", sessionId)
  }  

  print(paste("Importing session", sessionName, "using audio files from", wavDir))

  if (!dir.exists(wavDir)) {
    print(paste("Skipping session", sessionName, "- directory does not exist:", wavDir))
    next
  }

  # Check if all bundles for this session already exist in the emuDB
  sessionDir = file.path(dbPath, paste0(sessionName, "_ses"))
  fileNames = unlist(files[[1]]$name)
  bundleNames = tools::file_path_sans_ext(fileNames)
  alreadyImported = all(sapply(bundleNames, function(b) dir.exists(file.path(sessionDir, paste0(b, "_bndl")))))
  if (alreadyImported) {
    print(paste("Skipping session", sessionName, "- all bundles already imported"))
    next
  }

  #import_recordings(VISPDB, dir = wavDir, targetSessionName = sessionName, verbose = FALSE)
  import_mediaFiles(VISPDB, dir = wavDir, targetSessionName = sessionName, verbose = FALSE)
}
