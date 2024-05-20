#library(emuR, warn.conflicts = FALSE)
#library(reindeer)
#dbPath = file.path(Sys.getenv("PROJECT_PATH"), "Data", "VISP_emuDB")
#VISPDB = load_emuDB(dbPath)

#list_ssffTrackDefinitions(VISPDB)

#add_ssffTrackDefinition(VISPDB, name = "FORMANTS", onTheFlyFunctionName = "forest")
#add_ssffTrackDefinition(VISPDB, name = "F0", onTheFlyFunctionName = "ksvF0")

#remove_ssffTrackDefinition(VISPDB, name = "FORMANTS", deleteFiles = FALSE)
#remove_ssffTrackDefinition(VISPDB, name = "F0", deleteFiles = FALSE)




library(emuR, warn.conflicts = FALSE)
#library(reindeer)

dbPath <- file.path(Sys.getenv("PROJECT_PATH"), "Data", "VISP_emuDB")
VISPDB <- load_emuDB(dbPath)

# List existing tracks
existing_tracks <- list_ssffTrackDefinitions(VISPDB)

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



