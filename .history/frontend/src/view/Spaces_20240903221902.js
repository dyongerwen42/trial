import React, { useState, useEffect } from 'react';
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
import VisibilityIcon from '@mui/icons-material/Visibility'; // Icon for showing annotations
import ImageAnnotation from '../ImageAnnotation'; // Adjust the import path as necessary

const Spaces = ({ globalSpaces, globalElements }) => {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState('');
  const [isAnnotationOpen, setIsAnnotationOpen] = useState(false);
  const [annotations, setAnnotations] = useState([]);
  const [selectedImage, setSelectedImage] = useState('');
  const [spaceConditionScores, setSpaceConditionScores] = useState({});

  useEffect(() => {
    const calculateConditionScores = () => {
      const scores = {};

      globalSpaces.forEach((space) => {
        const relatedElements = globalElements.filter(
          (element) => element.spaceId === space.id
        );

        const latestInspectionScores = relatedElements.map((element) => {
          const latestInspection = element.inspectionReport?.filter(report => report.inspectionDone).sort(
            (a, b) => new Date(b.inspectionDate) - new Date(a.inspectionDate)
          )[0];

          return latestInspection?.overallConditionScore || null;
        }).filter(score => score !== null); // Filter out null values

        const totalScore = latestInspectionScores.reduce((total, score) => total + score, 0);

        const averageScore =
          latestInspectionScores.length > 0 ? totalScore / latestInspectionScores.length : null;

        scores[space.id] = averageScore;
      });

      setSpaceConditionScores(scores);
    };

    calculateConditionScores();
  }, [globalSpaces, globalElements]);

  const handleOpenFile = (file) => {
    setSelectedFile(file);
    setOpen(true);
  };

  const handleOpenAnnotation = (image, annotations) => {
    setSelectedImage(image);
    setAnnotations(annotations);
    setIsAnnotationOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setIsAnnotationOpen(false);
    setSelectedFile('');
    setSelectedImage('');
    setAnnotations([]);
  };

  const getConditionStyles = (score) => {
    if (score <= 1.5) return { backgroundColor: '#66bb6a', color: 'white' }; // Green
    if (score <= 3) return { backgroundColor: '#ffeb3b', color: 'black' }; // Yellow
    if (score <= 4.5) return { backgroundColor: '#ffa726', color: 'white' }; // Amber
    return { backgroundColor: '#ef5350', color: 'white' }; // Red
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#f0f2f5', borderRadius: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3, color: '#3c3c3c' }}>
        Ruimtes
      </Typography>
      <TableContainer component={Paper} sx={{ boxShadow: 5, borderRadius: 3 }}>
        <Table aria-label="all spaces table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#eceff1', p: 2 }}>Ruimte</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#eceff1', p: 2 }}>Beschrijving</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#eceff1', p: 2, textAlign: 'center' }}>Gemiddelde Conditiescore</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#eceff1', p: 2 }}>Acties</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {globalSpaces.map((space) => (
              <TableRow
                key={space.id}
                sx={{
                  '&:nth-of-type(odd)': { bgcolor: '#f9f9f9' },
                  '&:hover': { bgcolor: '#f1f1f1', boxShadow: '0 3px 5px rgba(0, 0, 0, 0.1)' },
                  transition: 'background-color 0.3s, box-shadow 0.3s',
                }}
              >
                <TableCell sx={{ p: 2 }}>{space.name}</TableCell>
                <TableCell sx={{ p: 2 }}>{space.description}</TableCell>
                <TableCell
                  sx={{
                    p: 2,
                    textAlign: 'center', // Center horizontally in the cell
                    verticalAlign: 'middle', // Center vertically in the cell
                  }}
                >
                  {spaceConditionScores[space.id] != null && !isNaN(spaceConditionScores[space.id]) ? (
                    <Box
                      sx={{
                        ...getConditionStyles(spaceConditionScores[space.id]),
                        display: 'flex', // Flexbox for centering
                        justifyContent: 'center', // Center horizontally within the box
                        alignItems: 'center', // Center vertically within the box
                        borderRadius: '50%', // Circular shape for the condition score
                        fontWeight: 'bold',
                        width: '40px',
                        height: '40px',
                        margin: '0 auto', // Ensure the box itself is centered within the TableCell
                      }}
                    >
                      {spaceConditionScores[space.id].toFixed(1)}
                    </Box>
                  ) : (
                    'N/A'
                  )}
                </TableCell>
                <TableCell sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {Array.isArray(space.photos) &&
                      space.photos.map((photo, index) => (
                        <Tooltip title={`Bekijk Foto ${index + 1}`} key={`${space.id}-photo-${index}`}>
                          <IconButton
                            color="primary"
                            onClick={() =>
                              handleOpenFile(`http://localhost:5000/${photo}`)
                            }
                          >
                            <ImageIcon />
                          </IconButton>
                        </Tooltip>
                      ))}
                    {Array.isArray(space.documents) &&
                      space.documents.map((document, index) => (
                        <Tooltip title={`Bekijk Document ${index + 1}`} key={`${space.id}-document-${index}`}>
                          <IconButton
                            color="primary"
                            onClick={() =>
                              handleOpenFile(`http://localhost:5000/${document}`)
                            }
                          >
                            <PictureAsPdfIcon />
                          </IconButton>
                        </Tooltip>
                      ))}
                    {space.image && space.annotations?.length > 0 && (
                      <Tooltip title="Bekijk annotaties">
                        <IconButton
                          color="primary"
                          onClick={() =>
                            handleOpenAnnotation(`http://localhost:5000/${space.image}`, space.annotations)
                          }
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
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
              <ImageAnnotation image={selectedImage} annotations={annotations} />
            </Box>
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default Spaces;
