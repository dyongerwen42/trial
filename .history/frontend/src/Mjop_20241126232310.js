// FullTaskManager.jsx

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
import TaskTimeline from './TaskTimeline'; // Nieuwe import

const FullTaskManager = () => {
  // Extracting state and setters from context
  const {
    state,
    setGlobalElements,
    saveData,
    addOfferGroup,
    editOfferGroup,
    deleteOfferGroup,
  } = useMjopContext();

  // Lokale state variabelen
  const [selectedElementsByCategory, setSelectedElementsByCategory] = useState({});
  const [dialogMode, setDialogMode] = useState(null); // 'add' of 'edit'
  const [currentCategory, setCurrentCategory] = useState('');
  const [taskProperties, setTaskProperties] = useState({
    id: null,
    name: '',
    groupDate: new Date(),
    cost: 0,
    amount: 0, // Tijd per taakgroep in maanden
    duration: 'days',
    totalSquareMeters: 0,
    urgency: 1, // Standaard urgentie ingesteld op 1
    periodic: false,
    periodicityMonths: '',
    totalYears: '',
    indexation: false,
    indexationRate: '',
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
      amount: 0, // Tijd per taakgroep in maanden
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

  // Open Edit Task dialog voor een specifieke taakgroep
  const openEditDialog = (group) => {
    // Bereid elementnamen en ruimtes voor weergave in de dialog
    const elementNames = {};
    const elementSpaces = {};
    group.subtasks.forEach((subtask) => {
      elementNames[subtask.id] = subtask.name;
      elementSpaces[subtask.id] =
        state.globalSpaces.find((space) => space.id === subtask.spaceId)?.name ||
        'Onbekende Ruimte';
    });

    setDialogMode('edit');
    setTaskProperties({
      id: group.id,
      name: group.name,
      groupDate: new Date(group.groupDate),
      cost: group.cost,
      amount: group.amount,
      duration: group.duration,
      totalSquareMeters: group.totalSquareMeters,
      urgency: group.urgency,
      periodic: group.periodic,
      periodicityMonths: group.periodicityMonths || '',
      totalYears: group.totalYears || '',
      indexation: group.indexation,
      indexationRate: group.indexationRate || '',
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
  const addOrUpdateTaskGroup = useCallback(() => {
    const {
      id,
      name,
      groupDate,
      cost,
      amount, // Tijd per taakgroep in maanden
      duration,
      totalSquareMeters,
      urgency,
      periodic,
      periodicityMonths,
      totalYears,
      indexation,
      indexationRate,
      assignPricesIndividually,
      individualCosts,
      selectedElementIds,
      elementNames,
      elementSpaces,
    } = taskProperties;

    if (dialogMode === 'add') {
      if (periodic) {
        // Validatie van invoervelden
        if (!periodicityMonths || periodicityMonths <= 0) {
          setSnackbarMessage('Voer een geldige periodiciteit in maanden in!');
          setSnackbarOpen(true);
          return;
        }
        if (!totalYears || totalYears <= 0) {
          setSnackbarMessage('Voer een geldig aantal totale jaren in!');
          setSnackbarOpen(true);
          return;
        }
        if (indexation && (!indexationRate || indexationRate < 0)) {
          setSnackbarMessage('Voer een geldige indexatievoet in!');
          setSnackbarOpen(true);
          return;
        }

        // Bereken het totale aantal periodes
        const totalPeriods = Math.floor(
          (parseInt(totalYears, 10) * 12) / parseInt(periodicityMonths, 10)
        );
        const indexRate = indexation ? parseFloat(indexationRate) / 100 : 0;

        const newTaskGroups = [];
        const newOfferGroups = [];
        const tasksByElementId = {}; // Collect tasks per element

        for (let i = 0; i < totalPeriods; i++) {
          // Bereken de datum voor deze periode
          const periodDate = addMonths(new Date(groupDate), i * parseInt(periodicityMonths, 10));

          // Bereken de kosten met indexatie
          const fullYearsElapsed = differenceInYears(periodDate, new Date(groupDate));
          const adjustedCost = indexation
            ? parseFloat((parseFloat(cost) * Math.pow(1 + indexRate, fullYearsElapsed)).toFixed(2))
            : parseFloat(parseFloat(cost).toFixed(2));

          selectedElementIds.forEach((elementId) => {
            const element = state.globalElements.find((el) => el.id === elementId);
            if (!element) return;

            const groupId = uuidv4();
            const offerGroupId = uuidv4(); // Unieke ID voor elke offerGroup

            // Maak een nieuwe taakgroep aan voor dit element en deze periode
            const newTaskGroup = {
              id: groupId,
              name: `${name} - Period ${i + 1} - ${element.name}`,
              groupDate: periodDate,
              cost: adjustedCost,
              amount: parseInt(amount, 10),
              duration,
              totalSquareMeters: parseFloat(totalSquareMeters).toFixed(2),
              urgency: parseInt(urgency, 10),
              periodic: false, // Individuele taakgroepen zijn niet periodiek
              periodicityMonths: null,
              totalYears: null,
              indexation: false,
              indexationRate: null,
              assignPricesIndividually,
              subtasks: [
                {
                  ...element,
                  individualCost: assignPricesIndividually
                    ? parseFloat((individualCosts[elementId] || 0).toFixed(2))
                    : 0,
                  endDate: new Date(periodDate),
                  offerGroupId, // Link naar offerGroup
                },
              ],
            };

            newTaskGroups.push(newTaskGroup);

            // Maak een nieuwe offerGroup aan voor dit element en deze periode
            const newOfferGroup = {
              offerGroupId: offerGroupId,
              invoicePrice: "",
              offerPrice: "",
              estimatedValue: assignPricesIndividually
                ? parseFloat((individualCosts[elementId] || 0).toFixed(2))
                : parseFloat(cost.toFixed(2)),
              name: `Offertegroep ${i + 1} - ${element.name}`,
              offerAccepted: false,
              groupWorkDate: format(periodDate, 'yyyy-MM-dd'), // Gebruik format hier
            };

            newOfferGroups.push(newOfferGroup);

            // Maak een nieuwe taak aan en voeg deze toe aan de specifieke element
            const newTask = {
              id: uuidv4(),
              name: `${name} - Period ${i + 1} - ${element.name}`,
              description: element.description || '',
              endDate: new Date(periodDate),
              cost: assignPricesIndividually
                ? parseFloat((individualCosts[elementId] || 0).toFixed(2))
                : parseFloat(parseFloat(cost).toFixed(2)),
              isGrouped: true,
              elementName: element.name,
              groupId: groupId,
              offerGroupId: offerGroupId, // Link naar offerGroup
            };

            // Collect tasks per element
            if (!tasksByElementId[elementId]) {
              tasksByElementId[elementId] = [];
            }
            tasksByElementId[elementId].push(newTask);
          });
        }

        // Update globalElements after collecting all tasks
        const updatedGlobalElements = state.globalElements.map((el) => {
          if (tasksByElementId[el.id]) {
            return {
              ...el,
              tasks: [...(el.tasks || []), ...tasksByElementId[el.id]],
            };
          }
          return el;
        });

        setGlobalElements(updatedGlobalElements);

        // Voeg alle nieuwe taakgroepen en offerGroups toe aan de staat
        setTaskGroups((prev) => [...prev, ...newTaskGroups]);
        newOfferGroups.forEach((og) => addOfferGroup(og));

        // Maak selecties leeg en sluit dialog
        setSelectedElementsByCategory((prev) => ({ ...prev, [currentCategory]: [] }));
        setDialogMode(null);
        setSnackbarMessage('Periodieke taakgroepen succesvol toegevoegd!');
        setSnackbarOpen(true);
      } else {
        // Niet periodiek: Maak één taakgroep aan
        // Validatie van invoervelden
        if (amount <= 0) {
          setSnackbarMessage('Voer een geldige tijd in maanden in!');
          setSnackbarOpen(true);
          return;
        }

        // Maak taken aan en update globalElements
        const updatedGlobalElements = state.globalElements.map((element) => {
          if (selectedElementIds.includes(element.id)) {
            // Stel endDate in op groepsdatum
            const endDate = new Date(groupDate);

            const newTask = {
              id: uuidv4(),
              name, // Taaknaam uit de dialog
              description: element.description || '',
              endDate,
              cost: assignPricesIndividually
                ? parseFloat((individualCosts[element.id] || 0).toFixed(2))
                : parseFloat(parseFloat(cost).toFixed(2)),
              isGrouped: true,
              elementName: element.name,
              groupId: null, // Wordt later ingesteld
              offerGroupId: null, // Wordt later ingesteld
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
        const offerGroupId = uuidv4(); // Unieke ID voor offerGroup

        const newTaskGroup = {
          id: groupId,
          name,
          groupDate: new Date(groupDate),
          cost: parseFloat(cost.toFixed(2)),
          amount: parseInt(amount, 10),
          duration,
          totalSquareMeters: parseFloat(totalSquareMeters).toFixed(2),
          urgency: parseInt(urgency, 10),
          periodic: false,
          periodicityMonths: null,
          totalYears: null,
          indexation: false,
          indexationRate: null,
          assignPricesIndividually,
          subtasks: selectedElementIds.map((elementId) => {
            const element = state.globalElements.find((el) => el.id === elementId);
            return {
              ...element,
              individualCost: assignPricesIndividually
                ? parseFloat((individualCosts[elementId] || 0).toFixed(2))
                : 0,
              endDate: new Date(groupDate),
              offerGroupId: offerGroupId, // Link naar offerGroup
            };
          }),
        };

        // Voeg nieuwe taakgroep toe
        setTaskGroups((prev) => [...prev, newTaskGroup]);

        // Maak een nieuwe offerGroup aan
        const newOfferGroup = {
          offerGroupId: offerGroupId,
          invoicePrice: "",
          offerPrice: "",
          estimatedValue: assignPricesIndividually
            ? selectedElementIds.reduce((sum, elId) => sum + parseFloat(individualCosts[elId] || 0), 0)
            : parseFloat(cost.toFixed(2)),
          name: `Offertegroep - ${name}`,
          offerAccepted: false,
          groupWorkDate: format(new Date(groupDate), 'yyyy-MM-dd'), // Gebruik format hier
        };

        addOfferGroup(newOfferGroup);

        // Update taken met groupId en offerGroupId
        const finalGlobalElements = updatedGlobalElements.map((element) => {
          if (selectedElementIds.includes(element.id)) {
            const updatedTasks = element.tasks.map((task) => ({
              ...task,
              groupId: task.groupId || groupId,
              offerGroupId: task.offerGroupId || offerGroupId,
            }));
            return { ...element, tasks: updatedTasks };
          }
          return element;
        });

        setGlobalElements(finalGlobalElements);

        // Maak selecties leeg en sluit dialog
        setSelectedElementsByCategory((prev) => ({ ...prev, [currentCategory]: [] }));
        setDialogMode(null);
        setSnackbarMessage('Taakgroep succesvol toegevoegd!');
        setSnackbarOpen(true);
      }
    }, [
      dialogMode,
      taskProperties,
      state.globalElements,
      addOfferGroup,
      currentCategory,
      setGlobalElements,
      state.globalSpaces,
      deleteOfferGroup,
      editOfferGroup,
      state.offerGroups,
      taskGroups,
    ]); // Correct afsluiting met ])

  // Functie om taakgroep te verwijderen
  const handleDeleteTaskGroup = () => {
    const { id, name, offerGroupId } = taskProperties;
    if (!id) return;

    // Verwijder de taakgroep uit state
    setTaskGroups((prevGroups) => prevGroups.filter((group) => group.id !== id));

    // Verwijder de bijbehorende offerGroup
    if (offerGroupId) {
      deleteOfferGroup(offerGroupId);
    }

    // Update globalElements door groupId en offerGroupId te verwijderen uit taken
    const updatedGlobalElements = state.globalElements.map((element) => {
      if (element.tasks && element.tasks.length > 0) {
        const updatedTasks = element.tasks.map((task) => {
          if (task.groupId === id) {
            const { groupId, offerGroupId, ...rest } = task; // Verwijder groupId en offerGroupId
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
        costPerYear[year] = (costPerYear[year] || 0) + parseFloat(group.cost);
      }
    });
    // Rond de totale kosten per jaar af op 2 decimalen
    Object.keys(costPerYear).forEach((year) => {
      costPerYear[year] = parseFloat(costPerYear[year].toFixed(2));
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

  // Handler to call saveData
  const handleSaveData = async () => {
    try {
      await saveData();
      // Assuming saveData updates state.success or state.errors
      // If not, set a success message here
      if (state.success) {
        setSnackbarMessage(state.success);
      } else {
        setSnackbarMessage('Data successfully saved.');
      }
      setSnackbarOpen(true);
    } catch (error) {
      // Assuming saveData handles errors and sets state.errors
      // If not, set an error message here
      setSnackbarMessage('Failed to save data. Please try again.');
      setSnackbarOpen(true);
    }
  };

  // Effect om success en error messages te behandelen vanuit context
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
          {/* Header met Save Button */}
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

          {/* Task Timeline */}
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
        // addOfferGroup={addOfferGroup} // Verwijderd
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
          severity={state.success ? 'success' : state.errors.general ? 'error' : 'info'}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FullTaskManager;
