import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Tabs,
  Tab,
  Typography,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton, // Added for the floating save button
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save'; // Added for the save icon
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import GeneralInfo from './GeneralInfo';
import CashInfo from './CashInfo';
import GlobalSpaces from './GlobalSpaces';
import GlobalElements from './GlobalElements';
import Planning from './Planning';
import GlobalDocuments from './GlobalDocuments';
import TaskCreationForm from './TaskCreationForm';
import InspectionReport from './InspectionReport';
import KanbanView from './KanbanView'; // Import the KanbanView component

import elementsData from './inspectionTasks.json';
import spacesData from './spaces.json';
import validate from './validation';
import { fetchMJOPData, saveMJOPData, calculateCurrentCash, getSaldoColor } from './dataHandling';


const GenerateMJOP = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [value, setValue] = useState(0);

  const [generalInfo, setGeneralInfo] = useState({
    projectNumber: '',
    projectName: '',
    address: '',
    contactPerson: '',
    inspectionDate: '',
    propertyImage: null,
    opdrachtgeverNaam: '',
    opdrachtgeverAdres: '',
    opdrachtgeverPostcode: '',
    opdrachtgeverPlaats: '',
    opdrachtgeverTelefoon: '',
    opdrachtgeverEmail: '',
    inspecteur: '',
    inspectiedatum: '',
    opmerkingen: '',
  });

  const [cashInfo, setCashInfo] = useState({
    currentCash: '',
    monthlyContribution: '',
    reserveDate: '',
    totalWorth: '',
  });

  const [mjop, setMJOP] = useState({});
  const [globalElements, setGlobalElements] = useState([]);
  const [globalSpaces, setGlobalSpaces] = useState([]);
  const [globalDocuments, setGlobalDocuments] = useState([]);
  const [offerGroups, setOfferGroups] = useState([]); // State for offer groups
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);
  const [newElement, setNewElement] = useState({
    name: '',
    description: '',
    inspectionDate: null,
    interval: '',
    documents: [],
    photos: [],
    spaceId: '',
  });
  const [newSpace, setNewSpace] = useState({
    name: '',
    description: '',
    photos: [],
    documents: [],
    image: '',
    annotations: [],
  });
  const [filter, setFilter] = useState('todo');
  const [tabErrors, setTabErrors] = useState({
    generalInfo: false,
    cashInfo: false,
    globalSpaces: false,
    globalElements: false,
    inspectionReport: false,
    planning: false,
    globalDocuments: false,
  });
  const [openErrorDialog, setOpenErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const logAction = (action, data) => {
    console.log(`[${new Date().toISOString()}] ${action}:`, JSON.stringify(data, null, 2));
  };

  useEffect(() => {
    console.log('Updated offerGroups in parent:', JSON.stringify(offerGroups, null, 2));
  }, [offerGroups]);

  useEffect(() => {
    if (id) {
      fetchMJOPData(
        id,
        setMJOP,
        setGeneralInfo,
        setCashInfo,
        setOfferGroups, // Set offerGroups during data fetch
        () => {}, // Placeholder for setTotalWorth
        setGlobalElements,
        setGlobalSpaces,
        setGlobalDocuments
      );
    } else {
      setGlobalElements([]);
      setGlobalSpaces([]);
    }
    logAction('Initial load', { id, generalInfo, globalElements, globalSpaces, globalDocuments });
  }, [id]);

  const handleChange = (section, field, value) => {
    logAction('Handle change', { section, field, value });
    if (section === 'cashInfo') {
      setCashInfo((prev) => ({
        ...prev,
        [field]: value,
      }));
    } else if (section === 'generalInfo') {
      setGeneralInfo((prev) => ({
        ...prev,
        [field]: value,
      }));
    } else {
      setGlobalElements((prev) =>
        prev.map((element) =>
          element.id === section
            ? {
                ...element,
                inspectionReport: element.inspectionReport.map((report) => ({
                  ...report,
                  tasks: report.tasks.map((task) =>
                    task.id === field ? { ...task, ...value } : task
                  ),
                })),
              }
            : element
        )
      );
    }
  };

  const handleValidation = () => {
    const { newErrors, newTabErrors, isValid } = validate({
      generalInfo,
      cashInfo,
      totalWorth: cashInfo.totalWorth,
      globalElements,
    });
    setErrors(newErrors);
    setTabErrors(newTabErrors);
    logAction('Handle validation', { newErrors, newTabErrors, isValid });
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrors({});
    setSuccess(null);

    if (!handleValidation()) {
      setIsSaving(false);
      setErrors((prevErrors) => ({
        ...prevErrors,
        general: 'Er zijn validatiefouten die moeten worden opgelost.',
      }));
      return;
    }

    try {
      const formData = new FormData();
      formData.append('mjop', JSON.stringify(mjop));
      formData.append('generalInfo', JSON.stringify(generalInfo));
      formData.append('cashInfo', JSON.stringify(cashInfo));
      formData.append('globalElements', JSON.stringify(globalElements));
      formData.append('globalSpaces', JSON.stringify(globalSpaces));
      formData.append('globalDocuments', JSON.stringify(globalDocuments));
      formData.append('offerGroups', JSON.stringify(offerGroups)); // Include offerGroups in the submission

      if (generalInfo.propertyImage && typeof generalInfo.propertyImage !== 'string') {
        formData.append('propertyImage', generalInfo.propertyImage);
      }

      globalSpaces.forEach((space, spaceIndex) => {
        if (space.photos) {
          space.photos.forEach((photo, photoIndex) => {
            if (typeof photo !== 'string') {
              formData.append(`globalSpacesPhotos[${spaceIndex}][${photoIndex}]`, photo);
            }
          });
        }
      });

      globalElements.forEach((element, elementIndex) => {
        if (element.photos) {
          element.photos.forEach((photo, photoIndex) => {
            if (typeof photo !== 'string') {
              formData.append(`globalElementsPhotos[${elementIndex}][${photoIndex}]`, photo);
            }
          });
        }
        if (element.documents) {
          element.documents.forEach((document, documentIndex) => {
            if (typeof document !== 'string') {
              formData.append(`globalElementsDocuments[${elementIndex}][${documentIndex}]`, document);
            }
          });
        }
      });

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      };

      await saveMJOPData(id, formData, config, setIsSaving, setSuccess, setErrors, navigate);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Error saving MJOP data:`, err);
      setIsSaving(false);
      setErrors({ general: 'Er is een fout opgetreden bij het opslaan van de gegevens.' });
    }
  };

  const handleAddElement = (element) => {
    const elementWithId = { ...element, id: uuidv4() };
    logAction('Handle add element', { elementWithId });
    setGlobalElements([...globalElements, elementWithId]);
  };

  const handleEditElement = (element) => {
    logAction('Handle edit element', { element });
    setGlobalElements(globalElements.map((el) => (el.id === element.id ? element : el)));
  };

  const handleDeleteElement = (id) => {
    logAction('Handle delete element', { id });
    setGlobalElements(globalElements.filter((element) => element.id !== id));
  };

  const handleAddSpace = (space) => {
    const spaceWithId = { ...space, id: uuidv4() };
    logAction('Handle add space', { spaceWithId });
    setGlobalSpaces([...globalSpaces, spaceWithId]);
  };

  const handleEditSpace = (space) => {
    logAction('Handle edit space', { space });
    setGlobalSpaces(globalSpaces.map((sp) => (sp.id === space.id ? space : sp)));
  };

  const handleDeleteSpace = (id) => {
    logAction('Handle delete space', { id });
    setGlobalSpaces(globalSpaces.filter((space) => space.id !== id));
  };

  const handleAddItemToPlanning = (task, elementId) => {
    logAction('Add item to planning', { task, elementId });
    setGlobalElements((prevElements) =>
      prevElements.map((element) => {
        if (element.id === elementId) {
          return {
            ...element,
            inspectionReport: element.inspectionReport.map((report) =>
              report.tasks.map((t) =>
                t.id === task.id
                  ? {
                      ...t,
                      planned: true,
                      plannedData: {
                        workDate: task.workDate,
                        estimatedPrice: task.estimatedPrice,
                        comment: task.comment,
                        files: task.files || [],
                      },
                    }
                  : t
              )
            ),
          };
        }
        return element;
      })
    );
  };

  const handleItemChange = (taskId, field, value) => {
    logAction('Handle item change', { taskId, field, value });
    setGlobalElements((prevElements) =>
      prevElements.map((element) => ({
        ...element,
        inspectionReport: element.inspectionReport.map((report) => ({
          ...report,
          tasks: report.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  plannedData: {
                    ...task.plannedData,
                    [field]: value,
                  },
                }
              : task
          ),
        })),
      }))
    );
  };

  const handleDeleteItem = (taskId) => {
    logAction('Handle delete item', { taskId });
    setGlobalElements((prevElements) =>
      prevElements.map((element) => ({
        ...element,
        inspectionReport: element.inspectionReport.map((report) => ({
          ...report,
          tasks: report.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  planned: false,
                  plannedData: {},
                }
              : task
          ),
        })),
      }))
    );
  };

  const handleAddCustomItem = (item) => {
    logAction('Handle add custom item', { item });
    const generalElement = globalElements.find((el) => el.name === 'Algemeneen');

    if (generalElement) {
      setGlobalElements((prevElements) =>
        prevElements.map((element) => {
          if (element.name === 'Algemeneen') {
            return {
              ...element,
              inspectionReport: [
                {
                  id: uuidv4(),
                  element: 'Algemeneen',
                  description: '',
                  tasks: [
                    ...element.inspectionReport[0].tasks,
                    {
                      ...item,
                      id: uuidv4(),
                      planned: true,
                      plannedData: {
                        workDate: item.workDate,
                        estimatedPrice: item.estimatedPrice,
                        comment: item.comment,
                        files: item.files || [],
                      },
                    },
                  ],
                },
              ],
            };
          }
          return element;
        })
      );
    } else {
      setGlobalElements([
        ...globalElements,
        {
          id: uuidv4(),
          name: 'Algemeneen',
          description: '',
          inspectionReport: [
            {
              id: uuidv4(),
              element: 'Algemeneen',
              description: '',
              tasks: [
                {
                  ...item,
                  id: uuidv4(),
                  planned: true,
                  plannedData: {
                    workDate: item.workDate,
                    estimatedPrice: item.estimatedPrice,
                    comment: item.comment,
                    files: item.files || [],
                  },
                },
              ],
            },
          ],
        },
      ]);
    }
  };

  const handleTabChange = (event, newValue) => {
    const checkCashFields = () => {
      const { currentCash, monthlyContribution, reserveDate, totalWorth } = cashInfo;
      return currentCash && monthlyContribution && reserveDate && totalWorth;
    };

    if (newValue === 6 && !checkCashFields()) {
      setErrorMessage('Vul eerst de kasinformatie in.');
      setOpenErrorDialog(true);
      return;
    }

    if (newValue === 3 && globalSpaces.length === 0) {
      setErrorMessage('Definieer eerst de ruimtes.');
      setOpenErrorDialog(true);
      return;
    }

    if (newValue === 4 && globalElements.length === 0) {
      setErrorMessage('Definieer eerst de elementen.');
      setOpenErrorDialog(true);
      return;
    }

    setValue(newValue);
  };

  const handleAddTask = (taskData, useInterval) => {
    setGlobalElements((prevElements) => {
      return prevElements.map((element) => {
        if (element.id === taskData.elementId) {
          const updatedTasks = [...(element.tasks || [])];

          let currentStartDate = new Date(taskData.startDate);
          let currentEstimatedPrice = parseFloat(taskData.estimatedPrice);

          if (useInterval) {
            for (let i = 0; i < taskData.totalYears; i += taskData.intervalYears) {
              const newTask = {
                id: uuidv4(),
                name: taskData.name,
                description: taskData.description,
                urgency: taskData.urgency,
                planned: {
                  workDate: new Date(currentStartDate).toISOString(),
                  estimatedPrice: currentEstimatedPrice.toFixed(2),
                  offerPrice: '',
                  invoicePrice: '',
                  comment: '',
                  offerFiles: [],
                  invoiceFiles: [],
                  offerAccepted: false,
                },
                ultimateDate: new Date(
                  currentStartDate.getFullYear() + taskData.intervalYears,
                  currentStartDate.getMonth(),
                  currentStartDate.getDate()
                ).toISOString(),
              };

              updatedTasks.push(newTask);
              currentStartDate.setFullYear(
                currentStartDate.getFullYear() + taskData.intervalYears
              );
              currentEstimatedPrice *= 1 + taskData.inflationRate / 100;
            }
          } else {
            const newTask = {
              id: uuidv4(),
              name: taskData.name,
              description: taskData.description,
              urgency: taskData.urgency,
              planned: {
                workDate: new Date(taskData.startDate).toISOString(),
                estimatedPrice: parseFloat(taskData.estimatedPrice).toFixed(2),
                offerPrice: '',
                invoicePrice: '',
                comment: '',
                offerFiles: [],
                invoiceFiles: [],
                offerAccepted: false,
              },
              ultimateDate: new Date(taskData.startDate).toISOString(),
            };
            updatedTasks.push(newTask);
          }

          return {
            ...element,
            tasks: updatedTasks,
          };
        }
        return element;
      });
    });
  };

  return (
    <Box
      mx="auto"
   
      sx={{

        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Main content and form container */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          bgcolor: 'background.paper',
          p: 4,
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          flexGrow: 1, // Allow the form to take up available space
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start', // Align content to the top
        }}
      >
        {/* Tabs for navigation */}
        <Tabs value={value} onChange={handleTabChange}>
          <Tab label={<Badge color="error" variant="dot" invisible={!tabErrors.generalInfo}>Algemene Informatie</Badge>} />
          <Tab label={<Badge color="error" variant="dot" invisible={!tabErrors.cashInfo}>Kasinformatie</Badge>} />
          <Tab label={<Badge color="error" variant="dot" invisible={!tabErrors.globalSpaces}>Ruimtes</Badge>} />
          <Tab label={<Badge color="error" variant="dot" invisible={!tabErrors.globalElements}>Elementen</Badge>} />
          <Tab label={<Badge color="error" variant="dot" invisible={!tabErrors.inspectionReport}>Inspectierapport</Badge>} />
          <Tab label="Taak Aanmaken" />
          <Tab label={<Badge color="error" variant="dot" invisible={!tabErrors.planning}>Planning</Badge>} />
          <Tab label={<Badge color="error" variant="dot" invisible={!tabErrors.globalDocuments}>Documenten</Badge>} />
          <Tab label="Kanban Bord" />
        </Tabs>
  
        {/* Tab Panels */}
        <TabPanel value={value} index={0}>
          <GeneralInfo generalInfo={generalInfo} setGeneralInfo={setGeneralInfo} errors={errors} />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <CashInfo
            cashInfo={cashInfo}
            setCashInfo={setCashInfo}
            errors={errors}
            calculateCurrentCash={() => calculateCurrentCash(cashInfo, globalElements)}
            getSaldoColor={() =>
              getSaldoColor(calculateCurrentCash(cashInfo, globalElements), cashInfo.totalWorth)
            }
          />
        </TabPanel>
        <TabPanel value={value} index={2}>
          <GlobalSpaces
            availableSpaces={spacesData}
            globalSpaces={globalSpaces}
            setGlobalSpaces={setGlobalSpaces}
            newSpace={newSpace}
            setNewSpace={setNewSpace}
            handleAddSpace={handleAddSpace}
            handleEditSpace={handleEditSpace}
            handleDeleteSpace={handleDeleteSpace}
          />
        </TabPanel>
        <TabPanel value={value} index={3}>
          <GlobalElements
            availableElements={elementsData}
            globalElements={globalElements}
            setGlobalElements={setGlobalElements}
            newElement={newElement}
            setNewElement={setNewElement}
            globalSpaces={globalSpaces}
            handleAddElement={handleAddElement}
            handleEditElement={handleEditElement}
            handleDeleteElement={handleDeleteElement}
          />
        </TabPanel>
        <TabPanel value={value} index={4}>
          <InspectionReport
            globalElements={globalElements}
            filter={filter}
            setFilter={setFilter}
            setGlobalElements={setGlobalElements}
            globalSpaces={globalSpaces}
          />
        </TabPanel>
        <TabPanel value={value} index={5}>
          <TaskCreationForm
            globalSpaces={globalSpaces}
            setGlobalSpaces={setGlobalSpaces}
            globalElements={globalElements}
            setGlobalElements={setGlobalElements}
            onAddTask={handleAddTask}
          />
        </TabPanel>
        <TabPanel value={value} index={6}>
          <Planning
            globalSpaces={globalSpaces}
            globalElements={globalElements}
            setGlobalElements={setGlobalElements}
            handleAddItem={handleAddItemToPlanning}
            handleItemChange={handleItemChange}
            handleDeleteItem={handleDeleteItem}
            handleAddCustomItem={handleAddCustomItem}
            cashInfo={cashInfo}
            offerGroups={offerGroups}
            setOfferGroups={setOfferGroups}
          />
        </TabPanel>
        <TabPanel value={value} index={7}>
          <GlobalDocuments globalDocuments={globalDocuments} setGlobalDocuments={setGlobalDocuments} />
        </TabPanel>
        <TabPanel value={value} index={8}>
          <KanbanView />
        </TabPanel>
  
        {/* Error Handling */}
        {errors.general && (
          <Typography color="error" mt={2}>
            {errors.general}
          </Typography>
        )}
        {success && (
          <Typography color="success" mt={2}>
            {success}
          </Typography>
        )}
      </Box>
  
      {/* Floating Save Button */}
      <IconButton
        type="submit"
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          backgroundColor: "primary.main",
          color: 'white',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          "&:hover": {
            backgroundColor: "primary.dark",
          },
          zIndex: 10,
        }}
        disabled={isSaving}
      >
        <SaveIcon />
      </IconButton>
  
      {/* Error Dialog */}
      <Dialog open={openErrorDialog} onClose={() => setOpenErrorDialog(false)}>
        <DialogTitle>Fout</DialogTitle>
        <DialogContent>
          <Typography>{errorMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenErrorDialog(false)} color="primary">
            Ok
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
  
  

};

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div

      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box >{children}</Box>}
    </div>
  );
};

export default GenerateMJOP;
