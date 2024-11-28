// ... (bestaande imports)

import { Info as InfoIcon } from '@mui/icons-material'; // Zorg ervoor dat dit is geïmporteerd

const FullTaskManager = () => {
  // ... (bestaande state en functies)

  // State voor Task Group Info Dialog
  const [taskGroupInfoDialogOpen, setTaskGroupInfoDialogOpen] = useState(false);
  const [currentTaskGroupInfo, setCurrentTaskGroupInfo] = useState(null);

  // Functie om de Task Group Info Dialog te openen
  const handleOpenTaskGroupInfoDialog = (group) => {
    setCurrentTaskGroupInfo(group);
    setTaskGroupInfoDialogOpen(true);
  };

  // Functie om de Task Group Info Dialog te sluiten
  const handleCloseTaskGroupInfoDialog = () => {
    setTaskGroupInfoDialogOpen(false);
    setCurrentTaskGroupInfo(null);
  };

  return (
    <Box sx={{ position: 'relative', height: '100vh', backgroundColor: '#e0e0e0', p: 2 }}>
      <Grid container spacing={2} sx={{ height: '100%' }}>
        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              height: '100%',
              p: 2,
              overflowY: 'auto',
              borderRadius: 2,
              backgroundColor: '#ffffff',
            }}
          >
            {/* Search */}
            <Box display="flex" alignItems="center" mb={2}>
              <TextField
                placeholder="Zoek elementen..."
                variant="outlined"
                size="small"
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mr: 1 }}
              />
              <Tooltip title="Zoeken">
                <IconButton aria-label="search">
                  <SearchIcon color="action" />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Elements Header */}
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Elementen
            </Typography>

            {/* Displaying Elements by Category */}
            {Object.entries(filteredCategorizedElements).map(([category, elements]) => {
              const allElementIds = elements.map((el) => el.id);
              const selected = selectedElementsByCategory[category] || [];
              const isAllSelected = selected.length === allElementIds.length;

              return (
                <Accordion key={category} sx={{ mb: 2, boxShadow: 'none' }}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      backgroundColor: '#f5f5f5',
                      borderRadius: 1,
                      '&:hover': { backgroundColor: '#e0e0e0' },
                    }}
                  >
                    {/* Select All Checkbox */}
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={selected.length > 0 && !isAllSelected}
                      onChange={() => toggleSelectAll(category)}
                      sx={{ mr: 1 }}
                      color="primary"
                    />
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      {category}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {elements.map((element) => {
                      // Define conditions for displaying the year tag
                      const plannedYears = Array.from(
                        new Set(
                          (element.tasks || [])
                            .filter((task) => task.endDate)
                            .map((task) => new Date(task.endDate).getFullYear())
                        )
                      );

                      return (
                        <Card
                          key={element.id}
                          variant="outlined"
                          sx={{
                            mb: 2,
                            borderRadius: 2,
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                            backgroundColor: selected.includes(element.id) ? '#e3f2fd' : '#ffffff',
                            transition: 'background-color 0.3s',
                          }}
                        >
                          <CardHeader
                            avatar={
                              <Checkbox
                                checked={selected.includes(element.id)}
                                onChange={() => toggleElementSelection(category, element.id)}
                                color="primary"
                              />
                            }
                            action={
                              <Tooltip title="Details bekijken" arrow>
                                <IconButton aria-label="info" onClick={() => handleOpenInfoDialog(element)}>
                                  <InfoOutlinedIcon color="action" />
                                </IconButton>
                              </Tooltip>
                            }
                            title={
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {element.name}
                              </Typography>
                            }
                            subheader={
                              <Typography variant="body2" color="textSecondary">
                                {element.spaceName}
                              </Typography>
                            }
                          />
                          <CardContent>
                            {/* Conditional Year Tags */}
                            {plannedYears.length > 0 && (
                              <Box display="flex" flexWrap="wrap" gap={0.5}>
                                {plannedYears.map((year) => (
                                  <Chip
                                    key={year}
                                    label={year}
                                    size="small"
                                    color="secondary"
                                    sx={{ mt: 0.5 }}
                                  />
                                ))}
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                    {/* Add Button for this category */}
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<AddIcon />}
                      fullWidth
                      sx={{
                        mt: 1,
                        textTransform: 'none',
                        borderRadius: 1,
                        backgroundColor: '#1976d2',
                        '&:hover': {
                          backgroundColor: '#115293',
                        },
                      }}
                      onClick={() => openAddDialog(category)}
                    >
                      Toevoegen
                    </Button>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Paper>
        </Grid>

        {/* Main Panel */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={3}
            sx={{
              height: '100%',
              p: 2,
              borderRadius: 2,
              backgroundColor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            {/* Timeline */}
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              Tijdlijn
            </Typography>
            <Box
              display="flex"
              gap={2}
              overflow="auto"
              sx={{ flexGrow: 1, mt: 1, pb: 2 }}
            >
              {years.map((year) => (
                <Card
                  key={year}
                  variant="outlined"
                  sx={{
                    minWidth: 220,
                    textAlign: 'center',
                    backgroundColor: '#f9fafb',
                    borderRadius: 2,
                    border: '1px solid #e0e0e0',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                    },
                  }}
                  onClick={() => handleOpenTaskGroupInfoDialog({ year, groups: taskGroupsByYear[year] })}
                >
                  <CardHeader
                    title={
                      <Typography variant="h6" sx={{ fontWeight: 500 }}>
                        {year}
                      </Typography>
                    }
                  />
                  <CardContent>
                    {taskGroupsByYear[year] && taskGroupsByYear[year].length > 0 ? (
                      taskGroupsByYear[year].map((group) => (
                        <Box key={group.id} sx={{ mb: 2 }}>
                          <Card
                            variant="outlined"
                            sx={{
                              borderRadius: 2,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                              backgroundColor: '#ffffff',
                              cursor: 'pointer',
                              transition: 'background-color 0.3s',
                              '&:hover': {
                                backgroundColor: '#f0f0f0',
                              },
                            }}
                            onClick={(e) => {
                              e.stopPropagation(); // Voorkom dat de bovenliggende onClick wordt geactiveerd
                              handleOpenTaskGroupInfoDialog(group);
                            }}
                          >
                            <CardHeader
                              title={
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                  {group.name}
                                </Typography>
                              }
                              subheader={
                                <Typography variant="body2" color="textSecondary">
                                  Urgentie: {group.urgency} | Kosten: €{group.assignPricesIndividually ? 'Variabel' : group.cost}
                                </Typography>
                              }
                              action={
                                <Tooltip title="Bewerk Taakgroep" arrow>
                                  <IconButton aria-label="edit" onClick={() => editTaskGroup(group)}>
                                    <EditIcon color="action" />
                                  </IconButton>
                                </Tooltip>
                              }
                            />
                            <CardContent>
                              {group.subtasks.map((element) => (
                                <Box key={element.id} sx={{ mb: 1, pl: 2 }}>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                    {element.name} ({element.spaceName})
                                  </Typography>
                                  <Typography variant="body2">
                                    Datum: {new Date(element.endDate).toLocaleDateString()}
                                  </Typography>
                                  {group.assignPricesIndividually && (
                                    <Typography variant="body2">
                                      Kosten: €{element.individualCost}
                                    </Typography>
                                  )}
                                </Box>
                              ))}
                            </CardContent>
                          </Card>
                        </Box>
                      ))
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        Geen taken voor dit jaar.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Add/Edit Task Group Dialog */}
      <Dialog
        open={isAddDialogOpen || isEditDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false);
          setIsEditDialogOpen(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{isEditDialogOpen ? 'Taakgroep bewerken' : 'Taakgroep toevoegen'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Taaknaam"
            fullWidth
            margin="dense"
            value={taskProperties.name}
            onChange={(e) =>
              setTaskProperties((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          <TextField
            label="Datum Taakgroep"
            type="date"
            fullWidth
            margin="dense"
            value={taskProperties.groupDate.toISOString().substr(0, 10)}
            onChange={(e) =>
              setTaskProperties((prev) => ({ ...prev, groupDate: new Date(e.target.value) }))
            }
            InputLabelProps={{
              shrink: true,
            }}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Urgentie</InputLabel>
            <Select
              value={taskProperties.urgency}
              label="Urgentie"
              onChange={(e) =>
                setTaskProperties((prev) => ({
                  ...prev,
                  urgency: Number(e.target.value),
                }))
              }
            >
              {[1, 2, 3, 4, 5].map((urgency) => (
                <MenuItem key={urgency} value={urgency}>
                  Urgentie {urgency}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Kostprijs"
            fullWidth
            margin="dense"
            type="number"
            value={taskProperties.cost}
            onChange={(e) =>
              setTaskProperties((prev) => ({ ...prev, cost: e.target.value }))
            }
          />
          <FormControlLabel
            control={
              <Switch
                checked={taskProperties.assignPricesIndividually}
                onChange={(e) =>
                  setTaskProperties((prev) => ({
                    ...prev,
                    assignPricesIndividually: e.target.checked,
                  }))
                }
                color="primary"
              />
            }
            label="Prijzen per element toewijzen"
          />
          {/* Display selected elements */}
          <Box sx={{ mt: 2 }}>
            {taskProperties.selectedElementIds.map((elementId) => {
              const element = globalElements.find((el) => el.id === elementId);
              return (
                <Box key={elementId} sx={{ mb: 2, borderBottom: '1px solid #e0e0e0', pb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    {element.name} ({element.spaceName})
                  </Typography>
                  {taskProperties.assignPricesIndividually && (
                    <TextField
                      label="Kostprijs"
                      type="number"
                      fullWidth
                      margin="dense"
                      value={taskProperties.individualCosts[elementId] || ''}
                      onChange={(e) =>
                        setTaskProperties((prev) => ({
                          ...prev,
                          individualCosts: {
                            ...prev.individualCosts,
                            [elementId]: e.target.value,
                          },
                        }))
                      }
                    />
                  )}
                  {/* Individual Date */}
                  <TextField
                    label="Individuele Datum"
                    type="date"
                    fullWidth
                    margin="dense"
                    value={
                      taskProperties.individualDates[elementId]
                        ? taskProperties.individualDates[elementId].toISOString().substr(0, 10)
                        : ''
                    }
                    onChange={(e) =>
                      setTaskProperties((prev) => ({
                        ...prev,
                        individualDates: {
                          ...prev.individualDates,
                          [elementId]: new Date(e.target.value),
                        },
                      }))
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setIsAddDialogOpen(false);
              setIsEditDialogOpen(false);
            }}
            color="secondary"
            sx={{ textTransform: 'none' }}
          >
            Annuleren
          </Button>
          <Button
            onClick={isEditDialogOpen ? saveEditedTaskGroup : addTasksToElements}
            color="primary"
            variant="contained"
            sx={{ textTransform: 'none' }}
          >
            {isEditDialogOpen ? 'Taakgroep bijwerken' : 'Taakgroep toevoegen'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Task Group Info Dialog */}
      <Dialog
        open={taskGroupInfoDialogOpen}
        onClose={handleCloseTaskGroupInfoDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Details van Taakgroep: {currentTaskGroupInfo?.name}</DialogTitle>
        <DialogContent>
          {currentTaskGroupInfo ? (
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>Urgentie:</strong> {currentTaskGroupInfo.urgency}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Kosten:</strong> €{currentTaskGroupInfo.assignPricesIndividually ? 'Variabel' : currentTaskGroupInfo.cost}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Datum:</strong> {new Date(currentTaskGroupInfo.groupDate).toLocaleDateString()}
              </Typography>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Subtaken:
              </Typography>
              {currentTaskGroupInfo.subtasks.map((element) => (
                <Card key={element.id} variant="outlined" sx={{ mb: 1 }}>
                  <CardHeader
                    title={
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {element.name}
                      </Typography>
                    }
                    subheader={
                      <Typography variant="body2" color="textSecondary">
                        {element.spaceName}
                      </Typography>
                    }
                    action={
                      <Tooltip title="Bekijk details" arrow>
                        <IconButton aria-label="info" onClick={() => handleOpenInfoDialog(element)}>
                          <InfoOutlinedIcon />
                        </IconButton>
                      </Tooltip>
                    }
                  />
                  <CardContent>
                    <Typography variant="body2">
                      <strong>Datum:</strong> {new Date(element.endDate).toLocaleDateString()}
                    </Typography>
                    {currentTaskGroupInfo.assignPricesIndividually && (
                      <Typography variant="body2">
                        <strong>Kosten:</strong> €{element.individualCost}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Typography>Geen gegevens beschikbaar.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTaskGroupInfoDialog} color="primary" sx={{ textTransform: 'none' }}>
            Sluiten
          </Button>
        </DialogActions>
      </Dialog>

      {/* Info Dialog */}
      <Dialog open={infoDialogOpen} onClose={handleCloseInfoDialog} maxWidth="md" fullWidth>
        <DialogTitle>Elementdetails</DialogTitle>
        <DialogContent>
          {currentElementInfo ? (
            <Box>
              {/* Categorieën Weergeven */}
              <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
                {currentElementInfo.categories && currentElementInfo.categories.length > 0 ? (
                  currentElementInfo.categories.map((category, index) => (
                    <Chip key={index} label={category} size="small" color="primary" />
                  ))
                ) : (
                  <Typography variant="h6" gutterBottom>
                    {currentElementInfo.name}
                  </Typography>
                )}
              </Box>
              <Typography variant="body1" gutterBottom>
                {currentElementInfo.description || 'Geen beschrijving beschikbaar.'}
              </Typography>
              {/* Display Photos */}
              {currentElementInfo.photos && currentElementInfo.photos.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1">Foto's:</Typography>
                  <Box display="flex" flexWrap="wrap" gap={2} mt={1}>
                    {currentElementInfo.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo.replace('\\\\', '/')}
                        alt={`${currentElementInfo.name} ${index + 1}`}
                        style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: 8 }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
              {/* Display Documents */}
              {currentElementInfo.documents && currentElementInfo.documents.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1">Documenten:</Typography>
                  <Box display="flex" flexDirection="column" gap={1} mt={1}>
                    {currentElementInfo.documents.map((doc, idx) => (
                      <a key={idx} href={`/${doc}`} target="_blank" rel="noopener noreferrer">
                        {doc.split('\\').pop()}
                      </a>
                    ))}
                  </Box>
                </Box>
              )}
              {/* Display Other Data as Needed */}
            </Box>
          ) : (
            <Typography>Geen gegevens beschikbaar.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInfoDialog} color="primary" sx={{ textTransform: 'none' }}>
            Sluiten
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback messages */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FullTaskManager;
