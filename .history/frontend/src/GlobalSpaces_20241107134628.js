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
    setGlobalSpaces,
    handleAddSpace,
    handleEditSpace,
    handleDeleteSpace,
    setNewSpace,
    saveData, // Add saveData here to enable saving to the database
  } = useMjopContext();
  

  // Define availableSpaces based on the current globalSpaces state
  const availableSpaces = spaces

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

  const steps = [
    'Ruimte Details',
    'Verdieping Selectie',
    'Afbeeldingen Uploaden',
    'Documenten Uploaden',
    'Bestaande Bouwtekening Selecteren',
    'Controleer en Opslaan',
  ];

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

  useEffect(() => {
    if (!newSpace || !newSpace.id) return;
  
    setSelectedImage(newSpace.image ? newSpace.image.replace(/\\/g, '/') : null);
    setAnnotations(newSpace.annotations || []);
    setFloorSelection(newSpace.floorSelection || false);
    setFloorNumber(newSpace.floorNumber || '');
  }, [newSpace]);

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
  

  useEffect(() => {
    const drawings = [...new Set(globalSpaces.map(space => space.image).filter(image => image))];
    setAllDrawings(drawings);
  }, [globalSpaces]);

  const filteredSpaces = useMemo(() => {
    return availableSpaces.filter(
      (space) =>
        space.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        space.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, availableSpaces]);

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
            <IconButton onClick={() => handleOpenModal(row.original.photos)}>
              <AddPhotoAlternateIcon />
            </IconButton>
            <IconButton onClick={() => handleOpenModal(row.original.documents)}>
              <InsertDriveFileIcon />
            </IconButton>
            <IconButton onClick={() => handleOpenImageModal(row.original.image, row.original.annotations)}>
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

  const data = useMemo(() => globalSpaces, [globalSpaces]);

  const { getTableProps, getTableBodyProps, headerGroups, prepareRow, rows } = useTable({
    columns,
    data,
  });

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

  const handleStep = (step) => {
    setActiveStep(step);
    setErrors({});
    setFoutieveStappen([]);
  };

  const handleSaveSpace = async () => {
    const newErrors = {};
  
    // Validate the required fields
    if (!newSpace.name) newErrors.name = 'Naam is verplicht';
    if (!newSpace.description) newErrors.description = 'Beschrijving is verplicht';
  
    setErrors(newErrors);
    handleFoutieveStappen(newErrors);
  
    if (Object.keys(newErrors).length > 0) return;
  
    if (isEditing) {
      handleEditSpace(newSpace); // Update existing space
    } else {
      handleAddSpace(newSpace); // Add new space
    }
  
    setErrors({});
    setFoutieveStappen([]);
    resetNewSpace();
  
    try {
      setTimeout(async () => {
        await saveData();
        console.log("Space data saved successfully to the database.");
      }, 3000); // 30000 milliseconds = 30 seconds
      console.log("Space data saved successfully to the database.");
    } catch (error) {
      console.error("Error saving space data to database:", error);
    }
  };
  
  

  const handleFoutieveStappen = (fouten) => {
    const nieuweFoutieveStappen = [];
    if (fouten.name) nieuweFoutieveStappen.push(0);
    if (fouten.description) nieuweFoutieveStappen.push(0);
    setFoutieveStappen(nieuweFoutieveStappen);
  };

  const handleOpenImageModal = (image, annotations) => {
    const formattedImage = image ? image.replace(/\\/g, '/') : null;
    setSelectedImage(formattedImage ? `http://localhost:5000/${formattedImage}` : null);
    setAnnotations(annotations || []);
    setOpenImageModal(true);

    setErrors({});
    setFoutieveStappen([]);
  };

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

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    const uploadedFiles = await Promise.all(files.map(uploadFile));
    setNewSpace(prevState => ({
      ...prevState,
      photos: [...(prevState.photos || []), ...uploadedFiles]
    }));
  };

  const handleDocumentChange = async (e) => {
    const files = Array.from(e.target.files);
    const uploadedFiles = await Promise.all(files.map(uploadFile));
    setNewSpace(prevState => ({
      ...prevState,
      documents: [...(prevState.documents || []), ...uploadedFiles]
    }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    const uploadedFile = await uploadFile(file);
    if (uploadedFile) {
      const imageUrl = `http://localhost:5000/${uploadedFile.replace(/\\/g, '/')}`;
      setSelectedImage(imageUrl);
      setNewSpace(prevState => ({
        ...prevState,
        image: uploadedFile,
        annotations: [] 
      }));
    }
  };

  const handleExistingDrawingSelect = (e) => {
    const selectedImage = e.target.value.startsWith('http') ? e.target.value : `http://localhost:5000/${e.target.value.replace(/\\/g, '/')}`;
    setSelectedImage(selectedImage);
    setNewSpace(prevState => ({
      ...prevState,
      image: selectedImage,
      annotations: []
    }));
    console.log('Selected Image:', selectedImage); // Debugging log
  };

  const handleClearImage = (index) => {
    const updatedPhotos = Array.from(newSpace.photos || []).filter((_, i) => i !== index);
    setNewSpace(prevState => ({
      ...prevState,
      photos: updatedPhotos
    }));
    setImagePreviews(updatedPhotos.map((file) => (typeof file === 'string' ? `http://localhost:5000/${file.replace(/\\/g, '/')}` : URL.createObjectURL(file))));
  };

  const handleClearDocument = (index) => {
    const updatedDocuments = Array.from(newSpace.documents || []).filter((_, i) => i !== index);
    setNewSpace(prevState => ({
      ...prevState,
      documents: updatedDocuments
    }));
    setDocumentPreviews(updatedDocuments.map((file) => (typeof file === 'string' ? `http://localhost:5000/${file.replace(/\\/g, '/')}` : URL.createObjectURL(file))));
  };

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

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleOpenModal = (files) => {
    setSelectedFiles(files);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedFiles([]);
  };

  const handleCloseImageModal = () => {
    setOpenImageModal(false);
    setSelectedImage(null);
    setAnnotations([]);
  };

  const renderFilePreview = (file) => {
    const fileType = file.split('.').pop();
    if (fileType === 'pdf') {
      return <PictureAsPdfIcon style={{ fontSize: 40 }} />;
    } else {
      return <InsertDriveFileIcon style={{ fontSize: 40 }} />;
    }
  };

  const handleUndoAnnotation = () => {
    const updatedAnnotations = annotations.slice(0, -1);
    setAnnotations(updatedAnnotations);
    setNewSpace(prevState => ({ ...prevState, annotations: updatedAnnotations }));
  };

  const handleDeleteAllAnnotations = () => {
    setAnnotations([]);
    setNewSpace(prevState => ({ ...prevState, annotations: [] }));
  };

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

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
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
                />
              </Grid>
            )}
          </Grid>
        );
      case 2:
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
                <Typography variant="body1"><strong>Geüploade Documenten:</strong> {newSpace.documents.length} bestand(en)}</Typography>
              </Grid>
            )}

            {selectedImage && (
              <Grid item xs={12}>
                <Typography variant="body1"><strong>Bouwtekening:</strong> {selectedImage.split('/').pop()}</Typography>
              </Grid>
            )}

            {annotations.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="body1"><strong>Annotaties:</strong> {annotations.length} annotatie(s)}</Typography>
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
              <Stepper nonLinear activeStep={activeStep} alternativeLabel>
                {steps.map((label, index) => (
                  <Step key={label} completed={activeStep > index}>
                    <StepButton color="inherit" onClick={() => handleStep(index)}>
                      <StepLabel error={foutieveStappen.includes(index)}>{label}</StepLabel>
                    </StepButton>
                  </Step>
                ))}
              </Stepper>
              <Box mt={2}>
                {renderStepContent(activeStep)}
              </Box>
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
                    <Button variant="contained" color="primary" onClick={handleSaveSpace} sx={{ textTransform: 'none' }}>
                      Opslaan
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
    </Box>
  );
  
  
  
  
  
};

export default GlobalSpaces;
