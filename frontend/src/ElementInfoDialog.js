// components/ElementInfoDialog.jsx

import React from 'react';
import {
    Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Tabs,
  Tab,
  Box,
  Card,
  CardHeader,
  CardContent,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';

const ElementInfoDialog = ({
  open,
  onClose,
  elementInfo,
}) => {
  const [selectedTab, setSelectedTab] = React.useState(0);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const renderTabsContent = () => {
    if (!elementInfo) return null;

    return (
      <Box sx={{ width: '100%' }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          aria-label="Element Info Tabs"
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Details" id="element-tab-0" aria-controls="element-tabpanel-0" />
          <Tab label="Foto's" id="element-tab-1" aria-controls="element-tabpanel-1" />
          <Tab label="Documenten" id="element-tab-2" aria-controls="element-tabpanel-2" />
          <Tab label="Gebreken" id="element-tab-3" aria-controls="element-tabpanel-3" />
          <Tab label="Inspectierapporten" id="element-tab-4" aria-controls="element-tabpanel-4" />
          <Tab label="Taken" id="element-tab-5" aria-controls="element-tabpanel-5" />
          <Tab label="Annotaties" id="element-tab-6" aria-controls="element-tabpanel-6" />
        </Tabs>
        {/* Details Tab */}
        <Box
          role="tabpanel"
          hidden={selectedTab !== 0}
          id="element-tabpanel-0"
          aria-labelledby="element-tab-0"
          sx={{ p: 2 }}
        >
          {selectedTab === 0 && (
            <Box>
              {/* Basic Information */}
              <Typography variant="h6" gutterBottom>
                {elementInfo.name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                {elementInfo.description || 'Geen beschrijving beschikbaar.'}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Type:</strong> {elementInfo.type || 'Onbekend'}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Materiaal:</strong> {elementInfo.material || 'Onbepaald'}
              </Typography>
              {elementInfo.customMaterial && (
                <Typography variant="body2" gutterBottom>
                  <strong>Aangepast Materiaal:</strong> {elementInfo.customMaterial}
                </Typography>
              )}
            </Box>
          )}
        </Box>
        {/* Foto's Tab */}
        <Box
          role="tabpanel"
          hidden={selectedTab !== 1}
          id="element-tabpanel-1"
          aria-labelledby="element-tab-1"
          sx={{ p: 2 }}
        >
          {selectedTab === 1 && (
            <Box>
              {/* Photos */}
              {elementInfo.photos && elementInfo.photos.length > 0 ? (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Foto's:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={2} mt={1}>
                    {elementInfo.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo.replace(/\\/g, '/')}
                        alt={`${elementInfo.name} ${index + 1}`}
                        style={{
                          width: '150px',
                          height: '150px',
                          objectFit: 'cover',
                          borderRadius: 8,
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              ) : (
                <Typography>Geen foto's beschikbaar.</Typography>
              )}
            </Box>
          )}
        </Box>
        {/* Documenten Tab */}
        <Box
          role="tabpanel"
          hidden={selectedTab !== 2}
          id="element-tabpanel-2"
          aria-labelledby="element-tab-2"
          sx={{ p: 2 }}
        >
          {selectedTab === 2 && (
            <Box>
              {/* Documents */}
              {elementInfo.documents && elementInfo.documents.length > 0 ? (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Documenten:
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={1} mt={1}>
                    {elementInfo.documents.map((doc, idx) => (
                      <a
                        key={idx}
                        href={`/${doc}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#1976d2', textDecoration: 'none' }}
                      >
                        {doc.split('\\').pop()}
                      </a>
                    ))}
                  </Box>
                </Box>
              ) : (
                <Typography>Geen documenten beschikbaar.</Typography>
              )}
            </Box>
          )}
        </Box>
        {/* Gebreken Tab */}
        <Box
          role="tabpanel"
          hidden={selectedTab !== 3}
          id="element-tabpanel-3"
          aria-labelledby="element-tab-3"
          sx={{ p: 2 }}
        >
          {selectedTab === 3 && (
            <Box>
              {/* Defects */}
              {elementInfo.gebreken && Object.keys(elementInfo.gebreken).length > 0 ? (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Gebreken:
                  </Typography>
                  {Object.entries(elementInfo.gebreken).map(([severity, issues]) => (
                    <Box key={severity} sx={{ mt: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {severity.charAt(0).toUpperCase() + severity.slice(1)}:
                      </Typography>
                      <ul>
                        {issues.map((issue, idx) => (
                          <li key={idx}>{issue}</li>
                        ))}
                      </ul>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography>Geen gebreken gemeld.</Typography>
              )}
            </Box>
          )}
        </Box>
        {/* Inspectierapporten Tab */}
        <Box
          role="tabpanel"
          hidden={selectedTab !== 4}
          id="element-tabpanel-4"
          aria-labelledby="element-tab-4"
          sx={{ p: 2 }}
        >
          {selectedTab === 4 && (
            <Box>
              {/* Inspection Reports */}
              {elementInfo.inspectionReport && elementInfo.inspectionReport.length > 0 ? (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Inspectierapporten:
                  </Typography>
                  {elementInfo.inspectionReport.map((report) => (
                    <Card key={report.id} variant="outlined" sx={{ mb: 3 }}>
                      <CardHeader
                        avatar={
                          <Avatar sx={{ bgcolor: '#3f51b5', width: 28, height: 28 }}>
                            <AssignmentIcon fontSize="small" />
                          </Avatar>
                        }
                        title={
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {report.name || 'Inspectie'}
                          </Typography>
                        }
                        subheader={
                          <Typography variant="body2" color="textSecondary">
                            Datum Inspectie:{' '}
                            {report.inspectionDate
                              ? new Date(report.inspectionDate).toLocaleDateString()
                              : 'Nog niet uitgevoerd'}
                          </Typography>
                        }
                      />
                      <CardContent>
                        <Typography variant="body2" gutterBottom>
                          {report.description || 'Geen beschrijving beschikbaar.'}
                        </Typography>
    
                        {/* Defects in Inspection Report */}
                        {report.mistakes && report.mistakes.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Gebreken:
                            </Typography>
                            {report.mistakes.map((mistake) => (
                              <Box key={mistake.id} sx={{ mb: 2, pl: 2 }}>
                                <Typography variant="body2">
                                  <strong>Categorie:</strong> {mistake.category} |{' '}
                                  <strong>Ernst:</strong> {mistake.severity} |{' '}
                                  <strong>Omvang:</strong> {mistake.omvang}
                                </Typography>
                                <Typography variant="body2">{mistake.description}</Typography>
                                {/* Mistake Images */}
                                {mistake.images && mistake.images.length > 0 && (
                                  <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                                    {mistake.images.map((img, idx) => (
                                      <img
                                        key={idx}
                                        src={img.replace(/\\/g, '/')}
                                        alt={`Mistake ${mistake.category} ${idx + 1}`}
                                        style={{
                                          width: '100px',
                                          height: '100px',
                                          objectFit: 'cover',
                                          borderRadius: 8,
                                        }}
                                      />
                                    ))}
                                  </Box>
                                )}
                              </Box>
                            ))}
                          </Box>
                        )}
    
                        {/* Remarks */}
                        {report.remarks && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Opmerkingen:
                            </Typography>
                            <Typography variant="body2">{report.remarks}</Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Typography>Geen inspectierapporten beschikbaar.</Typography>
              )}
            </Box>
          )}
        </Box>
        {/* Taken Tab */}
        <Box
          role="tabpanel"
          hidden={selectedTab !== 5}
          id="element-tabpanel-5"
          aria-labelledby="element-tab-5"
          sx={{ p: 2 }}
        >
          {selectedTab === 5 && (
            <Box>
              {/* Tasks */}
              {elementInfo.tasks && elementInfo.tasks.length > 0 ? (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Taken:
                  </Typography>
                  {elementInfo.tasks.map((task) => (
                    <Card key={task.id} variant="outlined" sx={{ mb: 3 }}>
                      <CardHeader
                        avatar={
                          <Avatar sx={{ bgcolor: '#4caf50', width: 28, height: 28 }}>
                            <AssignmentIcon fontSize="small" />
                          </Avatar>
                        }
                        title={
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {task.name}
                          </Typography>
                        }
                        subheader={
                          <Typography variant="body2" color="textSecondary">
                            Urgentie: {task.urgency}
                          </Typography>
                        }
                      />
                      <CardContent>
                        <Typography variant="body2" gutterBottom>
                          {task.description || 'Geen beschrijving beschikbaar.'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Geschatte Prijs:</strong> €{task.estimatedPrice || 'Onbekend'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Ultimate Datum:</strong>{' '}
                          {task.ultimateDate
                            ? new Date(task.ultimateDate).toLocaleDateString()
                            : 'Onbekend'}
                        </Typography>
    
                        {/* Planned Work Dates */}
                        {task.planned && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Geplande Werkdatum:
                            </Typography>
                            <Typography variant="body2">
                              {task.planned.workDate
                                ? new Date(task.planned.workDate).toLocaleDateString()
                                : 'Nog niet gepland'}
                            </Typography>
                          </Box>
                        )}
    
                        {/* Images */}
                        {task.images && task.images.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Afbeeldingen:
                            </Typography>
                            <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                              {task.images.map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img.replace(/\\/g, '/')}
                                  alt={`${task.name} ${idx + 1}`}
                                  style={{
                                    width: '100px',
                                    height: '100px',
                                    objectFit: 'cover',
                                    borderRadius: 8,
                                  }}
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
    
                        {/* Documents */}
                        {task.documents && task.documents.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Documenten:
                            </Typography>
                            <Box display="flex" flexDirection="column" gap={1} mt={1}>
                              {task.documents.map((doc, idx) => (
                                <a
                                  key={idx}
                                  href={`/${doc}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: '#1976d2', textDecoration: 'none' }}
                                >
                                  {doc.split('\\').pop()}
                                </a>
                              ))}
                            </Box>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Typography>Geen taken beschikbaar.</Typography>
              )}
            </Box>
          )}
        </Box>
        {/* Annotaties Tab */}
        <Box
          role="tabpanel"
          hidden={selectedTab !== 6}
          id="element-tabpanel-6"
          aria-labelledby="element-tab-6"
          sx={{ p: 2 }}
        >
          {selectedTab === 6 && (
            <Box>
              {/* Annotations */}
              {elementInfo.annotations && elementInfo.annotations.length > 0 ? (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Annotaties:
                  </Typography>
                  {elementInfo.annotations.map((annotation, idx) => (
                    <Box key={idx} sx={{ mb: 2, pl: 2 }}>
                      <Typography variant="body2">
                        <strong>Annotatie {idx + 1}:</strong>
                      </Typography>
                      <Typography variant="body2">
                        x: {annotation.x.toFixed(3)}, y: {annotation.y.toFixed(3)}, width: {annotation.width.toFixed(3)}, height: {annotation.height.toFixed(3)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography>Geen annotaties beschikbaar.</Typography>
              )}
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      aria-labelledby="element-info-dialog-title"
    >
      <DialogTitle id="element-info-dialog-title">
        Elementdetails: {elementInfo?.name}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {elementInfo ? (
          renderTabsContent()
        ) : (
          <Typography>Geen gegevens beschikbaar.</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          color="primary"
          sx={{ textTransform: 'none' }}
          startIcon={<CloseIcon fontSize="small" />}
          aria-label="Sluiten"
        >
          Sluiten
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ElementInfoDialog;
