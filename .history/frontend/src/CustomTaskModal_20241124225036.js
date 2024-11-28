import React, { useState, useEffect } from 'react';
import {
  Modal, Box, Paper, Typography, TextField, Grid, Button, IconButton, MenuItem, FormControl, ListItem, ListItemText, List, Divider, Tabs, Tab
} from '@mui/material';
import {
  AddPhotoAlternate as AddPhotoAlternateIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Clear as ClearIcon, Download as DownloadIcon, Close as CloseIcon, Description as DescriptionIcon, Delete as DeleteIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const InspectionModal = ({
  currentElementId,
  currentInspection,
  handleCloseModal,
  setGlobalElements,
  t,
  editableFields = {},
  globalElements,
}) => {
  const [description, setDescription] = useState('');
  const [inspectionDate, setInspectionDate] = useState('');
  const [imagePreviews, setImagePreviews] = useState([]);
  const [documentPreviews, setDocumentPreviews] = useState([]);
  const [mistakes, setMistakes] = useState([]);
  const [tabIndex, setTabIndex] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [overallConditionScore, setOverallConditionScore] = useState(1);

  useEffect(() => {
    if (currentInspection) {
      setDescription(currentInspection.description || '');
      setInspectionDate(currentInspection.inspectionDate || '');
      const imagePreviews = (currentInspection.images || []).map((file) => {
        if (typeof file === 'string') {
          return `http://localhost:5000/${file}`;
        } else if (file instanceof File) {
          return URL.createObjectURL(file);
        } else {
          return null;
        }
      }).filter((src) => src !== null);

      setImagePreviews(imagePreviews);

      const documentPreviews = (currentInspection.documents || []).map((file) => {
        if (typeof file === 'string') {
          return `http://localhost:5000/${file}`;
        } else if (file instanceof File) {
          return URL.createObjectURL(file);
        } else {
          return null;
        }
      }).filter((src) => src !== null);

      setDocumentPreviews(documentPreviews);

      setMistakes(currentInspection.mistakes || []);
      calculateOverallConditionScore(currentInspection.mistakes || []);
    }
  }, [currentInspection]);

  useEffect(() => {
    const currentElement = globalElements.find(el => el.id === currentElementId) || {};
    setTasks(currentElement.tasks || []);
  }, [currentElementId, globalElements]);

  const updateInspectionField = (field, value) => {
    setGlobalElements((prevElements) =>
      prevElements.map((element) =>
        element.id === currentElementId
          ? {
              ...element,
              inspectionReport: element.inspectionReport.map((inspection) =>
                inspection.id === currentInspection.id
                  ? { ...inspection, [field]: value }
                  : inspection
              ),
            }
          : element
      )
    );
  };

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
    updateInspectionField('description', e.target.value);
  };

  const handleDateChange = (e) => {
    setInspectionDate(e.target.value);
    updateInspectionField('inspectionDate', e.target.value);
  };

  const handleAddImages = async (newImages) => {
    const formData = new FormData();
    newImages.forEach((image) => {
      formData.append('file', image);
    });

    const { data } = await axios.post('http://localhost:5000/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const updatedImages = [...currentInspection.images, data.filePath];
    updateInspectionField('images', updatedImages);

    const updatedImagePreviews = [...imagePreviews, `http://localhost:5000/${data.filePath}`];
    setImagePreviews(updatedImagePreviews);
  };

  const handleAddDocuments = async (newDocuments) => {
    const formData = new FormData();
    newDocuments.forEach((doc) => {
      formData.append('file', doc);
    });

    const { data } = await axios.post('http://localhost:5000/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const updatedDocuments = [...currentInspection.documents, data.filePath];
    updateInspectionField('documents', updatedDocuments);

    const updatedDocumentPreviews = [...documentPreviews, `http://localhost:5000/${data.filePath}`];
    setDocumentPreviews(updatedDocumentPreviews);
  };

  const handleClearImage = (index) => {
    const updatedImages = currentInspection.images.filter((_, i) => i !== index);
    updateInspectionField('images', updatedImages);

    const updatedImagePreviews = imagePreviews.filter((_, i) => i !== index);
    setImagePreviews(updatedImagePreviews);
  };

  const handleClearDocument = (index) => {
    const updatedDocuments = currentInspection.documents.filter((_, i) => i !== index);
    updateInspectionField('documents', updatedDocuments);

    const updatedDocumentPreviews = documentPreviews.filter((_, i) => i !== index);
    setDocumentPreviews(updatedDocumentPreviews);
  };

  const handleAddMistake = (category, severity) => {
    const updatedMistakes = [
      ...mistakes,
      { id: uuidv4(), category, severity, omvang: '', description: '', images: [] },
    ];
    setMistakes(updatedMistakes);
    updateInspectionField('mistakes', updatedMistakes);
    calculateOverallConditionScore(updatedMistakes);
  };

  const handleMistakeChange = (index, field, value) => {
    const updatedMistakes = mistakes.map((mistake, i) =>
      i === index ? { ...mistake, [field]: value } : mistake
    );

    setMistakes(updatedMistakes);
    updateInspectionField('mistakes', updatedMistakes);
    calculateOverallConditionScore(updatedMistakes);
  };

  const handleMistakeImageChange = async (mistakeId, newImages) => {
    const formData = new FormData();
    newImages.forEach((image) => {
      formData.append('file', image);
    });

    const { data } = await axios.post('http://localhost:5000/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const updatedMistakes = mistakes.map((mistake) =>
      mistake.id === mistakeId ? { ...mistake, images: [...mistake.images, data.filePath] } : mistake
    );

    setMistakes(updatedMistakes);
    updateInspectionField('mistakes', updatedMistakes);
  };

  const handleMistakeClearImage = (mistakeId, imageIndex) => {
    const updatedMistakes = mistakes.map((mistake) =>
      mistake.id === mistakeId
        ? { ...mistake, images: mistake.images.filter((_, i) => i !== imageIndex) }
        : mistake
    );

    setMistakes(updatedMistakes);
    updateInspectionField('mistakes', updatedMistakes);
  };

  const calculateCorrectiefactor = (conditiescore) => {
    switch (conditiescore) {
      case 1: return 1.00;
      case 2: return 1.02;
      case 3: return 1.10;
      case 4: return 1.30;
      case 5: return 1.70;
      case 6: return 2.00;
      default: return 1.00;
    }
  };

  const calculateOverallConditionScore = (mistakes) => {
    if (mistakes.length === 0) {
        setOverallConditionScore(1);
        updateInspectionField('condition', 1);
        return;
    }

    let totalExtent = 0;
    let totalCorrectedExtent = 0;

    mistakes.forEach((mistake) => {
        const severity = mistake.severity;
        const extent = parseFloat(mistake.omvang);

        if (severity && !isNaN(extent)) {
            let conditiescore;
            switch (severity) {
                case 'ernstig':
                    if (extent >= 70) conditiescore = 6;
                    else if (extent >= 30) conditiescore = 5;
                    else if (extent >= 10) conditiescore = 4;
                    else if (extent >= 2) conditiescore = 3;
                    else conditiescore = 2;
                    break;
                case 'serieus':
                    if (extent >= 70) conditiescore = 5;
                    else if (extent >= 30) conditiescore = 4;
                    else if (extent >= 10) conditiescore = 3;
                    else if (extent >= 2) conditiescore = 2;
                    else conditiescore = 1;
                    break;
                case 'gering':
                    if (extent >= 70) conditiescore = 4;
                    else if (extent >= 30) conditiescore = 3;
                    else if (extent >= 10) conditiescore = 2;
                    else conditiescore = 1;
                    break;
                default:
                    conditiescore = 1;
            }

            const correctiefactor = calculateCorrectiefactor(conditiescore);
            totalExtent += extent;
            totalCorrectedExtent += extent * correctiefactor;
        }
    });

    const overallConditionScore = totalCorrectedExtent / totalExtent;
    let finalConditionScore;

    if (overallConditionScore <= 1.02) finalConditionScore = 1;
    else if (overallConditionScore <= 1.10) finalConditionScore = 2;
    else if (overallConditionScore <= 1.30) finalConditionScore = 3;
    else if (overallConditionScore <= 1.50) finalConditionScore = 4;
    else if (overallConditionScore <= 1.75) finalConditionScore = 5;
    else finalConditionScore = 6;

    setOverallConditionScore(finalConditionScore);
    updateInspectionField('condition', finalConditionScore);
  };

  const handleAddTask = () => {
    const newTask = { id: uuidv4(), name: '', description: '', estimatedPrice: '', ultimateDate: '', urgency: '', images: [], documents: [] };
    setGlobalElements((prevElements) =>
      prevElements.map((element) =>
        element.id === currentElementId
          ? {
              ...element,
              tasks: [...element.tasks, newTask],
            }
          : element
      )
    );
    setTasks((prevTasks) => [...prevTasks, newTask]);
  };

  const handleTaskChange = (taskId, field, value) => {
    setGlobalElements((prevElements) =>
      prevElements.map((element) =>
        element.id === currentElementId
          ? {
              ...element,
              tasks: element.tasks.map((task) =>
                task.id === taskId ? { ...task, [field]: value } : task
              ),
            }
          : element
      )
    );
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === taskId ? { ...task, [field]: value } : task))
    );
  };

  const handleDeleteTask = (taskId) => {
    setGlobalElements((prevElements) =>
      prevElements.map((element) =>
        element.id === currentElementId
          ? {
              ...element,
              tasks: element.tasks.filter((task) => task.id !== taskId),
            }
          : element
      )
    );
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
  };

  const handleTaskImageChange = (taskId, newImages) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, images: [...task.images, ...newImages] } : task
    );
    setTasks(updatedTasks);
    setGlobalElements((prevElements) =>
      prevElements.map((element) =>
        element.id === currentElementId
          ? {
              ...element,
              tasks: updatedTasks,
            }
          : element
      )
    );
  };

  const handleTaskClearImage = (taskId, imageIndex) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId
        ? { ...task, images: task.images.filter((_, i) => i !== imageIndex) }
        : task
    );
    setTasks(updatedTasks);
    setGlobalElements((prevElements) =>
      prevElements.map((element) =>
        element.id === currentElementId
          ? {
              ...element,
              tasks: updatedTasks,
            }
          : element
      )
    );
  };

  const handleTaskDocumentChange = (taskId, newDocuments) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, documents: [...task.documents, ...newDocuments] } : task
    );
    setTasks(updatedTasks);
    setGlobalElements((prevElements) =>
      prevElements.map((element) =>
        element.id === currentElementId
          ? {
              ...element,
              tasks: updatedTasks,
            }
          : element
      )
    );
  };

  const handleTaskClearDocument = (taskId, docIndex) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId
        ? { ...task, documents: task.documents.filter((_, i) => i !== docIndex) }
        : task
    );
    setTasks(updatedTasks);
    setGlobalElements((prevElements) =>
      prevElements.map((element) =>
        element.id === currentElementId
          ? {
              ...element,
              tasks: updatedTasks,
            }
          : element
      )
    );
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'pdf':
        return <InsertDriveFileIcon style={{ fontSize: 40 }} />;
      case 'msword':
      case 'vnd.openxmlformats-officedocument.wordprocessingml.document':
        return <DescriptionIcon style={{ fontSize: 40 }} />;
      default:
        return <InsertDriveFileIcon style={{ fontSize: 40 }} />;
    }
  };

  const renderMistakeList = (severity) => {
    const currentElement = globalElements.find(el => el.id === currentElementId);
    const gebreken = currentElement ? currentElement.gebreken : {};

    return (gebreken[severity] || []).map((mistake, index) => (
      <ListItem
        button
        key={index}
        onClick={() => handleAddMistake(mistake, severity)}
        sx={{
          borderRadius: 1,
          '&:hover': {
            backgroundColor: 'primary.light',
          },
        }}
      >
        <ListItemText primary={mistake} />
      </ListItem>
    ));
  };

  if (!currentInspection) {
    return null;
  }

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  return (
    <Modal
      open={!!currentInspection}
      onClose={handleCloseModal}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
      }}
    >
      <Paper
        sx={{
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          borderRadius: 2,
          boxShadow: 4,
          background: '#f0f0f0',
        }}
      >
        <Box display="flex" flexDirection="column" height="100%">
          <Box display="flex" justifyContent="space-between" alignItems="center" p={2} borderBottom="1px solid #ddd">
            <Typography variant="h6" color="primary">
              {t('generateMJOP.inspectElement')} - {currentInspection.name}
            </Typography>
            <IconButton onClick={handleCloseModal}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Box>
            <Tabs value={tabIndex} onChange={handleTabChange} aria-label="inspection tabs" centered>
              <Tab label={t('generateMJOP.mainData')} />
              <Tab label={t('generateMJOP.mistakes')} />
              <Tab label={t('generateMJOP.tasks')} />
            </Tabs>
          </Box>
          <Box flex={1} overflow="auto" p={4} sx={{ background: '#fff', borderRadius: '8px', m: 2 }}>
            {tabIndex === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('generateMJOP.name')}
                    value={currentInspection.name}
                    onChange={(e) => updateInspectionField('name', e.target.value)}
                    InputProps={{
                      readOnly: !editableFields.name,
                    }}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    label={t('generateMJOP.description')}
                    value={description}
                    onChange={handleDescriptionChange}
                    InputProps={{
                      readOnly: !editableFields.description,
                    }}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label={t('generateMJOP.inspectionDate')}
                    value={inspectionDate ? new Date(inspectionDate).toISOString().split('T')[0] : ''}
                    onChange={handleDateChange}
                    InputProps={{
                      readOnly: !editableFields.inspectionDate,
                    }}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label={t('generateMJOP.condition')}
                    value={overallConditionScore}
                    onChange={(e) => updateInspectionField('condition', e.target.value)}
                    InputProps={{
                      readOnly: true,
                    }}
                    variant="outlined"
                  >
                    <MenuItem value="">{t('generateMJOP.selectCondition')}</MenuItem>
                    <MenuItem value="1">1 = {t('generateMJOP.excellent')}</MenuItem>
                    <MenuItem value="2">2 = {t('generateMJOP.good')}</MenuItem>
                    <MenuItem value="3">3 = {t('generateMJOP.fair')}</MenuItem>
                    <MenuItem value="4">4 = {t('generateMJOP.moderate')}</MenuItem>
                    <MenuItem value="5">5 = {t('generateMJOP.poor')}</MenuItem>
                    <MenuItem value="6">6 = {t('generateMJOP.veryPoor')}</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label={t('generateMJOP.urgency')}
                    value={currentInspection.urgency}
                    onChange={(e) => updateInspectionField('urgency', e.target.value)}
                    InputProps={{
                      readOnly: !editableFields.urgency,
                    }}
                    variant="outlined"
                  >
                    <MenuItem value="">{t('generateMJOP.selectUrgency')}</MenuItem>
                    <MenuItem value="1">1 = {t('generateMJOP.noUrgency')}</MenuItem>
                    <MenuItem value="2">2 = {t('generateMJOP.lowUrgency')}</MenuItem>
                    <MenuItem value="3">3 = {t('generateMJOP.mediumUrgency')}</MenuItem>
                    <MenuItem value="4">4 = {t('generateMJOP.highUrgency')}</MenuItem>
                    <MenuItem value="5">5 = {t('generateMJOP.veryHighUrgency')}</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('generateMJOP.elementType')}
                    value={currentInspection.elementType}
                    onChange={(e) => updateInspectionField('elementType', e.target.value)}
                    InputProps={{
                      readOnly: !editableFields.elementType,
                    }}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('generateMJOP.material')}
                    value={currentInspection.material}
                    onChange={(e) => updateInspectionField('material', e.target.value)}
                    InputProps={{
                      readOnly: !editableFields.material,
                    }}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label={t('generateMJOP.damage')}
                    value={currentInspection.damage}
                    onChange={(e) => updateInspectionField('damage', e.target.value)}
                    InputProps={{
                      readOnly: !editableFields.damage,
                    }}
                    variant="outlined"
                  >
                    <MenuItem value="">{t('generateMJOP.selectDamage')}</MenuItem>
                    <MenuItem value="1">1 = {t('generateMJOP.noDamage')}</MenuItem>
                    <MenuItem value="2">2 = {t('generateMJOP.minorDamage')}</MenuItem>
                    <MenuItem value="3">3 = {t('generateMJOP.moderateDamage')}</MenuItem>
                    <MenuItem value="4">4 = {t('generateMJOP.severeDamage')}</MenuItem>
                    <MenuItem value="5">5 = {t('generateMJOP.criticalDamage')}</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('generateMJOP.elementFunction')}
                    value={currentInspection.elementFunction}
                    onChange={(e) => updateInspectionField('elementFunction', e.target.value)}
                    InputProps={{
                      readOnly: !editableFields.elementFunction,
                    }}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label={t('generateMJOP.surfaceArea')}
                    value={currentInspection.surfaceArea}
                    onChange={(e) => updateInspectionField('surfaceArea', e.target.value)}
                    InputProps={{
                      readOnly: !editableFields.surfaceArea,
                    }}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label={t('generateMJOP.unit')}
                    value={currentInspection.unit}
                    onChange={(e) => updateInspectionField('unit', e.target.value)}
                    InputProps={{
                      readOnly: !editableFields.unit,
                    }}
                    variant="outlined"
                  >
                    <MenuItem value="">{t('generateMJOP.selectUnit')}</MenuItem>
                    <MenuItem value="m2">m²</MenuItem>
                    <MenuItem value="m3">m³</MenuItem>
                    <MenuItem value="st">st</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label={t('generateMJOP.estimatedPrice')}
                    value={currentInspection.estimatedPrice}
                    onChange={(e) => updateInspectionField('estimatedPrice', e.target.value)}
                    InputProps={{
                      readOnly: !editableFields.estimatedPrice,
                    }}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    label={t('generateMJOP.remarks')}
                    value={currentInspection.remarks}
                    onChange={(e) => updateInspectionField('remarks', e.target.value)}
                    InputProps={{
                      readOnly: !editableFields.remarks,
                    }}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <Button
                      variant="contained"
                      component="label"
                      startIcon={<AddPhotoAlternateIcon />}
                      sx={{ mb: 2 }}
                    >
                      {t('generateMJOP.uploadPhotos')}
                      <input
                        type="file"
                        hidden
                        multiple
                        accept="image/*"
                        onChange={(e) => handleAddImages(Array.from(e.target.files))}
                      />
                    </Button>
                    <Box display="flex" flexWrap="wrap" mt={2}>
                      {imagePreviews.map((src, index) => (
                        <Box key={index} position="relative" mr={2} mb={2}>
                          <img
                            src={src}
                            alt={`Inspection image ${index}`}
                            style={{
                              width: '100px',
                              height: '100px',
                              objectFit: 'contain',
                              borderRadius: 4,
                              boxShadow: 2,
                            }}
                          />
                          <Box display="flex" justifyContent="center" mt={1}>
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
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <Button
                      variant="contained"
                      component="label"
                      startIcon={<InsertDriveFileIcon />}
                      sx={{ mb: 2 }}
                    >
                      {t('generateMJOP.uploadDocuments')}
                      <input
                        type="file"
                        hidden
                        multiple
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={(e) => handleAddDocuments(Array.from(e.target.files))}
                      />
                    </Button>
                    <Box display="flex" flexWrap="wrap" mt={2}>
                      {documentPreviews.map((src, index) => {
                        const fileType = src.split('.').pop();
                        const icon = getFileIcon(fileType);

                        return (
                          <Box key={index} position="relative" mr={2} mb={2}>
                            <a href={src} download style={{ margin: '0 8px' }}>
                              {icon}
                            </a>
                            <Box display="flex" justifyContent="center" mt={1}>
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
            )}
            {tabIndex === 1 && (
              <Box>
                <Typography variant="h6" component="h3" mb={2} color="primary">
                  {t('generateMJOP.mistakes')}
                </Typography>
                <Box display="flex" flexDirection="row" height="100%">
                  <Box
                    sx={{
                      minWidth: '300px',
                      backgroundColor: '#f4f4f4',
                      borderRight: '1px solid #ddd',
                      p: 2,
                    }}
                  >
                    <Typography variant="h6" component="h3">
                      {t('generateMJOP.selectMistakes')}
                    </Typography>
                    <List sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        onClick={() => handleAddMistake('', 'ernstig')}
                        sx={{ mt: 2 }}
                      >
                        {t('generateMJOP.addEmptyMistake')}
                      </Button>
                      <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>
                        {t('generateMJOP.ernstig')}
                      </Typography>
                      {renderMistakeList('ernstig')}
                      <Divider />
                      <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>
                        {t('generateMJOP.serieus')}
                      </Typography>
                      {renderMistakeList('serieus')}
                      <Divider />
                      <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>
                        {t('generateMJOP.gering')}
                      </Typography>
                      {renderMistakeList('gering')}
                      <Divider />
                  
                    </List>
                  </Box>
                  <Box p={4} flex={1} sx={{ maxHeight: 'calc(100vh - 64px)', overflowY: 'auto' }}>
                    {mistakes.map((mistake, index) => (
                      <Grid container spacing={2} key={index} sx={{ mb: 2, border: '1px solid #ddd', borderRadius: '8px', p: 2 }}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            select
                            label={t('generateMJOP.mistakeCategory')}
                            value={mistake.category}
                            onChange={(e) => handleMistakeChange(index, 'category', e.target.value)}
                            fullWidth
                            variant="outlined"
                          >
                            {(globalElements.find(el => el.id === currentElementId)?.gebreken.ernstig || [])
                              .concat(globalElements.find(el => el.id === currentElementId)?.gebreken.serieus || [])
                              .concat(globalElements.find(el => el.id === currentElementId)?.gebreken.gering || [])
                              .map((category, i) => (
                                <MenuItem key={i} value={category}>
                                  {category}
                                </MenuItem>
                              ))}
                          </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            select
                            label={t('generateMJOP.severity')}
                            value={mistake.severity}
                            onChange={(e) => handleMistakeChange(index, 'severity', e.target.value)}
                            fullWidth
                            variant="outlined"
                          >
                            <MenuItem value="ernstig">{t('generateMJOP.ernstig')}</MenuItem>
                            <MenuItem value="serieus">{t('generateMJOP.serieus')}</MenuItem>
                            <MenuItem value="gering">{t('generateMJOP.gering')}</MenuItem>
                          </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            type="number"
                            label={t('generateMJOP.extent')}
                            value={mistake.omvang}
                            onChange={(e) => handleMistakeChange(index, 'omvang', e.target.value)}
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
                        <Grid item xs={12}>
                          <TextField
                            label={t('generateMJOP.description')}
                            value={mistake.description}
                            onChange={(e) => handleMistakeChange(index, 'description', e.target.value)}
                            fullWidth
                            multiline
                            variant="outlined"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <FormControl fullWidth>
                            <Button
                              variant="contained"
                              component="label"
                              startIcon={<AddPhotoAlternateIcon />}
                              sx={{ mb: 2 }}
                            >
                              {t('generateMJOP.uploadPhoto')}
                              <input
                                type="file"
                                hidden
                                multiple
                                accept="image/*"
                                onChange={(e) => handleMistakeImageChange(mistake.id, Array.from(e.target.files))}
                              />
                            </Button>
                            <Box display="flex" flexWrap="wrap" mt={2}>
                              {mistake.images.map((image, imageIndex) => (
                                <Box key={imageIndex} position="relative" mr={2} mb={2}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleMistakeClearImage(mistake.id, imageIndex)}
                                    sx={{
                                      position: 'absolute',
                                      top: 4,
                                      right: 4,
                                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                                    }}
                                  >
                                    <ClearIcon />
                                  </IconButton>
                                  <img
                                    src={
                                      typeof image === 'string'
                                        ? `http://localhost:5000/${image}`
                                        : URL.createObjectURL(image)
                                    }
                                    alt={`Mistake image ${imageIndex}`}
                                    style={{
                                      width: '100px',
                                      height: '100px',
                                      objectFit: 'contain',
                                      borderRadius: 4,
                                      boxShadow: 2,
                                    }}
                                  />
                                  <Box display="flex" justifyContent="center" mt={1}>
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        const link = document.createElement('a');
                                        link.href =
                                          typeof image === 'string'
                                            ? `http://localhost:5000/${image}`
                                            : URL.createObjectURL(image);
                                        link.download = `mistake-image-${mistake.id}-${imageIndex}`;
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
                      </Grid>
                    ))}
                  </Box>
                </Box>
              </Box>
            )}
            {tabIndex === 2 && (
              <Box>
                <Typography variant="h6" component="h3" mb={2} color="primary">
                  {t('generateMJOP.tasks')}
                </Typography>
                <Button variant="contained" color="primary" onClick={handleAddTask} sx={{ mb: 2 }}>
                  {t('generateMJOP.addTask')}
                </Button>
                {tasks.map((task) => (
                  <Paper key={task.id} sx={{ p: 2, mb: 2, border: '1px solid #ddd', borderRadius: '8px' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label={t('generateMJOP.taskName')}
                          value={task.name}
                          onChange={(e) => handleTaskChange(task.id, 'name', e.target.value)}
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          label={t('generateMJOP.taskDescription')}
                          value={task.description}
                          onChange={(e) => handleTaskChange(task.id, 'description', e.target.value)}
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          type="number"
                          label={t('generateMJOP.estimatedPrice')}
                          value={task.estimatedPrice}
                          onChange={(e) => handleTaskChange(task.id, 'estimatedPrice', e.target.value)}
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label={t('generateMJOP.ultimateDate')}
                          type="date"
                          value={
                            task.ultimateDate
                              ? new Date(task.ultimateDate).toISOString().split('T')[0]
                              : ''
                          }
                          onChange={(e) => handleTaskChange(task.id, 'ultimateDate', e.target.value)}
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          select
                          label={t('generateMJOP.urgency')}
                          value={task.urgency}
                          onChange={(e) => handleTaskChange(task.id, 'urgency', e.target.value)}
                          variant="outlined"
                        >
                          <MenuItem value="">{t('generateMJOP.selectUrgency')}</MenuItem>
                          <MenuItem value="1">1 = {t('generateMJOP.noUrgency')}</MenuItem>
                          <MenuItem value="2">2 = {t('generateMJOP.lowUrgency')}</MenuItem>
                          <MenuItem value="3">3 = {t('generateMJOP.mediumUrgency')}</MenuItem>
                          <MenuItem value="4">4 = {t('generateMJOP.highUrgency')}</MenuItem>
                          <MenuItem value="5">5 = {t('generateMJOP.veryHighUrgency')}</MenuItem>
                        </TextField>
                      </Grid>
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <Button
                            variant="contained"
                            component="label"
                            startIcon={<AddPhotoAlternateIcon />}
                            sx={{ mb: 2 }}
                          >
                            {t('generateMJOP.uploadPhoto')}
                            <input
                              type="file"
                              hidden
                              multiple
                              accept="image/*"
                              onChange={(e) => handleTaskImageChange(task.id, Array.from(e.target.files))}
                            />
                          </Button>
                          <Box display="flex" flexWrap="wrap" mt={2}>
                            {task.images.map((image, imageIndex) => (
                              <Box key={imageIndex} position="relative" mr={2} mb={2}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleTaskClearImage(task.id, imageIndex)}
                                  sx={{
                                    position: 'absolute',
                                    top: 4,
                                    right: 4,
                                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                                  }}
                                >
                                  <ClearIcon />
                                </IconButton>
                                <img
                                  src={
                                    typeof image === 'string'
                                      ? `http://localhost:5000/${image}`
                                      : URL.createObjectURL(image)
                                  }
                                  alt={`Task image ${imageIndex}`}
                                  style={{
                                    width: '100px',
                                    height: '100px',
                                    objectFit: 'contain',
                                    borderRadius: 4,
                                    boxShadow: 2,
                                  }}
                                />
                                <Box display="flex" justifyContent="center" mt={1}>
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href =
                                        typeof image === 'string'
                                          ? `http://localhost:5000/${image}`
                                          : URL.createObjectURL(image);
                                      link.download = `task-image-${task.id}-${imageIndex}`;
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
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <Button
                            variant="contained"
                            component="label"
                            startIcon={<InsertDriveFileIcon />}
                            sx={{ mb: 2 }}
                          >
                            {t('generateMJOP.uploadDocuments')}
                            <input
                              type="file"
                              hidden
                              multiple
                              accept=".pdf,.doc,.docx,.txt"
                              onChange={(e) => handleTaskDocumentChange(task.id, Array.from(e.target.files))}
                            />
                          </Button>
                          <Box display="flex" flexWrap="wrap" mt={2}>
                            {task.documents.map((doc, docIndex) => {
                              const fileType = doc.split('.').pop();
                              const icon = getFileIcon(fileType);

                              return (
                                <Box key={docIndex} position="relative" mr={2} mb={2}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleTaskClearDocument(task.id, docIndex)}
                                    sx={{
                                      position: 'absolute',
                                      top: 4,
                                      right: 4,
                                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                                    }}
                                  >
                                    <ClearIcon />
                                  </IconButton>
                                  <a
                                    href={`http://localhost:5000/${doc}`}
                                    download
                                    style={{ margin: '0 8px' }}
                                  >
                                    {icon}
                                  </a>
                                  <Box display="flex" justifyContent="center" mt={1}>
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = `http://localhost:5000/${doc}`;
                                        link.download = doc.name;
                                        link.click();
                                      }}
                                    >
                                      <DownloadIcon />
                                    </IconButton>
                                  </Box>
                                </Box>
                              );
                            })}
                          </Box>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          variant="contained"
                          color="secondary"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          {t('generateMJOP.deleteTask')}
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
    </Modal>
  );
};

export default InspectionModal;
