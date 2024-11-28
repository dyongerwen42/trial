import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Snackbar,
  Alert,
  Button,
  CircularProgress,
  Typography,
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import { useMjopContext } from './MjopContext';
import { format, addMonths, differenceInYears } from 'date-fns';

// Import custom components
import Sidebar from './Sidebar';
import TaskGroupDialog from './TaskGroupDialog';
import ElementInfoDialog from './ElementInfoDialog';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import TaskTimeline from './TaskTimeline';

const FullTaskManager = () => {
  const {
    state,
    setGlobalElements,
    saveData,
    addOfferGroup,
    editOfferGroup,
    deleteOfferGroup,
  } = useMjopContext();

  const [selectedElementsByCategory, setSelectedElementsByCategory] = useState({});
  const [dialogMode, setDialogMode] = useState(null); // 'add' or 'edit'
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

  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [currentElementInfo, setCurrentElementInfo] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const yearRange = 10;
  const startYear = new Date().getFullYear();
  const years = Array.from({ length: yearRange }, (_, i) => startYear + i);

  const taskGroupsMap = useMemo(() => {
    return taskGroups.reduce((acc, group) => {
      acc[group.id] = group;
      return acc;
    }, {});
  }, [taskGroups]);

  const categorizedElements = useMemo(() => {
    return state.globalElements.reduce((acc, element) => {
      const elementCategories = element.categories || [];
      const spaceName =
        state.globalSpaces.find((space) => space.id === element.spaceId)?.name || 'Onbekende Ruimte';

      elementCategories.forEach((category) => {
        if (!acc[category]) {
          acc[category] = {};
        }
        if (!acc[category][spaceName]) {
          acc[category][spaceName] = [];
        }
        acc[category][spaceName].push({ ...element, spaceName });
      });
      return acc;
    }, {});
  }, [state.globalElements, state.globalSpaces]);

  const toggleElementSelection = (category, elementId) => {
    setSelectedElementsByCategory((prev) => {
      const selected = prev[category] || [];
      const updatedSelected = selected.includes(elementId)
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
    setSelectedElementsByCategory((prev) => ({
      ...prev,
      [category]: selected.length === allElementIds.length ? [] : allElementIds,
    }));
  };

  const openAddDialog = (category) => {
    if (!selectedElementsByCategory[category]?.length) {
      setSnackbarMessage('Selecteer ten minste één element om taken toe te voegen!');
      setSnackbarOpen(true);
      return;
    }

    const elementNames = {};
    const elementSpaces = {};
    selectedElementsByCategory[category].forEach((elementId) => {
      const element = state.globalElements.find((el) => el.id === elementId);
      if (element) {
        elementNames[elementId] = element.name;
        elementSpaces[elementId] =
          state.globalSpaces.find((space) => space.id === element.spaceId)?.name || 'Onbekende Ruimte';
      }
    });

    setDialogMode('add');
    setCurrentCategory(category);
    setTaskProperties((prev) => ({
      ...prev,
      name: category,
      selectedElementIds: selectedElementsByCategory[category],
      elementNames,
      elementSpaces,
    }));
  };

  const openEditDialog = (group) => {
    const elementNames = {};
    const elementSpaces = {};
    group.subtasks.forEach((subtask) => {
      elementNames[subtask.id] = subtask.name;
      elementSpaces[subtask.id] =
        state.globalSpaces.find((space) => space.id === subtask.spaceId)?.name || 'Onbekende Ruimte';
    });

    setDialogMode('edit');
    setTaskProperties({
      ...group,
      elementNames,
      elementSpaces,
      individualCosts: group.subtasks.reduce((acc, subtask) => {
        acc[subtask.id] = subtask.individualCost || 0;
        return acc;
      }, {}),
    });
  };

  const addOrUpdateTaskGroup = useCallback(() => {
    const { periodic, periodicityMonths, totalYears, cost, indexation, indexationRate } =
      taskProperties;

    if (dialogMode === 'add' && periodic) {
      if (!periodicityMonths || !totalYears) {
        setSnackbarMessage('Voer een geldige periodiciteit of totale jaren in.');
        setSnackbarOpen(true);
        return;
      }
      const periods = Math.floor((totalYears * 12) / periodicityMonths);
      console.log('Number of periods:', periods);
    }

    // Add or update logic...
  }, [dialogMode, taskProperties]);

  const handleDeleteTaskGroup = () => {
    const { id, name } = taskProperties;
    if (!id) return;

    setTaskGroups((prev) => prev.filter((group) => group.id !== id));
    setSnackbarMessage(`Taakgroep "${name}" verwijderd.`);
    setSnackbarOpen(true);
  };

  const handleSaveData = async () => {
    try {
      await saveData();
      setSnackbarMessage('Data succesvol opgeslagen.');
      setSnackbarOpen(true);
    } catch {
      setSnackbarMessage('Fout bij het opslaan van data.');
      setSnackbarOpen(true);
    }
  };

  useEffect(() => {
    if (state.success || state.errors.general) {
      setSnackbarMessage(state.success || state.errors.general);
      setSnackbarOpen(true);
    }
  }, [state.success, state.errors]);

  return (
    <Box sx={{ position: 'relative', height: '100vh', backgroundColor: '#f4f6f8', p: 3 }}>
      <Grid container spacing={4} sx={{ height: '100%' }}>
        <Grid item xs={12} md={4}>
          <Sidebar
            categorizedElements={categorizedElements}
            selectedElementsByCategory={selectedElementsByCategory}
            toggleElementSelection={toggleElementSelection}
            toggleSelectAll={toggleSelectAll}
            openAddDialog={openAddDialog}
          />
        </Grid>
        <Grid item xs={12} md={8}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Task Timeline
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveData}
              disabled={state.isSaving}
              startIcon={state.isSaving && <CircularProgress size={20} color="inherit" />}
            >
              {state.isSaving ? 'Opslaan...' : 'Opslaan'}
            </Button>
          </Box>
          <TaskTimeline years={years} taskGroupsByYear={taskGroupsMap} />
        </Grid>
      </Grid>
      <TaskGroupDialog
        open={dialogMode !== null}
        mode={dialogMode}
        taskProperties={taskProperties}
        setTaskProperties={setTaskProperties}
        onClose={() => setDialogMode(null)}
        onSubmit={addOrUpdateTaskGroup}
      />
      <ElementInfoDialog
        open={infoDialogOpen}
        elementInfo={currentElementInfo}
        onClose={() => setInfoDialogOpen(false)}
      />
      <DeleteConfirmationDialog
        open={deleteConfirmOpen}
        onConfirm={handleDeleteTaskGroup}
        onClose={() => setDeleteConfirmOpen(false)}
        taskGroupName={taskProperties.name}
      />
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={state.errors.general ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FullTaskManager;
