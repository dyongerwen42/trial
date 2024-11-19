// GlobalElements.js
import React, { useState, useMemo, useCallback } from "react";
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
import { useMjopContext } from "./MjopContext"; // Zorg ervoor dat je context correct is geïmporteerd
import inspectionTasks from "./inspectionTasks.json"; // Zorg ervoor dat dit bestand correct is geïmporteerd
import taken from "./taken.json"; // Zorg ervoor dat dit bestand correct is geïmporteerd
import ImageAnnotation from "./ImageAnnotation"; // Zorg ervoor dat dit component correct is geïmporteerd

const categories = Object.keys(taken.onderhoudstaken).map((key) => key);

// Helper functie om gebreken te extraheren, inclusief custom gebreken
const extractGebreken = (
  elementName,
  type,
  material,
  data,
  customGebreken
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

  // Voeg custom gebreken toe onder dezelfde type en materiaal
  if (
    customGebreken &&
    customGebreken[type] &&
    customGebreken[type][material]
  ) {
    for (const severity in customGebreken[type][material]) {
      if (!gebreken[severity]) {
        gebreken[severity] = [];
      }
      gebreken[severity] = [
        ...new Set([
          ...(gebreken[severity] || []),
          ...customGebreken[type][material][severity],
        ]),
      ];
    }
  }

  return gebreken;
};

