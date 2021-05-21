library(emuR)
dbPath = file.path(Sys.getenv("PROJECT_PATH"), "Data", "VISP_emuDB")
dbHandle = load_emuDB(dbPath)
wavDir = file.path("/home", "uploads", "emudb-sessions")

sessionDirs = list.files(wavDir)

for(sessDir in sessionDirs) {
  wavDir = file.path("/home", "uploads", "emudb-sessions", sessDir)
  import_mediaFiles(dbHandle, dir = wavDir, targetSessionName = sessDir)
}

