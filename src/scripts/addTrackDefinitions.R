library(emuR, warn.conflicts = FALSE)
#library(reindeer)

dbPath <- file.path(Sys.getenv("PROJECT_PATH"), "Data", "VISP_emuDB")
VISPDB <- load_emuDB(dbPath)

# List existing tracks
existing_tracks <- list_ssffTrackDefinitions(VISPDB)

# print out status about current tracks
if ("FORMANTS" %in% existing_tracks$name) {
  print("FORMANTS track already exists")
} else {
  print("FORMANTS track does not exist")
}

# Check if tracks exist before removing
existing_formants <- "FORMANTS" %in% existing_tracks$name
existing_f0 <- "F0" %in% existing_tracks$name

# Remove tracks only if they exist
if (existing_formants) {
  remove_ssffTrackDefinition(VISPDB, name = "FORMANTS", deleteFiles = FALSE)
}

if (existing_f0) {
  remove_ssffTrackDefinition(VISPDB, name = "F0", deleteFiles = FALSE)
}

# Add tracks
add_ssffTrackDefinition(VISPDB, name = "FORMANTS", onTheFlyFunctionName = "forest", interactive = FALSE)
add_ssffTrackDefinition(VISPDB, name = "F0", onTheFlyFunctionName = "ksvF0", interactive = FALSE)


#add_trackDefinition(VISPDB, name = "FORMANTS", onTheFlyFunctionName = "forest")
#add_trackDefinition(VISPDB, name = "F0", onTheFlyFunctionName = "ksvF0")



