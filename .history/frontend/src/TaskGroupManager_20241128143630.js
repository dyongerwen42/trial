// TaskGroupManager.jsx

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Grid,
  Snackbar,
  Alert,
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import { useMjopContext } from './MjopContext';
import { format, addMonths, differenceInYears } from 'date-fns';

// Import custom components
import TaskTimeline from './TaskTimeline';
import Sidebar from './Sidebar';
import TaskGroupDialog from './TaskGroupDialog';
import ElementInfoDialog from './ElementInfoDialog';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';

const TaskGroupManager = () => {
  const {
    state,
    setGlobalElements,
    saveData,
    addOfferGroup,
    editOfferGroup,
    deleteOfferGroup,
  } = useMjopContext();

  // State management
  const [selectedElementsByCategory, setSelectedElementsByCategory] = useState({});
  const [dialogMode, setDialogMode] = useState(null);
  const [currentCategory, setCurrentCategory] = useState('');
  const [taskProperties, setTaskProperties] = useState({
    id: null,
    name: '',
    groupDate: new Date(),
    cost: 0,
    amount: 0,
    duration: 'days',
    totalSquareMeters: 0,
    urgency: 1,
    periodic: false,
    periodicityMonths: '',
    totalYears: '',
    indexation: false,
    indexationRate: '',
    assignPricesIndividually: false,
    individualCosts: {},
    selectedElementIds: [],
    elementNames: {},
    elementSpaces: {},
  });
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [taskGroups, setTaskGroups] = useState([]);

  // State for Element Info Dialog
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [currentElementInfo, setCurrentElementInfo] = useState(null);

  // State for Delete Confirmation Dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Year range for TaskTimeline
  const yearRange = 10;
  const startYear = new Date().getFullYear();
  const years = Array.from({ length: yearRange }, (_, i) => startYear + i);

  // Memoized taskGroups map
  const taskGroupsMap = useMemo(() => {
    return taskGroups.reduce((acc, group) => {
      acc[group.id] = group;
      return acc;
    }, {});
  }, [taskGroups]);

  // Categorize elements
  const categorizedElements = useMemo(() => {
    if (!state.globalElements || !state.globalSpaces) {
      return {};
    }
    return state.globalElements.reduce((acc, element) => {
      const elementCategories = element.categories || [];
      const spaceName =
        state.globalSpaces.find((space) => space.id === element.spaceId)?.name ||
        'Onbekende Ruimte';

      elementCategories.forEach((category) => {
        if (!acc[category]) {
          acc[category] = {};
        }
        if (!acc[category][spaceName]) {
          acc[category][spaceName] = [];
        }
        acc[category][spaceName].push({
          ...element,
          spaceName,
        });
      });
      return acc;
    }, {});
  }, [state.globalElements, state.globalSpaces]);

  // Handlers
  const toggleElementSelection = (category, elementId) => {
    setSelectedElementsByCategory((prev) => {
      const selected = prev[category] || [];
      const isSelected = selected.includes(elementId);
      const updatedSelected = isSelected
        ? selected.filter((id) => id !== elementId)
        : [...selected, elementId];
      return { ...prev, [category]: updatedSelected };
    });
  };

  const toggleSelectAll = (category) => {
    const allElementIds = Object.values(categorizedElements[category] || {})
      .flat()
      .map((el) => el.id);
    const selected = selectedElementsByCategory[category] || [];
    const isAllSelected = selected.length === allElementIds.length;

    setSelectedElementsByCategory((prev) => ({
      ...prev,
      [category]: isAllSelected ? [] : allElementIds,
    }));
  };

  const openAddDialog = (category) => {
    if (
      !selectedElementsByCategory[category] ||
      selectedElementsByCategory[category].length === 0
    ) {
      setSnackbarMessage('Selecteer ten minste één element om taken toe te voegen!');
      setSnackbarOpen(true);
      return;
    }

    // Prepare element names and spaces for dialog
    const elementNames = {};
    const elementSpaces = {};
    selectedElementsByCategory[category].forEach((elementId) => {
      const element = state.globalElements.find((el) => el.id === elementId);
      if (element) {
        elementNames[elementId] = element.name;
        elementSpaces[elementId] =
          state.globalSpaces.find((space) => space.id === element.spaceId)?.name ||
          'Onbekende Ruimte';
      }
    });

    setDialogMode('add');
    setCurrentCategory(category);
    setTaskProperties({
      id: null,
      name: category,
      groupDate: new Date(),
      cost: 0,
      amount: 0,
      duration: 'days',
      totalSquareMeters: 0,
      urgency: 1,
      periodic: false,
      periodicityMonths: '',
      totalYears: '',
      indexation: false,
      indexationRate: '',
      assignPricesIndividually: false,
      individualCosts: {},
      selectedElementIds: selectedElementsByCategory[category],
      elementNames,
      elementSpaces,
    });
  };

  // Rest of your handlers...

  const handleSaveData = async () => {
    try {
      await saveData();
      if (state.success) {
        setSnackbarMessage(state.success);
      } else {
        setSnackbarMessage('Data successfully saved.');
      }
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Failed to save data. Please try again.');
      setSnackbarOpen(true);
    }
  };

  useEffect(() => {
    if (state.success) {
      setSnackbarMessage(state.success);
      setSnackbarOpen(true);
    }
    if (state.errors.general) {
      setSnackbarMessage(state.errors.general);
      setSnackbarOpen(true);
    }
  }, [state.success, state.errors]);

  if (!state || !state.isDataLoaded) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with Save Button */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Task Timeline
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSaveData}
          disabled={state.isSaving}
          startIcon={state.isSaving ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {state.isSaving ? 'Saving...' : 'Save'}
        </Button>
      </Box>

      <Grid container spacing={4}>
        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Sidebar
            categorizedElements={categorizedElements}
            selectedElementsByCategory={selectedElementsByCategory}
            toggleElementSelection={toggleElementSelection}
            toggleSelectAll={toggleSelectAll}
            openAddDialog={openAddDialog}
            handleOpenInfoDialog={handleOpenInfoDialog}
            taskGroupsMap={taskGroupsMap}
          />
        </Grid>

        {/* Task Timeline */}
        <Grid item xs={12} md={8}>
          <TaskTimeline
            years={years}
            taskGroupsByYear={taskGroupsByYear}
            totalCostPerYear={totalCostPerYear}
            handleOpenTaskGroupInfoDialog={openEditDialog}
          />
        </Grid>
      </Grid>

      {/* Dialogs */}
      {dialogMode && (
        <TaskGroupDialog
          open={dialogMode !== null}
          mode={dialogMode}
          onClose={() => setDialogMode(null)}
          taskProperties={taskProperties}
          setTaskProperties={setTaskProperties}
          onSubmit={addOrUpdateTaskGroup}
          onDelete={handleDeleteTaskGroup}
        />
      )}
      {infoDialogOpen && (
        <ElementInfoDialog
          open={infoDialogOpen}
          element={currentElementInfo}
          onClose={handleCloseInfoDialog}
        />
      )}
      {deleteConfirmOpen && (
        <DeleteConfirmationDialog
          open={deleteConfirmOpen}
          onConfirm={handleDeleteTaskGroup}
          onClose={() => setDeleteConfirmOpen(false)}
        />
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={state.errors.general ? 'error' : 'success'}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TaskGroupManager;
