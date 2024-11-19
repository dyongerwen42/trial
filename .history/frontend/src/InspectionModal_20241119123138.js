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
    addGebrekToElement,
    removeGebrekFromElement,
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
    overallConditionScore: 1, // Initial condition score
    remarks: "", // Added remarks field
    useVangnet: false, // Added Vangnetconstructie flag
  });

  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (currentInspection) {
      const element = globalElements.find((el) => el.id === currentElementId);
      if (element) {
        const inspection = element.inspectionReport.find(
          (rep) => rep.id === currentInspection.id
        );
        if (inspection) {
          setInspectionData({
            name: inspection.name || "",
            description: inspection.description || "",
            inspectionDate: inspection.inspectionDate
              ? new Date(inspection.inspectionDate).toISOString().split("T")[0]
              : "",
            images: inspection.images || [],
            documents: inspection.documents || [],
            mistakes: inspection.mistakes || [],
            overallConditionScore: inspection.overallConditionScore || 1,
            remarks: inspection.remarks || "",
            useVangnet: inspection.useVangnet || false,
          });
          setTasks(element.tasks || []);
        }
      }
    }
  }, [currentInspection, currentElementId, globalElements]);

  // Function to update inspection data fields
  const updateInspectionField = (field, value) => {
    setInspectionData((prevState) => ({
      ...prevState,
      [field]: value,
    }));
  };

  // Handler for general input changes
  const handleInputChange = (field) => (e) => {
    const { value, checked, type } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    updateInspectionField(field, newValue);
  };

  // Function to handle file uploads (images and documents)
  const handleAddFiles = async (newFiles, type) => {
    if (newFiles.length === 0) return;

    const formData = new FormData();
    newFiles.forEach((file) => formData.append("file", file));

    try {
      const { data } = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Zorg ervoor dat de server een array van filePaths retourneert
      const uploadedFilePaths = data.filePaths || [data.filePath];
      const updatedFiles = [...inspectionData[type], ...uploadedFilePaths];
      updateInspectionField(type, updatedFiles);
    } catch (error) {
      console.error("Error uploading files:", error);
      // Optioneel: voeg gebruikersfeedback toe voor upload fouten
    }
  };

  // Function to clear uploaded files
  const handleClearFile = (index, type) => {
    const updatedFiles = inspectionData[type].filter((_, i) => i !== index);
    updateInspectionField(type, updatedFiles);
  };

  // Function to add a new mistake (gebrek)
  const handleAddMistake = (gebrekName, severity) => {
    if (!gebrekName || !severity) {
      console.warn("Gebrek Naam en Ernst zijn verplicht.");
      return;
    }

    const newMistake = {
      id: uuidv4(),
      category: gebrekName, // Naam van het gebrek
      severity, // Ernst: "ernstig", "serieus", "gering"
      omvang: "", // Extent percentage, to be filled by user
      description: "",
      images: [],
    };
    const updatedMistakes = [...inspectionData.mistakes, newMistake];
    setInspectionData((prevState) => ({
      ...prevState,
      mistakes: updatedMistakes,
    }));
    calculateConditionScore(updatedMistakes);

    // Voeg het gebrek toe aan de globale context
    addGebrekToElement(currentElementId, severity, [gebrekName]);
  };

  // Function to handle changes within a mistake
  const handleMistakeChange = (index, field, value) => {
    const updatedMistakes = inspectionData.mistakes.map((mistake, i) =>
      i === index ? { ...mistake, [field]: value } : mistake
    );
    setInspectionData((prevState) => ({
      ...prevState,
      mistakes: updatedMistakes,
    }));
    calculateConditionScore(updatedMistakes);
  };

  // Function to remove a mistake
  const handleRemoveMistake = (index) => {
    const removedMistake = inspectionData.mistakes[index];
    if (!removedMistake) return;

    const updatedMistakes = inspectionData.mistakes.filter((_, i) => i !== index);
    setInspectionData((prevState) => ({
      ...prevState,
      mistakes: updatedMistakes,
    }));
    calculateConditionScore(updatedMistakes);

    // Verwijder het gebrek uit de globale context
    removeGebrekFromElement(currentElementId, removedMistake.severity, [removedMistake.category]);
  };

  // Function to handle image uploads for a mistake
  const handleMistakeImageChange = async (mistakeId, newImages) => {
    if (newImages.length === 0) return;

    const formData = new FormData();
    newImages.forEach((image) => formData.append("file", image));

    try {
      const { data } = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadedFilePaths = data.filePaths || [data.filePath];

      const updatedMistakes = inspectionData.mistakes.map((mistake) =>
        mistake.id === mistakeId
          ? { ...mistake, images: [...mistake.images, ...uploadedFilePaths] }
          : mistake
      );
      setInspectionData((prevState) => ({
        ...prevState,
        mistakes: updatedMistakes,
      }));
      calculateConditionScore(updatedMistakes);
    } catch (error) {
      console.error("Error uploading mistake images:", error);
      // Optioneel: voeg gebruikersfeedback toe voor upload fouten
    }
  };

  // Function to clear an image from a mistake
  const handleMistakeClearImage = (mistakeId, imageIndex) => {
    const updatedMistakes = inspectionData.mistakes.map((mistake) =>
      mistake.id === mistakeId
        ? {
            ...mistake,
            images: mistake.images.filter((_, i) => i !== imageIndex),
          }
        : mistake
    );
    setInspectionData((prevState) => ({
      ...prevState,
      mistakes: updatedMistakes,
    }));
    calculateConditionScore(updatedMistakes);
  };

  // Functions to handle task changes, additions, removals, and file uploads
  const handleTaskChange = (index, field, value) => {
    const updatedTasks = tasks.map((task, i) =>
      i === index ? { ...task, [field]: value } : task
    );
    setTasks(updatedTasks);
  };

  const handleRemoveTask = (index) => {
    const updatedTasks = tasks.filter((_, i) => i !== index);
    setTasks(updatedTasks);
  };

  const handleTaskImageChange = async (taskId, newImages) => {
    if (newImages.length === 0) return;

    const formData = new FormData();
    newImages.forEach((image) => formData.append("file", image));

    try {
      const { data } = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadedFilePaths = data.filePaths || [data.filePath];

      const updatedTasks = tasks.map((task) =>
        task.id === taskId
          ? { ...task, images: [...task.images, ...uploadedFilePaths] }
          : task
      );
      setTasks(updatedTasks);
    } catch (error) {
      console.error("Error uploading task images:", error);
      // Optioneel: voeg gebruikersfeedback toe voor upload fouten
    }
  };

  const handleTaskClearImage = (taskId, imageIndex) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId
        ? { ...task, images: task.images.filter((_, i) => i !== imageIndex) }
        : task
    );
    setTasks(updatedTasks);
  };

  const handleTaskDocumentChange = async (taskId, newDocuments) => {
    if (newDocuments.length === 0) return;

    const formData = new FormData();
    newDocuments.forEach((doc) => formData.append("file", doc));

    try {
      const { data } = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadedFilePaths = data.filePaths || [data.filePath];

      const updatedTasks = tasks.map((task) =>
        task.id === taskId
          ? { ...task, documents: [...task.documents, ...uploadedFilePaths] }
          : task
      );
      setTasks(updatedTasks);
    } catch (error) {
      console.error("Error uploading task documents:", error);
      // Optioneel: voeg gebruikersfeedback toe voor upload fouten
    }
  };

  const handleTaskClearDocument = (taskId, docIndex) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            documents: task.documents.filter((_, i) => i !== docIndex),
          }
        : task
    );
    setTasks(updatedTasks);
  };

  const handleAddTask = () => {
    const newTask = {
      id: uuidv4(),
      name: "",
      description: "",
      estimatedPrice: 0,
      ultimateDate: "",
      urgency: 1,
      images: [],
      documents: [],
    };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
  };

  // Condition Matrices as per NEN 2767 Table 5
  const conditionMatrices = {
    ernstig: [
      [1, 1, 1, 1, 2],
      [1, 1, 1, 2, 3],
      [1, 1, 2, 3, 4],
    ],
    serieus: [
      [1, 1, 1, 2, 3],
      [1, 1, 2, 3, 4],
      [1, 2, 3, 4, 5],
    ],
    gering: [
      [1, 1, 2, 3, 4],
      [1, 2, 3, 4, 5],
      [2, 3, 4, 5, 6],
    ],
  };

  // Function to get extent score from percentage
  const getExtentScore = (percentage) => {
    const value = parseFloat(percentage);
    if (isNaN(value)) return null;
    if (value < 2) return 1;
    if (value >= 2 && value < 10) return 2;
    if (value >= 10 && value < 30) return 3;
    if (value >= 30 && value < 70) return 4;
    return 5; // For 70% and above
  };

  // Function to get condition score from matrix
  const getConditionScore = (severity, intensityScore, extentScore) => {
    if (!severity || !intensityScore || !extentScore) {
      console.warn(
        `Incomplete data for condition score calculation. Severity: ${severity}, Intensity: ${intensityScore}, Extent: ${extentScore}`
      );
      return null;
    }

    // Normalize severity to lowercase to match the mapping keys
    const severityKey = severity.toLowerCase();
    if (!conditionMatrices[severityKey]) {
      console.warn(`Invalid severity: ${severity}`);
      return null;
    }
    const matrix = conditionMatrices[severityKey];
    if (!matrix) {
      console.warn(`Condition matrix not found for severity: ${severityKey}`);
      return null;
    }
    const intensityIndex = intensityScore - 1;
    const extentIndex = extentScore - 1;

    // Validate indices
    if (
      intensityIndex < 0 ||
      intensityIndex >= matrix.length ||
      extentIndex < 0 ||
      extentIndex >= matrix[intensityIndex].length
    ) {
      console.warn(
        `Invalid intensity or extent index. Intensity Index: ${intensityIndex}, Extent Index: ${extentIndex}`
      );
      return null;
    }

    const conditionScore = matrix[intensityIndex][extentIndex];
    return conditionScore;
  };

  // Function to aggregate condition scores as per NEN 2767 Annex B (Section 5.5)
  const aggregateConditionScores = (sections) => {
    const correctionFactors = {
      1: 0.0,
      2: 0.1,
      3: 0.2,
      4: 0.3,
      5: 0.4,
      6: 0.5,
    };
    let totalAdjustedValue = 0;
    let totalReplacementValue = 0;

    sections.forEach((section) => {
      const { conditionScore, replacementValue } = section;
      const correctionFactor = correctionFactors[conditionScore];
      const adjustedValue = replacementValue * correctionFactor;
      totalAdjustedValue += adjustedValue;
      totalReplacementValue += replacementValue;
    });

    const overallConditionIndex = totalAdjustedValue / totalReplacementValue;
    // Map the index back to a condition score
    const overallConditionScore = Math.round(overallConditionIndex * 10) + 1;
    return overallConditionScore > 6 ? 6 : overallConditionScore;
  };

  // Function to calculate the overall condition score as per NEN 2767
  const calculateConditionScore = (mistakes) => {
    // Filter out incomplete mistakes
    const validMistakes = mistakes.filter(
      (mistake) =>
        mistake.severity &&
        mistake.omvang &&
        conditionMatrices[mistake.severity.toLowerCase()]
    );

    // If there are no valid mistakes and not using Vangnetconstructie, set to excellent
    if (validMistakes.length === 0 && !inspectionData.useVangnet) {
      updateInspectionField("overallConditionScore", 1);
      return;
    }

    if (inspectionData.useVangnet) {
      // Calculate condition score based on age using the aging curve
      const element = globalElements.find((el) => el.id === currentElementId);
      if (!element || !element.installationDate || !element.fullLifeSpan) {
        console.warn("Element data incomplete for Vangnetconstructie calculation.");
        updateInspectionField("overallConditionScore", 1); // Default value
        return;
      }

      const installationDate = new Date(element.installationDate);
      const currentDate = new Date();
      let age = currentDate.getFullYear() - installationDate.getFullYear();
      // Adjust for month/day if necessary
      const monthDiff = currentDate.getMonth() - installationDate.getMonth();
      const dayDiff = currentDate.getDate() - installationDate.getDate();
      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--;
      }

      const L = parseFloat(element.fullLifeSpan);
      if (isNaN(L) || L <= 0) {
        console.warn(`Invalid fullLifeSpan: ${element.fullLifeSpan}`);
        updateInspectionField("overallConditionScore", 1); // Default value
        return;
      }

      const C = 6 / (1 + age / L);
      const theoreticalConditionScore = Math.min(Math.round(C), 6);
      updateInspectionField("overallConditionScore", theoreticalConditionScore);
      return;
    }

    let sections = [];

    // Group defects by severity for Situation 2
    const situation2Groups = {};

    validMistakes.forEach((mistake) => {
      const { severity, omvang, replacementValue } = mistake;
      const severityKey = severity.toLowerCase();
      const intensityScore = 1; // Default since 'intensity' is removed
      const extentPercentage = parseFloat(omvang);

      // Validate extent
      if (
        isNaN(extentPercentage) ||
        extentPercentage < 0
      ) {
        console.warn(
          `Invalid extent percentage (${omvang}) for mistake ID ${mistake.id}. Skipping this mistake.`
        );
        return; // Skip if extentScore couldn't be determined
      }

      const extentScore = getExtentScore(extentPercentage);
      if (!extentScore) {
        console.warn(
          `Invalid extent percentage (${omvang}) for mistake ID ${mistake.id}. Skipping this mistake.`
        );
        return; // Skip if extentScore couldn't be determined
      }

      // Key for grouping (Situation 2)
      const key = `${severityKey}`;

      if (!situation2Groups[key]) {
        situation2Groups[key] = [];
      }

      situation2Groups[key].push({
        conditionScore: getConditionScore(
          severityKey,
          intensityScore,
          extentScore
        ),
        replacementValue: parseFloat(replacementValue) || 1, // Default to 1 if not provided
      });
    });

    // Process Situation 2 groups
    Object.keys(situation2Groups).forEach((key) => {
      const defects = situation2Groups[key];
      defects.forEach((defect) => {
        if (defect.conditionScore) {
          sections.push({
            conditionScore: defect.conditionScore,
            replacementValue: defect.replacementValue,
          });
        }
      });
    });

    // Determine if there is a remaining part without defects (Situation 3)
    const element = globalElements.find((el) => el.id === currentElementId);
    if (!element || !element.replacementValue) {
      console.warn("Element data incomplete for aggregating condition scores.");
      return;
    }
    const elementReplacementValue = parseFloat(element.replacementValue) || 1; // Total replacement value of the element

    const totalReplacementValueWithDefects = sections.reduce(
      (sum, section) => sum + section.replacementValue,
      0
    );

    if (elementReplacementValue > totalReplacementValueWithDefects) {
      const remainingReplacementValue =
        elementReplacementValue - totalReplacementValueWithDefects;
      sections.push({
        conditionScore: 1, // No defects
        replacementValue: remainingReplacementValue,
      });
    }

    // Aggregate condition scores
    if (sections.length > 0) {
      const overallConditionScore = aggregateConditionScores(sections);
      updateInspectionField("overallConditionScore", overallConditionScore);
    } else {
      // No valid sections to aggregate
      updateInspectionField("overallConditionScore", 1); // Default to excellent
    }
  };

  // Function to get appropriate file icon based on file type
  const getFileIcon = (fileType) => {
    switch (fileType.toLowerCase()) {
      case "pdf":
        return <InsertDriveFileIcon style={{ fontSize: 40 }} />;
      case "doc":
      case "docx":
        return <DescriptionIcon style={{ fontSize: 40 }} />;
      default:
        return <InsertDriveFileIcon style={{ fontSize: 40 }} />;
    }
  };

  // Function to render the list of available defects based on severity
  const renderMistakeList = (severity) => {
    const currentElement = globalElements.find(
      (el) => el.id === currentElementId
    );
    const gebreken = currentElement ? currentElement.gebreken : {};

    return (gebreken[severity] || []).map((mistake, index) => (
      <ListItem
        button
        key={index}
        onClick={() => handleAddMistake(mistake, severity)}
        sx={{
          borderRadius: 1,
          "&:hover": {
            backgroundColor: "primary.light",
          },
        }}
      >
        <ListItemText primary={mistake} />
      </ListItem>
    ));
  };

  // Handler to save the inspection data
  const handleSave = () => {
    // Bereid bijgewerkte elementen voor
    const updatedElements = globalElements.map((element) => {
      if (element.id === currentElementId) {
        const inspectionExists = element.inspectionReport.some(
          (inspection) => inspection.id === currentInspection.id
        );

        const updatedInspectionReport = inspectionExists
          ? element.inspectionReport.map((inspection) =>
              inspection.id === currentInspection.id
                ? { ...inspection, ...inspectionData }
                : inspection
            )
          : [
              ...element.inspectionReport,
              { ...inspectionData, id: uuidv4() },
            ];

        return {
          ...element,
          inspectionReport: updatedInspectionReport,
          tasks: tasks,
        };
      }
      return element;
    });

    // Roep de context's saveData functie aan
    saveData(updatedElements);

    handleCloseModal();
  };

  // Function to display tab labels with error badges if needed
  const tabLabelWithError = (label, errorKey) => (
    <Badge
      variant="dot"
      color="error"
      invisible={true} // Always invisible since validations are handled separately
    >
      {label}
    </Badge>
  );

  // If there's no current inspection, do not render the modal
  if (!currentInspection) {
    return null;
  }

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
          <IconButton onClick={handleCloseModal}>
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
                          >
                            <DownloadIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleClearFile(index, "images")}
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
                        <Box key={index} position="relative" mr={2} mb={2}>
                          <a
                            href={`http://localhost:5000/${src}`}
                            download
                            style={{ margin: "0 8px" }}
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
                            >
                              <DownloadIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleClearFile(index, "documents")
                              }
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
                        <TextField
                          select
                          label="Gebrek Categorie"
                          value={mistake.category}
                          onChange={(e) =>
                            handleMistakeChange(
                              index,
                              "category",
                              e.target.value
                            )
                          }
                          fullWidth
                          variant="outlined"
                        >
                          <MenuItem value="">Selecteer Categorie</MenuItem>
                          {(() => {
                            const currentElement = globalElements.find(
                              (el) => el.id === currentElementId
                            );
                            const gebreken = currentElement
                              ? [
                                  ...gebreken.ernstig,
                                  ...gebreken.serieus,
                                  ...gebreken.gering,
                                ]
                              : [];
                            return gebreken.map((category, i) => (
                              <MenuItem key={i} value={category}>
                                {category}
                              </MenuItem>
                            ));
                          })()}
                        </TextField>
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
                            {mistake.images.map((image, imageIndex) => (
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
              >
                Voeg Nieuwe Taak Toe
              </Button>
              {tasks.map((task, index) => (
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
                        handleTaskChange(index, "name", e.target.value)
                      }
                      variant="outlined"
                    />
                  </Grid>

                  {/* Taak Beschrijving */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Taak Beschrijving"
                      value={task.description}
                      onChange={(e) =>
                        handleTaskChange(index, "description", e.target.value)
                      }
                      variant="outlined"
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
                        handleTaskChange(
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
                        handleTaskChange(index, "ultimateDate", e.target.value)
                      }
                      variant="outlined"
                      InputLabelProps={{
                        shrink: true,
                      }}
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
                        handleTaskChange(index, "urgency", e.target.value)
                      }
                      variant="outlined"
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
                        {task.images.map((image, imageIndex) => (
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
                        {task.documents.map((src, index) => {
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
                                >
                                  <DownloadIcon />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleTaskClearDocument(task.id, index)
                                  }
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
                      onClick={() => handleRemoveTask(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
            </Box>
          )}

          {/* Save Button */}
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            p={2}
            borderTop="1px solid #ddd"
          >
            <Button
              onClick={handleSave}
              variant="contained"
              color="primary"
              fullWidth
            >
              Save
            </Button>
          </Box>
        </Box>
      </Paper>
    </Modal>
  );
};

export default InspectionModal;
