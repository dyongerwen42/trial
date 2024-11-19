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
  CircularProgress, // Import CircularProgress
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
import { useTable } from "react-table";
import { v4 as uuidv4 } from "uuid";
import { useMjopContext } from "./MjopContext";
import availableElements from "./inspectionTasks.json";
import taken from "./taken.json";
import inspectionTasks from "./inspectionTasks.json";
import ImageAnnotation from "./ImageAnnotation";

const categories = Object.keys(taken.onderhoudstaken).map((key) => key);

// Adjust extractGebreken to include customGebreken
const extractGebreken = (elementName, type, material, data, customGebreken) => {
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

  // Add custom gebreken under the same type and material
  if (customGebreken && customGebreken[type] && customGebreken[type][material]) {
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
    updateGebreken,
    resetNewElement,
    setNewElement,
    setErrors,
    setSuccessMessage,
    addGebrek,
    removeGebrek,
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
  const [foutieveStappen, setFoutieveStappen] = useState([]);
  const [expandedElement, setExpandedElement] = useState(null);

  const theme = useTheme();

  // Add missing state variables
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

  // Update image and document previews
  useEffect(() => {
    if (newElement.photos && newElement.photos.length > 0) {
      const previews = newElement.photos
        .map((file) => {
          if (typeof file === "string") {
            return `http://localhost:5000/${file.replace("\\", "/")}`;
          } else if (file instanceof File) {
            return URL.createObjectURL(file);
          } else {
            return null;
          }
        })
        .filter((src) => src !== null);
      setImagePreviews(previews);
    } else {
      setImagePreviews([]);
    }

    if (newElement.documents && newElement.documents.length > 0) {
      const previews = newElement.documents
        .map((file) => {
          if (typeof file === "string") {
            return `http://localhost:5000/${file.replace("\\", "/")}`;
          } else if (file instanceof File) {
            return URL.createObjectURL(file);
          } else {
            return null;
          }
        })
        .filter((src) => src !== null);
      setDocumentPreviews(previews);
    } else {
      setDocumentPreviews([]);
    }
  }, [newElement.photos, newElement.documents]);

  // Filter elements based on search term
  const filteredElements = useMemo(() => {
    return availableElements.filter(
      (element) =>
        element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        element.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

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
  const handleSelectElement = (element, isEditMode = false, fromTable = false) => {
    const task = inspectionTasks.find((task) => task.name === element.name);

    const types = Object.keys(task?.gebreken || {});
    const materials = Object.keys(task?.gebreken[element.type] || {});

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
      initialGebreken = {};
    }

    setNewElement({
      id: fromTable ? element.id : "",
      name: element.name,
      description: element.description,
      interval: element.interval,
      spaceId: element.spaceId,
      type: element.type || "",
      material: element.material || "",
      customMaterial: element.customMaterial || "",
      photos: element.photos || [],
      documents: element.documents || [],
      gebreken: initialGebreken, // Empty when adding, existing when editing
      inspectionReport: element.inspectionReport || [
        {
          id: uuidv4(),
          description: "",
          inspectionDone: false,
          inspectionDate: null,
          tasks: [],
        },
      ],
      annotations: element.annotations || [],
    });

    setMaterials(materials);

    setIsEditing(fromTable && isEditMode);

    if (selectedSpace) {
      const imageWithAnnotations = selectedSpace.image.startsWith("http")
        ? selectedSpace.image
        : `http://localhost:5000/${selectedSpace.image.replace(/\\/g, "/")}`;

      setSelectedImage(imageWithAnnotations);
      setAnnotations(selectedSpace.annotations);
    }

    setErrors({});
    setFoutieveStappen([]);
    setActiveStep(0);
  };

  // Handle type change from form
  const handleTypeChange = (e) => {
    const selectedType = e.target.value;
    const task = inspectionTasks.find((task) => task.name === newElement.name);
    if (!task) {
      setErrors({ ...errors, type: "Geen taak gevonden voor geselecteerd element." });
      return;
    }

    const availableMaterials = Object.keys(task.gebreken[selectedType] || {});
    setMaterials(availableMaterials);

    setNewElement({
      ...newElement,
      type: selectedType,
      material: "",
      gebreken: {},
    });
  };

  // Handle material change
  const handleMaterialChange = (e) => {
    const selectedMaterial = e.target.value;

    // Remove gebreken for the previous material
    const updatedGebreken = { ...newElement.gebreken };

    if (newElement.type && updatedGebreken[newElement.type] && updatedGebreken[newElement.type][newElement.material]) {
      // Iterate over all severity categories and remove gebreken for the old material
      Object.keys(updatedGebreken[newElement.type][newElement.material]).forEach((severity) => {
        if (updatedGebreken[newElement.type][newElement.material][severity]) {
          delete updatedGebreken[newElement.type][newElement.material][severity];
        }
      });

      // Remove material if no severity levels remain
      if (Object.keys(updatedGebreken[newElement.type][newElement.material]).length === 0) {
        delete updatedGebreken[newElement.type][newElement.material];
      }

      // Remove type if no materials remain
      if (Object.keys(updatedGebreken[newElement.type]).length === 0) {
        delete updatedGebreken[newElement.type];
      }
    }

    setNewElement({
      ...newElement,
      material: selectedMaterial,
      gebreken: updatedGebreken,
      unitType: "",
      quantity: "",
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
          ? `http://localhost:5000/${doc.replace("\\", "/")}`
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
    setNewElement({
      ...newElement,
      photos: [
        ...(newElement.photos || []),
        ...fileUrls.filter((url) => url !== null),
      ],
    });
  };

  // Handle document file change
  const handleDocumentChange = async (e) => {
    const files = Array.from(e.target.files);
    const fileUrls = await Promise.all(files.map((file) => uploadFile(file)));
    setNewElement({
      ...newElement,
      documents: [
        ...(newElement.documents || []),
        ...fileUrls.filter((url) => url !== null),
      ],
    });
  };

  // Clear a specific photo
  const handleClearImage = (index) => {
    const updatedPhotos = Array.from(newElement.photos || []).filter(
      (_, i) => i !== index
    );
    setNewElement({ ...newElement, photos: updatedPhotos });
    setImagePreviews(
      updatedPhotos.map((file) =>
        typeof file === "string"
          ? `http://localhost:5000/${file.replace("\\", "/")}`
          : URL.createObjectURL(file)
      )
    );
  };

  // Clear a specific document
  const handleClearDocument = (index) => {
    const updatedDocuments = Array.from(newElement.documents || []).filter(
      (_, i) => i !== index
    );
    setNewElement({ ...newElement, documents: updatedDocuments });
    setDocumentPreviews(
      updatedDocuments.map((file) =>
        typeof file === "string"
          ? `http://localhost:5000/${file.replace("\\", "/")}`
          : URL.createObjectURL(file)
      )
    );
  };

  // Reset newElement
  const handleResetNewElement = () => {
    resetNewElement();
    setImagePreviews([]);
    setDocumentPreviews([]);
    setSelectedImage(null);
    setAnnotations([]);
    setErrors({});
    setIsEditing(false);
    setActiveStep(0);
  };

  // **Aangepaste handleSaveElement functie**
  const handleSaveElement = async () => { // Maak deze functie asynchroon
    const newErrors = {};

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

    console.log("Saving element with gebreken:", newElement.gebreken);

    try {
      setIsSaving(true); // Start de laadindicator
      let updatedGlobalElements;

      if (isEditing) {
        handleEditElement(newElement); // Bewerk het element
        setSuccessMessage("Element succesvol bijgewerkt.");

        // Bereken de bijgewerkte globalElements array
        updatedGlobalElements = globalElements.map((el) =>
          el.id === newElement.id ? newElement : el
        );
      } else {
        const newElementWithId = handleAddElement(newElement); // Voeg het nieuwe element toe en ontvang het met ID
        setSuccessMessage("Element succesvol toegevoegd.");

        // Bereken de bijgewerkte globalElements array
        updatedGlobalElements = [...globalElements, newElementWithId];
      }

      await saveData(updatedGlobalElements); // Geef de bijgewerkte array door
      console.log("Element data saved successfully to the database.");

      handleResetNewElement();
    } catch (error) {
      console.error("Fout bij het opslaan van element:", error);
      setErrors({ general: "Fout bij het opslaan van het element." });
    } finally {
      setIsSaving(false); // Stop de laadindicator
    }
  };

  // Verwijder of commentarieer deze useEffect uit
  /*
  // Auto save changes when globalElements change
  // useEffect(() => {
  //   if (globalElements.length > 0) {
  //     const saveChanges = async () => {
  //       try {
  //         await saveData();
  //         console.log("Element data saved successfully to the database.");
  //       } catch (error) {
  //         console.error("Error saving element data to database:", error);
  //         setErrors({ general: "Error saving data to database." });
  //       }
  //     };

  //     saveChanges();
  //   }
  // }, [globalElements, saveData, setErrors]);
  */

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

  // Check if all required fields are filled
  const allFieldsFilled = () => {
    return (
      newElement.name &&
      newElement.description &&
      newElement.interval &&
      newElement.spaceId &&
      newElement.type &&
      newElement.material &&
      (newElement.material !== "Other" || newElement.customMaterial)
    );
  };

  // Handle type selection from sidebar
  const handleTypeChangeFromSidePanel = (element, selectedType) => {
    console.log("handleTypeChangeFromSidePanel aangeroepen:", { element, selectedType });

    const task = inspectionTasks.find((task) => task.name === element.name);
    if (!task) {
      console.error(`Geen taak gevonden voor elementnaam: ${element.name}`);
      setErrors({ general: `Geen taak gevonden voor elementnaam: ${element.name}` });
      return;
    }

    const gebrekenForType = task.gebreken[selectedType];
    if (!gebrekenForType) {
      console.error(`Geen gebreken gevonden voor type: ${selectedType}`);
      setErrors({ general: `Geen gebreken gevonden voor type: ${selectedType}` });
      return;
    }

    const availableMaterials = Object.keys(gebrekenForType);
    console.log("Beschikbare materialen voor type:", availableMaterials);
    setMaterials(availableMaterials);

    setNewElement({
      ...newElement,
      name: element.name,
      description: element.description,
      interval: element.interval,
      spaceId: element.spaceId,
      type: selectedType,
      material: "",
      gebreken: {}, // Reset gebreken
      unitType: "",
      quantity: "",
    });

    // Reset fouten en stappen
    setErrors({});
    setFoutieveStappen([]);
    setActiveStep(0);
  };

  // Handle expanding/collapsing elements in sidebar
  const handleExpandClick = (index) => {
    setExpandedElement((prev) => (prev === index ? null : index));
  };

  // Handle adding a custom gebreken
  const handleAddCustomGebrek = () => {
    if (customGebrek.trim() === "") return;

    const severity = customGebrekSeverity;
    const gebrekName = customGebrek.trim();
    const category = newElement.type; // Add under current type
    const material = newElement.material; // Add under current material

    if (!category || !material) {
      setErrors({ ...errors, gebreken: "Type en Materiaal moeten geselecteerd zijn." });
      return;
    }

    addGebrek(category, material, severity, gebrekName); // Corrected parameter order

    setCustomGebrek("");
    setCustomGebrekSeverity("gering");
  };

  // Helper function to render gebreken
  const renderGebreken = () => {
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
      return <Typography variant="body1">Geen gebreken beschikbaar voor deze selectie.</Typography>;
    }

    return (
      <Box>
        {Object.keys(availableGebreken).map((severity) => (
          <Box key={severity} mb={2}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 'bold',
                textTransform: 'capitalize',
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
                {availableGebreken[severity].map((gebrek) => (
                  <ListItem
                    key={gebrek}
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
              <Typography variant="body2">Geen defecten beschikbaar.</Typography>
            )}
          </Box>
        ))}
      </Box>
    );
  };

  // Handle removing a specific gebreken
  const handleRemoveGebrek = (severityCategory, gebrekName) => {
    const category = newElement.type;
    const material = newElement.material;

    if (!category || !material) {
      setErrors({ ...errors, gebreken: "Type en Materiaal moeten geselecteerd zijn." });
      return;
    }

    removeGebrek(category, material, severityCategory, gebrekName);
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
                label="Naam van nieuw element"
                value={newElement.name}
                onChange={(e) =>
                  setNewElement({ ...newElement, name: e.target.value })
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
                label="Inspectie-interval"
                value={newElement.interval}
                onChange={(e) =>
                  setNewElement({ ...newElement, interval: e.target.value })
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
                    setNewElement({ ...newElement, categories: e.target.value })
                  }
                  renderValue={(selected) => selected.join(", ")}
                  label="Selecteer Categorieën"
                >
                  {Object.keys(taken.onderhoudstaken).map((category) => (
                    <MenuItem key={category} value={category}>
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
                  ).map((type) => (
                    <MenuItem key={type} value={type}>
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
                  {materials.map((material) => (
                    <MenuItem key={material} value={material}>
                      {material}
                    </MenuItem>
                  ))}
                  <MenuItem value="Other">Overig</MenuItem>
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
                    setNewElement({
                      ...newElement,
                      customMaterial: e.target.value,
                    })
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
                  setNewElement({ ...newElement, description: e.target.value })
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
                  setNewElement({ ...newElement, levensduur: e.target.value })
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
                  setNewElement({
                    ...newElement,
                    aanschafDatum: e.target.value,
                  })
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
                  setNewElement({
                    ...newElement,
                    vervangingsKosten: e.target.value,
                  })
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
                    setNewElement({ ...newElement, spaceId: e.target.value });
                    const selectedSpace = globalSpaces.find(
                      (space) => space.id === e.target.value
                    );
                    if (selectedSpace) {
                      const imageWithAnnotations = selectedSpace.image.startsWith("http")
                        ? selectedSpace.image
                        : `http://localhost:5000/${selectedSpace.image.replace(
                            "\\",
                            "/"
                          )}`;
                      setSelectedImage(imageWithAnnotations);
                      setAnnotations(selectedSpace.annotations);
                    }
                  }}
                  label="Selecteer Ruimte"
                >
                  <MenuItem value="">
                    <em>Selecteer Ruimte</em>
                  </MenuItem>
                  {globalSpaces.map((space) => (
                    <MenuItem key={space.id} value={space.id}>
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
                  {imagePreviews.map((src, index) => (
                    <Box key={src} position="relative" mr={2} mb={2}>
                      <img
                        src={src}
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
                          onClick={() => handleOpenImageModal(src)}
                        >
                          <AddCircleOutlineIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = src;
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
                  ))}
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
                  {documentPreviews.map((src, index) => {
                    const file = newElement.documents[index];
                    const fileType = file ? file.type?.split("/")[1] : null;
                    let icon;
                    if (fileType === "pdf") {
                      icon = <PictureAsPdfIcon style={{ fontSize: 40 }} />;
                    } else if (
                      fileType === "msword" ||
                      fileType === "vnd.openxmlformats-officedocument.wordprocessingml.document"
                    ) {
                      icon = <DescriptionIcon style={{ fontSize: 40 }} />;
                    } else {
                      icon = <InsertDriveFileIcon style={{ fontSize: 40 }} />;
                    }

                    return (
                      <Box key={src} position="relative" mr={2} mb={2}>
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
                <strong>Inspectie-interval:</strong> {newElement.interval}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body1">
                <strong>Geselecteerde Ruimte:</strong>{" "}
                {globalSpaces.find((space) => space.id === newElement.spaceId)?.name}
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
                  <strong>Aangepast Materiaal:</strong> {newElement.customMaterial}
                </Typography>
              </Grid>
            )}

            <Grid item xs={12}>
              <Typography variant="body1">
                <strong>Beschrijving:</strong> {newElement.description}
              </Typography>
            </Grid>

            {newElement.photos.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="body1">
                  <strong>Geüploade Foto's:</strong> {newElement.photos.length} bestand(en)
                </Typography>
              </Grid>
            )}

            {newElement.documents.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="body1">
                  <strong>Geüploade Documenten:</strong> {newElement.documents.length} bestand(en)
                </Typography>
              </Grid>
            )}

            {selectedImage && (
              <Grid item xs={12}>
                <Typography variant="body1">
                  <strong>Geselecteerde Ruimte: Afbeelding en Annotaties</strong>
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
            {filteredElements.map((element, index) => {
              const isExpanded = expandedElement === index;
              const parentColor = element.installatie
                ? theme.palette.primary.main
                : theme.palette.secondary.main;

              return (
                <React.Fragment key={element.id || index}>
                  <ListItem
                    button
                    onClick={() => handleExpandClick(index)}
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
                      {Object.keys(
                        inspectionTasks.find(
                          (task) => task.name === element.name
                        )?.gebreken || {}
                      ).map((type) => (
                        <ListItem
                          button
                          key={type}
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
                      ))}
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

        <Card sx={{ mb: 2, p: 2 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label, index) => (
              <Step key={label}>
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
              <Button variant="contained" onClick={handleNext} disabled={isSaving}>
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
              {headerGroups.map((headerGroup) => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column) => (
                    <th
                      {...column.getHeaderProps()}
                      style={{
                        padding: theme.spacing(1),
                        borderBottom: "1px solid #e0e0e0",
                        textAlign: "left",
                        backgroundColor: "#000000",
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

                return (
                  <tr
                    {...row.getRowProps()}
                    style={{
                      backgroundColor: isInstallatie ? "#e0f7fa" : "#ffffff",
                      color: "#000000",
                    }}
                  >
                    {row.cells.map((cell) => (
                      <td
                        {...cell.getCellProps()}
                        style={{
                          padding: theme.spacing(1),
                          borderBottom: "1px solid #e0e0e0",
                        }}
                      >
                        {cell.render("Cell")}
                      </td>
                    ))}
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
              <Box key={src} position="relative" mr={2} mb={2}>
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
                fileType === "vnd.openxmlformats-officedocument.wordprocessingml.document"
              ) {
                icon = <DescriptionIcon style={{ fontSize: 40 }} />;
              } else {
                icon = <InsertDriveFileIcon style={{ fontSize: 40 }} />;
              }
              return (
                <Box key={src} position="relative" mr={2} mb={2}>
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
