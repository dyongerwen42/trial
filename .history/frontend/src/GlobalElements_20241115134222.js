// GlobalElements.js
import React, { useState, useCallback, useMemo } from "react";
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

const GlobalElements = ({ t }) => {
  const {
    state: { globalElements, globalSpaces, newElement, errors },
    handleAddElement,
    handleEditElement,
    saveData,
    handleDeleteElement,
    updateGebreken,
    resetNewElement,
    setNewElement,
    setErrors,
    setSuccessMessage,
    addGebrek, // Added
    removeGebrek, // Added
  } = useMjopContext(); // Zorg ervoor dat 'errors' is opgenomen in destructurering

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
  const [customGebrek, setCustomGebrek] = useState("");
  const [customGebrekSeverity, setCustomGebrekSeverity] = useState("gering");

  const theme = useTheme();

  const steps = [
    "Element Details",
    "Ruimte Selectie",
    "Bestanden Uploaden",
    "Gebreken & Inspecties",
    "Review & Opslaan",
  ];

  // -------------------- Handler Functions --------------------

  // Function to extract defects based on element name, type, and material
  const extractGebreken = useCallback((elementName, type, material, data) => {
    const element = data.find((task) => task.name === elementName);
    if (
      element &&
      element.gebreken &&
      element.gebreken[type] &&
      element.gebreken[type][material]
    ) {
      return element.gebreken[type][material];
    }
    return {};
  }, []);

  // Function to retrieve prices based on element name
  const getPrices = useCallback((elementName) => {
    for (const category in taken.onderhoudstaken) {
      const categoryData = taken.onderhoudstaken[category];
      for (const taskType in categoryData) {
        const tasks = categoryData[taskType];
        for (const task of tasks) {
          if (task.beschrijving === elementName) {
            return {
              prijs_per_vierkante_meter: task.prijs_per_vierkante_meter || 0,
              prijs_per_strekkende_meter: task.prijs_per_strekkende_meter || 0,
              prijs_per_stuk: task.prijs_per_stuk || 0,
            };
          }
        }
      }
    }
    return {
      prijs_per_vierkante_meter: 0,
      prijs_per_strekkende_meter: 0,
      prijs_per_stuk: 0,
    };
  }, []);

  // Function to open documents modal
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

  // Function to open photos modal
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

  // Function to close documents modal
  const handleCloseDocumentsModal = useCallback(() => setDocumentsModalOpen(false), []);

  // Function to close photos modal
  const handleClosePhotosModal = useCallback(() => setPhotosModalOpen(false), []);

  // Function to open image modal
  const handleOpenImageModal = useCallback((src) => {
    setSelectedImage(src);
    setOpenImageModal(true);
  }, []);

  // Function to close image modal
  const handleCloseImageModal = useCallback(() => {
    setOpenImageModal(false);
  }, []);

  // Function to select an element for editing
  const handleSelectElement = useCallback(
    (element, isEditMode = false, fromTable = false) => {
      const task = inspectionTasks.find((task) => task.name === element.name);

      const types = Object.keys(task?.gebreken || {});
      const materials = Object.keys(task?.gebreken[element.type] || {});

      const selectedSpace = globalSpaces.find(
        (space) => space.id === element.spaceId
      );

      const prices = getPrices(element.name);

      // Check if type is defined
      if (!element.type) {
        console.error("Element type is undefined:", element);
        setErrors({ general: "Type van het element is niet gedefinieerd." });
        return;
      }

      // Initialize defects correctly under the right category, material, and severity
      const initialGebreken = element.gebreken
        ? element.gebreken
        : {}; // Start with empty defects if not edited

      setNewElement((prev) => ({
        ...prev,
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
        gebreken: initialGebreken,
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
        prices,
        unitType: element.unitType || "",
        quantity: element.quantity || "",
        levensduur: element.levensduur || "",
        aanschafDatum: element.aanschafDatum || null,
        vervangingsKosten: element.vervangingsKosten || "",
      }));

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
    },
    [globalSpaces, getPrices, setErrors, setNewElement]
  );

  // Function to handle type change
  const handleTypeChange = useCallback(
    (e) => {
      const selectedType = e.target.value;
      const materials = Object.keys(
        inspectionTasks.find((task) => task.name === newElement.name)?.gebreken[
          selectedType
        ] || {}
      );
      setMaterials(materials);
      setNewElement((prev) => ({
        ...prev,
        type: selectedType,
        material: "",
        gebreken: {}, // Reset defects
        unitType: "",
        quantity: "",
      }));
    },
    [newElement.name]
  );

  // Function to handle material change
  const handleMaterialChange = useCallback(
    (e) => {
      const selectedMaterial = e.target.value;
      const prices = getPrices(newElement.name);

      // Remove defects for the previous material
      const updatedGebreken = { ...newElement.gebreken };

      if (
        newElement.type &&
        updatedGebreken[newElement.type] &&
        updatedGebreken[newElement.type][newElement.material]
      ) {
        // Iterate over all severity categories and remove defects for the old material
        Object.keys(updatedGebreken[newElement.type][newElement.material]).forEach((severity) => {
          if (
            updatedGebreken[newElement.type][newElement.material][severity]
          ) {
            delete updatedGebreken[newElement.type][newElement.material][severity];
          }
        });

        // Remove material if no severity levels remain
        if (
          Object.keys(updatedGebreken[newElement.type][newElement.material]).length === 0
        ) {
          delete updatedGebreken[newElement.type][newElement.material];
        }

        // Remove type if no materials remain
        if (Object.keys(updatedGebreken[newElement.type]).length === 0) {
          delete updatedGebreken[newElement.type];
        }
      }

      setNewElement((prev) => ({
        ...prev,
        material: selectedMaterial,
        gebreken: updatedGebreken,
        prices,
        unitType: "",
        quantity: "",
      }));
    },
    [newElement.type, newElement.material, newElement.name, newElement.gebreken, getPrices]
  );

  // Function to upload file to server
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

  // Function to handle photo file change
  const handleFileChange = useCallback(
    async (e) => {
      const files = Array.from(e.target.files);
      const fileUrls = await Promise.all(files.map((file) => uploadFile(file)));
      setNewElement((prev) => ({
        ...prev,
        photos: [
          ...(prev.photos || []),
          ...fileUrls.filter((url) => url !== null),
        ],
      }));
    },
    [uploadFile]
  );

  // Function to handle document file change
  const handleDocumentChange = useCallback(
    async (e) => {
      const files = Array.from(e.target.files);
      const fileUrls = await Promise.all(files.map((file) => uploadFile(file)));
      setNewElement((prev) => ({
        ...prev,
        documents: [
          ...(prev.documents || []),
          ...fileUrls.filter((url) => url !== null),
        ],
      }));
    },
    [uploadFile]
  );

  // Function to clear a specific photo
  const handleClearImage = useCallback(
    (index) => {
      const updatedPhotos = Array.from(newElement.photos || []).filter(
        (_, i) => i !== index
      );
      setNewElement((prev) => ({
        ...prev,
        photos: updatedPhotos,
      }));
      setImagePreviews(
        updatedPhotos.map((file) =>
          typeof file === "string"
            ? `http://localhost:5000/${file.replace("\\", "/")}`
            : URL.createObjectURL(file)
        )
      );
    },
    [newElement.photos]
  );

  // Function to clear a specific document
  const handleClearDocument = useCallback(
    (index) => {
      const updatedDocuments = Array.from(newElement.documents || []).filter(
        (_, i) => i !== index
      );
      setNewElement((prev) => ({
        ...prev,
        documents: updatedDocuments,
      }));
      setDocumentPreviews(
        updatedDocuments.map((file) =>
          typeof file === "string"
            ? `http://localhost:5000/${file.replace("\\", "/")}`
            : URL.createObjectURL(file)
        )
      );
    },
    [newElement.documents]
  );

  // Function to reset newElement
  const handleResetNewElement = useCallback(() => {
    resetNewElement();
    setImagePreviews([]);
    setDocumentPreviews([]);
    setSelectedImage(null);
    setAnnotations([]);
    setErrors({});
    setIsEditing(false);
    setActiveStep(0);
  }, [resetNewElement, setErrors]);

  // Function to save element
  const handleSaveElement = useCallback(() => {
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

    if (isEditing) {
      handleEditElement(newElement);
      setSuccessMessage("Element succesvol bijgewerkt.");
    } else {
      handleAddElement(newElement);
      setSuccessMessage("Element succesvol toegevoegd.");
    }

    handleResetNewElement();
  }, [
    newElement,
    isEditing,
    handleEditElement,
    handleAddElement,
    handleResetNewElement,
    setErrors,
    setSuccessMessage,
  ]);

  // Function to handle stepper navigation - Next
  const handleNext = useCallback(() => {
    if (activeStep === steps.length - 1) {
      handleSaveElement();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  }, [activeStep, handleSaveElement, steps.length]);

  // Function to handle stepper navigation - Back
  const handleBack = useCallback(() => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  }, []);

  // Function to handle stepper step click
  const handleStep = useCallback((step) => {
    setActiveStep(step);
  }, []);

  // Check if all required fields are filled
  const allFieldsFilled = useMemo(() => (
    newElement.name &&
    newElement.description &&
    newElement.interval &&
    newElement.spaceId &&
    newElement.type &&
    newElement.material &&
    (newElement.material !== "Other" || newElement.customMaterial)
  ), [newElement]);

  // Function to handle type selection from sidebar
  const handleTypeChangeFromSidePanel = useCallback(
    (element, selectedType) => {
      const materials = Object.keys(
        inspectionTasks.find((task) => task.name === element.name)?.gebreken[
          selectedType
        ] || {}
      );
      setMaterials(materials);

      const prices = getPrices(element.name);

      setNewElement((prev) => ({
        ...prev,
        name: element.name,
        description: element.description,
        interval: element.interval,
        spaceId: element.spaceId,
        type: selectedType,
        material: "",
        gebreken: {}, // Reset defects
        prices,
        unitType: "",
        quantity: "",
      }));
    },
    [getPrices]
  );

  // Function to handle expanding/collapsing elements in sidebar
  const handleExpandClick = useCallback((index) => {
    setExpandedElement((prev) => (prev === index ? null : index));
  }, []);

  // Function to handle selecting and deselecting defects
  const handleSelectGebrek = useCallback(
    (category, severity, material, gebrekName) => {
      console.log("Handle Select Gebrek:", { category, severity, material, gebrekName });
      const isSelected =
        newElement.gebreken[category] &&
        newElement.gebreken[category][material] &&
        newElement.gebreken[category][material][severity] &&
        newElement.gebreken[category][material][severity].includes(gebrekName);

      if (isSelected) {
        // Remove the defect from the current category, material, and severity
        removeGebrek(category, severity, material, gebrekName);
      } else {
        // Add the defect with the current severity category
        addGebrek(category, severity, material, gebrekName);
      }
    },
    [newElement.gebreken, addGebrek, removeGebrek]
  );

  // Function to change the severity of a defect
  const handleChangeSeverity = useCallback(
    (category, severity, material, gebrekName, newSeverity) => {
      console.log("Handle Change Severity:", { category, severity, material, gebrekName, newSeverity });
      if (severity === newSeverity) return; // No change

      // Remove the defect from the current severity category
      removeGebrek(category, severity, material, gebrekName);
      // Add the defect to the new severity category
      addGebrek(category, newSeverity, material, gebrekName);
    },
    [addGebrek, removeGebrek]
  );

  // Function to add a custom defect
  const handleAddCustomGebrek = useCallback(() => {
    if (customGebrek.trim() === "") return;

    const category = "customCategory";
    const severityCategory = customGebrekSeverity;
    const material = "customMaterial";

    addGebrek(category, severityCategory, material, customGebrek.trim());

    setCustomGebrek("");
    setCustomGebrekSeverity("gering");
  }, [customGebrek, customGebrekSeverity, addGebrek]);

  // Function to add an annotation
  const handleAddAnnotation = useCallback(
    (position) => {
      const newAnnotation = {
        ...position,
      };
      setNewElement((prev) => ({
        ...prev,
        annotations: [...prev.annotations, newAnnotation],
      }));
    },
    []
  );

  // Function to undo the last annotation
  const handleUndoAnnotation = useCallback(() => {
    setNewElement((prev) => ({
      ...prev,
      annotations: prev.annotations.slice(0, -1),
    }));
  }, []);

  // Function to delete all annotations
  const handleDeleteAllAnnotations = useCallback(() => {
    setNewElement((prev) => ({
      ...prev,
      annotations: [],
    }));
  }, []);

  // -------------------- Render Functions --------------------

  // Define table columns
  const columnsTable = useMemo(() => [
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
  ], [globalSpaces, handleOpenDocumentsModal, handleOpenPhotosModal, handleSelectElement, handleDeleteElement]);

  const dataTable = useMemo(() => globalElements, [globalElements]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    rows: rowsTable,
  } = useTable({
    columns: columnsTable,
    data: dataTable,
  });

  // Helper function to render defects
  const renderGebreken = useCallback(() => {
    // Get available defects based on selected type and material
    const category = newElement.type;
    const material = newElement.material;
    const availableGebreken = extractGebreken(
      newElement.name,
      category,
      material,
      inspectionTasks
    );

    console.log("Available Gebreken:", availableGebreken);
    console.log("Selected Gebreken:", newElement.gebreken);

    if (!availableGebreken || Object.keys(availableGebreken).length === 0) {
      return <Typography variant="body1">Geen gebreken beschikbaar voor deze selectie.</Typography>;
    }

    return Object.keys(availableGebreken).map((severity) => (
      <Box key={severity} mb={2}>
        <Typography variant="body1" sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
          Ernst: {severity.charAt(0).toUpperCase() + severity.slice(1)}
        </Typography>
        {availableGebreken[severity].length > 0 ? (
          <Grid container spacing={1}>
            {availableGebreken[severity].map((gebrek) => {
              // Determine if this is a custom defect
              const isCustom = category === "customCategory" && material === "customMaterial";

              return (
                <Grid item xs={12} sm={6} md={4} key={gebrek}>
                  <Box display="flex" alignItems="center">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={
                            newElement.gebreken[category] &&
                            newElement.gebreken[category][material] &&
                            newElement.gebreken[category][material][severity] &&
                            newElement.gebreken[category][material][severity].includes(gebrek)
                          }
                          onChange={() =>
                            handleSelectGebrek(category, severity, material, gebrek)
                          }
                        />
                      }
                      label={gebrek}
                    />
                    {/* Only show if it's a custom defect */}
                    {isCustom && (
                      <FormControl
                        variant="outlined"
                        size="small"
                        sx={{ minWidth: 120, ml: 1 }}
                      >
                        <InputLabel>Ernst</InputLabel>
                        <Select
                          value={
                            newElement.gebreken[category] &&
                            newElement.gebreken[category][material] &&
                            newElement.gebreken[category][material][severity] &&
                            newElement.gebreken[category][material][severity].includes(gebrek)
                              ? severity
                              : "gering"
                          }
                          onChange={(e) =>
                            handleChangeSeverity(
                              category,
                              severity,
                              material,
                              gebrek,
                              e.target.value
                            )
                          }
                          label="Ernst"
                        >
                          <MenuItem value="ernstig">Ernstig</MenuItem>
                          <MenuItem value="serieus">Serieus</MenuItem>
                          <MenuItem value="gering">Gering</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Typography variant="body2">Geen defecten beschikbaar.</Typography>
        )}
      </Box>
    ));
  }, [newElement, extractGebreken, handleSelectGebrek, handleChangeSeverity]);

  // Function to render step content based on active step
  const renderStepContent = useCallback((step) => {
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
                label="Inspectie-interval"
                value={newElement.interval}
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
                    setNewElement((prev) => ({ ...prev, categories: e.target.value }))
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

            {/* Quantity and Unit Type together */}
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                <TextField
                  variant="outlined"
                  label="Hoeveelheid"
                  type="number"
                  value={newElement.quantity}
                  onChange={(e) =>
                    setNewElement((prev) => ({ ...prev, quantity: e.target.value }))
                  }
                  error={!!errors.quantity}
                  helperText={errors.quantity}
                  sx={{ mr: 2 }}
                />
                <FormControl
                  variant="outlined"
                  error={!!errors.unitType}
                  sx={{ minWidth: 150 }}
                >
                  <InputLabel>Eenheid</InputLabel>
                  <Select
                    value={newElement.unitType}
                    onChange={(e) =>
                      setNewElement((prev) => ({ ...prev, unitType: e.target.value }))
                    }
                    label="Eenheid"
                  >
                    <MenuItem value="">
                      <em>Selecteer</em>
                    </MenuItem>
                    <MenuItem value="vierkante_meter">Vierkante meter</MenuItem>
                    <MenuItem value="strekkende_meter">Strekkende meter</MenuItem>
                    <MenuItem value="stuk">Per stuk</MenuItem>
                  </Select>
                  {errors.unitType && (
                    <Typography color="error">{errors.unitType}</Typography>
                  )}
                </FormControl>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                variant="outlined"
                label="Beschrijving van nieuw element"
                multiline
                rows={4}
                value={newElement.description}
                onChange={(e) =>
                  setNewElement((prev) => ({ ...prev, description: e.target.value }))
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
                value={newElement.levensduur}
                onChange={(e) =>
                  setNewElement((prev) => ({ ...prev, levensduur: e.target.value }))
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
                value={newElement.vervangingsKosten}
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
      }, [newElement, errors, handleTypeChange, handleMaterialChange, renderGebreken]);

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
            {availableElements
              .filter(
                (element) =>
                  element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  element.description.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((element, index) => {
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
            <Button variant="contained" onClick={handleNext}>
              {activeStep === steps.length - 1 ? "Opslaan" : "Volgende"}
            </Button>
            {allFieldsFilled && activeStep < steps.length - 1 && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveElement}
              >
                Opslaan
              </Button>
            )}
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
              {rowsTable.map((row) => {
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
