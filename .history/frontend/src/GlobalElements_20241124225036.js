// GlobalElements.js
import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import {
  FormControlLabel,
  Checkbox,
  Card,
  Box,
  Button,
  TextField,
  Grid,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  useTheme,
  IconButton,
  Modal,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Autocomplete, // Import Autocomplete
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ClearIcon from "@mui/icons-material/Clear";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DescriptionIcon from "@mui/icons-material/Description";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import UndoIcon from "@mui/icons-material/Undo";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import SaveIcon from "@mui/icons-material/Save";
import { useTable } from "react-table";
import { v4 as uuidv4 } from "uuid";
import { useMjopContext } from "./MjopContext";
import inspectionTasks from "./inspectionTasks.json"; // Importing inspectionTasks.json
import taken from "./taken.json";
import ImageAnnotation from "./ImageAnnotation";

const categories = Object.keys(taken.onderhoudstaken).map((key) => key);

// Function to extract gebreken
const extractGebreken = (
  elementName,
  type,
  material,
  data,
  gebrekenFromState // Renamed for clarity
) => {
  const element = data.find((task) => task.name === elementName);
  let gebreken = {};

  if (
    element &&
    element.gebreken &&
    element.gebreken[type] &&
    element.gebreken[type][material]
  ) {
    gebreken = { ...element.gebreken[type][material] };
  }

  // Add gebreken from state (including custom gebreken)
  if (gebrekenFromState && gebrekenFromState[type]) {
    for (const severity in gebrekenFromState[type]) {
      if (!gebreken[severity]) {
        gebreken[severity] = [];
      }
      gebreken[severity] = [
        ...new Set([
          ...(gebreken[severity] || []),
          ...(gebrekenFromState[type][severity] || []),
        ]),
      ];
    }
  }

  return gebreken;
};

const GlobalElements = ({ t }) => {
  const {
    state: { globalElements, globalSpaces, newElement },
    handleAddElement,
    handleEditElement,
    saveData,
    handleDeleteElement,
    resetNewElement,
    setNewElement,
    addGebrek,
    removeGebrek,
    addGebreken, // Added this line
    // Add other necessary functions if needed
  } = useMjopContext();

  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [imagePreviews, setImagePreviews] = useState([]);
  const [documentPreviews, setDocumentPreviews] = useState([]);
  const [photosModalOpen, setPhotosModalOpen] = useState(false);
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [openImageModal, setOpenImageModal] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [expandedElement, setExpandedElement] = useState(null);

  const theme = useTheme();

  const [customGebrek, setCustomGebrek] = useState("");
  const [customGebrekSeverity, setCustomGebrekSeverity] = useState("gering");

  const [isSaving, setIsSaving] = useState(false); // Loading indicator

  const steps = [
    "Element Details",
    "Ruimte Selectie",
    "Bestanden Uploaden",
    "Gebreken & Inspecties",
    "Review & Opslaan",
  ];

  // Initialize availableElements with unique IDs
  const availableElementsWithIds = useMemo(() => {
    const idCount = {};
    return inspectionTasks.map((element) => {
      let uniqueId = element.id || uuidv4(); // Assign unique ID if missing

      // Check for duplicate IDs and make them unique
      if (idCount[uniqueId]) {
        idCount[uniqueId] += 1;
        uniqueId = `${uniqueId}-${idCount[uniqueId]}`;
      } else {
        idCount[uniqueId] = 1;
      }

      return {
        ...element,
        id: uniqueId,
      };
    });
  }, []);

  // Check for duplicate IDs (Optional: For debugging)
  useEffect(() => {
    const ids = availableElementsWithIds.map((el) => el.id);
    const uniqueIds = new Set(ids);
    if (uniqueIds.size !== ids.length) {
      console.warn("Duplicate IDs detected in availableElementsWithIds:", ids);
    }
  }, [availableElementsWithIds]);

  // Filter elements based on search term
  const filteredElements = useMemo(() => {
    return availableElementsWithIds.filter(
      (element) =>
        element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (element.description &&
          element.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, availableElementsWithIds]);

  // Define table columns
  const columns = useMemo(
    () => [
      {
        Header: "Elementnaam",
        accessor: "name",
      },
      {
        Header: "Beschrijving",
        accessor: "description",
      },
      {
        Header: "Interval",
        accessor: "interval",
      },
      {
        Header: "Ruimte",
        accessor: "spaceId",
        Cell: ({ value }) => {
          const space = globalSpaces.find((space) => space.id === value);
          return space ? space.name : "";
        },
      },
      {
        Header: "Bestanden",
        accessor: "files",
        Cell: ({ row }) => (
          <Box display="flex" justifyContent="center">
            <IconButton
              color="primary"
              onClick={() => handleOpenDocumentsModal(row.original.documents)}
              aria-label="open documents modal"
            >
              <InsertDriveFileIcon />
            </IconButton>
            <IconButton
              color="primary"
              onClick={() => handleOpenPhotosModal(row.original.photos)}
              aria-label="open photos modal"
            >
              <AddPhotoAlternateIcon />
            </IconButton>
          </Box>
        ),
      },
      {
        Header: "Acties",
        Cell: ({ row }) => (
          <Box display="flex" justifyContent="center">
            <IconButton
              color="primary"
              onClick={() => {
                handleSelectElement(row.original, true, true);
              }}
              aria-label="edit element"
            >
              <EditIcon />
            </IconButton>
            <IconButton
              color="secondary"
              onClick={() => handleDeleteElement(row.original.id)}
              aria-label="delete element"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        ),
      },
    ],
    [globalSpaces, handleDeleteElement]
  );

  const data = useMemo(() => globalElements, [globalElements]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    rows,
  } = useTable({
    columns,
    data,
  });

  // Handle selecting an element for editing
  const handleSelectElement = (
    element,
    isEditMode = false,
    fromTable = false
  ) => {
    console.log("handleSelectElement called with:", { element, isEditMode, fromTable });

    const selectedSpace = globalSpaces.find(
      (space) => space.id === element.spaceId
    );

    // Check if type is defined
    if (!element.type) {
      console.error("Element type is undefined:", element);
      return;
    }

    // Extract gebreken including custom gebreken from newElement.gebreken
    const availableGebreken = extractGebreken(
      element.name,
      element.type,
      element.material,
      inspectionTasks,
      newElement.gebreken // Use newElement.gebreken
    );

    console.log("Available Gebreken:", availableGebreken);

    // Set initialGebreken
    let initialGebreken = {};

    if (isEditMode && element.gebreken) {
      // When editing, retain existing gebreken
      initialGebreken = element.gebreken;
    } else {
      // When adding, initialize gebreken as empty (none selected)
      initialGebreken = { ernstig: [], serieus: [], gering: [] };
    }

    console.log("Initial Gebreken set to:", initialGebreken);

    // Update newElement state
    setNewElement({
      id: fromTable ? element.id : "",
      name: element.name,
      description: element.description,
      interval: element.interval,
      type: element.type || "",
      material: element.material || "",
      customMaterial: element.customMaterial || "",
      photos: element.photos || [],
      documents: element.documents || [],
      gebreken: initialGebreken, // Empty when adding, existing when editing
      inspectionReport: Array.isArray(element.inspectionReport)
        ? element.inspectionReport.map(report => ({
            id: report.id,
            description: report.description,
            inspectionDone: report.inspectionDone,
            inspectionDate: report.inspectionDate,
            tasks: report.tasks || [], // Ensure tasks are preserved
          }))
        : [
            {
              id: uuidv4(),
              description: "",
              inspectionDone: false,
              inspectionDate: null,
              tasks: [],
            },
          ],
      tasks: Array.isArray(element.tasks) ? element.tasks : [],
      annotations: element.annotations || [],
      categories: element.categories || [],
      levensduur: element.levensduur || "",
      aanschafDatum: element.aanschafDatum || "",
      vervangingsKosten: element.vervangingsKosten || "",
    });

    // Ensure 'tasks' is always an array
    if (!Array.isArray(newElement.tasks)) {
      setNewElement((prev) => ({ ...prev, tasks: [] }));
    }

    setMaterials(materials);

    setIsEditing(fromTable && isEditMode);

    // Updated code to handle undefined selectedSpace and selectedSpace.image
    if (selectedSpace && typeof selectedSpace.image === "string") {
      const imageWithAnnotations = selectedSpace.image.startsWith("http")
        ? selectedSpace.image
        : `http://localhost:5000/${selectedSpace.image.replace(/\\/g, "/")}`;

      setSelectedImage(imageWithAnnotations);
      setAnnotations(selectedSpace.annotations || []);
    } else {
      // Handle the case where there's no image or selectedSpace
      setSelectedImage(null);
      setAnnotations([]);
    }

    setActiveStep(0);
  };

  // Handle type change from form
  const handleTypeChange = (e) => {
    const selectedType = e.target.value;
    const element = inspectionTasks.find(
      (task) => task.name === newElement.name
    );
    if (!element) {
      return;
    }

    const availableMaterials = Object.keys(
      element.gebreken[selectedType] || {}
    );
    setMaterials(availableMaterials);

    setNewElement({
      ...newElement,
      type: selectedType,
      material: "",
      // Remove customMaterial as it's now handled by Autocomplete
      gebreken: { ernstig: [], serieus: [], gering: [] }, // Maintain structure
      tasks: [], // Reset tasks if type changes
    });
  };

  // Handle material change with Autocomplete
  const handleMaterialChange = (event, value) => {
    const selectedMaterial = value || ""; // value can be string or null

    // Remove gebreken for the previous material
    const updatedGebreken = { ...newElement.gebreken };

    if (
      newElement.type &&
      updatedGebreken[newElement.type] &&
      updatedGebreken[newElement.type][newElement.material]
    ) {
      // Iterate over all severity categories and remove gebreken for the old material
      ["ernstig", "serieus", "gering"].forEach((severity) => {
        updatedGebreken[newElement.type][severity] = updatedGebreken[newElement.type][severity].filter(
          (g) => g.material !== newElement.material
        );
      });

      // Clean up empty arrays
      ["ernstig", "serieus", "gering"].forEach((severity) => {
        if (
          updatedGebreken[newElement.type][severity] &&
          updatedGebreken[newElement.type][severity].length === 0
        ) {
          delete updatedGebreken[newElement.type][severity];
        }
      });

      // Remove type if no materials remain
      if (
        Object.keys(updatedGebreken[newElement.type] || {}).length === 0
      ) {
        delete updatedGebreken[newElement.type];
      }
    }

    setNewElement({
      ...newElement,
      material: selectedMaterial,
      gebreken: updatedGebreken,
    });
  };

  // Open image modal
  const handleOpenImageModal = (src) => {
    setSelectedImage(src);
    setOpenImageModal(true);
  };

  const handleCloseImageModal = () => {
    setOpenImageModal(false);
  };

  // Open documents modal
  const handleOpenDocumentsModal = (documents) => {
    setSelectedDocuments(
      documents.map((doc) =>
        typeof doc === "string"
          ? `http://localhost:5000/${doc.replace(/\\/g, "/")}`
          : URL.createObjectURL(doc)
      )
    );
    setDocumentsModalOpen(true);
  };

  // Upload file to server
  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await axios.post("http://localhost:5000/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data.filePath;
    } catch (error) {
      console.error("Fout bij het uploaden van bestand:", error);
      return null;
    }
  };

  // Handle photo file change
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    const fileUrls = await Promise.all(files.map((file) => uploadFile(file)));
    const validFileUrls = fileUrls.filter((url) => url !== null);

    setNewElement({
      ...newElement,
      photos: [...(newElement.photos || []), ...validFileUrls],
    });
  };

  // Handle document file change
  const handleDocumentChange = async (e) => {
    const files = Array.from(e.target.files);
    const fileUrls = await Promise.all(files.map((file) => uploadFile(file)));
    const validFileUrls = fileUrls.filter((url) => url !== null);

    setNewElement({
      ...newElement,
      documents: [...(newElement.documents || []), ...validFileUrls],
    });
  };

  // Clear a specific photo
  const handleClearImage = (index) => {
    const updatedPhotos = Array.from(newElement.photos || []).filter(
      (_, i) => i !== index
    );
    setNewElement({ ...newElement, photos: updatedPhotos });
  };

  // Clear a specific document
  const handleClearDocument = (index) => {
    const updatedDocuments = Array.from(newElement.documents || []).filter(
      (_, i) => i !== index
    );
    setNewElement({ ...newElement, documents: updatedDocuments });
  };

  // Reset newElement
  const handleResetNewElement = () => {
    resetNewElement();
    setImagePreviews([]);
    setDocumentPreviews([]);
    setSelectedImage(null);
    setAnnotations([]);
    setIsEditing(false);
    setActiveStep(0);
  };

  // Handle save element
  const handleSaveElement = async () => {
    console.log("Saving element with gebreken and tasks:", newElement);

    try {
      setIsSaving(true); // Start loading indicator
      let updatedGlobalElements;

      if (isEditing) {
        handleEditElement(newElement); // Edit the element

        // Update globalElements array
        updatedGlobalElements = globalElements.map((el) =>
          el.id === newElement.id ? newElement : el
        );
      } else {
        const newElementWithId = handleAddElement(newElement); // Add new element with ID

        // Update globalElements array
        updatedGlobalElements = [...globalElements, newElementWithId];
      }

      await saveData(updatedGlobalElements); // Save to database
      console.log("Element data saved successfully to the database.");

      handleResetNewElement();
    } catch (error) {
      console.error("Fout bij het opslaan van element:", error);
      // setErrors({ general: "Fout bij het opslaan van het element." });
    } finally {
      setIsSaving(false); // Stop loading indicator
    }
  };

  // Handle save data from save button
  const handleSaveData = async () => {
    try {
      setIsSaving(true); // Start loading indicator
      await saveData(); // Call the saveData function
      console.log("Data saved successfully.");
      // setSuccessMessage("Data succesvol opgeslagen.");
    } catch (error) {
      console.error("Error saving data:", error);
      // setErrors({ general: "Fout bij het opslaan van data." });
    } finally {
      setIsSaving(false); // Stop loading indicator
    }
  };

  // Open photos modal
  const handleOpenPhotosModal = (photos) => {
    setSelectedPhotos(
      photos.map((photo) =>
        typeof photo === "string"
          ? `http://localhost:5000/${photo.replace("\\", "/")}`
          : URL.createObjectURL(photo)
      )
    );
    setPhotosModalOpen(true);
  };

  // Close photos modal
  const handleClosePhotosModal = () => setPhotosModalOpen(false);

  // Close documents modal
  const handleCloseDocumentsModal = () => setDocumentsModalOpen(false);

  // Add an annotation
  const handleAddAnnotation = (position) => {
    const newAnnotation = {
      ...position,
    };
    setNewElement({
      ...newElement,
      annotations: [...newElement.annotations, newAnnotation],
    });
  };

  // Undo the last annotation
  const handleUndoAnnotation = () => {
    setNewElement({
      ...newElement,
      annotations: newElement.annotations.slice(0, -1),
    });
  };

  // Delete all annotations
  const handleDeleteAllAnnotations = () => {
    setNewElement({
      ...newElement,
      annotations: [],
    });
  };

  // Handle stepper navigation
  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleSaveElement();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleStep = (step) => {
    setActiveStep(step);
  };

  // Handle type selection from sidebar
  const handleTypeChangeFromSidePanel = (element, selectedType) => {
    console.log("handleTypeChangeFromSidePanel called with:", {
      element,
      selectedType,
    });

    const gebrekenForType = element.gebreken[selectedType];
    if (!gebrekenForType) {
      console.error(`No gebreken found for type: ${selectedType}`);
      return;
    }

    const availableMaterials = Object.keys(gebrekenForType);
    console.log("Available materials for type:", availableMaterials);

    setMaterials(availableMaterials);

    setNewElement({
      ...newElement,
      name: element.name,
      description: element.description,
      interval: element.interval,
      type: selectedType,
      material: "",
      // Remove customMaterial as it's now handled by Autocomplete
      gebreken: { ernstig: [], serieus: [], gering: [] }, // Maintain structure
      tasks: [], // Reset tasks if type changes
      levensduur: "",
      aanschafDatum: "",
      vervangingsKosten: "",
    });

    // Reset steps
    setActiveStep(0);
  };

  // Handle expanding/collapsing elements in sidebar
  const handleExpandClick = (elementId) => {
    setExpandedElement((prev) => (prev === elementId ? null : elementId));
  };

  // Handle adding a custom gebrek
  const handleAddCustomGebrek = () => {
    if (customGebrek.trim() === "") return;

    const severity = customGebrekSeverity;
    const gebrekName = customGebrek.trim();

    if (!severity) {
      return;
    }

    // Add gebrek under the current severity
    addGebreken("gebreken", { category: severity, gebrekName }); // Corrected parameter order

    setCustomGebrek("");
    setCustomGebrekSeverity("gering");
  };

  // Function to select all gebreken of a certain severity
  const handleSelectAllGebreken = (severity, gebrekenList) => {
    // Add all gebreken of this severity without duplicates
    gebrekenList.forEach((gebrek) => {
      addGebrek(severity, gebrek);
    });
  };

  // Helper function to render gebreken (Updated with checkboxes and Select All)
  const renderGebreken = () => {
    // Get available gebreken based on selected type and material, including custom gebreken
    const type = newElement.type; // 'type' refers to 'type'
    const material = newElement.material; // Now handled by Autocomplete
    const availableGebreken = extractGebreken(
      newElement.name,
      type,
      material,
      inspectionTasks,
      newElement.gebreken // Use newElement.gebreken
    );

    console.log("Available Gebreken:", availableGebreken);
    console.log("Selected Gebreken:", newElement.gebreken);

    if (!availableGebreken || Object.keys(availableGebreken).length === 0) {
      return (
        <Typography variant="body1">
          {type && material
            ? "No gebreken available for this selection."
            : "Please select Type and Material to view gebreken."}
        </Typography>
      );
    }

    return (
      <Box>
        {Object.keys(availableGebreken).map((severityLevel, severityIndex) => (
          <Box key={`severity-${severityLevel}-${severityIndex}`} mb={2}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography
                variant="body1"
                sx={{
                  fontWeight: "bold",
                  textTransform: "capitalize",
                  color:
                    severityLevel === "ernstig"
                      ? theme.palette.error.main
                      : severityLevel === "serieus"
                      ? theme.palette.warning.main
                      : theme.palette.success.main,
                }}
              >
                Severity: {severityLevel.charAt(0).toUpperCase() + severityLevel.slice(1)}
              </Typography>
              <Button
                size="small"
                onClick={() => handleSelectAllGebreken(severityLevel, availableGebreken[severityLevel] || [])}
                aria-label={`Select all ${severityLevel} gebreken`}
              >
                Select All
              </Button>
            </Box>
            {Array.isArray(availableGebreken[severityLevel]) && availableGebreken[severityLevel].length > 0 ? (
              <List>
                {availableGebreken[severityLevel].map((gebrek, gebrekIndex) => {
                  const isChecked =
                    newElement.gebreken[severityLevel] &&
                    newElement.gebreken[severityLevel].includes(gebrek);

                  console.log(`Rendering checkbox for gebrek: ${gebrek} | Checked: ${isChecked}`);

                  return (
                    <ListItem key={`gebrek-${severityLevel}-${gebrek}-${gebrekIndex}`}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                addGebrek(severityLevel, gebrek);
                              } else {
                                removeGebrek(severityLevel, gebrek);
                              }
                            }}
                            name={`gebrek-${severityLevel}-${gebrek}`}
                            aria-label={`Toggle ${gebrek} as ${severityLevel}`}
                          />
                        }
                        label={gebrek}
                      />
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <Typography variant="body2">No gebreken available.</Typography>
            )}
          </Box>
        ))}
      </Box>
    );
  };

  // Render step content based on active step
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                label="Name of New Element"
                value={newElement.name}
                onChange={(e) =>
                  setNewElement({ ...newElement, name: e.target.value })
                }
                sx={{ mb: 2 }}
                aria-label="element name"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                type="number"
                label="Inspection Interval (in months)"
                value={newElement.interval || ""}
                onChange={(e) =>
                  setNewElement({ ...newElement, interval: e.target.value })
                }
                sx={{ mb: 2 }}
                aria-label="inspection interval"
              />
            </Grid>

            {/* Multi-Select Dropdown for Categories */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                <InputLabel>Type of Work</InputLabel>
                <Select
                  multiple
                  value={newElement.categories || []}
                  onChange={(e) =>
                    setNewElement({ ...newElement, categories: e.target.value })
                  }
                  renderValue={(selected) => selected.join(", ")}
                  label="Select Categories"
                  aria-label="select categories"
                >
                  {categories.map((category, categoryIndex) => (
                    <MenuItem
                      key={`category-${category}-${categoryIndex}`}
                      value={category}
                    >
                      <Checkbox
                        checked={newElement.categories?.includes(category)}
                      />
                      <ListItemText primary={category} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                <InputLabel>Select Type</InputLabel>
                <Select
                  value={newElement.type}
                  onChange={handleTypeChange}
                  label="Select Type"
                  aria-label="select type"
                >
                  {Object.keys(
                    inspectionTasks.find(
                      (task) => task.name === newElement.name
                    )?.gebreken || {}
                  ).map((type, typeIndex) => (
                    <MenuItem key={`type-${type}-${typeIndex}`} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                <Autocomplete
                  freeSolo
                  options={materials}
                  value={newElement.material}
                  onChange={handleMaterialChange}
                  onInputChange={handleMaterialChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select or Enter Material"
                      variant="outlined"
                      aria-label="select or enter material"
                    />
                  )}
                />
              </FormControl>
            </Grid>
            {newElement.material === "Other" && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Custom Material"
                  value={newElement.customMaterial}
                  onChange={(e) =>
                    setNewElement({
                      ...newElement,
                      customMaterial: e.target.value,
                    })
                  }
                  sx={{ mb: 2 }}
                  aria-label="custom material"
                />
              </Grid>
            )}

            {/* Removed Quantity and Unit Type fields */}

            <Grid item xs={12}>
              <TextField
                fullWidth
                variant="outlined"
                label="Description of New Element"
                multiline
                rows={4}
                value={newElement.description}
                onChange={(e) =>
                  setNewElement({ ...newElement, description: e.target.value })
                }
                sx={{ mb: 2 }}
                aria-label="element description"
              />
            </Grid>

            {/* New fields for Levensduur, Aanschaf Datum, and Vervangings Kosten */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                label="Lifetime (in years)"
                type="number"
                value={newElement.levensduur || ""}
                onChange={(e) =>
                  setNewElement({ ...newElement, levensduur: e.target.value })
                }
                sx={{ mb: 2 }}
                aria-label="lifetime in years"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                label="Acquisition Date"
                type="date"
                InputLabelProps={{
                  shrink: true,
                }}
                value={newElement.aanschafDatum || ""}
                onChange={(e) =>
                  setNewElement({
                    ...newElement,
                    aanschafDatum: e.target.value,
                  })
                }
                sx={{ mb: 2 }}
                aria-label="acquisition date"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                label="Replacement Cost"
                type="number"
                value={newElement.vervangingsKosten || ""}
                onChange={(e) =>
                  setNewElement({
                    ...newElement,
                    vervangingsKosten: e.target.value,
                  })
                }
                sx={{ mb: 2 }}
                aria-label="replacement cost"
              />
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl
                fullWidth
                variant="outlined"
                sx={{ mb: 2 }}
              >
                <InputLabel>Select Space</InputLabel>
                <Select
                  value={newElement.spaceId}
                  onChange={(e) => {
                    setNewElement({ ...newElement, spaceId: e.target.value });
                    const selectedSpace = globalSpaces.find(
                      (space) => space.id === e.target.value
                    );
                    // Updated code to handle undefined selectedSpace and selectedSpace.image
                    if (selectedSpace && typeof selectedSpace.image === "string") {
                      const imageWithAnnotations = selectedSpace.image.startsWith("http")
                        ? selectedSpace.image
                        : `http://localhost:5000/${selectedSpace.image.replace(
                            /\\/g,
                            "/"
                          )}`;
                      setSelectedImage(imageWithAnnotations);
                      setAnnotations(selectedSpace.annotations || []);
                    } else {
                      // Handle case when there's no image
                      setSelectedImage(null);
                      setAnnotations([]);
                    }
                  }}
                  label="Select Space"
                  aria-label="select space"
                >
                  <MenuItem value="">
                    <em>Select Space</em>
                  </MenuItem>
                  {globalSpaces.map((space) => (
                    <MenuItem key={`space-${space.id}`} value={space.id}>
                      {space.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<AddPhotoAlternateIcon />}
                  sx={{ mb: 2 }}
                  aria-label="upload photos"
                >
                  Upload Photos
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </Button>
                <Box display="flex" flexWrap="wrap" mt={2}>
                  {Array.isArray(newElement.photos) && newElement.photos.map((src, index) => {
                    const imgSrc =
                      typeof src === "string"
                        ? `http://localhost:5000/${src.replace("\\", "/")}`
                        : URL.createObjectURL(src);
                    return (
                      <Box
                        key={`image-${imgSrc}-${index}`}
                        position="relative"
                        mr={2}
                        mb={2}
                      >
                        <img
                          src={imgSrc}
                          alt={`Photo ${index}`}
                          style={{
                            width: "100px",
                            height: "100px",
                            objectFit: "contain",
                          }}
                        />
                        <Box display="flex" justifyContent="center" mt={1}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              const link = document.createElement("a");
                              link.href = imgSrc;
                              link.download = `photo-${index}`;
                              link.click();
                            }}
                            aria-label={`download photo ${index}`}
                          >
                            <DownloadIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleClearImage(index)}
                            aria-label={`clear photo ${index}`}
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
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<InsertDriveFileIcon />}
                  sx={{ mb: 2 }}
                  aria-label="upload documents"
                >
                  Upload Documents
                  <input
                    type="file"
                    hidden
                    multiple
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleDocumentChange}
                  />
                </Button>
                <Box display="flex" flexWrap="wrap" mt={2}>
                  {Array.isArray(newElement.documents) && newElement.documents.map((src, index) => {
                    const docSrc =
                      typeof src === "string"
                        ? `http://localhost:5000/${src.replace("\\", "/")}`
                        : URL.createObjectURL(src);
                    const fileType = docSrc.split(".").pop().toLowerCase();
                    let icon;
                    if (fileType === "pdf") {
                      icon = <PictureAsPdfIcon style={{ fontSize: 40 }} />;
                    } else if (
                      fileType === "doc" ||
                      fileType === "docx"
                    ) {
                      icon = <DescriptionIcon style={{ fontSize: 40 }} />;
                    } else {
                      icon = <InsertDriveFileIcon style={{ fontSize: 40 }} />;
                    }

                    return (
                      <Box
                        key={`document-${docSrc}-${index}`}
                        position="relative"
                        mr={2}
                        mb={2}
                      >
                        <a href={docSrc} download style={{ margin: "0 8px" }} aria-label={`download document ${index}`}>
                          {icon}
                        </a>
                        <Box display="flex" justifyContent="center" mt={1}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              const link = document.createElement("a");
                              link.href = docSrc;
                              link.download = `document-${index}`;
                              link.click();
                            }}
                            aria-label={`download document ${index}`}
                          >
                            <DownloadIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleClearDocument(index)}
                            aria-label={`clear document ${index}`}
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
        );
      case 3:
        // Gebreken & Inspecties
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6">Gebreken</Typography>
              <Divider sx={{ mb: 2 }} />
              {renderGebreken()}
              {/* Add Custom Gebreken */}
              <Box mt={4}>
                <Typography variant="h6">Add Custom Gebreken</Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      label="Custom Gebrek"
                      value={customGebrek}
                      onChange={(e) => setCustomGebrek(e.target.value)}
                      aria-label="custom gebrek"
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Severity</InputLabel>
                      <Select
                        value={customGebrekSeverity}
                        onChange={(e) => setCustomGebrekSeverity(e.target.value)}
                        label="Severity"
                        aria-label="select severity"
                      >
                        <MenuItem value="ernstig">Ernstig</MenuItem>
                        <MenuItem value="serieus">Serieus</MenuItem>
                        <MenuItem value="gering">Gering</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleAddCustomGebrek}
                      fullWidth
                      disabled={
                        customGebrek.trim() === "" ||
                        (newElement.material === "Other" && newElement.customMaterial.trim() === "")
                      }
                      aria-label="add custom gebrek"
                    >
                      Add
                    </Button>
                    {newElement.material === "Other" && newElement.customMaterial.trim() === "" && (
                      <Typography variant="body2" color="error" mt={1}>
                        Please fill in the custom material to add gebreken.
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </Box>
            </Grid>

            {selectedImage && (
              <Grid item xs={12}>
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6">
                    Selected Space: Image and Annotations
                  </Typography>
                  <Box display="flex" justifyContent="flex-start" gap={2} mb={2}>
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<UndoIcon />}
                      onClick={handleUndoAnnotation}
                      disabled={newElement.annotations.length === 0}
                      aria-label="undo annotation"
                    >
                      Undo
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<DeleteSweepIcon />}
                      onClick={handleDeleteAllAnnotations}
                      disabled={newElement.annotations.length === 0}
                      aria-label="delete all annotations"
                    >
                      Delete All
                    </Button>
                  </Box>
                  <ImageAnnotation
                    image={selectedImage}
                    annotations={annotations}
                    elementAnnotations={newElement.annotations}
                    onAddAnnotation={handleAddAnnotation}
                    annotationColor="green"
                  />
                </Box>
              </Grid>
            )}
          </Grid>
        );
      case 4:
        // Review & Save
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6">Review Data</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body1">
                <strong>Name of New Element:</strong> {newElement.name}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body1">
                <strong>Inspection Interval:</strong> {newElement.interval} months
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body1">
                <strong>Selected Space:</strong>{" "}
                {globalSpaces.find((space) => space.id === newElement.spaceId)?.name || "No space selected"}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body1">
                <strong>Select Type:</strong> {newElement.type}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body1">
                <strong>Select Material:</strong> {newElement.material}
              </Typography>
            </Grid>

            {newElement.material === "Other" && (
              <Grid item xs={12} md={6}>
                <Typography variant="body1">
                  <strong>Custom Material:</strong>{" "}
                  {newElement.customMaterial}
                </Typography>
              </Grid>
            )}

            <Grid item xs={12}>
              <Typography variant="body1">
                <strong>Description:</strong> {newElement.description}
              </Typography>
            </Grid>

            {newElement.levensduur && (
              <Grid item xs={12} md={6}>
                <Typography variant="body1">
                  <strong>Lifetime:</strong> {newElement.levensduur} years
                </Typography>
              </Grid>
            )}

            {newElement.aanschafDatum && (
              <Grid item xs={12} md={6}>
                <Typography variant="body1">
                  <strong>Acquisition Date:</strong> {newElement.aanschafDatum}
                </Typography>
              </Grid>
            )}

            {newElement.vervangingsKosten && (
              <Grid item xs={12} md={6}>
                <Typography variant="body1">
                  <strong>Replacement Cost:</strong> €{newElement.vervangingsKosten}
                </Typography>
              </Grid>
            )}

            {newElement.categories.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="body1">
                  <strong>Type of Work:</strong> {newElement.categories.join(", ")}
                </Typography>
              </Grid>
            )}

            {newElement.photos.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="body1">
                  <strong>Uploaded Photos:</strong> {newElement.photos.length} file(s)
                </Typography>
              </Grid>
            )}

            {newElement.documents.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="body1">
                  <strong>Uploaded Documents:</strong> {newElement.documents.length} file(s)
                </Typography>
              </Grid>
            )}

            {/* Display Gebreken */}
            <Grid item xs={12}>
              <Typography variant="h6">Gebreken</Typography>
              {["ernstig", "serieus", "gering"].map((severity) => (
                <Box key={`review-gebrek-${severity}`} mb={2}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: "bold",
                      textTransform: "capitalize",
                      color:
                        severity === "ernstig"
                          ? theme.palette.error.main
                          : severity === "serieus"
                          ? theme.palette.warning.main
                          : theme.palette.success.main,
                    }}
                  >
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </Typography>
                  {Array.isArray(newElement.gebreken[severity]) && newElement.gebreken[severity].length > 0 ? (
                    <List>
                      {newElement.gebreken[severity].map((gebrek, index) => (
                        <ListItem key={`review-gebrek-${severity}-${gebrek}-${index}`}>
                          <ListItemText primary={gebrek} />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2">No gebreken.</Typography>
                  )}
                </Box>
              ))}
            </Grid>

            {/* Display Tasks */}
            <Grid item xs={12}>
              <Typography variant="h6">Tasks</Typography>
              {Array.isArray(newElement.tasks) && newElement.tasks.length > 0 ? (
                <List>
                  {newElement.tasks.map((task, index) => (
                    <ListItem key={`review-task-${task.id}-${index}`}>
                      <ListItemText
                        primary={task.description}
                        secondary={`Planned: ${task.planned ? "Yes" : "No"}${task.planned ? ` | Work Date: ${task.plannedData.workDate || "Not scheduled"} | Estimated Price: €${task.plannedData.estimatedPrice || 0}` : ""}`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2">No tasks added.</Typography>
              )}
            </Grid>

            {/* Display Inspection Report */}
            {Array.isArray(newElement.inspectionReport) && newElement.inspectionReport.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="h6">Inspection Reports</Typography>
                {newElement.inspectionReport.map((report, index) => (
                  <Box key={`review-inspectierapport-${report.id}-${index}`} mb={2}>
                    <Typography variant="subtitle1"><strong>Inspection Report {index + 1}:</strong></Typography>
                    <Typography variant="body1">
                      <strong>Description:</strong> {report.description || "No description."}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Inspection Done:</strong> {report.inspectionDone ? "Yes" : "No"}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Inspection Date:</strong> {report.inspectionDate || "Not filled in"}
                    </Typography>
                  </Box>
                ))}
              </Grid>
            )}

            {selectedImage && (
              <Grid item xs={12}>
                <Typography variant="body1">
                  <strong>
                    Selected Space: Image and Annotations
                  </strong>
                </Typography>
              </Grid>
            )}
          </Grid>
        );
      default:
        return "Unknown step";
    }
  };

  return (
    <Box display="flex" height="100vh">
      {isSidebarOpen && (
        <Paper
          className="sidebar"
          sx={{
            width: "20%",
            p: 2,
            boxShadow: 4,
            backgroundColor: "background.paper",
            transition: "width 0.3s ease",
            flexShrink: 0,
            overflowY: "auto",
          }}
        >
          <Typography variant="h6" gutterBottom>
            Available Elements
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search elements"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
            aria-label="search elements"
          />
          <List>
            {filteredElements.map((element, index) => {
              const isExpanded = expandedElement === element.id;
              const parentColor = element.installatie
                ? theme.palette.primary.main
                : theme.palette.secondary.main;

              // Combine id with index to ensure uniqueness
              const uniqueKey = `sidebar-element-${element.id}-${index}`;

              return (
                <React.Fragment key={uniqueKey}>
                  <ListItem
                    button
                    onClick={() => handleExpandClick(element.id)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      position: "relative",
                      padding: "16px",
                      marginBottom: "12px",
                      backgroundColor: isExpanded
                        ? theme.palette.grey[100]
                        : "white",
                      boxShadow: "0px 4px 15px rgba(0, 0, 0, 0.05)",
                      borderRadius: "12px",
                      cursor: "pointer",
                      transition:
                        "background-color 0.3s ease, box-shadow 0.3s ease",
                      "&:hover": {
                        backgroundColor: theme.palette.grey[200],
                        boxShadow: "0px 6px 20px rgba(0, 0, 0, 0.1)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: "6px",
                        height: "100%",
                        position: "absolute",
                        left: 0,
                        top: 0,
                        backgroundColor: parentColor,
                        borderRadius: "6px 0 0 6px",
                      }}
                    />
                    <ListItemText
                      primary={
                        <Typography
                          sx={{
                            fontWeight: "bold",
                            fontSize: "1.2rem",
                            color: theme.palette.text.primary,
                          }}
                        >
                          {element.name}
                        </Typography>
                      }
                      sx={{ marginLeft: "30px" }}
                    />
                  </ListItem>
                  {isExpanded && <Divider sx={{ margin: "8px 0" }} />}
                  {isExpanded && (
                    <Box
                      sx={{
                        pl: 5,
                        backgroundColor: theme.palette.grey[50],
                        borderRadius: "8px",
                        padding: "10px 0",
                      }}
                    >
                      {Object.keys(element.gebreken || {}).map(
                        (type, typeIndex) => (
                          <ListItem
                            button
                            key={`type-${element.id}-${type}-${typeIndex}-${index}`}
                            onClick={() =>
                              handleTypeChangeFromSidePanel(element, type)
                            }
                            sx={{
                              padding: "12px 20px",
                              backgroundColor: "transparent",
                              marginBottom: "6px",
                              borderRadius: "8px",
                              cursor: "pointer",
                              transition: "background-color 0.2s ease",
                              "&:hover": {
                                backgroundColor: theme.palette.action.hover,
                              },
                            }}
                          >
                            <ListItemText
                              primary={
                                <Typography
                                  sx={{
                                    fontSize: "1rem",
                                    color: theme.palette.text.secondary,
                                  }}
                                >
                                  {type}
                                </Typography>
                              }
                            />
                          </ListItem>
                        )
                      )}
                    </Box>
                  )}
                </React.Fragment>
              );
            })}
          </List>
        </Paper>
      )}

      <Box
        className="content"
        component="section"
        sx={{
          width: isSidebarOpen ? "80%" : "100%",
          p: 2,
          flexGrow: 1,
          overflowY: "auto",
        }}
      >
        <IconButton
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          color="secondary"
          sx={{
            padding: "8px",
            "&:hover": {
              backgroundColor: "secondary.dark",
            },
          }}
          aria-label={isSidebarOpen ? "sluit sidebar" : "open sidebar"}
        >
          {isSidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>

        <Typography variant="h5" sx={{ mt: 2, mb: 2 }}>
          Global Elements
        </Typography>

        {/* Save Button */}
        <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSaveData}
            disabled={isSaving}
            aria-label="save elements"
          >
            Save
          </Button>
          {isSaving && <CircularProgress size={24} sx={{ ml: 2 }} />}
        </Box>

        <Card sx={{ mb: 2, p: 2 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label, index) => (
              <Step key={`step-${label}-${index}`}>
                <StepLabel onClick={() => handleStep(index)}>
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
          <Box mt={2}>{renderStepContent(activeStep)}</Box>
          <Box display="flex" justifyContent="space-between" mt={4}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              aria-label="go back"
            >
              Back
            </Button>
            <Box display="flex" alignItems="center">
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={isSaving}
                aria-label={activeStep === steps.length - 1 ? "save elements" : "next step"}
              >
                {activeStep === steps.length - 1 ? "Save" : "Next"}
              </Button>
              {isSaving && <CircularProgress size={24} sx={{ ml: 2 }} />}
            </Box>
          </Box>
        </Card>

        {/* Table Section */}
        <Box sx={{ mt: 4 }}>
          <table {...getTableProps()} style={{ width: "100%" }}>
            <thead>
              {headerGroups.map((headerGroup, headerGroupIndex) => (
                <tr
                  {...headerGroup.getHeaderGroupProps()}
                  key={`header-group-${headerGroupIndex}`}
                >
                  {headerGroup.headers.map((column, columnIndex) => (
                    <th
                      {...column.getHeaderProps()}
                      key={`header-${column.id}-${columnIndex}`}
                      style={{
                        padding: theme.spacing(1),
                        borderBottom: "1px solid #e0e0e0",
                        textAlign: "left",
                        backgroundColor: "#1976d2", // Changed to a visible color
                        color: "#ffffff",
                      }}
                    >
                      {column.render("Header")}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody {...getTableBodyProps()}>
              {rows.map((row) => {
                prepareRow(row);
                const isInstallatie = row.original?.installatie;
                const rowKey = `table-row-${row.original.id}-${uuidv4()}`; // Ensure uniqueness

                return (
                  <tr
                    {...row.getRowProps()}
                    key={rowKey}
                    style={{
                      backgroundColor: isInstallatie ? "#e0f7fa" : "#ffffff",
                      color: "#000000",
                    }}
                  >
                    {row.cells.map((cell) => {
                      const cellKey = `table-cell-${rowKey}-${cell.column.id}`;
                      return (
                        <td
                          {...cell.getCellProps()}
                          key={cellKey}
                          style={{
                            padding: theme.spacing(1),
                            borderBottom: "1px solid #e0e0e0",
                          }}
                        >
                          {cell.render("Cell")}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Box>
      </Box>

      {/* Photos Modal */}
      <Modal
        open={photosModalOpen}
        onClose={handleClosePhotosModal}
        aria-labelledby="photos-modal-title"
        aria-describedby="photos-modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            overflowY: "auto",
            maxHeight: "90vh",
          }}
        >
          <Typography id="photos-modal-title" variant="h6" component="h2">
            Uploaded Photos
          </Typography>
          <Box display="flex" flexWrap="wrap" mt={2}>
            {selectedPhotos.map((src, index) => (
              <Box
                key={`modal-photo-${src}-${index}`}
                position="relative"
                mr={2}
                mb={2}
              >
                <img
                  src={src}
                  alt={`Photo ${index}`}
                  style={{
                    width: "100px",
                    height: "100px",
                    objectFit: "contain",
                  }}
                />
                <Box display="flex" justifyContent="center" mt={1}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = src;
                      link.download = `photo-${index}`;
                      link.click();
                    }}
                    aria-label={`download photo ${index}`}
                  >
                    <DownloadIcon />
                  </IconButton>
                </Box>
              </Box>
            ))}
          </Box>
          <Button onClick={handleClosePhotosModal} sx={{ mt: 2 }} aria-label="close photos modal">
            Close
          </Button>
        </Box>
      </Modal>

      {/* Documents Modal */}
      <Modal
        open={documentsModalOpen}
        onClose={handleCloseDocumentsModal}
        aria-labelledby="documents-modal-title"
        aria-describedby="documents-modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            overflowY: "auto",
            maxHeight: "90vh",
          }}
        >
          <Typography id="documents-modal-title" variant="h6" component="h2">
            Uploaded Documents
          </Typography>
          <Box display="flex" flexWrap="wrap" mt={2}>
            {selectedDocuments.map((src, index) => {
              const fileType = src.split(".").pop().toLowerCase();
              let icon;
              if (fileType === "pdf") {
                icon = <PictureAsPdfIcon style={{ fontSize: 40 }} />;
              } else if (
                fileType === "doc" ||
                fileType === "docx"
              ) {
                icon = <DescriptionIcon style={{ fontSize: 40 }} />;
              } else {
                icon = <InsertDriveFileIcon style={{ fontSize: 40 }} />;
              }
              return (
                <Box
                  key={`modal-document-${src}-${index}`}
                  position="relative"
                  mr={2}
                  mb={2}
                >
                  <a href={src} download style={{ margin: "0 8px" }} aria-label={`download document ${index}`}>
                    {icon}
                  </a>
                  <Box display="flex" justifyContent="center" mt={1}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = src;
                        link.download = `document-${index}`;
                        link.click();
                      }}
                      aria-label={`download document ${index}`}
                    >
                      <DownloadIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleClearDocument(index)}
                      aria-label={`clear document ${index}`}
                    >
                      <ClearIcon />
                    </IconButton>
                  </Box>
                </Box>
              );
            })}
          </Box>
          <Button onClick={handleCloseDocumentsModal} sx={{ mt: 2 }} aria-label="close documents modal">
            Close
          </Button>
        </Box>
      </Modal>

      {/* Image Modal */}
      <Modal
        open={openImageModal}
        onClose={handleCloseImageModal}
        aria-labelledby="image-modal-title"
        aria-describedby="image-modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "80%",
            maxWidth: 800,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            overflowY: "auto",
            maxHeight: "90vh",
          }}
        >
          <Typography id="image-modal-title" variant="h6" component="h2">
            Image
          </Typography>
          <img
            src={selectedImage}
            alt="Selected"
            style={{
              width: "100%",
              height: "auto",
              marginTop: "16px",
            }}
          />
          <Button onClick={handleCloseImageModal} sx={{ mt: 2 }} aria-label="close image modal">
            Close
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default GlobalElements;
