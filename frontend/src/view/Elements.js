import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Modal,
  Backdrop,
  Fade,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ImageAnnotation from '../ImageAnnotation'; // Adjust the import path as necessary

const getConditionScoreColor = (score) => {
  switch (score) {
    case 1:
      return 'green';
    case 2:
      return 'lightgreen';
    case 3:
      return 'yellow';
    case 4:
      return 'orange';
    case 5:
      return 'orangered';
    case 6:
      return 'red';
    default:
      return 'gray';
  }
};

const ElementsTable = ({ globalElements, globalSpaces }) => {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState('');
  const [isAnnotationOpen, setIsAnnotationOpen] = useState(false);
  const [annotations, setAnnotations] = useState([]);
  const [elementAnnotations, setElementAnnotations] = useState([]);
  const [selectedImage, setSelectedImage] = useState('');

  const handleOpenFile = (file) => {
    setSelectedFile(file);
    setOpen(true);
  };

  const handleOpenImageAnnotationModal = useCallback(
    (elementId) => {
      const element = globalElements.find((el) => el.id === elementId);

      if (!element) {
        console.error(`Element with ID ${elementId} not found`);
        return;
      }

      const selectedSpace = globalSpaces.find(
        (space) => space.id === element.spaceId
      );

      if (!selectedSpace) {
        console.error(`Space with ID ${element.spaceId} not found`);
        return;
      }

      const imageUrl = selectedSpace.image || "";

      if (!imageUrl) {
        console.error(`No image found for space ID ${element.spaceId}`);
        return;
      }

      const absoluteImageUrl = imageUrl.startsWith("http")
        ? imageUrl
        : `http://34.34.100.96:5000/${imageUrl}`;

      setSelectedImage(absoluteImageUrl);

      const spaceAnnotations = selectedSpace.annotations || [];
      const elementAnnotations = element.annotations || [];

      setAnnotations(spaceAnnotations);
      setElementAnnotations(elementAnnotations);

      setIsAnnotationOpen(true);
    },
    [globalElements, globalSpaces]
  );

  const handleClose = () => {
    setOpen(false);
    setIsAnnotationOpen(false);
    setSelectedFile('');
    setSelectedImage('');
    setAnnotations([]);
    setElementAnnotations([]);
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#f5f5f5', borderRadius: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3, color: '#333' }}>
        Elementen
      </Typography>
      <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2 }}>
        <Table aria-label="all elements table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#e0e0e0', p: 2 }}>Element</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#e0e0e0', p: 2 }}>Beschrijving</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#e0e0e0', p: 2, textAlign: 'center' }}>Conditie score</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#e0e0e0', p: 2 }}>Acties</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {globalElements.map((element) => {
              const latestReport = element.inspectionReport
                ?.filter(report => report.inspectionDone)
                .sort((a, b) => new Date(b.inspectionDate) - new Date(a.inspectionDate))[0];

              const conditionScore = latestReport?.overallConditionScore || '-';

              return (
                <TableRow key={element.id} sx={{ '&:nth-of-type(odd)': { bgcolor: '#f9f9f9' } }}>
                  <TableCell sx={{ p: 2 }}>{element.name}</TableCell>
                  <TableCell sx={{ p: 2 }}>{element.description}</TableCell>
                  <TableCell sx={{ p: 2, textAlign: 'center', verticalAlign: 'middle' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {conditionScore !== '-' ? (
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: getConditionScoreColor(conditionScore),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: conditionScore === 3 ? 'black' : 'white',
                            fontWeight: 'bold',
                          }}
                        >
                          {conditionScore}
                        </Box>
                      ) : (
                        '-'
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      {Array.isArray(element.photos) &&
                        element.photos.map((photo, index) => (
                          <Tooltip title={`View Photo ${index + 1}`} key={`${element.id}-photo-${index}`}>
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenFile(`http://34.34.100.96:5000/${photo}`)}
                            >
                              <ImageIcon />
                            </IconButton>
                          </Tooltip>
                        ))}
                      {Array.isArray(element.documents) &&
                        element.documents.map((document, index) => (
                          <Tooltip title={`View Document ${index + 1}`} key={`${element.id}-document-${index}`}>
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenFile(`http://34.34.100.96:5000/${document}`)}
                            >
                              <PictureAsPdfIcon />
                            </IconButton>
                          </Tooltip>
                        ))}
                      {element.annotations?.length > 0 && (
                        <Tooltip title="View Annotations">
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenImageAnnotationModal(element.id)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal for PDFs */}
      <Modal
        open={open && selectedFile.endsWith('.pdf')}
        onClose={handleClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={open}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '80%',
              maxHeight: '90vh',
              bgcolor: 'background.paper',
              boxShadow: 24,
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'auto',
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <IconButton onClick={handleClose}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <embed src={selectedFile} type="application/pdf" width="100%" height="600px" />
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* Modal for Image Annotation */}
      <Modal
        open={isAnnotationOpen}
        onClose={handleClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={isAnnotationOpen}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '80%',
              maxHeight: '90vh',
              bgcolor: 'background.paper',
              boxShadow: 24,
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'auto',
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <IconButton onClick={handleClose}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 3,
                overflow: 'auto',
                backgroundColor: '#f5f5f5',
              }}
            >
              <ImageAnnotation
                image={selectedImage}
                annotations={annotations}
                elementAnnotations={elementAnnotations}
                onAddAnnotation={(newAnnotation) => {
                  setElementAnnotations((prevAnnotations) => [
                    ...prevAnnotations,
                    newAnnotation,
                  ]);
                }}
              />
            </Box>
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default ElementsTable;
