import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box, Button, TextField, Typography, Select, MenuItem, InputLabel, FormControl, Modal, Accordion, AccordionSummary, AccordionDetails, IconButton, useTheme
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { v4 as uuidv4 } from 'uuid';
import InspectionModal from './InspectionModal';
import InspectionTable from './InspectionTable';
import ImageAnnotation from './ImageAnnotation';

const InspectionReport = ({
  globalElements = [], t, filter, setFilter, setGlobalElements, globalSpaces = []
}) => {
  const [currentInspection, setCurrentInspection] = useState(null);
  const [currentElementId, setCurrentElementId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [customElement, setCustomElement] = useState({ name: '', description: '', spaceId: '' });
  const [selectedImage, setSelectedImage] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [openImageModal, setOpenImageModal] = useState(false);
  const [photosModalOpen, setPhotosModalOpen] = useState(false);
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [lastModifiedReportId, setLastModifiedReportId] = useState(null);
  const [expanded, setExpanded] = useState('planned');
  const theme = useTheme();

  // Filter and sort the items based on their inspection status and the filter
  const { filteredUnplannedItems, filteredPlannedItems } = useMemo(() => {
    const unplanned = [];
    const planned = [];

    globalElements.forEach((item) => {
      item.inspectionReport.forEach((report) => {
        const reportData = {
          ...report,
          elementName: item.name,
          elementDescription: item.description,
          elementId: item.id,
        };

        if (!report.inspectionDate) {
          unplanned.push(reportData);
        } else {
          planned.push(reportData);
        }
      });
    });

    const applyFilter = (items) => {
      switch (filter) {
        case 'done':
          return items.filter(item => item.inspectionDone);
        case 'todo':
          return items.filter(item => !item.inspectionDone);
        case 'all':
        default:
          return items;
      }
    };

    return {
      filteredUnplannedItems: applyFilter(unplanned),
      filteredPlannedItems: applyFilter(planned),
    };
  }, [globalElements, filter]);

  useEffect(() => {
    if (filteredUnplannedItems.length > 0) {
      setExpanded('unplanned');
    } else {
      setExpanded('planned');
    }
  }, [filteredUnplannedItems.length]);

  const handleOpenModal = useCallback((elementId, inspection) => {
    const currentElement = globalElements.find(el => el.id === elementId);
    setCurrentElementId(elementId);
    setCurrentInspection(inspection || {
      id: uuidv4(),
      mistakes: [],
      ...currentElement?.gebreken,
      elementName: currentElement?.name,
      elementDescription: currentElement?.description,
    });
  }, [globalElements]);

  const handleCloseModal = useCallback(() => {
    setCurrentElementId(null);
    setCurrentInspection(null);
  }, []);

  const handleAddCustomElement = (customElement) => {
    const newElement = {
      id: uuidv4(),
      name: customElement.name,
      description: customElement.description,
      interval: 12,
      spaceId: customElement.spaceId,
      type: '',
      material: '',
      customMaterial: '',
      photos: [],
      documents: [],
      gebreken: {},
      tasks: [],
      inspectionReport: [
        {
          id: uuidv4(),
          description: '',
          inspectionDone: false,
          inspectionDate: null,
          mistakes: [],
        },
      ],
    };

    setGlobalElements(prevElements => [...prevElements, newElement]);
  };

  const handleDeleteElement = (elementId) => {
    setGlobalElements(prevElements => prevElements.filter(element => element.id !== elementId));
  };

  const handleOpenImageAnnotationModal = useCallback((report) => {
    const element = globalElements.find(el => el.id === report.elementId);

    if (element && element.inspectionReport) {
      const selectedSpace = globalSpaces.find(space => space.id === element.spaceId);
      if (selectedSpace) {
        setSelectedImage(selectedSpace.image.startsWith('http') ? selectedSpace.image : `http://localhost:5000/${selectedSpace.image.replace(/\\/g, '/')}`);
        setAnnotations([
          ...(selectedSpace.annotations || []).map(annotation => ({ ...annotation, color: 'red' })),
          ...(element.annotations || []).map(annotation => ({ ...annotation, color: 'green' })),
        ]);
        setOpenImageModal(true);
      } else {
        console.error(`Space with ID ${element.spaceId} not found`);
      }
    } else {
      console.error(`Element with ID ${report.elementId} not found or has no inspection reports`);
    }
  }, [globalElements, globalSpaces]);

  const handleInspectionChange = (elementId, reportId, field, value) => {
    setGlobalElements((prevElements) => {
      const updatedElements = prevElements.map((element) => {
        if (element.id === elementId) {
          setLastModifiedReportId(reportId);
          return {
            ...element,
            inspectionReport: element.inspectionReport.map((report) =>
              report.id === reportId
                ? { ...report, [field]: value }
                : report
            ),
          };
        }
        return element;
      });

      updatedElements.forEach((element) => {
        element.inspectionReport.sort((a, b) => new Date(a.inspectionDate) - new Date(b.inspectionDate));
      });

      return updatedElements;
    });
  };

  const handleInspectionDoneChange = (elementId, reportId, value) => {
    setGlobalElements((prevElements) =>
      prevElements.map((element) => {
        if (element.id === elementId) {
          const updatedReports = element.inspectionReport.map((report) => {
            if (report.id === reportId) {
              setLastModifiedReportId(reportId);
              return { ...report, inspectionDone: value };
            }
            return report;
          });

          if (value) {
            const currentReport = element.inspectionReport.find(report => report.id === reportId);
            const intervalInMonths = element.interval || 12;
            const nextInspectionDate = new Date(currentReport.inspectionDate || new Date());

            const hasFutureInspection = updatedReports.some(report => {
              const inspectionDate = new Date(report.inspectionDate);
              return inspectionDate > new Date(currentReport.inspectionDate);
            });

            if (!hasFutureInspection) {
              nextInspectionDate.setMonth(nextInspectionDate.getMonth() + intervalInMonths);

              updatedReports.push({
                id: uuidv4(),
                description: '',
                inspectionDone: false,
                inspectionDate: nextInspectionDate.toISOString().split('T')[0],
                mistakes: [],
              });

              updatedReports.sort((a, b) => new Date(a.inspectionDate) - new Date(b.inspectionDate));
            }
          }

          return {
            ...element,
            inspectionReport: updatedReports,
          };
        }
        return element;
      })
    );
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box display="flex" height="70vh" overflow="auto" flexDirection="column" width="100%" p={2} bgcolor="#f9fafb">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold" color={theme.palette.primary.main}>
          Inspectie Rapport
        </Typography>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          variant="contained"
          color="primary"
          sx={{
            borderRadius: 50,
            boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.1)',
            padding: '10px 20px',
            fontWeight: 'bold',
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
              boxShadow: '0px 12px 20px rgba(0, 0, 0, 0.2)',
            },
          }}
        >
          Voeg Inspectie Toe
        </Button>
      </Box>

      <Accordion
        expanded={expanded === 'unplanned'}
        onChange={handleAccordionChange('unplanned')}
        sx={{
          backgroundColor: '#fff',
          boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.05)',
          borderRadius: 2,
          marginBottom: 2,
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" fontWeight="bold">
            Ongeplande Inspecties ({filteredUnplannedItems.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <InspectionTable
            filteredItems={filteredUnplannedItems}
            filter={filter}
            setFilter={setFilter}
            handleOpenModal={handleOpenModal}
            handleInspectionChange={handleInspectionChange}
            handleInspectionDoneChange={handleInspectionDoneChange}
            handleDeleteElement={handleDeleteElement}
            handleOpenImageAnnotationModal={handleOpenImageAnnotationModal}
            lastModifiedReportId={lastModifiedReportId}
          />
        </AccordionDetails>
      </Accordion>

      <Accordion
        expanded={expanded === 'planned'}
        onChange={handleAccordionChange('planned')}
        sx={{
          backgroundColor: '#fff',
          boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.05)',
          borderRadius: 2,
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" fontWeight="bold">
            Geplande Inspecties ({filteredPlannedItems.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <InspectionTable
            filteredItems={filteredPlannedItems}
            filter={filter}
            setFilter={setFilter}
            handleOpenModal={handleOpenModal}
            handleInspectionChange={handleInspectionChange}
            handleInspectionDoneChange={handleInspectionDoneChange}
            handleDeleteElement={handleDeleteElement}
            handleOpenImageAnnotationModal={handleOpenImageAnnotationModal}
            lastModifiedReportId={lastModifiedReportId}
          />
        </AccordionDetails>
      </Accordion>

      <Modal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
        <Box sx={modalStyle}>
          <Typography variant="h6" component="h2">Voeg aangepast element toe</Typography>
          <TextField
            label="Naam aangepast element"
            name="name"
            value={customElement.name}
            onChange={(e) => setCustomElement((prev) => ({ ...prev, name: e.target.value }))}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Beschrijving aangepast element"
            name="description"
            value={customElement.description}
            onChange={(e) => setCustomElement((prev) => ({ ...prev, description: e.target.value }))}
            fullWidth
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Selecteer ruimte</InputLabel>
            <Select
              name="spaceId"
              value={customElement.spaceId}
              onChange={(e) => setCustomElement((prev) => ({ ...prev, spaceId: e.target.value }))}
            >
              <MenuItem value="">Selecteer ruimte</MenuItem>
              {globalSpaces.map((space) => (
                <MenuItem key={space.id} value={space.id}>
                  {space.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button
              onClick={() => {
                handleAddCustomElement(customElement);
                setCustomElement({ name: '', description: '', spaceId: '' });
                setIsAddModalOpen(false);
              }}
              variant="contained"
              color="primary"
              sx={{
                borderRadius: 30,
                padding: '10px 20px',
                backgroundColor: theme.palette.success.main,
                '&:hover': {
                  backgroundColor: theme.palette.success.dark,
                },
              }}
            >
              Toevoegen
            </Button>
          </Box>
        </Box>
      </Modal>

      <Modal open={photosModalOpen} onClose={() => setPhotosModalOpen(false)}>
        <Box sx={{ ...modalStyle, width: 600, maxHeight: '80vh', overflowY: 'auto' }}>
          <Typography variant="h6" component="h2" gutterBottom>Bekijk Foto's</Typography>
          <Box display="flex" flexDirection="row" flexWrap="wrap" justifyContent="center" gap={2}>
            {selectedPhotos.map((src, index) => (
              <Box
                key={index}
                position="relative"
                mb={2}
                textAlign="center"
                borderRadius="8px"
                overflow="hidden"
                boxShadow={3}
              >
                <img
                  src={src}
                  alt={`Foto ${index}`}
                  style={{
                    width: '200px',
                    height: 'auto',
                    objectFit: 'cover',
                    marginBottom: theme.spacing(1),
                    borderRadius: '8px',
                  }}
                />
                <IconButton
                  size="small"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = src;
                    link.download = `foto-${index}`;
                    link.click();
                  }}
                  sx={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    bgcolor: 'white',
                    borderRadius: '50%',
                  }}
                >
                  <DownloadIcon />
                </IconButton>
              </Box>
            ))}
          </Box>
          <Button
            onClick={() => setPhotosModalOpen(false)}
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
          >
            Sluiten
          </Button>
        </Box>
      </Modal>

      <Modal open={documentsModalOpen} onClose={() => setDocumentsModalOpen(false)}>
        <Box sx={{ ...modalStyle, width: 400 }}>
          <Typography variant="h6" component="h2" gutterBottom>Bekijk Documenten</Typography>
          <Box display="flex" flexDirection="column" alignItems="center">
            {selectedDocuments.map((src, index) => {
              const fileType = src.split('.').pop();
              let icon;
              if (fileType === 'pdf') {
                icon = <PictureAsPdfIcon style={{ fontSize: 40 }} />;
              } else if (fileType === 'doc' || fileType === 'docx') {
                icon = <DescriptionIcon style={{ fontSize: 40 }} />;
              } else {
                icon = <InsertDriveFileIcon style={{ fontSize: 40 }} />;
              }
              return (
                <Box key={index} position="relative" mb={2} textAlign="center">
                  <a href={src} download>
                    {icon}
                  </a>
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
                </Box>
              );
            })}
          </Box>
          <Button
            onClick={() => setDocumentsModalOpen(false)}
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
          >
            Sluiten
          </Button>
        </Box>
      </Modal>

      <Modal open={openImageModal} onClose={() => setOpenImageModal(false)}>
        <Box
          sx={{
            ...modalStyle,
            width: '80%',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Box sx={{ flexGrow: 1, width: '100%', overflow: 'auto' }}>
            <ImageAnnotation image={selectedImage} annotations={annotations} />
          </Box>
          <Button
            onClick={() => setOpenImageModal(false)}
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
          >
            Sluiten
          </Button>
        </Box>
      </Modal>

      <InspectionModal
        currentElementId={currentElementId}
        currentInspection={currentInspection}
        handleCloseModal={handleCloseModal}
        setGlobalElements={setGlobalElements}
        t={t}
        globalElements={globalElements}
      />
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
  borderRadius: 10,
};

export default InspectionReport;
