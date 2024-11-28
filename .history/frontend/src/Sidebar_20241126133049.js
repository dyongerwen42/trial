import React from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  Button,
  Box,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  InfoOutlined as InfoOutlinedIcon,
} from '@mui/icons-material';

const Sidebar = ({
  categorizedElements,
  selectedElementsByCategory,
  toggleElementSelection,
  toggleSelectAll,
  openAddDialog,
  handleOpenInfoDialog,
  taskGroupsMap,
}) => {
  return (
    <Paper
      elevation={4}
      sx={{
        height: '100%',
        p: 4,
        overflowY: 'auto',
        borderRadius: 4,
        backgroundColor: '#f9fafc',
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3, color: '#334155' }}>
        Elementen
      </Typography>

      {Object.entries(categorizedElements).map(([category, spaces]) => {
        const allElementIds = Object.values(spaces).flat().map((el) => el.id);
        const selected = selectedElementsByCategory[category] || [];
        const isAllSelected = selected.length === allElementIds.length;

        return (
          <Accordion
            key={category}
            disableGutters
            sx={{
              mb: 3,
              borderRadius: 2,
              backgroundColor: '#ffffff',
              boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.05)',
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: '#64748b' }} />}
              sx={{
                backgroundColor: '#f1f5f9',
                borderRadius: 2,
                '&:hover': { backgroundColor: '#e2e8f0' },
                px: 3,
                py: 2,
              }}
            >
              <Checkbox
                checked={isAllSelected}
                indeterminate={selected.length > 0 && !isAllSelected}
                onChange={() => toggleSelectAll(category)}
                sx={{ mr: 2 }}
                color="primary"
                inputProps={{ 'aria-label': `Selecteer alle elementen in ${category}` }}
              />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                {category}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 3, py: 2 }}>
              {Object.entries(spaces).map(([spaceName, elements]) => (
                <Box key={spaceName} sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#475569', mb: 1 }}>
                    {spaceName}
                  </Typography>
                  {elements.map((element) => {
                    const plannedYears = Array.from(
                      new Set(
                        (element.tasks || [])
                          .filter(
                            (task) =>
                              task.endDate &&
                              taskGroupsMap[task.groupId]?.name === category
                          )
                          .map((task) => new Date(task.endDate).getFullYear())
                      )
                    ).sort((a, b) => a - b);

                    return (
                      <Card
                        key={element.id}
                        variant="outlined"
                        sx={{
                          mb: 2,
                          borderRadius: 3,
                          backgroundColor: selected.includes(element.id)
                            ? '#e0f2fe'
                            : '#ffffff',
                          transition: 'background-color 0.3s ease',
                          boxShadow: selected.includes(element.id)
                            ? '0px 4px 15px rgba(0, 0, 0, 0.15)'
                            : '0px 2px 10px rgba(0, 0, 0, 0.05)',
                          '&:hover': {
                            backgroundColor: '#f0f9ff',
                            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
                          },
                        }}
                      >
                        <CardHeader
                          avatar={
                            <Checkbox
                              checked={selected.includes(element.id)}
                              onChange={() => toggleElementSelection(category, element.id)}
                              color="primary"
                              size="small"
                              inputProps={{ 'aria-label': `Selecteer ${element.name}` }}
                            />
                          }
                          action={
                            <Tooltip title="Details bekijken" arrow>
                              <IconButton
                                aria-label={`Bekijk details van ${element.name}`}
                                onClick={() => handleOpenInfoDialog(element)}
                                size="small"
                              >
                                <InfoOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          }
                          title={
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                              {element.name}
                            </Typography>
                          }
                          subheader={
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              {element.spaceName}
                            </Typography>
                          }
                        />
                        <CardContent>
                          {element.photos && element.photos.length > 0 && (
                            <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                              {element.photos.map((photo, index) => (
                                <img
                                  key={index}
                                  src={photo.replace(/\\/g, '/')}
                                  alt={`${element.name} ${index + 1}`}
                                  style={{
                                    width: '70px',
                                    height: '70px',
                                    objectFit: 'cover',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                  }}
                                />
                              ))}
                            </Box>
                          )}
                          {plannedYears.length > 0 && (
                            <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                              {plannedYears.map((year) => (
                                <Chip
                                  key={year}
                                  label={year}
                                  size="small"
                                  color="secondary"
                                  sx={{
                                    backgroundColor: '#0ea5e9',
                                    color: '#ffffff',
                                    fontWeight: 500,
                                  }}
                                />
                              ))}
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              ))}
              <Button
                variant="contained"
                size="medium"
                startIcon={<AddIcon />}
                fullWidth
                sx={{
                  mt: 1,
                  backgroundColor: '#0ea5e9',
                  color: '#ffffff',
                  textTransform: 'none',
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: '#0369a1',
                  },
                }}
                onClick={() => openAddDialog(category)}
              >
                Taakgroep Toevoegen
              </Button>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Paper>
  );
};

Sidebar.propTypes = {
  categorizedElements: PropTypes.object.isRequired,
  selectedElementsByCategory: PropTypes.object.isRequired,
  toggleElementSelection: PropTypes.func.isRequired,
  toggleSelectAll: PropTypes.func.isRequired,
  openAddDialog: PropTypes.func.isRequired,
  handleOpenInfoDialog: PropTypes.func.isRequired,
  taskGroupsMap: PropTypes.object.isRequired,
};

export default Sidebar;
