// FullTaskManager.jsx

import React, { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { useMjopContext } from './MjopContext';

// Importeer de aangepaste componenten
import Sidebar from './Sidebar';
import TaskGroupDialog from './TaskGroupDialog';
import ElementInfoDialog from './ElementInfoDialog';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import TaskTimeline from './TaskTimeline'; // Nieuwe import

const FullTaskManager = () => {
  // Extracting state and setters from context
  const {
    state: { globalElements, globalSpaces },
    setGlobalElements,
  } = useMjopContext();

  // Lokale state variabelen
  const [selectedElementsByCategory, setSelectedElementsByCategory] = useState({});
  const [dialogMode, setDialogMode] = useState(null); // 'add' of 'edit'
  const [currentCategory, setCurrentCategory] = useState('');
  const [taskProperties, setTaskProperties] = useState({
    id: null, // Toegevoegd voor bewerken identificatie
    name: '',
    groupDate: new Date(),
    cost: 0,
    amount: 0,
    duration: 'days',
    totalSquareMeters: 0,
    urgency: 1, // Standaard urgentie ingesteld op 1
    periodic: false,
    periodicityMonths: '',
    indexation: false,
    assignPricesIndividually: false,
    individualCosts: {},
    selectedElementIds: [],
    // Extra eigenschappen voor elementnamen en ruimtes
    elementNames: {},
    elementSpaces: {},
  });
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [taskGroups, setTaskGroups] = useState([]);

  // State voor Element Info Dialog
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [currentElementInfo, setCurrentElementInfo] = useState(null);

  // State voor Delete Confirmation Dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const yearRange = 10;
  const startYear = new Date().getFullYear();
  const years = Array.from({ length: yearRange }, (_, i) => startYear + i);

  // Mapping van groupId naar groep voor gemakkelijke lookup
  const taskGroupsMap = useMemo(() => {
    return taskGroups.reduce((acc, group) => {
      acc[group.id] = group;
      return acc;
    }, {});
  }, [taskGroups]);

  // Categoriseren van elementen per categorie en ruimte
  const categorizedElements = useMemo(() => {
    return globalElements.reduce((acc, element) => {
      const elementCategories = element.categories || [];
      const spaceName =
        globalSpaces.find((space) => space.id === element.spaceId)?.name ||
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
  }, [globalElements, globalSpaces]);

  // Handler voor element selectie
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

  // Handler voor 'Selecteer Alles' toggle
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

  // Open Add Task dialog voor een categorie
  const openAddDialog = (category) => {
    if (
      !selectedElementsByCategory[category] ||
      selectedElementsByCategory[category].length === 0
    ) {
      setSnackbarMessage('Selecteer ten minste één element om taken toe te voegen!');
      setSnackbarOpen(true);
      return;
    }

    // Bereid elementnamen en ruimtes voor weergave in de dialog
    const elementNames = {};
    const elementSpaces = {};
    selectedElementsByCategory[category].forEach((elementId) => {
      const element = globalElements.find((el) => el.id === elementId);
      if (element) {
        elementNames[elementId] = element.name;
        elementSpaces[elementId] = globalSpaces.find((space) => space.id === element.spaceId)?.name || 'Onbekende Ruimte';
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
      indexation: false,
      assignPricesIndividually: false,
      individualCosts: {},
      selectedElementIds: selectedElementsByCategory[category],
      elementNames,
      elementSpaces,
    });
  };

  // Open Edit Task dialog voor een specifieke taakgroep
  const openEditDialog = (group) => {
    // Bereid elementnamen en ruimtes voor weergave in de dialog
    const elementNames = {};
    const elementSpaces = {};
    group.subtasks.forEach((subtask) => {
      elementNames[subtask.id] = subtask.name;
      elementSpaces[subtask.id] = globalSpaces.find((space) => space.id === subtask.spaceId)?.name || 'Onbekende Ruimte';
    });

    setDialogMode('edit');
    setTaskProperties({
      id: group.id,
      name: group.name,
      groupDate: group.groupDate,
      cost: group.cost,
      amount: group.amount,
      duration: group.duration,
      totalSquareMeters: group.totalSquareMeters,
      urgency: group.urgency,
      periodic: group.periodic,
      periodicityMonths: group.periodicityMonths || '',
      indexation: group.indexation,
      assignPricesIndividually: group.assignPricesIndividually,
      individualCosts: group.subtasks.reduce((acc, subtask) => {
        acc[subtask.id] = subtask.individualCost || 0;
        return acc;
      }, {}),
      selectedElementIds: group.subtasks.map((subtask) => subtask.id),
      elementNames,
      elementSpaces,
    });
  };

  // Voeg taken toe of werk bestaande taakgroepen bij
  const addOrUpdateTaskGroup = () => {
    const {
      id,
      name,
      groupDate,
      cost,
      amount,
      duration,
      totalSquareMeters,
      urgency,
      periodic,
      periodicityMonths,
      indexation,
      assignPricesIndividually,
      individualCosts,
      selectedElementIds,
      elementNames,
      elementSpaces,
    } = taskProperties;

    if (dialogMode === 'add') {
      // Maak taken aan en update globalElements
      const updatedGlobalElements = globalElements.map((element) => {
        if (selectedElementIds.includes(element.id)) {
          // Stel endDate in op groepsdatum
          const endDate = new Date(groupDate);

          const newTask = {
            id: uuidv4(),
            name, // Taaknaam uit de dialog
            description: element.description || '',
            endDate,
            cost: assignPricesIndividually
              ? Number(individualCosts[element.id] || 0)
              : Number(cost),
            isGrouped: true,
            elementName: element.name,
            groupId: null, // Wordt later ingesteld
          };
          // Zorg ervoor dat alle eigenschappen behouden blijven
          const updatedElement = {
            ...element,
            tasks: [...(element.tasks || []), newTask],
          };
          return updatedElement;
        }
        return element;
      });

      // Maak een nieuwe taakgroep aan
      const groupId = uuidv4();
      const newTaskGroup = {
        id: groupId,
        name,
        groupDate: new Date(groupDate),
        cost: Number(cost),
        amount: Number(amount),
        duration,
        totalSquareMeters: Number(totalSquareMeters),
        urgency: Number(urgency),
        periodic,
        periodicityMonths: periodic ? Number(periodicityMonths) : null,
        indexation,
        assignPricesIndividually,
        subtasks: selectedElementIds.map((elementId) => {
          const element = globalElements.find((el) => el.id === elementId);
          return {
            ...element,
            individualCost: assignPricesIndividually
              ? Number(individualCosts[elementId] || 0)
              : 0,
            endDate: new Date(groupDate),
          };
        }),
      };

      // Update taken met groupId
      const finalGlobalElements = updatedGlobalElements.map((element) => {
        if (selectedElementIds.includes(element.id)) {
          const updatedTasks = element.tasks.map((task) => ({
            ...task,
            groupId: task.groupId || groupId,
          }));
          return { ...element, tasks: updatedTasks };
        }
        return element;
      });

      setGlobalElements(finalGlobalElements);

      setTaskGroups((prev) => [...prev, newTaskGroup]);

      // Maak selecties leeg en sluit dialog
      setSelectedElementsByCategory((prev) => ({ ...prev, [currentCategory]: [] }));
      setDialogMode(null);
      setSnackbarMessage('Taakgroep succesvol toegevoegd!');
      setSnackbarOpen(true);
    } else if (dialogMode === 'edit') {
      // Update bestaande taakgroep
      const updatedTaskGroups = taskGroups.map((group) => {
        if (group.id === id) {
          return {
            ...group,
            name,
            groupDate,
            cost,
            amount,
            duration,
            totalSquareMeters,
            urgency,
            periodic,
            periodicityMonths: periodic ? Number(periodicityMonths) : null,
            indexation,
            assignPricesIndividually,
            subtasks: selectedElementIds.map((elementId) => {
              const element = globalElements.find((el) => el.id === elementId);
              return {
                ...element,
                individualCost: assignPricesIndividually
                  ? Number(individualCosts[elementId] || 0)
                  : 0,
                endDate: new Date(groupDate),
              };
            }),
          };
        }
        return group;
      });

      setTaskGroups(updatedTaskGroups);

      // Update globalElements
      const updatedGlobalElements = globalElements.map((element) => {
        if (selectedElementIds.includes(element.id)) {
          const updatedTasks = (element.tasks || []).map((task) => {
            if (task.groupId === id) {
              return {
                ...task,
                name,
                endDate: new Date(groupDate),
                cost: assignPricesIndividually
                  ? Number(individualCosts[element.id] || 0)
                  : Number(cost),
              };
            }
            return task;
          });
          return { ...element, tasks: updatedTasks };
        }
        return element;
      });

      setGlobalElements(updatedGlobalElements);

      setDialogMode(null);
      setSnackbarMessage('Taakgroep succesvol bijgewerkt!');
      setSnackbarOpen(true);
    }
  };

  // Functie om taakgroep te verwijderen
  const handleDeleteTaskGroup = () => {
    const { id, name } = taskProperties;
    if (!id) return;

    // Verwijder de taakgroep uit state
    setTaskGroups((prevGroups) => prevGroups.filter((group) => group.id !== id));

    // Update globalElements door groupId te verwijderen uit taken
    const updatedGlobalElements = globalElements.map((element) => {
      if (element.tasks && element.tasks.length > 0) {
        const updatedTasks = element.tasks.map((task) => {
          if (task.groupId === id) {
            const { groupId, ...rest } = task; // Verwijder groupId
            return rest;
          }
          return task;
        });
        return { ...element, tasks: updatedTasks };
      }
      return element;
    });

    setGlobalElements(updatedGlobalElements);

    // Sluit dialogen en toon succesbericht
    setDeleteConfirmOpen(false);
    setDialogMode(null);
    setSnackbarMessage(`Taakgroep "${name}" succesvol verwijderd!`);
    setSnackbarOpen(true);
  };

  // Haal taakgroepen op per jaar voor de tijdlijn
  const taskGroupsByYear = useMemo(() => {
    const groupsByYear = taskGroups.reduce((acc, group) => {
      const year = group.groupDate ? new Date(group.groupDate).getFullYear() : null;
      if (year) {
        if (!acc[year]) {
          acc[year] = [];
        }
        acc[year].push(group);
      }
      return acc;
    }, {});
    return groupsByYear;
  }, [taskGroups]);

  // Bereken totale kosten per jaar
  const totalCostPerYear = useMemo(() => {
    const costPerYear = {};
    taskGroups.forEach((group) => {
      const year = group.groupDate ? new Date(group.groupDate).getFullYear() : null;
      if (year) {
        costPerYear[year] = (costPerYear[year] || 0) + Number(group.cost || 0);
      }
    });
    return costPerYear;
  }, [taskGroups]);

  // Handler om Element Info Dialog te openen
  const handleOpenInfoDialog = (element) => {
    setCurrentElementInfo(element);
    setInfoDialogOpen(true);
  };

  // Handler om Element Info Dialog te sluiten
  const handleCloseInfoDialog = () => {
    setInfoDialogOpen(false);
    setCurrentElementInfo(null);
  };

  return (
    <Box sx={{ position: 'relative', height: '100vh', backgroundColor: '#f4f6f8', p: 3 }}>
      <Grid container spacing={4} sx={{ height: '100%' }}>
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

        {/* Hoofd Paneel */}
        <Grid item xs={12} md={8}>
          <TaskTimeline
            years={years}
            taskGroupsByYear={taskGroupsByYear}
            totalCostPerYear={totalCostPerYear}
            handleOpenTaskGroupInfoDialog={openEditDialog}
          />
        </Grid>
      </Grid>

      {/* Eendrachtige Add/Edit Task Group Dialog */}
      <TaskGroupDialog
        open={dialogMode === 'add' || dialogMode === 'edit'}
        mode={dialogMode}
        onClose={() => setDialogMode(null)}
        taskProperties={taskProperties}
        setTaskProperties={setTaskProperties}
        onSubmit={addOrUpdateTaskGroup}
        onDelete={() => setDeleteConfirmOpen(true)} // Open delete bevestiging
      />

      {/* Element Info Dialog */}
      <ElementInfoDialog
        open={infoDialogOpen}
        onClose={handleCloseInfoDialog}
        elementInfo={currentElementInfo}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteTaskGroup}
        taskGroupName={taskProperties.name}
      />

      {/* Snackbar voor feedback berichten */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FullTaskManager;
