// InspectionModal.js
import React, { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Paper,
  Typography,
  TextField,
  Grid,
  Button,
  IconButton,
  MenuItem,
  FormControl,
  ListItem,
  ListItemText,
  List,
  Divider,
  Tabs,
  Tab,
  Badge,
  Autocomplete,
} from "@mui/material";
import {
  AddPhotoAlternate as AddPhotoAlternateIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  Description as DescriptionIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { useMjopContext } from "./MjopContext"; // Zorg ervoor dat het pad correct is

const InspectionModal = ({
  currentElementId,
  currentInspection,
  handleCloseModal,
  t, // Assuming 't' is for translations
}) => {
  const {
    state,
    saveData,
    // ... andere functies
  } = useMjopContext();
  const { globalElements } = state;

  const [tabIndex, setTabIndex] = useState(0);
  const [inspectionData, setInspectionData] = useState({
    name: "",
    description: "",
    inspectionDate: "",
    images: [],
    documents: [],
    mistakes: [],
    overallConditionScore: 1,
    remarks: "",
    useVangnet: false,
  });

  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (currentInspection) {
      // Reset de staat eerst
      setInspectionData({
        name: "",
        description: "",
        inspectionDate: "",
        images: [],
        documents: [],
        mistakes: [],
        overallConditionScore: 1,
        remarks: "",
        useVangnet: false,
      });
      setTasks([]);

      // Laad nieuwe inspectiegegevens
      const element = globalElements.find((el) => el.id === currentElementId);
      if (element) {
        const inspection = element.inspectionReport.find(
          (rep) => rep.id === currentInspection.id
        );
        if (inspection) {
          console.log("Loading inspection data:", inspection); // Debug log
          setInspectionData({
            name: inspection.name || "",
            description: inspection.description || "",
            inspectionDate: inspection.inspectionDate
              ? new Date(inspection.inspectionDate).toISOString().split("T")[0]
              : "",
            images: Array.isArray(inspection.images) ? inspection.images : [],
            documents: Array.isArray(inspection.documents) ? inspection.documents : [],
            mistakes: Array.isArray(inspection.mistakes) ? inspection.mistakes : [],
            overallConditionScore: inspection.overallConditionScore || 1,
            remarks: inspection.remarks || "",
            useVangnet: inspection.useVangnet || false,
          });
          setTasks(Array.isArray(inspection.tasks) ? inspection.tasks : []);
        } else {
          console.warn(`Inspection with ID ${currentInspection.id} not found in element ${currentElementId}`);
        }
      } else {
        console.warn(`Element with ID ${currentElementId} not found`);
      }
    }
  }, [currentInspection, currentElementId, globalElements]);

  // ... rest van de code

  return (
    <Modal
      open={!!currentInspection}
      onClose={handleCloseModal}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100vw",
      }}
    >
      <Paper
        sx={{
          width: "90vw",
          height: "90vh",
          overflow: "hidden",
          borderRadius: 2,
          boxShadow: 6,
          background: "#f9f9f9",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          p={2}
          borderBottom="1px solid #ddd"
        >
          <Typography variant="h5" color="primary">
            Inspectie Element - {inspectionData.name}
          </Typography>
          <IconButton onClick={handleCloseModal} aria-label="close modal">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Tabs */}
        <Tabs
          value={tabIndex}
          onChange={(e, newValue) => setTabIndex(newValue)}
          aria-label="inspection tabs"
          centered
        >
          <Tab label={tabLabelWithError("Hoofdgegevens", "name")} />
          <Tab label={tabLabelWithError("Gebreken", "mistakes")} />
          <Tab label={tabLabelWithError("Taken", "tasks")} />
        </Tabs>

        {/* Tab Content */}
        <Box
          flex={1}
          overflow="auto"
          p={4}
          sx={{ background: "#fff", borderRadius: "8px", m: 2 }}
        >
          {/* Hoofdgegevens Tab */}
          {tabIndex === 0 && (
            <Grid container spacing={3}>
              {/* Naam */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Naam"
                  value={inspectionData.name}
                  onChange={handleInputChange("name")}
                  variant="outlined"
                  aria-label="inspection name"
                />
              </Grid>

              {/* Beschrijving */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  label="Beschrijving"
                  value={inspectionData.description}
                  onChange={handleInputChange("description")}
                  variant="outlined"
                  aria-label="inspection description"
                />
              </Grid>

              {/* Inspectie Datum */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Inspectie Datum"
                  value={inspectionData.inspectionDate}
                  onChange={handleInputChange("inspectionDate")}
                  variant="outlined"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  aria-label="inspection date"
                />
              </Grid>

              {/* Conditie Score */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Conditie Score"
                  value={inspectionData.overallConditionScore}
                  // Read-only since it's calculated
                  variant="outlined"
                  InputProps={{
                    readOnly: true,
                  }}
                  aria-label="condition score"
                >
                  <MenuItem value={1}>1 = Uitstekend</MenuItem>
                  <MenuItem value={2}>2 = Goed</MenuItem>
                  <MenuItem value={3}>3 = Redelijk</MenuItem>
                  <MenuItem value={4}>4 = Matig</MenuItem>
                  <MenuItem value={5}>5 = Slecht</MenuItem>
                  <MenuItem value={6}>6 = Zeer Slecht</MenuItem>
                </TextField>
              </Grid>

              {/* Opmerkingen */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  label="Opmerkingen"
                  value={inspectionData.remarks}
                  onChange={handleInputChange("remarks")}
                  variant="outlined"
                  aria-label="inspection remarks"
                />
              </Grid>

              {/* Upload Foto's */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<AddPhotoAlternateIcon />}
                    sx={{ mb: 2 }}
                    aria-label="upload photos"
                  >
                    Upload Foto's
                    <input
                      type="file"
                      hidden
                      multiple
                      accept="image/*"
                      onChange={(e) =>
                        handleAddFiles(Array.from(e.target.files), "images")
                      }
                    />
                  </Button>
                  <Box display="flex" flexWrap="wrap" mt={2}>
                    {inspectionData.images.map((src, index) => (
                      <Box key={index} position="relative" mr={2} mb={2}>
                        <img
                          src={`http://localhost:5000/${src}`}
                          alt={`Inspectie foto ${index + 1}`}
                          style={{
                            width: "100px",
                            height: "100px",
                            objectFit: "contain",
                            borderRadius: 4,
                            boxShadow: 2,
                          }}
                        />
                        <Box display="flex" justifyContent="center" mt={1}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              const link = document.createElement("a");
                              link.href = `http://localhost:5000/${src}`;
                              link.download = `foto-${index + 1}`;
                              link.click();
                            }}
                            aria-label={`download foto ${index + 1}`}
                          >
                            <DownloadIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleClearFile(index, "images")}
                            aria-label={`clear foto ${index + 1}`}
                          >
                            <ClearIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </FormControl>
              </Grid>

              {/* Upload Documenten */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<InsertDriveFileIcon />}
                    sx={{ mb: 2 }}
                    aria-label="upload documents"
                  >
                    Upload Documenten
                    <input
                      type="file"
                      hidden
                      multiple
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={(e) =>
                        handleAddFiles(Array.from(e.target.files), "documents")
                      }
                    />
                  </Button>
                  <Box display="flex" flexWrap="wrap" mt={2}>
                    {inspectionData.documents.map((src, index) => {
                      const fileType = src.split(".").pop();
                      const icon = getFileIcon(fileType);

                      return (
                        <Box
                          key={index}
                          position="relative"
                          mr={2}
                          mb={2}
                        >
                          <a
                            href={`http://localhost:5000/${src}`}
                            download
                            style={{ margin: "0 8px" }}
                            aria-label={`download document ${index + 1}`}
                          >
                            {icon}
                          </a>
                          <Box display="flex" justifyContent="center" mt={1}>
                            <IconButton
                              size="small"
                              onClick={() => {
                                const link = document.createElement("a");
                                link.href = `http://localhost:5000/${src}`;
                                link.download = `document-${index + 1}`;
                                link.click();
                              }}
                              aria-label={`download document ${index + 1}`}
                            >
                              <DownloadIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleClearFile(index, "documents")
                              }
                              aria-label={`clear document ${index + 1}`}
                            >
                              <ClearIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </FormControl>
              </Grid>
            </Grid>
          )}

          {/* Gebreken Tab */}
          {tabIndex === 1 && (
            <Box>
              <Typography variant="h6" component="h3" mb={2} color="primary">
                Gebreken
              </Typography>
              <Box display="flex" flexDirection="row" height="100%">
                {/* Defect Selection Panel */}
                <Box
                  sx={{
                    minWidth: "300px",
                    backgroundColor: "#f4f4f4",
                    borderRight: "1px solid #ddd",
                    p: 2,
                  }}
                >
                  <Typography variant="h6" component="h3">
                    Selecteer Gebreken
                  </Typography>
                  <List sx={{ maxHeight: "70vh", overflowY: "auto" }}>
                    {/* Button to add a new empty defect */}
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      onClick={() => handleAddMistake("Nieuw Gebrek", "ernstig")}
                      sx={{ mt: 2 }}
                      aria-label="add empty defect"
                    >
                      Voeg Leeg Gebrek Toe
                    </Button>

                    {/* Ernstig Defects */}
                    <Typography
                      variant="subtitle1"
                      sx={{ mt: 2, fontWeight: "bold" }}
                    >
                      Ernstig
                    </Typography>
                    {renderMistakeList("ernstig")}
                    <Divider />

                    {/* Serieus Defects */}
                    <Typography
                      variant="subtitle1"
                      sx={{ mt: 2, fontWeight: "bold" }}
                    >
                      Serieus
                    </Typography>
                    {renderMistakeList("serieus")}
                    <Divider />

                    {/* Gering Defects */}
                    <Typography
                      variant="subtitle1"
                      sx={{ mt: 2, fontWeight: "bold" }}
                    >
                      Gering
                    </Typography>
                    {renderMistakeList("gering")}
                    <Divider />
                  </List>
                </Box>

                {/* Defect Details Panel */}
                <Box
                  p={4}
                  flex={1}
                  sx={{ maxHeight: "calc(100vh - 64px)", overflowY: "auto" }}
                >
                  {inspectionData.mistakes.map((mistake, index) => (
                    <Grid
                      container
                      spacing={2}
                      key={mistake.id}
                      sx={{
                        mb: 2,
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        p: 2,
                      }}
                    >
                      {/* Gebrek Categorie Field */}
                      <Grid item xs={12} sm={6}>
                        <Autocomplete
                          freeSolo
                          options={allGebreken}
                          value={mistake.category}
                          onChange={(event, newValue) => {
                            handleMistakeChange(index, "category", newValue);
                            // Geen toevoeging aan globale context
                          }}
                          onInputChange={(event, newInputValue) => {
                            handleMistakeChange(index, "category", newInputValue);
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Gebrek Categorie"
                              variant="outlined"
                              aria-label={`defect category ${index + 1}`}
                            />
                          )}
                        />
                      </Grid>

                      {/* Ernst (Severity) Field */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          select
                          label="Ernst"
                          value={mistake.severity}
                          onChange={(e) =>
                            handleMistakeChange(
                              index,
                              "severity",
                              e.target.value
                            )
                          }
                          fullWidth
                          variant="outlined"
                          aria-label={`defect severity ${index + 1}`}
                        >
                          <MenuItem value="ernstig">Ernstig</MenuItem>
                          <MenuItem value="serieus">Serieus</MenuItem>
                          <MenuItem value="gering">Gering</MenuItem>
                        </TextField>
                      </Grid>

                      {/* Omvang (Extent) Field */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          type="number"
                          label="Omvang (%)"
                          value={mistake.omvang}
                          onChange={(e) =>
                            handleMistakeChange(index, "omvang", e.target.value)
                          }
                          fullWidth
                          InputProps={{
                            inputProps: {
                              min: 0,
                              max: 100,
                            },
                          }}
                          variant="outlined"
                          aria-label={`defect extent ${index + 1}`}
                        />
                      </Grid>

                      {/* Beschrijving (Description) Field */}
                      <Grid item xs={12}>
                        <TextField
                          label="Beschrijving"
                          value={mistake.description}
                          onChange={(e) =>
                            handleMistakeChange(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          fullWidth
                          multiline
                          variant="outlined"
                          aria-label={`defect description ${index + 1}`}
                        />
                      </Grid>

                      {/* Upload Foto's voor Gebrek */}
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <Button
                            variant="contained"
                            component="label"
                            startIcon={<AddPhotoAlternateIcon />}
                            sx={{ mb: 2 }}
                            aria-label={`upload defect photos ${index + 1}`}
                          >
                            Upload Foto
                            <input
                              type="file"
                              hidden
                              multiple
                              accept="image/*"
                              onChange={(e) =>
                                handleMistakeImageChange(
                                  mistake.id,
                                  Array.from(e.target.files)
                                )
                              }
                            />
                          </Button>
                          <Box display="flex" flexWrap="wrap" mt={2}>
                            {Array.isArray(mistake.images) && mistake.images.map((image, imageIndex) => (
                              <Box
                                key={imageIndex}
                                position="relative"
                                mr={2}
                                mb={2}
                              >
                                {/* Clear Image Button */}
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleMistakeClearImage(
                                      mistake.id,
                                      imageIndex
                                    )
                                  }
                                  sx={{
                                    position: "absolute",
                                    top: 4,
                                    right: 4,
                                    backgroundColor: "rgba(255, 255, 255, 0.7)",
                                  }}
                                  aria-label={`clear defect image ${imageIndex + 1}`}
                                >
                                  <ClearIcon />
                                </IconButton>

                                {/* Display Image */}
                                <img
                                  src={`http://localhost:5000/${image}`}
                                  alt={`Gebrek foto ${imageIndex + 1}`}
                                  style={{
                                    width: "100px",
                                    height: "100px",
                                    objectFit: "contain",
                                    borderRadius: 4,
                                    boxShadow: 2,
                                  }}
                                />

                                {/* Download Image Button */}
                                <Box display="flex" justifyContent="center" mt={1}>
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      const link = document.createElement("a");
                                      link.href = `http://localhost:5000/${image}`;
                                      link.download = `gebrek-foto-${mistake.id}-${imageIndex + 1}`;
                                      link.click();
                                    }}
                                    aria-label={`download defect image ${imageIndex + 1}`}
                                  >
                                    <DownloadIcon />
                                  </IconButton>
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        </FormControl>
                      </Grid>

                      {/* Delete Mistake Button */}
                      <Grid
                        item
                        xs={12}
                        display="flex"
                        justifyContent="flex-end"
                      >
                        <IconButton
                          color="secondary"
                          onClick={() => handleRemoveMistake(index)}
                          aria-label={`delete defect ${index + 1}`}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  ))}
                </Box>
              </Box>
            </Box>
          )}

          {/* Taken Tab */}
          {tabIndex === 2 && (
            <Box>
              <Typography variant="h6" component="h3" mb={2} color="primary">
                Taken
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddTask}
                sx={{ mb: 2 }}
                aria-label="add task"
              >
                Voeg Nieuwe Taak Toe
              </Button>
              {Array.isArray(tasks) && tasks.length > 0 ? (
                tasks.map((task, index) => (
                  <Grid
                    container
                    spacing={2}
                    key={task.id}
                    sx={{
                      mb: 2,
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      p: 2,
                    }}
                  >
                    {/* Taak Naam */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Taak Naam"
                        value={task.name}
                        onChange={(e) =>
                          handleTaskChangeInternal(index, "name", e.target.value)
                        }
                        variant="outlined"
                        aria-label={`task name ${index + 1}`}
                      />
                    </Grid>

                    {/* Taak Beschrijving */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Taak Beschrijving"
                        value={task.description}
                        onChange={(e) =>
                          handleTaskChangeInternal(index, "description", e.target.value)
                        }
                        variant="outlined"
                        aria-label={`task description ${index + 1}`}
                      />
                    </Grid>

                    {/* Geschatte Prijs */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Geschatte Prijs (€)"
                        value={task.estimatedPrice}
                        onChange={(e) =>
                          handleTaskChangeInternal(
                            index,
                            "estimatedPrice",
                            e.target.value
                          )
                        }
                        variant="outlined"
                        InputProps={{
                          inputProps: {
                            min: 0,
                          },
                        }}
                        aria-label={`estimated price task ${index + 1}`}
                      />
                    </Grid>

                    {/* Uiterste Datum */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Uiterste Datum"
                        value={task.ultimateDate}
                        onChange={(e) =>
                          handleTaskChangeInternal(index, "ultimateDate", e.target.value)
                        }
                        variant="outlined"
                        InputLabelProps={{
                          shrink: true,
                        }}
                        aria-label={`ultimate date task ${index + 1}`}
                      />
                    </Grid>

                    {/* Urgentie */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        select
                        label="Urgentie"
                        value={task.urgency}
                        onChange={(e) =>
                          handleTaskChangeInternal(index, "urgency", e.target.value)
                        }
                        variant="outlined"
                        aria-label={`urgency task ${index + 1}`}
                      >
                        <MenuItem value={1}>1 - Zeer Laag</MenuItem>
                        <MenuItem value={2}>2 - Laag</MenuItem>
                        <MenuItem value={3}>3 - Gemiddeld</MenuItem>
                        <MenuItem value={4}>4 - Hoog</MenuItem>
                        <MenuItem value={5}>5 - Zeer Hoog</MenuItem>
                        <MenuItem value={6}>6 - Kritiek</MenuItem>
                      </TextField>
                    </Grid>

                    {/* Upload Foto's voor Taak */}
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <Button
                          variant="contained"
                          component="label"
                          startIcon={<AddPhotoAlternateIcon />}
                          sx={{ mb: 2 }}
                          aria-label={`upload task photos ${index + 1}`}
                        >
                          Upload Foto
                          <input
                            type="file"
                            hidden
                            multiple
                            accept="image/*"
                            onChange={(e) =>
                              handleTaskImageChange(
                                task.id,
                                Array.from(e.target.files)
                              )
                            }
                          />
                        </Button>
                        <Box display="flex" flexWrap="wrap" mt={2}>
                          {Array.isArray(task.images) && task.images.map((image, imageIndex) => (
                            <Box
                              key={imageIndex}
                              position="relative"
                              mr={2}
                              mb={2}
                            >
                              {/* Clear Image Button */}
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleTaskClearImage(
                                    task.id,
                                    imageIndex
                                  )
                                }
                                sx={{
                                  position: "absolute",
                                  top: 4,
                                  right: 4,
                                  backgroundColor: "rgba(255, 255, 255, 0.7)",
                                }}
                                aria-label={`clear task image ${imageIndex + 1}`}
                              >
                                <ClearIcon />
                              </IconButton>

                              {/* Display Image */}
                              <img
                                src={`http://localhost:5000/${image}`}
                                alt={`Taak foto ${imageIndex + 1}`}
                                style={{
                                  width: "100px",
                                  height: "100px",
                                  objectFit: "contain",
                                  borderRadius: 4,
                                  boxShadow: 2,
                                }}
                              />

                              {/* Download Image Button */}
                              <Box display="flex" justifyContent="center" mt={1}>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    const link = document.createElement("a");
                                    link.href = `http://localhost:5000/${image}`;
                                    link.download = `taak-foto-${task.id}-${imageIndex + 1}`;
                                    link.click();
                                  }}
                                  aria-label={`download task image ${imageIndex + 1}`}
                                >
                                  <DownloadIcon />
                                </IconButton>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      </FormControl>
                    </Grid>

                    {/* Upload Documenten voor Taak */}
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <Button
                          variant="contained"
                          component="label"
                          startIcon={<InsertDriveFileIcon />}
                          sx={{ mb: 2 }}
                          aria-label={`upload task documents ${index + 1}`}
                        >
                          Upload Documenten
                          <input
                            type="file"
                            hidden
                            multiple
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={(e) =>
                              handleTaskDocumentChange(
                                task.id,
                                Array.from(e.target.files)
                              )
                            }
                          />
                        </Button>
                        <Box display="flex" flexWrap="wrap" mt={2}>
                          {Array.isArray(task.documents) && task.documents.map((src, docIndex) => {
                            const fileType = src.split(".").pop();
                            const icon = getFileIcon(fileType);

                            return (
                              <Box
                                key={docIndex}
                                position="relative"
                                mr={2}
                                mb={2}
                              >
                                <a
                                  href={`http://localhost:5000/${src}`}
                                  download
                                  style={{ margin: "0 8px" }}
                                  aria-label={`download task document ${docIndex + 1}`}
                                >
                                  {icon}
                                </a>
                                <Box display="flex" justifyContent="center" mt={1}>
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      const link = document.createElement("a");
                                      link.href = `http://localhost:5000/${src}`;
                                      link.download = `document-${docIndex + 1}`;
                                      link.click();
                                    }}
                                    aria-label={`download task document ${docIndex + 1}`}
                                  >
                                    <DownloadIcon />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleTaskClearDocument(task.id, docIndex)
                                    }
                                    aria-label={`clear task document ${docIndex + 1}`}
                                  >
                                    <ClearIcon />
                                  </IconButton>
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      </FormControl>
                    </Grid>

                    {/* Delete Task Button */}
                    <Grid item xs={12} display="flex" justifyContent="flex-end">
                      <IconButton
                        color="secondary"
                        onClick={() => handleRemoveTaskInternal(index)}
                        aria-label={`delete task ${index + 1}`}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))
              ) : (
                <Typography variant="body1" color="textSecondary" aria-label="no tasks added">
                  Geen taken toegevoegd.
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Paper>
    </Modal>
  );
};

export default InspectionReport;
