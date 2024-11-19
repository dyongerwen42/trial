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
  Alert,
  Checkbox,
  FormControlLabel,
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

const InspectionModal = ({
  currentElementId,
  currentInspection,
  handleCloseModal,
  setGlobalElements,
  t,
  globalElements,
}) => {
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
  const [validationErrors, setValidationErrors] = useState({});
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (currentInspection) {
      const element = globalElements.find((el) => el.id === currentElementId);
      setInspectionData({
        name: currentInspection.name || currentInspection.elementName || "",
        description:
          currentInspection.description ||
          currentInspection.elementDescription ||
          "",
        inspectionDate: currentInspection.inspectionDate || "",
        images: currentInspection.images || [],
        documents: currentInspection.documents || [],
        mistakes: currentInspection.mistakes || [],
        overallConditionScore:
          currentInspection.overallConditionScore || 1, // Ensure correct property
        remarks: currentInspection.remarks || "", // Load existing remarks
        useVangnet: currentInspection.useVangnet || false, // Load existing Vangnetconstructie flag
      });

      setTasks(element?.tasks || []);
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

      const updatedFiles = [...inspectionData[type], data.filePath];
      updateInspectionField(type, updatedFiles);
    } catch (error) {
      console.error("Error uploading files:", error);
      // Optionally handle upload errors
    }
  };

  // Function to clear uploaded files
  const handleClearFile = (index, type) => {
    const updatedFiles = inspectionData[type].filter((_, i) => i !== index);
    updateInspectionField(type, updatedFiles);
  };

  // Function to add a new mistake (gebrek)
  const handleAddMistake = (category, severity) => {
    const newMistake = {
      id: uuidv4(),
      category,
      severity,
      omvang: "",
      intensity: "", // New field for intensity
      description: "",
      images: [],
      replacementValue: 1, // Default replacement value
    };
    const updatedMistakes = [...inspectionData.mistakes, newMistake];
    updateInspectionField("mistakes", updatedMistakes);
    calculateConditionScore(updatedMistakes);
  };

  // Function to handle changes within a mistake
  const handleMistakeChange = (index, field, value) => {
    const updatedMistakes = inspectionData.mistakes.map((mistake, i) =>
      i === index ? { ...mistake, [field]: value } : mistake
    );
    updateInspectionField("mistakes", updatedMistakes);
    calculateConditionScore(updatedMistakes);
  };

  // Function to remove a mistake
  const handleRemoveMistake = (index) => {
    const updatedMistakes = inspectionData.mistakes.filter((_, i) => i !== index);
    updateInspectionField("mistakes", updatedMistakes);
    calculateConditionScore(updatedMistakes);
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

      const updatedMistakes = inspectionData.mistakes.map((mistake) =>
        mistake.id === mistakeId
          ? { ...mistake, images: [...mistake.images, data.filePath] }
          : mistake
      );
      updateInspectionField("mistakes", updatedMistakes);
      calculateConditionScore(updatedMistakes);
    } catch (error) {
      console.error("Error uploading mistake images:", error);
      // Optionally handle upload errors
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
    updateInspectionField("mistakes", updatedMistakes);
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

      const updatedTasks = tasks.map((task) =>
        task.id === taskId
          ? { ...task, images: [...task.images, data.filePath] }
          : task
      );
      setTasks(updatedTasks);
    } catch (error) {
      console.error("Error uploading task images:", error);
      // Optionally handle upload errors
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

      const updatedTasks = tasks.map((task) =>
        task.id === taskId
          ? { ...task, documents: [...task.documents, data.filePath] }
          : task
      );
      setTasks(updatedTasks);
    } catch (error) {
      console.error("Error uploading task documents:", error);
      // Optionally handle upload errors
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

  // **Updated Severity Mapping**
  // Changed keys to match actual severity values: "gering", "serieus", "ernstig"
  const severityMapping = {
    "gering": "minor",
    "serieus": "significant",
    "ernstig": "serious",
  };

  // Condition Matrices as per NEN 2767 Table 5
  const conditionMatrices = {
    minor: [
      [1, 1, 1, 1, 2], // Intensity 1
      [1, 1, 1, 2, 3], // Intensity 2
      [1, 1, 2, 3, 4], // Intensity 3
    ],
    significant: [
      [1, 1, 1, 2, 3],
      [1, 1, 2, 3, 4],
      [1, 2, 3, 4, 5],
    ],
    serious: [
      [1, 1, 2, 3, 4],
      [1, 2, 3, 4, 5],
      [2, 3, 4, 5, 6],
    ],
  };

  // Function to get extent score from percentage
  const getExtentScore = (percentage) => {
    const value = parseFloat(percentage);
    if (value < 2) return 1;
    if (value >= 2 && value < 10) return 2;
    if (value >= 10 && value < 30) return 3;
    if (value >= 30 && value < 70) return 4;
    return 5; // For 70% and above
  };

  // Function to get condition score from matrix
  const getConditionScore = (severity, intensityScore, extentScore) => {
    // Normalize severity to lowercase to match the mapping keys
    const severityKey = severityMapping[severity.toLowerCase()];
    if (!severityKey) {
      throw new Error(`Invalid severity: ${severity}`);
    }
    const matrix = conditionMatrices[severityKey];
    if (!matrix) {
      throw new Error(`Condition matrix not found for severity: ${severityKey}`);
    }
    const intensityIndex = intensityScore - 1;
    const extentIndex = extentScore - 1;
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
    if (mistakes.length === 0 && !inspectionData.useVangnet) {
      updateInspectionField("overallConditionScore", 1);
      return;
    }

    if (inspectionData.useVangnet) {
      // Calculate condition score based on age using the aging curve
      const element = globalElements.find((el) => el.id === currentElementId);
      const installationDate = new Date(element?.installationDate);
      const currentDate = new Date();
      const age = currentDate.getFullYear() - installationDate.getFullYear();
      const L = parseFloat(element?.fullLifeSpan) || 100; // Total lifespan of the element in years

      const C = 6 / (1 + age / L);
      const theoreticalConditionScore = Math.min(Math.round(C), 6);
      updateInspectionField("overallConditionScore", theoreticalConditionScore);
      return;
    }

    let sections = [];

    // Group defects by severity and intensity for Situation 2
    const situation2Groups = {};
    const situation3Defects = [];

    mistakes.forEach((mistake) => {
      const { severity, intensity, omvang, replacementValue } = mistake;
      const severityKey = severityMapping[severity.toLowerCase()];
      if (!severityKey) {
        throw new Error(`Invalid severity: ${severity}`);
      }
      const intensityScore = parseInt(intensity, 10);
      const extentPercentage = parseFloat(omvang) || 0;

      // Key for grouping (Situation 2)
      const key = `${severityKey}-${intensityScore}`;

      if (!situation2Groups[key]) {
        situation2Groups[key] = [];
      }

      situation2Groups[key].push({
        extentPercentage,
        replacementValue: parseFloat(replacementValue) || 1, // Default to 1 if not provided
        severity,
        intensityScore,
      });
    });

    // Process Situation 2 groups
    Object.keys(situation2Groups).forEach((key) => {
      const defects = situation2Groups[key];
      if (defects.length > 1) {
        // Situation 2 applies
        const { severity, intensityScore } = defects[0];
        // Sum extents
        let totalExtentPercentage = defects.reduce(
          (sum, defect) => sum + defect.extentPercentage,
          0
        );
        if (totalExtentPercentage > 100) {
          totalExtentPercentage = 100; // Cap at 100%
        }
        const extentScore = getExtentScore(totalExtentPercentage);
        const conditionScore = getConditionScore(
          severity,
          intensityScore,
          extentScore
        );
        const totalReplacementValue = defects.reduce(
          (sum, defect) => sum + defect.replacementValue,
          0
        );
        sections.push({
          conditionScore,
          replacementValue: totalReplacementValue,
        });
      } else {
        // Only one defect in this group, may fall under Situation 3
        situation3Defects.push(defects[0]);
      }
    });

    // Process Situation 3 defects
    situation3Defects.forEach((defect) => {
      const { severity, intensityScore, replacementValue } = defect;
      const extentScore = 5; // Assign extent score of 5 (100%)
      const conditionScore = getConditionScore(
        severity,
        intensityScore,
        extentScore
      );
      sections.push({
        conditionScore,
        replacementValue,
      });
    });

    // Determine if there is a remaining part without defects (Situation 3)
    const totalReplacementValueWithDefects = sections.reduce(
      (sum, section) => sum + section.replacementValue,
      0
    );
    const element = globalElements.find((el) => el.id === currentElementId);
    const elementReplacementValue = parseFloat(element?.replacementValue) || 1; // Total replacement value of the element

    if (elementReplacementValue > totalReplacementValueWithDefects) {
      const remainingReplacementValue =
        elementReplacementValue - totalReplacementValueWithDefects;
      sections.push({
        conditionScore: 1, // No defects
        replacementValue: remainingReplacementValue,
      });
    }

    // Aggregate condition scores
    const overallConditionScore = aggregateConditionScores(sections);
    updateInspectionField("overallConditionScore", overallConditionScore);
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

  // Function to display tab labels with error badges if needed
  const tabLabelWithError = (label, errorKey) => (
    <Badge
      variant="dot"
      color="error"
      invisible={!validationErrors[errorKey]}
    >
      {label}
    </Badge>
  );

  // Function to validate the entire form
  const validateForm = () => {
    const errors = {};
    if (!inspectionData.name) errors.name = "Naam is verplicht";
    if (!inspectionData.description)
      errors.description = "Beschrijving is verplicht";
    if (!inspectionData.inspectionDate)
      errors.inspectionDate = "Inspectie Datum is verplicht";

    if (
      inspectionData.mistakes.some(
        (m) =>
          !m.severity ||
          !m.omvang ||
          !m.description ||
          !m.intensity // Ensure intensity is filled
      )
    ) {
      errors.mistakes =
        "Vul alle velden in voor gebreken, inclusief intensiteit.";
    }

    if (
      tasks.some(
        (t) =>
          !t.name ||
          !t.description ||
          !t.estimatedPrice ||
          !t.ultimateDate ||
          !t.urgency // Ensure urgency is filled
      )
    ) {
      errors.tasks = "Vul alle velden in voor taken.";
    }

    setValidationErrors(errors);
    setFormError(
      Object.keys(errors).length > 0
        ? "Er zijn fouten in het formulier. Controleer de invoer."
        : ""
    );
    return Object.keys(errors).length === 0;
  };

  // Handler to save the inspection data
  const handleSave = () => {
    if (!validateForm()) return;

    setGlobalElements((prevElements) => {
      const updatedElements = prevElements.map((element) => {
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

          const updatedElement = {
            ...element,
            inspectionReport: updatedInspectionReport,
            tasks: tasks,
          };

          return updatedElement;
        }
        return element;
      });

      return updatedElements;
    });
    handleCloseModal();
  };

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
          width: "100vw",
          height: "100vh",
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
                  error={!!validationErrors.name}
                  helperText={validationErrors.name}
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
                  error={!!validationErrors.description}
                  helperText={validationErrors.description}
                />
              </Grid>

              {/* Inspectie Datum */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Inspectie Datum"
                  value={
                    inspectionData.inspectionDate
                      ? new Date(inspectionData.inspectionDate)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  onChange={handleInputChange("inspectionDate")}
                  variant="outlined"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  error={!!validationErrors.inspectionDate}
                  helperText={validationErrors.inspectionDate}
                />
              </Grid>

              {/* Conditie Score */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Conditie Score"
                  value={inspectionData.overallConditionScore}
                  // Removed onChange to make it read-only
                  variant="outlined"
                  InputProps={{
                    readOnly: true, // Make it read-only since it's calculated
                  }}
                  error={!!validationErrors.overallConditionScore}
                  helperText={validationErrors.overallConditionScore}
                >
                  <MenuItem value="">Selecteer Conditie</MenuItem>
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
                      onClick={() => handleAddMistake("", "ernstig")}
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
                      {(globalElements.find((el) => el.id === currentElementId)
                        ?.gebreken.ernstig?.length > 0 ||
                        globalElements.find((el) => el.id === currentElementId)
                          ?.gebreken.serieus?.length > 0 ||
                        globalElements.find((el) => el.id === currentElementId)
                          ?.gebreken.gering?.length > 0) && (
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
                            error={!!validationErrors.mistakes}
                            helperText={
                              validationErrors.mistakes &&
                              "Selecteer een categorie."
                            }
                          >
                            <MenuItem value="">Selecteer Categorie</MenuItem>
                            {(
                              globalElements.find(
                                (el) => el.id === currentElementId
                              )?.gebreken.ernstig || []
                            )
                              .concat(
                                globalElements.find(
                                  (el) => el.id === currentElementId
                                )?.gebreken.serieus || []
                              )
                              .concat(
                                globalElements.find(
                                  (el) => el.id === currentElementId
                                )?.gebreken.gering || []
                              )
                              .map((category, i) => (
                                <MenuItem key={i} value={category}>
                                  {category}
                                </MenuItem>
                              ))}
                          </TextField>
                        </Grid>
                      )}

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
                          error={!!validationErrors.mistakes}
                          helperText={
                            validationErrors.mistakes &&
                            "Selecteer de ernst."
                          }
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
                          error={!!validationErrors.mistakes}
                          helperText={
                            validationErrors.mistakes &&
                            "Vul een geldige omvang in."
                          }
                        />
                      </Grid>

                      {/* Intensiteit (Intensity) Field */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          select
                          label="Intensiteit"
                          value={mistake.intensity}
                          onChange={(e) =>
                            handleMistakeChange(
                              index,
                              "intensity",
                              e.target.value
                            )
                          }
                          fullWidth
                          variant="outlined"
                          error={!!validationErrors.mistakes}
                          helperText={
                            validationErrors.mistakes &&
                            "Selecteer de intensiteit."
                          }
                        >
                          <MenuItem value="">Selecteer Intensiteit</MenuItem>
                          <MenuItem value="1">1 - Initiële fase</MenuItem>
                          <MenuItem value="2">2 - Gevorderde fase</MenuItem>
                          <MenuItem value="3">3 - Finale fase</MenuItem>
                        </TextField>
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
                          error={!!validationErrors.mistakes}
                          helperText={
                            validationErrors.mistakes &&
                            "Vul een beschrijving in."
                          }
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
                      error={!!validationErrors.tasks}
                      helperText={
                        validationErrors.tasks && "Vul de taak naam in."
                      }
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
                      error={!!validationErrors.tasks}
                      helperText={
                        validationErrors.tasks && "Vul de taak beschrijving in."
                      }
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
                      error={!!validationErrors.tasks}
                      helperText={
                        validationErrors.tasks && "Vul een geschatte prijs in."
                      }
                    />
                  </Grid>

                  {/* Uiterste Datum */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Uiterste Datum"
                      value={
                        task.ultimateDate
                          ? new Date(task.ultimateDate)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        handleTaskChange(index, "ultimateDate", e.target.value)
                      }
                      variant="outlined"
                      InputLabelProps={{
                        shrink: true,
                      }}
                      error={!!validationErrors.tasks}
                      helperText={
                        validationErrors.tasks && "Vul een uiterste datum in."
                      }
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
                      error={!!validationErrors.tasks}
                      helperText={
                        validationErrors.tasks && "Selecteer de urgentie."
                      }
                    >
                      <MenuItem value="1">1 - Zeer Laag</MenuItem>
                      <MenuItem value="2">2 - Laag</MenuItem>
                      <MenuItem value="3">3 - Gemiddeld</MenuItem>
                      <MenuItem value="4">4 - Hoog</MenuItem>
                      <MenuItem value="5">5 - Zeer Hoog</MenuItem>
                      <MenuItem value="6">6 - Kritiek</MenuItem>
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
                                handleTaskClearImage(task.id, imageIndex)
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

          {/* Form Error Alert */}
          {formError && (
            <Box mx={2} mt={2}>
              <Alert severity="error">{formError}</Alert>
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
