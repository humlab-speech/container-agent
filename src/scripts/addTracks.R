
library(emuR, warn.conflicts = FALSE)


dbPath <- file.path(Sys.getenv("PROJECT_PATH"), "Data", "VISP_emuDB")
VISP <- load_emuDB(dbPath)

# Make a data frame of sound files and specifications of SSFF track definitions that should be there

merge(list_files(VISP,"wav"),list_ssffTrackDefinitions(VISP)) -> VISPtracks

# Make a column in the set that explicitly names the SSFF signal tracks that should be there

VISPtracks$trackfile <- 
paste0(tools::file_path_sans_ext(VISPtracks$absolute_file_path),".",VISPtracks$fileExtension)

# Filter out the SSFF tracks that are already there

VISPtracks <- VISPtracks[!file.exists(VISPtracks$trackfile),]

fo_dat <- VISPtracks[VISPtracks$fileExtension =="f0",]
if(nrow(fo_dat) > 0 ){
  
  ksvF0(fo_dat[["absolute_file_path"]],toFile=TRUE)
}

F_dat <- VISPtracks[VISPtracks$fileExtension =="fms",]
if(nrow(F_dat) > 0 ){
  
  forest(F_dat[["absolute_file_path"]],toFile=TRUE)
}
