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
} from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Clear as ClearIcon,
  AddPhotoAlternate as AddPhotoAlternateIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Description as DescriptionIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  Undo as UndoIcon,
  DeleteSweep as DeleteSweepIcon,
} from "@mui/icons-material";
import { useTable } from "react-table";
import { v4 as uuidv4 } from "uuid";
import { useMjopContext } from "./MjopContext";
import availableElements from "./inspectionTasks.json";
import taken from "./taken.json";
import inspectionTasks from "./inspectionTasks.json";
import ImageAnnotation from "./ImageAnnotation";

const categories = Object.keys(taken.onderhoudstaken).map((key) => key);

// Pas extractGebreken aan om customGebreken mee te nemen
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

  // Voeg aangepaste gebreken toe onder dezelfde type en material
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

const getPrices = (elementName) => {
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

  // State Hooks
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

  // Extra state variabelen
  const [customGebrek, setCustomGebrek] = useState("");
  const [customGebrekSeverity, setCustomGebrekSeverity] = useState("gering");

  const steps = [
    "Element Details",
    "Ruimte Selectie",
    "Bestanden Uploaden",
    "Gebreken & Inspecties",
    "Review & Opslaan",
  ];

  // **Event Handlers Definities Beginnen Hier**
  
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

  // Close documents modal
  const handleCloseDocumentsModal = () => setDocumentsModalOpen(false);

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

  // Handle material change
  const handleMaterialChange = (e) => {
    const selectedMaterial = e.target.value;
    const prices = getPrices(newElement.name);

    // Verwijder gebreken voor de vorige materiaal via context
    if (newElement.type && newElement.material) {
      const oldMaterial = newElement.material;
      const oldGebreken = newElement.gebreken[newElement.type]?.[oldMaterial] || {};

      Object.keys(oldGebreken).forEach((severity) => {
        oldGebreken[severity].forEach((gebrekName) => {
          removeGebrek(newElement.type, oldMaterial, severity, gebrekName);
        });
      });
    }

    setNewElement({
      ...newElement,
      material: selectedMaterial,
      prices,
      unitType: "",
      quantity: "",
    });
  };

  // Handle photos modal opening and closing
  // (Already defined above)

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

  // Handle selecting an element for editing
  const handleSelectElement = (element, isEditMode = false, fromTable = false) => {
    const task = inspectionTasks.find((task) => task.name === element.name);

    const types = Object.keys(task?.gebreken || {});
    const materials = Object.keys(task?.gebreken[element.type] || {});

    const selectedSpace = globalSpaces.find(
      (space) => space.id === element.spaceId
    );

    const prices = getPrices(element.name);

    // Controleer of type is gedefinieerd
    if (!element.type) {
      console.error("Element type is undefined:", element);
      setErrors({ general: "Type van het element is niet gedefinieerd." });
      return;
    }

    // Extract gebreken inclusief custom gebreken
    const availableGebreken = extractGebreken(
      element.name,
      element.type,
      element.material,
      inspectionTasks,
      customGebreken // Voeg customGebreken toe
    );

    // Stel initialGebreken in
    let initialGebreken = {};

    if (isEditMode && element.gebreken) {
      // Bij bewerken, behoud de bestaande gebreken
      initialGebreken = element.gebreken;
    } else {
      // Bij toevoegen, initialiseert gebreken als leeg (geen geselecteerd)
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
      gebreken: initialGebreken, // Leeg bij toevoegen, bestaande bij bewerken
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
      categories: element.categories || [],
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

  // Handle type change
  const handleTypeChange = (e) => {
    const selectedType = e.target.value;
    const materials = Object.keys(
      inspectionTasks.find((task) => task.name === newElement.name)?.gebreken[
        selectedType
      ] || {}
    );
    setMaterials(materials);
    setNewElement({
      ...newElement,
      type: selectedType,
      material: "",
      gebreken: {}, // Reset gebreken
      unitType: "",
      quantity: "",
    });
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
    setCustomGebrek("");
    setCustomGebrekSeverity("gering");
  };

  // Save element
  const handleSaveElement = () => {
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
  };

  // Auto save changes when globalElements change
  useEffect(() => {
    if (globalElements.length > 0) {
      const saveChanges = async () => {
        try {
          await saveData();
          console.log("Element data saved successfully to the database.");
        } catch (error) {
          console.error("Error saving element data to database:", error);
          setErrors({ general: "Error saving data to database." });
        }
      };

      saveChanges();
    }
  }, [globalElements, saveData, setErrors]);

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

  // Handle expanding/collapsing elements in sidebar
  const handleExpandClick = (index) => {
    setExpandedElement((prev) => (prev === index ? null : index));
  };

  // Handle type selection from sidebar
  const handleTypeChangeFromSidePanel = (element, selectedType) => {
    const materials = Object.keys(
      inspectionTasks.find((task) => task.name === element.name)?.gebreken[
        selectedType
      ] || {}
    );
    setMaterials(materials);

    const prices = getPrices(element.name);

    setNewElement({
      ...newElement,
      name: element.name,
      description: element.description,
      interval: element.interval,
      spaceId: element.spaceId,
      type: selectedType,
      material: "",
      gebreken: {}, // Reset gebreken
      prices,
      unitType: "",
      quantity: "",
    });
  };

  // Handle adding custom gebreken
  const handleAddCustomGebrek = () => {
    if (customGebrek.trim() === "") return;

    const severity = customGebrekSeverity;
    const gebrekName = customGebrek.trim();
    const category = newElement.type; // Voeg toe onder het huidige type
    const material = newElement.material; // Voeg toe onder het huidige materiaal

    // Voeg het custom gebrek toe aan de context
    addGebrek(category, material, severity, gebrekName);

    // Reset de inputvelden
    setCustomGebrek("");
    setCustomGebrekSeverity("gering");
  };

  // Helper function to render gebreken zonder checkboxes
  const renderGebreken = () => {
    // Get available gebreken based on selected type and material, inclusief aangepaste gebreken
    const category = newElement.type;
    const material = newElement.material;
    const availableGebreken = extractGebreken(
      newElement.name,
      category,
      material,
      inspectionTasks,
      customGebreken // Voeg customGebreken toe
    );

    if (!availableGebreken || Object.keys(availableGebreken).length === 0) {
      return <Typography variant="body1">Geen gebreken beschikbaar voor deze selectie.</Typography>;
    }

    return Object.keys(availableGebreken).map((severity) => (
      <Box key={severity} mb={2}>
        <Typography variant="body1" sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
          Ernst: {severity.charAt(0).toUpperCase() + severity.slice(1)}
        </Typography>
        {availableGebreken[severity].length > 0 ? (
          <List dense>
            {availableGebreken[severity].map((gebrek) => (
              <ListItem key={gebrek}>
                <ListItemText primary={gebrek} />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2">Geen defecten beschikbaar.</Typography>
        )}
      </Box>
    ));
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
            <Button variant="contained" onClick={handleNext}>
              {activeStep === steps.length - 1 ? "Opslaan" : "Volgende"}
            </Button>
            {allFieldsFilled() && activeStep < steps.length - 1 && (
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
