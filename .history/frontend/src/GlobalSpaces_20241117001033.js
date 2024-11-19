// src/GlobalSpaces.js
import React, { useState, useEffect, useMemo } from 'react';
import {
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
  IconButton,
  FormControl,
  Modal,
  Backdrop,
  Fade,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Select,
  InputLabel,
  Stepper,
  Step,
  StepLabel,
  StepButton,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Clear as ClearIcon,
  AddPhotoAlternate as AddPhotoAlternateIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Download as DownloadIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Undo as UndoIcon,
  DeleteSweep as DeleteSweepIcon,
} from '@mui/icons-material';
import { useTable } from 'react-table';
import axios from 'axios';
import ImageAnnotation from './ImageAnnotation';
import { useMjopContext } from "./MjopContext";
import spaces from './spaces.json'; // Importing spaces JSON directly

const GlobalSpaces = () => {

  const {
    state: { globalSpaces, newSpace },
    state
    setGlobalSpaces,
    handleAddSpace,
    handleEditSpace,
    handleDeleteSpace,
    setNewSpace,
    saveData, // Function to save data to the backend/database
  } = useMjopContext();

  // Define availableSpaces based on the current globalSpaces state
  const availableSpaces = spaces;

  // State variables
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [documentPreviews, setDocumentPreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const [openModal, setOpenModal] = useState(false);
  const [openImageModal, setOpenImageModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [floorSelection, setFloorSelection] = useState(false);
  const [floorNumber, setFloorNumber] = useState('');
  const [allDrawings, setAllDrawings] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [foutieveStappen, setFoutieveStappen] = useState([]);

  // New States for Saving and Notifications
  const [isSaving, setIsSaving] = useState(false); // Loading state
  const [successMessage, setSuccessMessage] = useState(''); // Success notification
  const [errorMessage, setErrorMessage] = useState(''); // Error notification

  const steps = [
    'Ruimte Details',
    'Verdieping Selectie',
    'Afbeeldingen Uploaden',
    'Documenten Uploaden',
    'Bestaande Bouwtekening Selecteren',
    'Controleer en Opslaan',
  ];

  // Function to check if all required fields are filled before proceeding to next step
  const areAllFieldsFilled = () => {
    switch (activeStep) {
      case 0:
        return newSpace.name.trim() !== '' && newSpace.description.trim() !== '';
      case 1:
        return floorSelection || (!floorSelection && floorNumber.trim() !== '');
      default:
        return true;
    }
  };

  // Initialize form fields when editing a space
  useEffect(() => {
    if (!newSpace || !newSpace.id) return;

    setSelectedImage(newSpace.image ? newSpace.image.replace(/\\/g, '/') : null);
    setAnnotations(newSpace.annotations || []);
    setFloorSelection(newSpace.floorSelection || false);
    setFloorNumber(newSpace.floorNumber || '');
  }, [newSpace]);

  // Generate previews for uploaded photos and documents
  useEffect(() => {
    const previews = newSpace?.photos?.map((file) => {
      if (typeof file === 'string') {
        return `http://localhost:5000/${file.replace(/\\/g, '/')}`;
      } else if (file instanceof File) {
        return URL.createObjectURL(file);
      } else {
        return null;
      }
    }).filter((src) => src !== null);

    setImagePreviews(previews || []);

    const documentPreviews = newSpace?.documents?.map((file) => {
      if (typeof file === 'string') {
        return `http://localhost:5000/${file.replace(/\\/g, '/')}`;
      } else if (file instanceof File) {
        return URL.createObjectURL(file);
      } else {
        return null;
      }
    }).filter((src) => src !== null);

    setDocumentPreviews(documentPreviews || []);
  }, [newSpace?.photos, newSpace?.documents]);

  // Collect all unique drawings from globalSpaces
  useEffect(() => {
    const drawings = [...new Set(globalSpaces.map(space => space.image).filter(image => image))];
    setAllDrawings(drawings);
  }, [globalSpaces]);

  // Filter spaces based on search term
  const filteredSpaces = useMemo(() => {
    return availableSpaces.filter(
      (space) =>
        space.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        space.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, availableSpaces]);

  // Define table columns using react-table
  const columns = useMemo(
    () => [
      {
        Header: 'Ruimtenaam',
        accessor: 'name',
      },
      {
        Header: 'Beschrijving',
        accessor: 'description',
      },
      {
        Header: 'Bestanden',
        accessor: 'files',
        Cell: ({ row }) => (
          <Box display="flex" alignItems="center">
            <IconButton onClick={() => handleOpenModal(row.original.photos)} color="primary">
              <AddPhotoAlternateIcon />
            </IconButton>
            <IconButton onClick={() => handleOpenModal(row.original.documents)} color="primary">
              <InsertDriveFileIcon />
            </IconButton>
            <IconButton onClick={() => handleOpenImageModal(row.original.image, row.original.annotations)} color="primary">
              <VisibilityIcon />
            </IconButton>
          </Box>
        ),
      },
      {
        Header: 'Acties',
        Cell: ({ row }) => (
          <Box display="flex" justifyContent="space-around">
            <IconButton
              onClick={() => {
                setIsEditing(true);
                const formattedImage = row.original.image ? row.original.image.replace(/\\/g, '/') : '';
                setNewSpace({ ...row.original, image: formattedImage });
                setSelectedImage(formattedImage ? `http://localhost:5000/${formattedImage}` : null);
                setAnnotations(row.original.annotations || []);
                setFloorSelection(row.original.floorSelection || false);
                setFloorNumber(row.original.floorNumber || '');
                setActiveStep(0);
                setErrors({});
              }}
              color="primary"
            >
              <EditIcon />
            </IconButton>
            <IconButton
              onClick={() => handleDeleteSpace(row.original.id)}
              color="secondary"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        ),
      },
    ],
    [handleDeleteSpace]
  );

  // Prepare data for react-table
  const data = useMemo(() => globalSpaces, [globalSpaces]);

  const { getTableProps, getTableBodyProps, headerGroups, prepareRow, rows } = useTable({
    columns,
    data,
  });

  // Function to handle selecting a space from the sidebar for editing
  const handleSelectSpace = (space) => {
    if (!space || !space.id) return; // Prevents undefined 'id' error

    const formattedImage = space.image ? space.image.replace(/\\/g, '/') : '';
    const resetSpace = { ...space, image: formattedImage };
    setNewSpace(resetSpace);
    setSelectedImage(formattedImage ? `http://localhost:5000/${formattedImage}` : null);
    setAnnotations(resetSpace.annotations || []);
    setFloorSelection(resetSpace.floorSelection || false);
    setFloorNumber(resetSpace.floorNumber || '');
    setActiveStep(0);

    setErrors({});
    setFoutieveStappen([]);
  };

  // Function to navigate to a specific step in the stepper
  const handleStep = (step) => {
    setActiveStep(step);
    setErrors({});
    setFoutieveStappen([]);
  };

  // Function to handle saving the space (adding or editing)
  const handleSaveSpace = async () => {
    const newErrors = {};

    // Validate the required fields
    if (!newSpace.name) newErrors.name = 'Naam is verplicht';
    if (!newSpace.description) newErrors.description = 'Beschrijving is verplicht';
    if (!floorSelection && floorNumber.trim() === '') newErrors.floorNumber = 'Verdieping is verplicht';

    setErrors(newErrors);
    handleFoutieveStappen(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    try {
      setIsSaving(true); // Start loading indicator
      let updatedGlobalSpaces;

      if (isEditing) {
        await handleEditSpace(newSpace); // Update existing space
        setSuccessMessage("Ruimte succesvol bijgewerkt.");

        // Update globalSpaces array
        updatedGlobalSpaces = globalSpaces.map((el) =>
          el.id === newSpace.id ? newSpace : el
        );
      } else {
        await handleAddSpace(newSpace); // Add new space
        setSuccessMessage("Ruimte succesvol toegevoegd.");

        // Update globalSpaces array
        updatedGlobalSpaces = [...globalSpaces, newSpace];
      }

      await saveData(updatedGlobalSpaces); // Save to database
      console.log("Space data saved successfully to the database.");

      resetNewSpace();
    } catch (error) {
      console.error("Fout bij het opslaan van ruimte:", error);
      setErrorMessage("Fout bij het opslaan van de ruimte.");
    } finally {
      setIsSaving(false); // Stop loading indicator
    }
  };

  // Automatically save data when globalSpaces change
  useEffect(() => {
    if (globalSpaces.length > 0) { // Changed from state.globalSpaces to globalSpaces
      const saveChanges = async () => {
        try {
          await saveData(); // Save the latest data to the backend
          console.log("Space data saved successfully to the database.");
        } catch (error) {
          console.error("Error saving space data to database:", error);
        }
      };

      saveChanges();
    }
  }, [globalSpaces, saveData]); // Changed dependency from state.globalSpaces to globalSpaces

  // Function to map validation errors to stepper steps
  const handleFoutieveStappen = (fouten) => {
    const nieuweFoutieveStappen = [];
    if (fouten.name) nieuweFoutieveStappen.push(0);
    if (fouten.description) nieuweFoutieveStappen.push(0);
    if (fouten.floorNumber) nieuweFoutieveStappen.push(1);
    setFoutieveStappen(nieuweFoutieveStappen);
  };

  // Function to open image modal with annotations
  const handleOpenImageModal = (image, annotations) => {
    if (typeof image !== 'string') {
      console.error("Afbeelding moet een string zijn:", image);
      setErrorMessage("Onjuiste afbeeldingstype.");
      return;
    }

    const formattedImage = image ? image.replace(/\\/g, '/') : null;
    setSelectedImage(formattedImage ? `http://localhost:5000/${formattedImage}` : null);
    setAnnotations(annotations || []);
    setOpenImageModal(true);

    setErrors({});
    setFoutieveStappen([]);
  };

  // Function to upload files to the server
  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.filePath;
    } catch (error) {
      console.error('Fout bij het uploaden van bestand:', error);
      return null;
    }
  };

  // Handle photo file changes
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    const uploadedFiles = await Promise.all(files.map(uploadFile));
    const validUploadedFiles = uploadedFiles.filter(filePath => filePath !== null);

    setNewSpace(prevState => ({
      ...prevState,
      photos: [...(prevState.photos || []), ...validUploadedFiles]
    }));
  };

  // Handle document file changes
  const handleDocumentChange = async (e) => {
    const files = Array.from(e.target.files);
    const uploadedFiles = await Promise.all(files.map(uploadFile));
    const validUploadedFiles = uploadedFiles.filter(filePath => filePath !== null);

    setNewSpace(prevState => ({
      ...prevState,
      documents: [...(prevState.documents || []), ...validUploadedFiles]
    }));
  };

  // Handle image changes for existing drawings
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const uploadedFile = await uploadFile(file);
    if (uploadedFile) {
      const imageUrl = `http://localhost:5000/${uploadedFile.replace(/\\/g, '/')}`;
      setSelectedImage(imageUrl);
      setNewSpace(prevState => ({
        ...prevState,
        image: uploadedFile,
        annotations: [] 
      }));
    } else {
      setErrorMessage("Fout bij het uploaden van de afbeelding.");
    }
  };

  // Handle selecting an existing drawing
  const handleExistingDrawingSelect = (e) => {
    const value = e.target.value;
    if (typeof value !== 'string') {
      console.error("Geselecteerde waarde moet een string zijn:", value);
      setErrorMessage("Onjuiste selectie voor bouwtekening.");
      return;
    }

    const selectedImage = value.startsWith('http') ? value : `http://localhost:5000/${value.replace(/\\/g, '/')}`;
    setSelectedImage(selectedImage);
    setNewSpace(prevState => ({
      ...prevState,
      image: selectedImage,
      annotations: []
    }));
    console.log('Selected Image:', selectedImage); // Debugging log
  };

  // Function to clear a specific uploaded photo
  const handleClearImage = (index) => {
    const updatedPhotos = Array.from(newSpace.photos || []).filter((_, i) => i !== index);
    setNewSpace(prevState => ({
      ...prevState,
      photos: updatedPhotos
    }));
    setImagePreviews(updatedPhotos.map((file) => (typeof file === 'string' ? `http://localhost:5000/${file.replace(/\\/g, '/')}` : URL.createObjectURL(file))));
  };

  // Function to clear a specific uploaded document
  const handleClearDocument = (index) => {
    const updatedDocuments = Array.from(newSpace.documents || []).filter((_, i) => i !== index);
    setNewSpace(prevState => ({
      ...prevState,
      documents: updatedDocuments
    }));
    setDocumentPreviews(updatedDocuments.map((file) => (typeof file === 'string' ? `http://localhost:5000/${file.replace(/\\/g, '/')}` : URL.createObjectURL(file))));
  };

  // Function to reset the form to its initial state
  const resetNewSpace = () => {
    setNewSpace({
      id: '',
      name: '',
      description: '',
      photos: [],
      documents: [],
      image: '',
      annotations: [],
      floorSelection: false,
      floorNumber: '',
    });
    setSelectedImage(null);
    setAnnotations([]);
    setImagePreviews([]);
    setDocumentPreviews([]);
    setErrors({});
    setIsEditing(false);
    setActiveStep(0);
  };

  // Function to navigate to the next step
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  // Function to navigate to the previous step
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Function to open the modal for viewing files
  const handleOpenModal = (files) => {
    setSelectedFiles(files);
    setOpenModal(true);
  };

  // Function to close the file modal
  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedFiles([]);
  };

  // Function to close the image modal
  const handleCloseImageModal = () => {
    setOpenImageModal(false);
    setSelectedImage(null);
    setAnnotations([]);
  };

  // Function to render file previews based on file type
  const renderFilePreview = (file) => {
    const fileType = file.split('.').pop().toLowerCase();
    if (fileType === 'pdf') {
      return <PictureAsPdfIcon style={{ fontSize: 40 }} />;
    } else {
      return <InsertDriveFileIcon style={{ fontSize: 40 }} />;
    }
  };

  // Function to undo the last annotation
  const handleUndoAnnotation = () => {
    const updatedAnnotations = annotations.slice(0, -1);
    setAnnotations(updatedAnnotations);
    setNewSpace(prevState => ({ ...prevState, annotations: updatedAnnotations }));
  };

  // Function to delete all annotations
  const handleDeleteAllAnnotations = () => {
    setAnnotations([]);
    setNewSpace(prevState => ({ ...prevState, annotations: [] }));
  };

  // Styles for modals
  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '80%',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
  };

  // Function to render content based on the current step
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        // Step 1: Ruimte Details
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                label="Nieuwe Ruimtenaam"
                value={newSpace.name}
                onChange={(e) => setNewSpace({ ...newSpace, name: e.target.value })}
                error={!!errors.name}
                helperText={errors.name}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                variant="outlined"
                label="Ruimtebeschrijving"
                multiline
                rows={4}
                value={newSpace.description}
                onChange={(e) => setNewSpace({ ...newSpace, description: e.target.value })}
                error={!!errors.description}
                helperText={errors.description}
              />
            </Grid>
          </Grid>
        );
      case 1:
        // Step 2: Verdieping Selectie
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={floorSelection}
                      onChange={(e) => setFloorSelection(e.target.checked)}
                    />
                  }
                  label="Alle Verdiepingen"
                />
              </FormControl>
            </Grid>
            {!floorSelection && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Verdieping"
                  type="number"
                  value={floorNumber}
                  onChange={(e) => setFloorNumber(e.target.value)}
                  error={!!errors.floorNumber}
                  helperText={errors.floorNumber}
                />
              </Grid>
            )}
          </Grid>
        );
      case 2:
        // Step 3: Afbeeldingen Uploaden
        return (
          <FormControl fullWidth variant="outlined">
            <Button
              variant="contained"
              component="label"
              startIcon={<AddPhotoAlternateIcon />}
              sx={{ mb: 2, fontSize: '0.875rem', maxWidth: '200px' }}
            >
              Afbeeldingen (Optioneel)
              <input
                type="file"
                hidden
                multiple
                accept="image/*"
                onChange={handleFileChange}
              />
            </Button>
            {imagePreviews.length > 0 && (
              <Box mt={2} display="flex" flexWrap="wrap">
                {imagePreviews.map((src, index) => (
                  <Box key={index} position="relative" m={1}>
                    <img src={src} alt="Voorbeeld" style={{ width: 100, height: 100, objectFit: 'contain' }} />
                    <Box display="flex" justifyContent="center" mt={1}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = src;
                          link.download = src.split('/').pop();
                          link.click();
                        }}
                        color="primary"
                      >
                        <DownloadIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => handleClearImage(index)}
                        style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          background: 'rgba(255, 255, 255, 0.7)',
                        }}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
            <Typography variant="body2" color="textSecondary">
              Het toevoegen van afbeeldingen is optioneel.
            </Typography>
          </FormControl>
        );
      case 3:
        // Step 4: Documenten Uploaden
        return (
          <FormControl fullWidth variant="outlined">
            <Button
              variant="contained"
              component="label"
              startIcon={<InsertDriveFileIcon />}
              sx={{ mb: 2, fontSize: '0.875rem', maxWidth: '200px' }}
            >
              Documenten (Optioneel)
              <input
                type="file"
                hidden
                multiple
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleDocumentChange}
              />
            </Button>
            {documentPreviews.length > 0 && (
              <Box mt={2} display="flex" flexWrap="wrap">
                {documentPreviews.map((src, index) => (
                  <Box key={index} position="relative" m={1}>
                    <a href={src} target="_blank" rel="noopener noreferrer">
                      {renderFilePreview(src)}
                    </a>
                    <Box display="flex" justifyContent="center" mt={1}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = src;
                          link.download = src.split('/').pop();
                          link.click();
                        }}
                        color="primary"
                      >
                          <DownloadIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => handleClearDocument(index)}
                        style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          background: 'rgba(255, 255, 255, 0.7)',
                        }}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
            <Typography variant="body2" color="textSecondary">
              Het toevoegen van documenten is optioneel.
            </Typography>
          </FormControl>
        );
      case 4:
        // Step 5: Bestaande Bouwtekening Selecteren
        return (
          <FormControl fullWidth variant="outlined">
            <InputLabel id="select-existing-drawing-label">Selecteer bestaande bouwtekening (Optioneel)</InputLabel>
            <Select
              labelId="select-existing-drawing-label"
              id="select-existing-drawing"
              value={selectedImage || ''}
              onChange={handleExistingDrawingSelect}
              label="Selecteer bestaande bouwtekening (Optioneel)"
              sx={{ mb: 2 }}
            >
              {allDrawings.map((drawing) => (
                <MenuItem key={drawing} value={drawing}>
                  {drawing.split('/').pop()}
                </MenuItem>
              ))}
            </Select>
            <Button
              variant="contained"
              component="label"
              startIcon={<AddPhotoAlternateIcon />}
              sx={{ mb: 2, fontSize: '0.875rem', maxWidth: '200px' }}
            >
              Bouwtekening
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleImageChange}
              />
            </Button>
            {selectedImage && (
              <>
                <Box display="flex" justifyContent="flex-start" gap={2} mb={2}>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<UndoIcon />}
                    onClick={handleUndoAnnotation}
                    disabled={annotations.length === 0}
                  >
                    Undo
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteSweepIcon />}
                    onClick={handleDeleteAllAnnotations}
                    disabled={annotations.length === 0}
                  >
                    Delete All
                  </Button>
                </Box>
                <ImageAnnotation
                  key={selectedImage}
                  image={selectedImage}
                  annotations={annotations}
                  onAddAnnotation={(position) => {
                    const updatedAnnotations = [...annotations, position];
                    setAnnotations(updatedAnnotations);
                    setNewSpace(prevState => ({ ...prevState, annotations: updatedAnnotations }));
                  }}
                />
              </>
            )}
            <Typography variant="body2" color="textSecondary">
              Het toevoegen van een bouwtekening is optioneel.
            </Typography>
          </FormControl>
        );
      case 5:
        // Step 6: Controleer en Opslaan
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6">Controleer de gegevens</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body1"><strong>Ruimtenaam:</strong> {newSpace.name}</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body1"><strong>Ruimtebeschrijving:</strong> {newSpace.description}</Typography>
            </Grid>

            {newSpace.floorSelection ? (
              <Grid item xs={12} md={6}>
                <Typography variant="body1"><strong>Verdieping:</strong> Alle Verdiepingen</Typography>
              </Grid>
            ) : (
              <Grid item xs={12} md={6}>
                <Typography variant="body1"><strong>Verdieping:</strong> {newSpace.floorNumber}</Typography>
              </Grid>
            )}

            {newSpace.photos.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="body1"><strong>Geüploade Afbeeldingen:</strong> {newSpace.photos.length} bestand(en)</Typography>
              </Grid>
            )}

            {newSpace.documents.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="body1"><strong>Geüploade Documenten:</strong> {newSpace.documents.length} bestand(en)</Typography>
              </Grid>
            )}

            {selectedImage && (
              <Grid item xs={12}>
                <Typography variant="body1"><strong>Bouwtekening:</strong> {selectedImage.split('/').pop()}</Typography>
              </Grid>
            )}

            {annotations.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="body1"><strong>Annotaties:</strong> {annotations.length} annotatie(s)</Typography>
              </Grid>
            )}
          </Grid>
        );
      default:
        return 'Onbekende stap';
    }
  };

  return (
    <Box display="flex" height="100vh">
      {/* Sidebar */}
      {isSidebarOpen && (
        <Paper
          sx={{
            flexBasis: '20%', // Sidebar width
            p: 2,
            boxShadow: 4,
            borderRadius: 2,
            backgroundColor: 'background.paper',
            transition: 'width 0.3s ease',
            flexShrink: 0,
            overflowY: 'auto', // Enable vertical scrolling for sidebar content
          }}
        >
          <Typography variant="h6" gutterBottom>
            Beschikbare Ruimtes
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Zoek ruimtes"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 3 }}
          />
          <List>
            {filteredSpaces.map((space) => (
              <React.Fragment key={space.id}>
                <ListItem button onClick={() => handleSelectSpace(space)} sx={{ mb: 1 }}>
                  <ListItemText primary={space.name} />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Main Content */}
      <Box
        component="section"
        sx={{
          width: isSidebarOpen ? '80%' : '100%',
          minWidth: '0',
          display: 'flex',
          flexDirection: 'column',
          p: 3,
          transition: 'width 0.3s ease',
          flexGrow: 1,
          maxHeight: '100vh', // Set max height to viewport height
          overflowY: 'auto',   // Enable vertical scrolling
        }}
      >
        {/* Header with IconButton and Title */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <IconButton
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            color="secondary"
            sx={{
              mb: 2,
              padding: '8px',
              '&:hover': {
                backgroundColor: 'secondary.dark',
              },
            }}
          >
            {isSidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>

          <Typography variant="h5" fontWeight={600}>
            Globale Ruimtes
          </Typography>
        </Box>

        {/* Main Content */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}> {/* Add scrolling for main content */}
          <Card sx={{ mb: 4, p: 3, borderRadius: 2, boxShadow: 3 }}>
            <CardContent>
              {/* Stepper */}
              <Stepper nonLinear activeStep={activeStep} alternativeLabel>
                {steps.map((label, index) => (
                  <Step key={label} completed={activeStep > index}>
                    <StepButton color="inherit" onClick={() => handleStep(index)}>
                      <StepLabel error={foutieveStappen.includes(index)}>{label}</StepLabel>
                    </StepButton>
                  </Step>
                ))}
              </Stepper>
              {/* Step Content */}
              <Box mt={2}>
                {renderStepContent(activeStep)}
              </Box>
              {/* Navigation Buttons */}
              <Box display="flex" justifyContent="space-between" mt={4}>
                {activeStep !== 0 && (
                  <Button onClick={handleBack} variant="contained" color="secondary" sx={{ textTransform: 'none' }}>
                    Terug
                  </Button>
                )}
                <Box display="flex" gap={2}>
                  <Button variant="contained" color="secondary" onClick={resetNewSpace} sx={{ textTransform: 'none' }}>
                    Reset
                  </Button>
                  {activeStep === steps.length - 1 ? (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSaveSpace}
                      disabled={isSaving}
                      sx={{ textTransform: 'none' }}
                    >
                      {isSaving ? <CircularProgress size={24} /> : 'Opslaan'}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleNext}
                      disabled={!areAllFieldsFilled()}
                      sx={{ textTransform: 'none' }}
                    >
                      Volgende
                    </Button>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Table Section */}
          <Box>
            <table {...getTableProps()} style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                {headerGroups.map((headerGroup) => (
                  <tr {...headerGroup.getHeaderGroupProps()}>
                    {headerGroup.headers.map((column) => (
                      <th
                        {...column.getHeaderProps()}
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid #ddd',
                          textAlign: 'left',
                          backgroundColor: '#f7f7f7',
                          fontWeight: 'bold',
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
                  return (
                    <tr {...row.getRowProps()}>
                      {row.cells.map((cell) => (
                        <td
                          {...cell.getCellProps()}
                          style={{
                            padding: '12px',
                            borderBottom: '1px solid #ddd',
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

      {/* Modal for Files */}
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
        aria-labelledby="file-modal-title"
        aria-describedby="file-modal-description"
      >
        <Fade in={openModal}>
          <Box sx={modalStyle}>
            <Typography id="file-modal-title" variant="h6" component="h2">
              Bestanden
            </Typography>
            <List>
              {selectedFiles && selectedFiles.length > 0 ? (
                selectedFiles.map((file, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={file} />
                  </ListItem>
                ))
              ) : (
                <Typography variant="body2">Geen bestanden geüpload.</Typography>
              )}
            </List>
            <Button onClick={handleCloseModal} sx={{ mt: 2 }}>
              Sluiten
            </Button>
          </Box>
        </Fade>
      </Modal>

      {/* Modal for Image */}
      <Modal
        open={openImageModal}
        onClose={handleCloseImageModal}
        aria-labelledby="image-modal-title"
        aria-describedby="image-modal-description"
      >
        <Box sx={modalStyle}>
          <Typography id="image-modal-title" variant="h6" component="h2">
            Afbeelding en Annotaties
          </Typography>
          {selectedImage ? (
            <Box>
              <img
                src={selectedImage}
                alt="Selected"
                style={{
                  width: '100%',
                  height: 'auto',
                  marginTop: '16px',
                }}
              />
              <Box display="flex" justifyContent="flex-start" gap={2} mt={2}>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<UndoIcon />}
                  onClick={handleUndoAnnotation}
                  disabled={annotations.length === 0}
                >
                  Undo
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteSweepIcon />}
                  onClick={handleDeleteAllAnnotations}
                  disabled={annotations.length === 0}
                >
                  Delete All
                </Button>
              </Box>
              <ImageAnnotation
                image={selectedImage}
                annotations={annotations}
                onAddAnnotation={(position) => {
                  const updatedAnnotations = [...annotations, position];
                  setAnnotations(updatedAnnotations);
                  setNewSpace(prevState => ({ ...prevState, annotations: updatedAnnotations }));
                }}
              />
            </Box>
          ) : (
            <Typography variant="body2">Geen afbeelding geselecteerd.</Typography>
          )}
          <Button onClick={handleCloseImageModal} sx={{ mt: 2 }}>
            Sluiten
          </Button>
        </Box>
      </Modal>

      {/* Snackbar for Success */}
      <Snackbar
        open={successMessage !== ''}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccessMessage('')} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Snackbar for Errors */}
      <Snackbar
        open={errorMessage !== ''}
        autoHideDuration={6000}
        onClose={() => setErrorMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setErrorMessage('')} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GlobalSpaces;
