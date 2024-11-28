import React, { useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Tooltip,
  Button,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { useTranslation } from 'react-i18next';

const GlobalDocuments = ({ globalDocuments, setGlobalDocuments }) => {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleDeleteDocument = async (index) => {
    const fileToDelete = globalDocuments[index];
    try {
      await axios.delete(`http://localhost:5000/delete`, { data: { filePath: fileToDelete.filePath } });
      const updatedDocuments = globalDocuments.filter((_, i) => i !== index);
      setGlobalDocuments(updatedDocuments);
    } catch (error) {
      console.error('Error deleting the file:', error);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleUploadDocuments = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);

    try {
      const uploadedFiles = await Promise.all(
        selectedFiles.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);

          const response = await axios.post('http://localhost:5000/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          return {
            name: file.name,
            filePath: response.data.filePath,
          };
        })
      );

      setGlobalDocuments((prevDocuments) => [...prevDocuments, ...uploadedFiles]);
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
    }
  };

  const renderFileIcon = (fileName) => {
    const fileType = fileName.split('.').pop();
    if (fileType === 'pdf') {
      return <InsertDriveFileIcon color="error" />;
    } else {
      return <InsertDriveFileIcon color="primary" />;
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
        {t('generateMJOP.globalDocuments')}
      </Typography>
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <TextField
          type="file"
          inputProps={{ multiple: true }}
          onChange={handleFileChange}
          variant="outlined"
          fullWidth
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleUploadDocuments}
          disabled={uploading || selectedFiles.length === 0}
          sx={{ mb: 2 }}
        >
          {uploading ? <CircularProgress size={24} /> : t('Upload Files')}
        </Button>
      </Paper>
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('File Name')}</TableCell>
              <TableCell>{t('Actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {globalDocuments.map((doc, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {renderFileIcon(doc.name)}
                    <Typography sx={{ ml: 1 }}>{doc.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Tooltip title={t('Download')} arrow>
                    <IconButton
                      edge="end"
                      aria-label="download"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = `http://localhost:5000/${doc.filePath}`;
                        link.download = doc.name;
                        link.click();
                      }}
                      sx={{ mx: 2 }}  // Increased margin
                    >
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('Delete')} arrow>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDeleteDocument(index)}
                      sx={{ mx: 2 }}  // Increased margin
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default GlobalDocuments;