const GlobalElements = ({ t }) => {
  const {
    state: { globalElements, globalSpaces, newElement, errors, customGebreken },
    handleAddElement,
    handleEditElement,
    saveData,
    handleDeleteElement,
    addGebrek,
    removeGebrek,
    resetNewElement,
    setNewElement,
    setErrors,
    setSuccessMessage,
  } = useMjopContext();

  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [photosModalOpen, setPhotosModalOpen] = useState(false);
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [openImageModal, setOpenImageModal] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [foutieveStappen, setFoutieveStappen] = useState([]);
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
    return inspectionTasks.map((element) => ({
      ...element,
      id: element.id || uuidv4(), // Assign unique ID if missing
    }));
  }, []);

  // Filter elements based on search term
  const filteredElements = useMemo(() => {
    return availableElementsWithIds.filter(
      (element) =>
        element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (element.description &&
          element.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, availableElementsWithIds]);

  /** 
   * **Definieer alle handler-functies eerst**
   * Dit zorgt ervoor dat ze beschikbaar zijn voordat ze worden gebruikt in andere hooks zoals useMemo
   */

  // Open photos modal
  const handleOpenPhotosModal = useCallback((photos) => {
    setSelectedPhotos(
      photos.map((photo) =>
        typeof photo === "string"
          ? `http://localhost:5000/${photo.replace("\\", "/")}`
          : URL.createObjectURL(photo)
      )
    );
    setPhotosModalOpen(true);
  }, []);

  // Close photos modal
  const handleClosePhotosModal = useCallback(() => setPhotosModalOpen(false), []);

  // Open image modal
  const handleOpenImageModal = useCallback((src) => {
    setSelectedImage(src);
    setOpenImageModal(true);
  }, []);

  // Close image modal
  const handleCloseImageModal = useCallback(() => setOpenImageModal(false), []);

  // Open documents modal
  const handleOpenDocumentsModal = useCallback((documents) => {
    setSelectedDocuments(
      documents.map((doc) =>
        typeof doc === "string"
          ? `http://localhost:5000/${doc.replace("\\", "/")}`
          : URL.createObjectURL(doc)
      )
    );
    setDocumentsModalOpen(true);
  }, []);

  // Close documents modal
  const handleCloseDocumentsModal = useCallback(() => setDocumentsModalOpen(false), []);

  // Handle selecting an element for editing
  const handleSelectElement = useCallback(
    (element, isEditMode = false, fromTable = false) => {
      const types = Object.keys(element?.gebreken || {});
      const materials = types.length
        ? Object.keys(element.gebreken[types[0]] || {})
        : [];

      const selectedSpace = globalSpaces.find(
        (space) => space.id === element.spaceId
      );

      // Check if type is defined
      if (!element.type) {
        console.error("Element type is undefined:", element);
        setErrors({ general: "Type van het element is niet gedefinieerd." });
        return;
      }

      // Extract gebreken including custom gebreken
      const availableGebreken = extractGebreken(
        element.name,
        element.type,
        element.material,
        inspectionTasks,
        customGebreken // Include customGebreken
      );

      // Set initialGebreken
      let initialGebreken = {};

      if (isEditMode && element.gebreken) {
        // When editing, retain existing gebreken
        initialGebreken = element.gebreken;
      } else {
        // When adding, initialize gebreken as empty (none selected)
        initialGebreken = {
          ernstig: [],
          serieus: [],
          gering: [],
        };
      }

      setNewElement((prev) => ({
        ...prev,
        id: fromTable ? element.id : "",
        name: element.name || "",
        description: element.description || "",
        interval: element.interval || "",
        spaceId: element.spaceId || "", // Ensure spaceId is not undefined
        type: element.type || "",
        material: element.material || "",
        customMaterial: element.customMaterial || "",
        photos: element.photos || [],
        documents: element.documents || [],
        gebreken: initialGebreken, // Empty when adding, existing when editing
        inspectionReport: element.inspectionReport.length > 0 ? element.inspectionReport : [
          {
            id: uuidv4(),
            description: "",
            inspectionDone: false,
            inspectionDate: null,
            tasks: [],
          },
        ], // Initialize as array
        annotations: element.annotations || [],
      }));

      setMaterials(materials);

      setIsEditing(fromTable && isEditMode);

      // Handle selectedSpace image and annotations
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

      setErrors({});
      setFoutieveStappen([]);
      setActiveStep(0);
    },
    [globalSpaces, customGebreken, setErrors]
  );

  // Handle type change from form
  const handleTypeChange = useCallback(
    (e) => {
      const selectedType = e.target.value;
      const element = inspectionTasks.find(
        (task) => task.name === newElement.name
      );
      if (!element) {
        setErrors({
          ...errors,
          type: "Geen taak gevonden voor geselecteerd element.",
        });
        return;
      }

      const availableMaterials = Object.keys(
        element.gebreken[selectedType] || {}
      );
      setMaterials(availableMaterials);

      setNewElement((prev) => ({
        ...prev,
        type: selectedType,
        material: "",
        gebreken: {
          ernstig: [],
          serieus: [],
          gering: [],
        },
      }));
    },
    [newElement.name, inspectionTasks, errors]
  );

  // Handle material change
  const handleMaterialChange = useCallback(
    (e) => {
      const selectedMaterial = e.target.value;

      setNewElement((prev) => ({
        ...prev,
        material: selectedMaterial,
        // Reset gebreken if needed
      }));
    },
    []
  );

  // Upload file to server
  const uploadFile = useCallback(async (file) => {
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
  }, []);

  // Handle photo file change
  const handleFileChange = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    const fileUrls = await Promise.all(files.map((file) => uploadFile(file)));
    const validFileUrls = fileUrls.filter((url) => url !== null);

    setNewElement((prev) => ({
      ...prev,
      photos: [...(prev.photos || []), ...validFileUrls],
    }));
  }, [uploadFile]);

  // Handle document file change
  const handleDocumentChange = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    const fileUrls = await Promise.all(files.map((file) => uploadFile(file)));
    const validFileUrls = fileUrls.filter((url) => url !== null);

    setNewElement((prev) => ({
      ...prev,
      documents: [...(prev.documents || []), ...validFileUrls],
    }));
  }, [uploadFile]);

  // Clear a specific photo
  const handleClearImage = useCallback((index) => {
    setNewElement((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  }, []);

  // Clear a specific document
  const handleClearDocument = useCallback((index) => {
    setNewElement((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  }, []);

  // Reset newElement
  const handleResetNewElement = useCallback(() => {
    resetNewElement();
    setSelectedImage(null);
    setAnnotations([]);
    setErrors({});
    setIsEditing(false);
    setActiveStep(0);
  }, [resetNewElement, setErrors]);

  // Handle save element
  const handleSaveElement = useCallback(async () => {
    const newErrors = {};

    // Validatie
    if (!newElement.name) newErrors.name = "Naam is verplicht";
    if (!newElement.type) newErrors.type = "Type is verplicht";
    if (!newElement.material) newErrors.material = "Materiaal is verplicht";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const invalidSteps = [];
      if (newErrors.name) invalidSteps.push(0);
      if (newErrors.type || newErrors.material) invalidSteps.push(3);
      setFoutieveStappen(invalidSteps);
      return;
    }

    console.log("Saving element with gebreken and inspectionReport:", newElement);

    try {
      setIsSaving(true); // Start loading indicator
      let updatedGlobalElements;

      if (isEditing) {
        handleEditElement(newElement); // Edit the element
        setSuccessMessage("Element succesvol bijgewerkt.");

        // Update globalElements array
        updatedGlobalElements = globalElements.map((el) =>
          el.id === newElement.id ? newElement : el
        );
      } else {
        const newElementWithId = handleAddElement(newElement); // Add new element with ID
        setSuccessMessage("Element succesvol toegevoegd.");

        // Update globalElements array
        updatedGlobalElements = [...globalElements, newElementWithId];
      }

      await saveData(updatedGlobalElements); // Save to database
      console.log("Element data saved successfully to the database.");

      handleResetNewElement();
    } catch (error) {
      console.error("Fout bij het opslaan van element:", error);
      setErrors({ general: "Fout bij het opslaan van het element." });
    } finally {
      setIsSaving(false); // Stop loading indicator
    }
  }, [
    isEditing,
    handleEditElement,
    newElement,
    globalElements,
    handleAddElement,
    saveData,
    setSuccessMessage,
    setErrors,
    handleResetNewElement,
  ]);

  // Handle save data from save button
  const handleSaveData = useCallback(async () => {
    try {
      setIsSaving(true); // Start loading indicator
      await saveData(); // Call the saveData function
      console.log("Data saved successfully.");
      setSuccessMessage("Data succesvol opgeslagen.");
    } catch (error) {
      console.error("Error saving data:", error);
      setErrors({ general: "Fout bij het opslaan van data." });
    } finally {
      setIsSaving(false); // Stop loading indicator
    }
  }, [saveData, setSuccessMessage, setErrors]);

  // Add an annotation
  const handleAddAnnotation = useCallback((position) => {
    const newAnnotation = {
      ...position,
    };
    setNewElement((prev) => ({
      ...prev,
      annotations: [...prev.annotations, newAnnotation],
    }));
  }, []);

  // Undo the last annotation
  const handleUndoAnnotation = useCallback(() => {
    setNewElement((prev) => ({
      ...prev,
      annotations: prev.annotations.slice(0, -1),
    }));
  }, []);

  // Delete all annotations
  const handleDeleteAllAnnotations = useCallback(() => {
    setNewElement((prev) => ({
      ...prev,
      annotations: [],
    }));
  }, []);

  // Handle stepper navigation
  const handleNext = useCallback(() => {
    if (activeStep === steps.length - 1) {
      handleSaveElement();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  }, [activeStep, steps.length, handleSaveElement]);

  const handleBack = useCallback(() => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  }, []);

  const handleStep = useCallback((step) => {
    setActiveStep(step);
  }, []);

  // Handle type selection from sidebar
  const handleTypeChangeFromSidePanel = useCallback(
    (element, selectedType) => {
      console.log("handleTypeChangeFromSidePanel aangeroepen:", {
        element,
        selectedType,
      });

      const gebrekenForType = element.gebreken[selectedType];
      if (!gebrekenForType) {
        console.error(`Geen gebreken gevonden voor type: ${selectedType}`);
        setErrors({
          general: `Geen gebreken gevonden voor type: ${selectedType}`,
        });
        return;
      }

      const availableMaterials = Object.keys(gebrekenForType);
      console.log("Beschikbare materialen voor type:", availableMaterials);

      setMaterials(availableMaterials);

      setNewElement((prev) => ({
        ...prev,
        name: element.name || "",
        description: element.description || "",
        interval: element.interval || "",
        type: selectedType,
        material: "",
        gebreken: {
          ernstig: [],
          serieus: [],
          gering: [],
        }, // Reset gebreken
        unitType: "",
        quantity: "",
        inspectionReport: [
          {
            id: uuidv4(),
            description: "",
            inspectionDone: false,
            inspectionDate: null,
            tasks: [],
          },
        ],
      }));

      // Reset errors and steps
      setErrors({});
      setFoutieveStappen([]);
      setActiveStep(0);
    },
    [setErrors]
  );

  // Handle expanding/collapsing elements in sidebar
  const handleExpandClick = useCallback((elementId) => {
    setExpandedElement((prev) => (prev === elementId ? null : elementId));
  }, []);

  // Handle adding a custom gebrek
  const handleAddCustomGebrek = useCallback(() => {
    if (customGebrek.trim() === "") return;

    const severity = customGebrekSeverity;
    const gebrekName = customGebrek.trim();
    const category = newElement.type; // Add under current type
    const material = newElement.material; // Add under current material

    if (!category || !material) {
      setErrors({
        ...errors,
        gebreken: "Type en Materiaal moeten geselecteerd zijn.",
      });
      return;
    }

    addGebrek(category, material, severity, gebrekName); // Corrected parameter order

    setCustomGebrek("");
    setCustomGebrekSeverity("gering");
  }, [customGebrek, customGebrekSeverity, newElement.type, newElement.material, addGebrek, errors]);

  // Helper function to render gebreken
  const renderGebreken = useCallback(() => {
    // Get available gebreken based on selected type and material, including custom gebreken
    const category = newElement.type;
    const material = newElement.material;
    const availableGebreken = extractGebreken(
      newElement.name,
      category,
      material,
      inspectionTasks,
      customGebreken // Include customGebreken
    );

    console.log("Available Gebreken:", availableGebreken);
    console.log("Selected Gebreken:", newElement.gebreken);

    if (!availableGebreken || Object.keys(availableGebreken).length === 0) {
      return (
        <Typography variant="body1">
          Geen gebreken beschikbaar voor deze selectie.
        </Typography>
      );
    }

    return (
      <Box>
        {Object.keys(availableGebreken).map((severity, severityIndex) => (
          <Box key={`severity-${severity}-${severityIndex}`} mb={2}>
            <Typography
              variant="body1"
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
              Ernst: {severity.charAt(0).toUpperCase() + severity.slice(1)}
            </Typography>
            {availableGebreken[severity].length > 0 ? (
              <List>
                {availableGebreken[severity].map((gebrek, gebrekIndex) => (
                  <ListItem
                    key={`gebrek-${severity}-${gebrek}-${gebrekIndex}-${category}-${material}`}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleRemoveGebrek(severity, gebrek)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemText primary={gebrek} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2">Geen gebreken beschikbaar.</Typography>
            )}
          </Box>
        ))}
      </Box>
    );
  }, [newElement.type, newElement.material, newElement.name, newElement.gebreken, inspectionTasks, customGebreken, theme.palette]);

  // Handle removing a specific gebrek
  const handleRemoveGebrek = useCallback((severityCategory, gebrekName) => {
    const category = newElement.type;
    const material = newElement.material;

    if (!category || !material) {
      setErrors({
        ...errors,
        gebreken: "Type en Materiaal moeten geselecteerd zijn.",
      });
      return;
    }

    removeGebrek(category, material, severityCategory, gebrekName);
  }, [newElement.type, newElement.material, removeGebrek, errors]);

  // Definieer table columns met dependencies op modal functies
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
            >
              <InsertDriveFileIcon />
            </IconButton>
            <IconButton
              color="primary"
              onClick={() => handleOpenPhotosModal(row.original.photos)}
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
            >
              <EditIcon />
            </IconButton>
            <IconButton
              color="secondary"
              onClick={() => handleDeleteElement(row.original.id)}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        ),
      },
    ],
    [
      globalSpaces,
      handleDeleteElement,
      handleOpenDocumentsModal,
      handleOpenPhotosModal,
      handleSelectElement,
    ]
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

  // Render step content based on active step
  const renderStepContent = useCallback(
    (step) => {
      switch (step) {
        case 0:
          return (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Naam van nieuw element"
                  value={newElement.name}
                  onChange={(e) =>
                    setNewElement((prev) => ({ ...prev, name: e.target.value }))
                  }
                  error={!!errors.name}
                  helperText={errors.name}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  type="number"
                  label="Inspectie-interval (in maanden)"
                  value={newElement.interval || ""}
                  onChange={(e) =>
                    setNewElement((prev) => ({ ...prev, interval: e.target.value }))
                  }
                  error={!!errors.interval}
                  helperText={errors.interval}
                  sx={{ mb: 2 }}
                />
              </Grid>

              {/* Multi-Select Dropdown for Categories */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                  <InputLabel>Soort werkzaamheden</InputLabel>
                  <Select
                    multiple
                    value={newElement.categories || []}
                    onChange={(e) =>
                      setNewElement((prev) => ({
                        ...prev,
                        categories: e.target.value,
                      }))
                    }
                    renderValue={(selected) => selected.join(", ")}
                    label="Selecteer Categorieën"
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
                <FormControl
                  fullWidth
                  variant="outlined"
                  error={!!errors.type}
                  sx={{ mb: 2 }}
                >
                  <InputLabel>Selecteer Type</InputLabel>
                  <Select
                    value={newElement.type}
                    onChange={handleTypeChange}
                    label="Selecteer Type"
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
                  {errors.type && (
                    <Typography color="error">{errors.type}</Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl
                  fullWidth
                  variant="outlined"
                  error={!!errors.material}
                  sx={{ mb: 2 }}
                >
                  <InputLabel>Selecteer Materiaal</InputLabel>
                  <Select
                    value={newElement.material}
                    onChange={handleMaterialChange}
                    label="Selecteer Materiaal"
                  >
                    {materials.map((material, materialIndex) => (
                      <MenuItem
                        key={`material-${material}-${materialIndex}`}
                        value={material}
                      >
                        {material}
                      </MenuItem>
                    ))}
                    <MenuItem key="material-Other" value="Other">
                      Overig
                    </MenuItem>
                  </Select>
                  {errors.material && (
                    <Typography color="error">{errors.material}</Typography>
                  )}
                </FormControl>
              </Grid>
              {newElement.material === "Other" && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    label="Aangepast Materiaal"
                    value={newElement.customMaterial}
                    onChange={(e) =>
                      setNewElement((prev) => ({
                        ...prev,
                        customMaterial: e.target.value,
                      }))
                    }
                    error={!!errors.customMaterial}
                    helperText={errors.customMaterial}
                    sx={{ mb: 2 }}
                  />
                </Grid>
              )}

              {/* Removed Quantity and Unit Type fields */}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Beschrijving van nieuw element"
                  multiline
                  rows={4}
                  value={newElement.description}
                  onChange={(e) =>
                    setNewElement((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  error={!!errors.description}
                  helperText={errors.description}
                  sx={{ mb: 2 }}
                />
              </Grid>

              {/* New fields for Levensduur, Aanschaf Datum, and Vervangings Kosten */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Levensduur (in jaren)"
                  type="number"
                  value={newElement.levensduur || ""}
                  onChange={(e) =>
                    setNewElement((prev) => ({
                      ...prev,
                      levensduur: e.target.value,
                    }))
                  }
                  error={!!errors.levensduur}
                  helperText={errors.levensduur}
                  sx={{ mb: 2 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Aanschaf Datum"
                  type="date"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  value={newElement.aanschafDatum || ""}
                  onChange={(e) =>
                    setNewElement((prev) => ({
                      ...prev,
                      aanschafDatum: e.target.value,
                    }))
                  }
                  error={!!errors.aanschafDatum}
                  helperText={errors.aanschafDatum}
                  sx={{ mb: 2 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Vervangings Kosten"
                  type="number"
                  value={newElement.vervangingsKosten || ""}
                  onChange={(e) =>
                    setNewElement((prev) => ({
                      ...prev,
                      vervangingsKosten: e.target.value,
                    }))
                  }
                  error={!!errors.vervangingsKosten}
                  helperText={errors.vervangingsKosten}
                  sx={{ mb: 2 }}
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
                  error={!!errors.spaceId}
                  sx={{ mb: 2 }}
                >
                  <InputLabel>Selecteer Ruimte</InputLabel>
                  <Select
                    value={newElement.spaceId}
                    onChange={(e) => {
                      const selectedValue = e.target.value;
                      setNewElement((prev) => ({ ...prev, spaceId: selectedValue }));
                      const selectedSpace = globalSpaces.find(
                        (space) => space.id === selectedValue
                      );
                      // Handle selectedSpace image and annotations
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
                    label="Selecteer Ruimte"
                  >
                    <MenuItem value="">
                      <em>Selecteer Ruimte</em>
                    </MenuItem>
                    {globalSpaces.map((space) => (
                      <MenuItem key={`space-${space.id}`} value={space.id}>
                        {space.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.spaceId && (
                    <Typography color="error">{errors.spaceId}</Typography>
                  )}
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
                  >
                    Upload Foto's
                    <input
                      type="file"
                      hidden
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </Button>
                  <Box display="flex" flexWrap="wrap" mt={2}>
                    {newElement.photos?.map((src, index) => {
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
                            alt={`Voorbeeld ${index}`}
                            style={{
                              width: "100px",
                              height: "100px",
                              objectFit: "contain",
                            }}
                          />
                          <Box display="flex" justifyContent="center" mt={1}>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenImageModal(imgSrc)}
                            >
                              <AddCircleOutlineIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => {
                                const link = document.createElement("a");
                                link.href = imgSrc;
                                link.download = `image-${index}`;
                                link.click();
                              }}
                            >
                              <DownloadIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleClearImage(index)}
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
                  >
                    Upload Documenten
                    <input
                      type="file"
                      hidden
                      multiple
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleDocumentChange}
                    />
                  </Button>
                  <Box display="flex" flexWrap="wrap" mt={2}>
                    {newElement.documents?.map((src, index) => {
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
                        fileType ===
                          "vnd.openxmlformats-officedocument.wordprocessingml.document"
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
                          <a href={docSrc} download style={{ margin: "0 8px" }}>
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
                            >
                              <DownloadIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleClearDocument(index)}
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
                  <Typography variant="h6">Voeg Aangepaste Gebreken Toe</Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        variant="outlined"
                        label="Aangepast Gebrek"
                        value={customGebrek}
                        onChange={(e) => setCustomGebrek(e.target.value)}
                        error={!!errors.gebreken}
                        helperText={errors.gebreken}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel>Ernst</InputLabel>
                        <Select
                          value={customGebrekSeverity}
                          onChange={(e) => setCustomGebrekSeverity(e.target.value)}
                          label="Ernst"
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
                        disabled={customGebrek.trim() === ""}
                      >
                        Voeg Toe
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              {selectedImage && (
                <Grid item xs={12}>
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6">
                      Geselecteerde Ruimte: Afbeelding en Annotaties
                    </Typography>
                    <Box display="flex" justifyContent="flex-start" gap={2} mb={2}>
                      <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<UndoIcon />}
                        onClick={handleUndoAnnotation}
                        disabled={newElement.annotations.length === 0}
                      >
                        Undo
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<DeleteSweepIcon />}
                        onClick={handleDeleteAllAnnotations}
                        disabled={newElement.annotations.length === 0}
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
          // Review & Opslaan
          return (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6">Controleer de gegevens</Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body1">
                  <strong>Naam van nieuw element:</strong> {newElement.name}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body1">
                  <strong>Inspectie-interval:</strong> {newElement.interval} maanden
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body1">
                  <strong>Geselecteerde Ruimte:</strong>{" "}
                  {
                    globalSpaces.find((space) => space.id === newElement.spaceId)
                      ?.name
                  }
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body1">
                  <strong>Selecteer Type:</strong> {newElement.type}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body1">
                  <strong>Selecteer Materiaal:</strong> {newElement.material}
                </Typography>
              </Grid>

              {newElement.material === "Other" && (
                <Grid item xs={12} md={6}>
                  <Typography variant="body1">
                    <strong>Aangepast Materiaal:</strong>{" "}
                    {newElement.customMaterial}
                  </Typography>
                </Grid>
              )}

              <Grid item xs={12}>
                <Typography variant="body1">
                  <strong>Beschrijving:</strong> {newElement.description}
                </Typography>
              </Grid>

              {newElement.levensduur && (
                <Grid item xs={12} md={6}>
                  <Typography variant="body1">
                    <strong>Levensduur:</strong> {newElement.levensduur} jaar
                  </Typography>
                </Grid>
              )}

              {newElement.aanschafDatum && (
                <Grid item xs={12} md={6}>
                  <Typography variant="body1">
                    <strong>Aanschaf Datum:</strong> {newElement.aanschafDatum}
                  </Typography>
                </Grid>
              )}

              {newElement.vervangingsKosten && (
                <Grid item xs={12} md={6}>
                  <Typography variant="body1">
                    <strong>Vervangings Kosten:</strong> €{newElement.vervangingsKosten}
                  </Typography>
                </Grid>
              )}

              {newElement.photos.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="body1">
                    <strong>Geüploade Foto's:</strong>{" "}
                    {newElement.photos.length} bestand(en)
                  </Typography>
                </Grid>
              )}

              {newElement.documents.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="body1">
                    <strong>Geüploade Documenten:</strong>{" "}
                    {newElement.documents.length} bestand(en)
                  </Typography>
                </Grid>
              )}

              {/* Display Inspection Report */}
              {newElement.inspectionReport && newElement.inspectionReport.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="h6">
                    Inspectierapporten
                  </Typography>
                  {newElement.inspectionReport.map((report, index) => (
                    <Box key={`review-report-${report.id}-${index}`} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                      <Typography variant="subtitle1"><strong>Inspectierapport {index + 1}</strong></Typography>
                      <Typography variant="body1">
                        <strong>Beschrijving:</strong> {report.description || "Geen beschrijving."}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Inspectie Gedaan:</strong> {report.inspectionDone ? "Ja" : "Nee"}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Inspectie Datum:</strong> {report.inspectionDate ? new Date(report.inspectionDate).toLocaleDateString() : "Niet ingevuld"}
                      </Typography>
                      {report.tasks.length > 0 ? (
                        <Box mt={2}>
                          <Typography variant="subtitle2"><strong>Inspectietaken:</strong></Typography>
                          <List>
                            {report.tasks.map((task, taskIndex) => (
                              <ListItem key={`review-task-${task.id}-${taskIndex}`}>
                                <ListItemText
                                  primary={task.description}
                                  secondary={`Planned: ${task.planned ? "Yes" : "No"}`}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      ) : (
                        <Typography variant="body2" mt={2}>
                          Geen inspectietaken toegevoegd.
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Grid>
              )}

              {selectedImage && (
                <Grid item xs={12}>
                  <Typography variant="body1">
                    <strong>
                      Geselecteerde Ruimte: Afbeelding en Annotaties
                    </strong>
                  </Typography>
                </Grid>
              )}
            </Grid>
          );
        default:
          return "Unknown step";
      }
    },
    [newElement, errors, renderGebreken, globalSpaces, selectedImage, annotations]
  );

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
            Beschikbare Elementen
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Zoek elementen"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
          />
          <List>
            {filteredElements.map((element) => {
              const isExpanded = expandedElement === element.id;
              const parentColor = element.installatie
                ? theme.palette.primary.main
                : theme.palette.secondary.main;

              const uniqueKey = `sidebar-element-${element.id}`;

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
                            key={`type-${element.id}-${type}-${typeIndex}`}
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
        >
          {isSidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>

        <Typography variant="h5" sx={{ mt: 2, mb: 2 }}>
          Globale Elementen
        </Typography>

        {/* Save Button */}
        <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSaveData}
            disabled={isSaving}
          >
            Opslaan
          </Button>
          {isSaving && <CircularProgress size={24} sx={{ ml: 2 }} />}
        </Box>

        <Card sx={{ mb: 2, p: 2 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label, index) => (
              <Step key={`step-${label}-${index}`}>
                <StepLabel
                  onClick={() => handleStep(index)}
                  error={foutieveStappen.includes(index)}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
          <Box mt={2}>{renderStepContent(activeStep)}</Box>
          <Box display="flex" justifyContent="space-between" mt={4}>
            <Button disabled={activeStep === 0} onClick={handleBack}>
              Terug
            </Button>
            <Box display="flex" alignItems="center">
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={isSaving}
              >
                {activeStep === steps.length - 1 ? "Opslaan" : "Volgende"}
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
                const rowKey = `table-row-${row.original.id}`;

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
            Geüploade Foto's
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
                  >
                    <DownloadIcon />
                  </IconButton>
                </Box>
              </Box>
            ))}
          </Box>
          <Button onClick={handleClosePhotosModal} sx={{ mt: 2 }}>
            Sluiten
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
            Geüploade Documenten
          </Typography>
          <Box display="flex" flexWrap="wrap" mt={2}>
            {selectedDocuments.map((src, index) => {
              const fileType = src.split(".").pop().toLowerCase();
              let icon;
              if (fileType === "pdf") {
                icon = <PictureAsPdfIcon style={{ fontSize: 40 }} />;
              } else if (
                fileType === "doc" ||
                fileType ===
                  "vnd.openxmlformats-officedocument.wordprocessingml.document"
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
                  <a href={src} download style={{ margin: "0 8px" }}>
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
                    >
                      <DownloadIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleClearDocument(index)}
                    >
                      <ClearIcon />
                    </IconButton>
                  </Box>
                </Box>
              );
            })}
          </Box>
          <Button onClick={handleCloseDocumentsModal} sx={{ mt: 2 }}>
            Sluiten
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
            Afbeelding
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
          <Button onClick={handleCloseImageModal} sx={{ mt: 2 }}>
            Sluiten
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default GlobalElements;
