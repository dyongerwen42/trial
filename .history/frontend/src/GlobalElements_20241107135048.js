import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import {
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
  Collapse,  // For the collapsible list items
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ClearIcon from '@mui/icons-material/Clear';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import UndoIcon from '@mui/icons-material/Undo';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';  // Icon for expanding
import ExpandLessIcon from '@mui/icons-material/ExpandLess';  // Icon for collapsing
import { useTable } from 'react-table';
import { v4 as uuidv4 } from 'uuid';
import { useMjopContext } from "./MjopContext";
import  availableElements from './inspectionTasks.json';



import inspectionTasks from './inspectionTasks.json';
import ImageAnnotation from './ImageAnnotation';

const extractGebreken = (elementName, type, material, data) => {
  const element = data.find(task => task.name === elementName);
  if (element && element.gebreken && element.gebreken[type] && element.gebreken[type][material]) {
    return element.gebreken[type][material];
  }
  return {};
};

const GlobalElements = ({ t }) => {
  const {
    state: { globalElements, globalSpaces},
    handleAddElement,
    handleEditElement,
    saveData,
    handleDeleteElement,
  } = useMjopContext();

  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [newElement, setNewElement] = useState({
    id: '',
    name: '',
    description: '',
    interval: '',
    spaceId: '',
    type: '',
    material: '',
    customMaterial: '',
    photos: [],
    documents: [],
    gebreken: {},
    levensduur: '', // Add this field
    aanschafDatum: null, // Add this field (use Date or string)
    vervangingsKosten: '', // Add this field
    inspectionReport: [
      {
        id: '',
        description: '',
        inspectionDone: false,
        inspectionDate: null,
        tasks: [],
      },
    ],
    annotations: [],
  });
  
  const [imagePreviews, setImagePreviews] = useState([]);
  const [documentPreviews, setDocumentPreviews] = useState([]);
  const [errors, setErrors] = useState({});
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
  const [expandedElement, setExpandedElement] = useState(null); // Track which element is expanded

  const theme = useTheme();

  const steps = ['Element Details', 'Ruimte Selectie', 'Bestanden Uploaden', 'Gebreken & Inspecties', 'Review & Opslaan'];

  useEffect(() => {
    if (newElement.photos && newElement.photos.length > 0) {
      const previews = newElement.photos.map((file) => {
        if (typeof file === 'string') {
          return `http://localhost:5000/${file.replace('\\', '/')}`;
        } else if (file instanceof File) {
          return URL.createObjectURL(file);
        } else {
          return null;
        }
      }).filter((src) => src !== null);
      setImagePreviews(previews);
    } else {
      setImagePreviews([]);
    }

    if (newElement.documents && newElement.documents.length > 0) {
      const previews = newElement.documents.map((file) => {
        if (typeof file === 'string') {
          return `http://localhost:5000/${file.replace('\\', '/')}`;
        } else if (file instanceof File) {
          return URL.createObjectURL(file);
        } else {
          return null;
        }
      }).filter((src) => src !== null);
      setDocumentPreviews(previews);
    } else {
      setDocumentPreviews([]);
    }
  }, [newElement.photos, newElement.documents]);

  const filteredElements = useMemo(() => {
    return availableElements.filter(
      (element) =>
        element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        element.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, availableElements]);

  const columns = useMemo(
    () => [
      {
        Header: 'Elementnaam',
        accessor: 'name',
      },
      {
        Header: 'Beschrijving',
        accessor: 'description',
      },
      {
        Header: 'Interval',
        accessor: 'interval',
      },
      {
        Header: 'Ruimte',
        accessor: 'spaceId',
        Cell: ({ value }) => {
          const space = globalSpaces.find((space) => space.id === value);
          return space ? space.name : '';
        },
      },
      {
        Header: 'Bestanden',
        accessor: 'files',
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
        Header: 'Acties',
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

  const { getTableProps, getTableBodyProps, headerGroups, prepareRow, rows } = useTable({
    columns,
    data,
  });

const handleSelectElement = (element, isEditMode = false, fromTable = false) => {
  // Find the relevant inspection task based on the element's name
  const task = inspectionTasks.find(task => task.name === element.name);
  
  // Extract the types and materials related to the element's issues (gebreken)
  const types = Object.keys(task?.gebreken || {});
  const materials = Object.keys(task?.gebreken[element.type] || {});
  
  // Find the associated space for the element
  const selectedSpace = globalSpaces.find(space => space.id === element.spaceId);

  // Set up the new element state with existing or default values
  setNewElement({
    id: fromTable ? element.id : '',
    name: element.name,
    description: element.description,
    interval: element.interval,
    spaceId: element.spaceId,
    type: element.type || '',
    material: element.material || '',
    customMaterial: element.customMaterial || '',
    photos: element.photos || [],
    documents: element.documents || [],
    gebreken: element.gebreken || extractGebreken(element.name, element.type, element.material, inspectionTasks),
    inspectionReport: element.inspectionReport || [
      {
        id: uuidv4(),
        description: '',
        inspectionDone: false,
        inspectionDate: null,
        tasks: [],
      },
    ],
    annotations: element.annotations || [],
  });

  // Set materials based on the selected element's type
  setMaterials(materials);
  
  // Determine if the element is being edited
  setIsEditing(fromTable && isEditMode);

  if (selectedSpace) {
    // Construct the image URL, replacing backslashes if necessary
    const imageWithAnnotations = selectedSpace.image.startsWith('http') 
      ? selectedSpace.image 
      : `http://localhost:5000/${selectedSpace.image.replace(/\\/g, '/')}`;
    
    // Set the selected image and annotations related to the space
    setSelectedImage(imageWithAnnotations);
    setAnnotations(selectedSpace.annotations);
  }

  // Reset validation errors and steps when a new item is selected
  setErrors({});
  setFoutieveStappen([]);
  setActiveStep(0);
};


  const handleTypeChange = (e) => {
    const selectedType = e.target.value;
    const materials = Object.keys(inspectionTasks.find(task => task.name === newElement.name)?.gebreken[selectedType] || {});
    setMaterials(materials);
    setNewElement({
      ...newElement,
      type: selectedType,
      material: '',
      gebreken: {},
    });
  };

  const handleMaterialChange = (e) => {
    const selectedMaterial = e.target.value;
    const gebreken = extractGebreken(newElement.name, newElement.type, selectedMaterial, inspectionTasks);
    setNewElement({
      ...newElement,
      material: selectedMaterial,
      gebreken,
    });
  };

  const handleOpenImageModal = (src) => {
    setSelectedImage(src);
    setOpenImageModal(true);
  };

  const handleCloseImageModal = () => {
    setOpenImageModal(false);
  };

  const handleOpenDocumentsModal = (documents) => {
    setSelectedDocuments(documents.map((doc) => (typeof doc === 'string' ? `http://localhost:5000/${doc.replace('\\', '/')}` : URL.createObjectURL(doc))));
    setDocumentsModalOpen(true);
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.filePath;
    } catch (error) {
      console.error('Fout bij het uploaden van bestand:', error);
      return null;
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    const fileUrls = await Promise.all(files.map((file) => uploadFile(file)));
    setNewElement({
      ...newElement,
      photos: [...(newElement.photos || []), ...fileUrls.filter((url) => url !== null)],
    });
  };

  const handleDocumentChange = async (e) => {
    const files = Array.from(e.target.files);
    const fileUrls = await Promise.all(files.map((file) => uploadFile(file)));
    setNewElement({
      ...newElement,
      documents: [...(newElement.documents || []), ...fileUrls.filter((url) => url !== null)],
    });
  };

  const handleClearImage = (index) => {
    const updatedPhotos = Array.from(newElement.photos || []).filter((_, i) => i !== index);
    setNewElement({ ...newElement, photos: updatedPhotos });
    setImagePreviews(updatedPhotos.map((file) => (typeof file === 'string' ? `http://localhost:5000/${file.replace('\\', '/')}` : URL.createObjectURL(file))));
  };

  const handleClearDocument = (index) => {
    const updatedDocuments = Array.from(newElement.documents || []).filter((_, i) => i !== index);
    setNewElement({ ...newElement, documents: updatedDocuments });
    setDocumentPreviews(updatedDocuments.map((file) => (typeof file === 'string' ? `http://localhost:5000/${file.replace('\\', '/')}` : URL.createObjectURL(file))));
  };

  const resetNewElement = () => {
    setNewElement({
      id: '',
      name: '',
      description: '',
      interval: '',
      spaceId: '',
      type: '',
      material: '',
      customMaterial: '',
      photos: [],
      documents: [],
      gebreken: {},
      inspectionReport: [
        {
          id: uuidv4(),
          description: '',
          inspectionDone: false,
          inspectionDate: null,
          tasks: [],
        },
      ],
      annotations: [],
    });
    setImagePreviews([]);
    setDocumentPreviews([]);
    setSelectedImage(null);
    setAnnotations([]);
    setErrors({});
    setIsEditing(false);
    setActiveStep(0);
  };

  const handleSaveElement = () => {
    // Define validation rules, keeping only essential fields or skipping as needed
    const newErrors = {};
  
    // Only validate the name if it must be filled, otherwise, skip
    if (!newElement.name) newErrors.name = 'Naam is verplicht';
  
    // Apply additional validations only if strictly necessary
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const invalidSteps = [];
      if (newErrors.name) invalidSteps.push(0); // Only step 0 has required fields
      setFoutieveStappen(invalidSteps);
      return;
    }
  
    // Add or update the element, based on whether we are editing
    if (isEditing) {
      handleEditElement(newElement); // Update the element
    } else {
      handleAddElement(newElement); // Add a new element
    }
  
    // Reset the form fields after saving, clearing input for next use
    resetNewElement();
  };
  
  useEffect(() => {
    if (state.globalElements.length > 0) {
      const saveChanges = async () => {
        try {
          await saveData(); // Save the latest data to the backend
          console.log("Element data saved successfully to the database.");
        } catch (error) {
          console.error("Error saving element data to database:", error);
        }
      };
  
      saveChanges();
    }
  }, [state.globalElements]); // Trigger on changes to globalElements
  
  

  const handleOpenPhotosModal = (photos) => {
    setSelectedPhotos(photos.map((photo) => (typeof photo === 'string' ? `http://localhost:5000/${photo.replace('\\', '/')}` : URL.createObjectURL(photo))));
    setPhotosModalOpen(true);
  };

  const handleClosePhotosModal = () => setPhotosModalOpen(false);

  const handleCloseDocumentsModal = () => setDocumentsModalOpen(false);

  const handleAddAnnotation = (position) => {
    const newAnnotation = {
      ...position,
    };
    setNewElement({
      ...newElement,
      annotations: [...newElement.annotations, newAnnotation],
    });
  };

  const handleUndoAnnotation = () => {
    setNewElement({
      ...newElement,
      annotations: newElement.annotations.slice(0, -1),
    });
  };

  const handleDeleteAllAnnotations = () => {
    setNewElement({
      ...newElement,
      annotations: [],
    });
  };

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

  const allFieldsFilled = () => {
    return (
      newElement.name &&
      newElement.description &&
      newElement.interval &&
      newElement.spaceId &&
      newElement.type &&
      newElement.material &&
      (newElement.material !== 'Other' || newElement.customMaterial)
    );
  };

  const handleTypeChangeFromSidePanel = (element, selectedType) => {
    // Update the element with the selected type
    const materials = Object.keys(inspectionTasks.find(task => task.name === element.name)?.gebreken[selectedType] || {});
    setMaterials(materials);
    
    setNewElement({
      ...newElement,
      name: element.name,
      description: element.description,
      interval: element.interval,
      spaceId: element.spaceId,
      type: selectedType,
      material: '',  // Reset material selection
      gebreken: {},
    });
  };

  
  const handleExpandClick = (index) => {
    setExpandedElement((prev) => (prev === index ? null : index)); // Toggle using index
  };
  
  

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
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined" error={!!errors.type} sx={{ mb: 2 }}>
                <InputLabel>Selecteer Type</InputLabel>
                <Select
                  value={newElement.type}
                  onChange={handleTypeChange}
                  label="Selecteer Type"
                >
                  {Object.keys(inspectionTasks.find(task => task.name === newElement.name)?.gebreken || {}).map((type, index) => (
                    <MenuItem key={index} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
                {errors.type && <Typography color="error">{errors.type}</Typography>}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined" error={!!errors.material} sx={{ mb: 2 }}>
                <InputLabel>Selecteer Materiaal</InputLabel>
                <Select
                  value={newElement.material}
                  onChange={handleMaterialChange}
                  label="Selecteer Materiaal"
                >
                  {materials.map((material, index) => (
                    <MenuItem key={index} value={material}>
                      {material}
                    </MenuItem>
                  ))}
                  <MenuItem value="Other">Overig</MenuItem>
                </Select>
                {errors.material && <Typography color="error">{errors.material}</Typography>}
              </FormControl>
            </Grid>
            {newElement.material === 'Other' && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Aangepast Materiaal"
                  value={newElement.customMaterial}
                  onChange={(e) =>
                    setNewElement({ ...newElement, customMaterial: e.target.value })}
                  error={!!errors.customMaterial}
                  helperText={errors.customMaterial}
                  sx={{ mb: 2 }}
                />
              </Grid>
            )}
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
                value={newElement.levensduur}
                onChange={(e) =>
                  setNewElement({ ...newElement, levensduur: e.target.value })}
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
                value={newElement.aanschafDatum || ''}
                onChange={(e) =>
                  setNewElement({ ...newElement, aanschafDatum: e.target.value })}
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
                  setNewElement({ ...newElement, vervangingsKosten: e.target.value })}
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
                <FormControl fullWidth variant="outlined" error={!!errors.spaceId} sx={{ mb: 2 }}>
                  <InputLabel>Selecteer Ruimte</InputLabel>
                  <Select
                    value={newElement.spaceId}
                    onChange={(e) => {
                      setNewElement({ ...newElement, spaceId: e.target.value });
                      const selectedSpace = globalSpaces.find(space => space.id === e.target.value);
                      if (selectedSpace) {
                        const imageWithAnnotations = selectedSpace.image.startsWith('http') ? selectedSpace.image : `http://localhost:5000/${selectedSpace.image.replace('\\', '/')}`;
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
                  {errors.spaceId && <Typography color="error">{errors.spaceId}</Typography>}
                </FormControl>
              </Grid>
            </Grid>
          );
         case 2:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <Button variant="contained" component="label" startIcon={<AddPhotoAlternateIcon />} sx={{ mb: 2 }}>
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
                    <Box key={index} position="relative" mr={2} mb={2}>
                      <img
                        src={src}
                        alt={`Voorbeeld ${index}`}
                        style={{ width: '100px', height: '100px', objectFit: 'contain' }}
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
                            const link = document.createElement('a');
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
                <Button variant="contained" component="label" startIcon={<InsertDriveFileIcon />} sx={{ mb: 2 }}>
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
                    const fileType = file ? file.type?.split('/')[1] : null;
                    let icon;
                    if (fileType === 'pdf') {
                      icon = <PictureAsPdfIcon style={{ fontSize: 40 }} />;
                    } else if (fileType === 'msword' || fileType === 'vnd.openxmlformats-officedocument.wordprocessingml.document') {
                      icon = <DescriptionIcon style={{ fontSize: 40 }} />;
                    } else {
                      icon = <InsertDriveFileIcon style={{ fontSize: 40 }} />;
                    }

                    return (
                      <Box key={index} position="relative" mr={2} mb={2}>
                        <a href={src} download style={{ margin: '0 8px' }}>
                          {icon}
                        </a>
                        <Box display="flex" justifyContent="center" mt={1}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDocumentsModal(src)}
                          >
                            <AddCircleOutlineIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {
                              const link = document.createElement('a');
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
        return (
          <Grid container spacing={2}>
            {selectedImage && (
              <Grid item xs={12}>
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6">Geselecteerde Ruimte: Afbeelding en Annotaties</Typography>
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
                    annotationColor="green" // Specify color for element annotations
                  />
                </Box>
              </Grid>
            )}
          </Grid>
        );
      case 4:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6">Controleer de gegevens</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body1"><strong>Naam van nieuw element:</strong> {newElement.name}</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body1"><strong>Inspectie-interval:</strong> {newElement.interval}</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body1"><strong>Geselecteerde Ruimte:</strong> {globalSpaces.find(space => space.id === newElement.spaceId)?.name}</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body1"><strong>Selecteer Type:</strong> {newElement.type}</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body1"><strong>Selecteer Materiaal:</strong> {newElement.material}</Typography>
            </Grid>

            {newElement.material === 'Other' && (
              <Grid item xs={12} md={6}>
                <Typography variant="body1"><strong>Aangepast Materiaal:</strong> {newElement.customMaterial}</Typography>
              </Grid>
            )}

            <Grid item xs={12}>
              <Typography variant="body1"><strong>Beschrijving:</strong> {newElement.description}</Typography>
            </Grid>

            {newElement.photos.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="body1"><strong>Geüploade Foto's:</strong> {newElement.photos.length} bestand(en)</Typography>
              </Grid>
            )}

            {newElement.documents.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="body1"><strong>Geüploade Documenten:</strong> {newElement.documents.length} bestand(en)</Typography>
              </Grid>
            )}

            {selectedImage && (
              <Grid item xs={12}>
                <Typography variant="body1"><strong>Geselecteerde Ruimte: Afbeelding en Annotaties</strong></Typography>
              </Grid>
            )}
          </Grid>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box display="flex" height="100vh">
      {isSidebarOpen && (
        <Paper
          className="sidebar"
          sx={{
            width: '20%',          // Fixed width for the sidebar
       // Sidebar will not exceed 300px width
            p: 2,
            boxShadow: 4,
            backgroundColor: 'background.paper',
            transition: 'width 0.3s ease',
            flexShrink: 0,
            overflowY: 'auto',      // Allow scrolling when content overflows
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
              const parentColor = element.installatie ? theme.palette.primary.main : theme.palette.secondary.main;
  
              return (
                <React.Fragment key={index}>
                  <ListItem
                    button
                    onClick={() => handleExpandClick(index)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      position: 'relative',
                      padding: '16px',
                      marginBottom: '12px',
                      backgroundColor: isExpanded ? theme.palette.grey[100] : 'white',
                      boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.05)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
                      '&:hover': {
                        backgroundColor: theme.palette.grey[200],
                        boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.1)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: '6px',
                        height: '100%',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        backgroundColor: parentColor,
                        borderRadius: '6px 0 0 6px',
                      }}
                    />
                    <ListItemText
                      primary={<Typography sx={{ fontWeight: 'bold', fontSize: '1.2rem', color: theme.palette.text.primary }}>{element.name}</Typography>}
                      sx={{ marginLeft: '30px' }}
                    />
                  </ListItem>
                  {isExpanded && <Divider sx={{ margin: '8px 0' }} />}
                  {isExpanded && (
                    <Box sx={{ pl: 5, backgroundColor: theme.palette.grey[50], borderRadius: '8px', padding: '10px 0' }}>
                      {Object.keys(inspectionTasks.find(task => task.name === element.name)?.gebreken || {}).map((type) => (
                        <ListItem
                          button
                          key={type}
                          onClick={() => handleTypeChangeFromSidePanel(element, type)}
                          sx={{
                            padding: '12px 20px',
                            backgroundColor: 'transparent',
                            marginBottom: '6px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease',
                            '&:hover': {
                              backgroundColor: theme.palette.action.hover,
                            },
                          }}
                        >
                          <ListItemText
                            primary={
                              <Typography
                                sx={{
                                  fontSize: '1rem',
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
          width: isSidebarOpen ? '80%' : '100%',
          p: 2,
          flexGrow: 1,          // Ensure it grows to take the remaining space
          overflowY: 'auto',    // Allow scrolling for content overflow
        }}
      >
        <IconButton
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          color="secondary"
          sx={{
            padding: '8px',
            '&:hover': {
              backgroundColor: 'secondary.dark',
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
                <StepLabel onClick={() => handleStep(index)} error={foutieveStappen.includes(index)}>
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
          <Box mt={2}>
            {renderStepContent(activeStep)}
          </Box>
          <Box display="flex" justifyContent="space-between" mt={4}>
            <Button disabled={activeStep === 0} onClick={handleBack}>
              Terug
            </Button>
            <Button variant="contained" onClick={handleNext}>
              {activeStep === steps.length - 1 ? 'Opslaan' : 'Volgende'}
            </Button>
            {allFieldsFilled() && activeStep < steps.length - 1 && (
              <Button variant="contained" color="primary" onClick={handleSaveElement}>
                Opslaan
              </Button>
            )}
          </Box>
        </Card>
  
        {/* Table Section */}
        <Box sx={{ mt: 4 }}>
          <table {...getTableProps()} style={{ width: '100%' }}>
            <thead>
              {headerGroups.map((headerGroup) => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column) => (
                    <th
                      {...column.getHeaderProps()}
                      style={{
                        padding: theme.spacing(1),
                        borderBottom: '1px solid #e0e0e0',
                        textAlign: 'left',
                        backgroundColor: '#000000',
                        color: '#ffffff',
                      }}
                    >
                      {column.render('Header')}
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
                      backgroundColor: isInstallatie ? '#e0f7fa' : '#ffffff',
                      color: '#000000',
                    }}
                  >
                    {row.cells.map((cell) => (
                      <td
                        {...cell.getCellProps()}
                        style={{
                          padding: theme.spacing(1),
                          borderBottom: '1px solid #e0e0e0',
                        }}
                      >
                        {cell.render('Cell')}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Box>
      </Box>
    </Box>
  );
  
  
  
  
};

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
};

export default GlobalElements;
