// InspectionModal.js
import React, { useState, useEffect, useCallback } from "react";
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
  Snackbar,
  Alert,
  LinearProgress,
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
import { useMjopContext } from "./MjopContext"; // Ensure correct path

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
    inspectionReport: [
      {
        id: uuidv4(),
        description: "",
        inspectionDone: false,
        inspectionDate: "",
        tasks: [],
        mistakes: [],
        overallConditionScore: 1,
        remarks: "",
      },
    ],
    overallConditionScore: 1,
    remarks: "",
    useVangnet: false,
  });

  const [uploadError, setUploadError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

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
            images: Array.isArray(inspection.images) ? inspection.images : [],
            documents: Array.isArray(inspection.documents) ? inspection.documents : [],
            inspectionReport: Array.isArray(element.inspectionReport)
              ? element.inspectionReport.map((report) => ({
                  ...report,
                  mistakes: Array.isArray(report.mistakes) ? report.mistakes : [],
                  tasks: Array.isArray(report.tasks) ? report.tasks : [],
                  overallConditionScore: calculateConditionScore(report.mistakes || [], report.tasks || []),
                  remarks: report.remarks || "",
                }))
              : [
                  {
                    id: uuidv4(),
                    description: "",
                    inspectionDone: false,
                    inspectionDate: "",
                    tasks: [],
                    mistakes: [],
                    overallConditionScore: 1,
                    remarks: "",
                  },
                ],
            overallConditionScore: calculateOverallConditionScore(element.inspectionReport || []),
            remarks: inspection.remarks || "",
            useVangnet: inspection.useVangnet || false,
          });
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

    const allowedTypes =
      type === "images"
        ? ["image/jpeg", "image/png", "image/gif"]
        : ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
    const maxSize = type === "images" ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 5MB for images, 10MB for documents

    const validFiles = newFiles.filter(
      (file) => allowedTypes.includes(file.type) && file.size <= maxSize
    );

    if (validFiles.length !== newFiles.length) {
      setUploadError("Some files were rejected due to invalid type or size.");
    }

    if (validFiles.length === 0) return;

    const formData = new FormData();
    validFiles.forEach((file) => formData.append("file", file));

    try {
      const { data } = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      // Ensure the server returns an array of file paths
      const uploadedFilePaths = Array.isArray(data.filePaths) ? data.filePaths : [data.filePath];
      const updatedFiles = [...(inspectionData[type] || []), ...uploadedFilePaths];
      updateInspectionField(type, updatedFiles);
      setUploadProgress(0); // Reset progress after upload
    } catch (error) {
      console.error("Error uploading files:", error);
      setUploadError("Failed to upload files. Please try again.");
      setUploadProgress(0); // Reset progress on error
    }
  };

  // Function to clear uploaded files
  const handleClearFile = (index, type) => {
    const updatedFiles = (inspectionData[type] || []).filter((_, i) => i !== index);
    updateInspectionField(type, updatedFiles);
  };

  // Function to add a new mistake (gebrek)
  const handleAddMistake = (reportId, gebrekName, severity) => {
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

    const updatedInspectionReport = inspectionData.inspectionReport.map((report) =>
      report.id === reportId
        ? { ...report, mistakes: [...report.mistakes, newMistake] }
        : report
    );

    setInspectionData((prevState) => ({
      ...prevState,
      inspectionReport: updatedInspectionReport,
    }));

    calculateConditionScore(updatedInspectionReport);
    addGebrekToElement(currentElementId, severity, [gebrekName]);
  };

  // Function to handle changes within a mistake
  const handleMistakeChange = (reportId, mistakeId, field, value) => {
    const updatedInspectionReport = inspectionData.inspectionReport.map((report) =>
      report.id === reportId
        ? {
            ...report,
            mistakes: report.mistakes.map((mistake) =>
              mistake.id === mistakeId ? { ...mistake, [field]: value } : mistake
            ),
          }
        : report
    );

    setInspectionData((prevState) => ({
      ...prevState,
      inspectionReport: updatedInspectionReport,
    }));

    calculateConditionScore(updatedInspectionReport);
  };

  // Function to remove a mistake
  const handleRemoveMistake = (reportId, mistakeId) => {
    const removedMistake = inspectionData.inspectionReport
      .find((report) => report.id === reportId)
      ?.mistakes.find((mistake) => mistake.id === mistakeId);

    if (!removedMistake) return;

    const updatedInspectionReport = inspectionData.inspectionReport.map((report) =>
      report.id === reportId
        ? {
            ...report,
            mistakes: report.mistakes.filter((mistake) => mistake.id !== mistakeId),
          }
        : report
    );

    setInspectionData((prevState) => ({
      ...prevState,
      inspectionReport: updatedInspectionReport,
    }));

    calculateConditionScore(updatedInspectionReport);
    removeGebrekFromElement(currentElementId, removedMistake.severity, [removedMistake.category]);
  };

  // Function to handle image uploads for a mistake
  const handleMistakeImageChange = async (reportId, mistakeId, newImages) => {
    if (newImages.length === 0) return;

    const formData = new FormData();
    newImages.forEach((image) => formData.append("file", image));

    try {
      const { data } = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadedFilePaths = Array.isArray(data.filePaths) ? data.filePaths : [data.filePath];

      const updatedInspectionReport = inspectionData.inspectionReport.map((report) =>
        report.id === reportId
          ? {
              ...report,
              mistakes: report.mistakes.map((mistake) =>
                mistake.id === mistakeId
                  ? { ...mistake, images: [...mistake.images, ...uploadedFilePaths] }
                  : mistake
              ),
            }
          : report
      );

      setInspectionData((prevState) => ({
        ...prevState,
        inspectionReport: updatedInspectionReport,
      }));

      calculateConditionScore(updatedInspectionReport);
    } catch (error) {
      console.error("Error uploading mistake images:", error);
      setUploadError("Failed to upload mistake images. Please try again.");
    }
  };

  // Function to clear an image from a mistake
  const handleMistakeClearImage = (reportId, mistakeId, imageIndex) => {
    const updatedInspectionReport = inspectionData.inspectionReport.map((report) =>
      report.id === reportId
        ? {
            ...report,
            mistakes: report.mistakes.map((mistake) =>
              mistake.id === mistakeId
                ? { ...mistake, images: mistake.images.filter((_, i) => i !== imageIndex) }
                : mistake
            ),
          }
        : report
    );

    setInspectionData((prevState) => ({
      ...prevState,
      inspectionReport: updatedInspectionReport,
    }));

    calculateConditionScore(updatedInspectionReport);
  };

  // Functions to handle task changes, additions, removals, and file uploads
  const handleTaskChange = (reportId, taskId, field, value) => {
    const updatedInspectionReport = inspectionData.inspectionReport.map((report) =>
      report.id === reportId
        ? {
            ...report,
            tasks: report.tasks.map((task) =>
              task.id === taskId ? { ...task, [field]: value } : task
            ),
          }
        : report
    );

    setInspectionData((prevState) => ({
      ...prevState,
      inspectionReport: updatedInspectionReport,
    }));

    calculateConditionScore(updatedInspectionReport);
  };

  const handleRemoveTask = (reportId, taskId) => {
    const updatedInspectionReport = inspectionData.inspectionReport.map((report) =>
      report.id === reportId
        ? {
            ...report,
            tasks: report.tasks.filter((task) => task.id !== taskId),
          }
        : report
    );

    setInspectionData((prevState) => ({
      ...prevState,
      inspectionReport: updatedInspectionReport,
    }));

    calculateConditionScore(updatedInspectionReport);
  };

  const handleTaskImageChange = async (reportId, taskId, newImages) => {
    if (newImages.length === 0) return;

    const formData = new FormData();
    newImages.forEach((image) => formData.append("file", image));

    try {
      const { data } = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadedFilePaths = Array.isArray(data.filePaths) ? data.filePaths : [data.filePath];

      const updatedInspectionReport = inspectionData.inspectionReport.map((report) =>
        report.id === reportId
          ? {
              ...report,
              tasks: report.tasks.map((task) =>
                task.id === taskId
                  ? { ...task, images: [...task.images, ...uploadedFilePaths] }
                  : task
              ),
            }
          : report
      );

      setInspectionData((prevState) => ({
        ...prevState,
        inspectionReport: updatedInspectionReport,
      }));

      calculateConditionScore(updatedInspectionReport);
    } catch (error) {
      console.error("Error uploading task images:", error);
      setUploadError("Failed to upload task images. Please try again.");
    }
  };

  const handleTaskClearImage = (reportId, taskId, imageIndex) => {
    const updatedInspectionReport = inspectionData.inspectionReport.map((report) =>
      report.id === reportId
        ? {
            ...report,
            tasks: report.tasks.map((task) =>
              task.id === taskId
                ? { ...task, images: task.images.filter((_, i) => i !== imageIndex) }
                : task
            ),
          }
        : report
    );

    setInspectionData((prevState) => ({
      ...prevState,
      inspectionReport: updatedInspectionReport,
    }));

    calculateConditionScore(updatedInspectionReport);
  };

  const handleTaskDocumentChange = async (reportId, taskId, newDocuments) => {
    if (newDocuments.length === 0) return;

    const formData = new FormData();
    newDocuments.forEach((doc) => formData.append("file", doc));

    try {
      const { data } = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadedFilePaths = Array.isArray(data.filePaths) ? data.filePaths : [data.filePath];

      const updatedInspectionReport = inspectionData.inspectionReport.map((report) =>
        report.id === reportId
          ? {
              ...report,
              tasks: report.tasks.map((task) =>
                task.id === taskId
                  ? { ...task, documents: [...task.documents, ...uploadedFilePaths] }
                  : task
              ),
            }
          : report
      );

      setInspectionData((prevState) => ({
        ...prevState,
        inspectionReport: updatedInspectionReport,
      }));

      calculateConditionScore(updatedInspectionReport);
    } catch (error) {
      console.error("Error uploading task documents:", error);
      setUploadError("Failed to upload task documents. Please try again.");
    }
  };

  const handleTaskClearDocument = (reportId, taskId, docIndex) => {
    const updatedInspectionReport = inspectionData.inspectionReport.map((report) =>
      report.id === reportId
        ? {
            ...report,
            tasks: report.tasks.map((task) =>
              task.id === taskId
                ? { ...task, documents: task.documents.filter((_, i) => i !== docIndex) }
                : task
            ),
          }
        : report
    );

    setInspectionData((prevState) => ({
      ...prevState,
      inspectionReport: updatedInspectionReport,
    }));

    calculateConditionScore(updatedInspectionReport);
  };

  // Function to handle overall condition score
  const calculateConditionScore = (inspectionReports) => {
    let totalScore = 0;
    let count = 0;

    inspectionReports.forEach((report) => {
      if (Array.isArray(report.mistakes)) {
        report.mistakes.forEach((mistake) => {
          if (mistake.severity && mistake.omvang) {
            const severityScore = {
              "ernstig": 3,
              "serieus": 2,
              "gering": 1,
            }[mistake.severity.toLowerCase()] || 0;

            const extentScore = getExtentScore(mistake.omvang);

            if (extentScore) {
              totalScore += severityScore * extentScore;
              count += 1;
            }
          }
        });
      }

      // Optionally include tasks in condition score
      if (Array.isArray(report.tasks)) {
        report.tasks.forEach((task) => {
          if (!task.completed) { // Assuming there's a 'completed' field
            totalScore += 1;
            count += 1;
          }
        });
      }
    });

    const averageScore = count > 0 ? Math.round(totalScore / count) : 1;
    const overallScore = averageScore > 6 ? 6 : averageScore;
    setInspectionData((prevState) => ({
      ...prevState,
      overallConditionScore: overallScore,
    }));
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
        onClick={() => handleAddMistake(currentInspection.id, mistake, severity)}
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
    // Prepare updated elements
    const updatedElements = globalElements.map((element) => {
      if (element.id === currentElementId) {
        const inspectionExists = Array.isArray(element.inspectionReport) && element.inspectionReport.some(
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
          inspectionReport: Array.isArray(updatedInspectionReport) ? updatedInspectionReport : [updatedInspectionReport],
        };
      }
      return element;
    });

    // Invoke context's saveData function
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

  // Error and Success Snackbar Handling
  const [openErrorSnackbar, setOpenErrorSnackbar] = useState(false);
  const [errorSnackbarMessage, setErrorSnackbarMessage] = useState("");

  const [openSuccessSnackbar, setOpenSuccessSnackbar] = useState(false);
  const [successSnackbarMessage, setSuccessSnackbarMessage] = useState("");

  useEffect(() => {
    if (uploadError) {
      setErrorSnackbarMessage(uploadError);
      setOpenErrorSnackbar(true);
    }
  }, [uploadError]);

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
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <LinearProgress variant="determinate" value={uploadProgress} />
                  )}
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
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <LinearProgress variant="determinate" value={uploadProgress} />
                  )}
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
                      onClick={() => handleAddMistake(currentInspection.id, "Nieuw Gebrek", "ernstig")}
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
                  {inspectionData.inspectionReport.map((report) => (
                    <Box key={report.id} sx={{ mb: 4 }}>
                      <Typography variant="subtitle1" color="secondary">
                        Inspectie: {report.description || "Geen Beschrijving"}
                      </Typography>
                      {Array.isArray(report.mistakes) && report.mistakes.map((mistake, index) => (
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
                                  report.id,
                                  mistake.id,
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
                                const gebreken = currentElement ? currentElement.gebreken : {};

                                // Ensure gebreken[severity] are always arrays
                                const allGebreken = [
                                  ...(Array.isArray(gebreken.ernstig) ? gebreken.ernstig : []),
                                  ...(Array.isArray(gebreken.serieus) ? gebreken.serieus : []),
                                  ...(Array.isArray(gebreken.gering) ? gebreken.gering : []),
                                ];

                                return allGebreken.map((category, i) => (
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
                                  report.id,
                                  mistake.id,
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
                                handleMistakeChange(report.id, mistake.id, "omvang", e.target.value)
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
                                  report.id,
                                  mistake.id,
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
                                      report.id,
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
                                          report.id,
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
                              onClick={() => handleRemoveMistake(report.id, mistake.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Grid>
                        </Grid>
                      ))}
                    </Box>
                  ))}
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
                    onClick={() => {
                      // Voeg een taak toe aan een specifieke inspectierapport
                      const reportId = inspectionData.inspectionReport[0]?.id;
                      if (reportId) {
                        handleAddTask(reportId);
                      } else {
                        console.warn("Geen inspectierapport gevonden om taken aan toe te voegen.");
                      }
                    }}
                    sx={{ mb: 2 }}
                  >
                    Voeg Nieuwe Taak Toe
                  </Button>
                  {Array.isArray(inspectionData.inspectionReport) && inspectionData.inspectionReport.map((report) => (
                    <Box key={report.id} sx={{ mb: 4 }}>
                      <Typography variant="subtitle1" color="secondary">
                        Inspectie: {report.description || "Geen Beschrijving"}
                      </Typography>
                      {Array.isArray(report.tasks) && report.tasks.map((task, index) => (
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
                                handleTaskChange(report.id, task.id, "name", e.target.value)
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
                                handleTaskChange(report.id, task.id, "description", e.target.value)
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
                                  report.id,
                                  task.id,
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
                                handleTaskChange(report.id, task.id, "ultimateDate", e.target.value)
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
                                handleTaskChange(report.id, task.id, "urgency", e.target.value)
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
                                      report.id,
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
                                          report.id,
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
                                      report.id,
                                      task.id,
                                      Array.from(e.target.files)
                                    )
                                  }
                                />
                              </Button>
                              <Box display="flex" flexWrap="wrap" mt={2}>
                                {Array.isArray(task.documents) && task.documents.map((src, index) => {
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
                                            handleTaskClearDocument(report.id, task.id, index)
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
                              onClick={() => handleRemoveTask(report.id, task.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Grid>
                        </Grid>
                      ))}
                    </Box>
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
          )}

          {/* Success Snackbar */}
          <Snackbar
            open={openSuccessSnackbar}
            autoHideDuration={6000}
            onClose={() => setOpenSuccessSnackbar(false)}
          >
            <Alert onClose={() => setOpenSuccessSnackbar(false)} severity="success" sx={{ width: '100%' }}>
              {successSnackbarMessage}
            </Alert>
          </Snackbar>

          {/* Error Snackbar */}
          <Snackbar
            open={openErrorSnackbar}
            autoHideDuration={6000}
            onClose={() => setOpenErrorSnackbar(false)}
          >
            <Alert onClose={() => setOpenErrorSnackbar(false)} severity="error" sx={{ width: '100%' }}>
              {errorSnackbarMessage}
            </Alert>
          </Snackbar>
        </Paper>
      </Modal>
    );
  };

  export default InspectionModal;
