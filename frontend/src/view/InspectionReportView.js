import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Box, Typography, Button, Modal, useTheme } from '@mui/material';
import InspectionModalView from './InspectionModalView';
import InspectionTableView from './InspectionTableView';
import ImageAnnotation from '../ImageAnnotation';

const InspectionReportView = ({
  globalElements = [], filter, setFilter, globalSpaces = []
}) => {
  const [currentInspection, setCurrentInspection] = useState(null);
  const [currentElementId, setCurrentElementId] = useState(null);
  const [lastModifiedReportId, setLastModifiedReportId] = useState(null);
  const [openImageModal, setOpenImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const theme = useTheme();

  // Filter only done inspections
  const doneInspections = useMemo(() => {
    return globalElements.flatMap(item => 
      item.inspectionReport
        .filter(report => report.inspectionDone)
        .map(report => ({
          ...report,
          elementName: item.name,
          elementDescription: item.description,
          elementId: item.id,
        }))
    );
  }, [globalElements]);

  const handleOpenModal = useCallback((elementId, inspection) => {
    const currentElement = globalElements.find(el => el.id === elementId);
    setCurrentElementId(elementId);
    setCurrentInspection({
      id: inspection.id || null,
      mistakes: [],
      ...inspection,
      elementName: currentElement?.name,
      elementDescription: currentElement?.description,
    });
  }, [globalElements]);

  const handleCloseModal = useCallback(() => {
    setCurrentElementId(null);
    setCurrentInspection(null);
  }, []);

  const handleOpenImageAnnotationModal = useCallback((report) => {
    const element = globalElements.find(el => el.id === report.elementId);

    if (element && element.inspectionReport) {
      const selectedSpace = globalSpaces.find(space => space.id === element.spaceId);
      if (selectedSpace) {
        setSelectedImage(selectedSpace.image.startsWith('http') ? selectedSpace.image : `http://34.34.100.96:5000/${selectedSpace.image.replace(/\\/g, '/')}`);
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

  return (
    <Box display="flex" height="60vh" overflow="auto" flexDirection="column" width="100%">
      <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} mb={2}>
        <Typography variant="h5">Inspectie Rapport - Voltooide Items</Typography>
      </Box>

      <InspectionTableView
        filteredItems={doneInspections}
        handleOpenModal={handleOpenModal}
        lastModifiedReportId={lastModifiedReportId}
        handleOpenImageAnnotationModal={handleOpenImageAnnotationModal}
      />

      <InspectionModalView
        currentElementId={currentElementId}
        currentInspection={currentInspection}
        handleCloseModal={handleCloseModal}
        globalElements={globalElements}
      />

      <Modal open={openImageModal} onClose={() => setOpenImageModal(false)}>
        <Box sx={{ ...modalStyle, width: '80%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box sx={{ flexGrow: 1, width: '100%', overflow: 'auto' }}>
            <ImageAnnotation
              image={selectedImage}
              annotations={annotations}
            />
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

export default InspectionReportView;
