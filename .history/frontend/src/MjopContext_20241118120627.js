// MjopContext.js
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useState,
  useMemo,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import {
  fetchMJOPData,
  saveMJOPData,
  calculateCurrentCash,
  getSaldoColor,
} from "./dataHandling";
import validate from "./validation";

// Creëer de Context
const MjopContext = createContext();

// Custom hook om de context te gebruiken
export const useMjopContext = () => useContext(MjopContext);

// Initialiseer de state
const initialState = {
  generalInfo: {
    projectNumber: "",
    projectName: "",
    address: "",
    contactPerson: "",
    inspectionDate: "",
    propertyImage: null,
    opdrachtgeverNaam: "",
    opdrachtgeverAdres: "",
    opdrachtgeverPostcode: "",
    opdrachtgeverPlaats: "",
    opdrachtgeverTelefoon: "",
    opdrachtgeverEmail: "",
    inspecteur: "",
    inspectiedatum: "",
    opmerkingen: "",
    contactPersonName: "Contactpersoon",
    contactPersonEmail: "contact@project.nl",
    contactPersonPhone: "0600000000",
    beheerderNaam: "Beheerder",
    beheerderAdres: "Beheeradres",
    beheerderPostcode: "1111AA",
    beheerderPlaats: "Beheerplaats",
    beheerderTelefoon: "0700000000",
    beheerderEmail: "beheer@beheer.nl",
  },
  cashInfo: {
    currentCash: 0,
    monthlyContribution: 0,
    reserveDate: new Date(),
    totalWorth: 0,
  },
  mjop: {},
  globalElements: [],
  globalSpaces: [],
  globalDocuments: [],
  offerGroups: [],
  newSpace: {
    name: "",
    description: "",
    photos: [],
    documents: [],
    image: "",
    annotations: [],
    floorSelection: false,
    floorNumber: "",
  },
  newElement: {
    name: "",
    description: "",
    inspectionDate: null,
    interval: "",
    documents: [],
    photos: [],
    spaceId: "",
    gebreken: {}, // Voor gebreken met ernst
    inspectionReport: [
      {
        id: uuidv4(),
        description: "",
        inspectionDone: false,
        inspectionDate: null,
        tasks: [],
      },
    ],
    annotations: [],
    categories: [],
    type: "",
    material: "",
    customMaterial: "",
    levensduur: "",
    aanschafDatum: "",
    vervangingsKosten: "",
  },
  isSaving: false,
  errors: {},
  success: null,
  tabErrors: {
    generalInfo: false,
    cashInfo: false,
    globalSpaces: false,
    globalElements: false,
    inspectionReport: false,
    planning: false,
    globalDocuments: false,
  },
  openErrorDialog: false,
  errorMessage: "",
};

// Reducer functie om de state te beheren
const mjopReducer = (state, action) => {
  switch (action.type) {
    case "SET_GENERAL_INFO":
      return {
        ...state,
        generalInfo: { ...state.generalInfo, ...action.payload },
      };

    case "SET_DATA":
      return {
        ...state,
        generalInfo: action.payload.generalInfo || state.generalInfo,
        cashInfo: action.payload.cashInfo || state.cashInfo,
        mjop: action.payload.mjop || state.mjop,
        globalElements: Array.isArray(action.payload.globalElements)
          ? action.payload.globalElements.map((element) => ({
              ...element,
              gebreken: element.gebreken || {},
              inspectionReport: Array.isArray(element.inspectionReport)
                ? element.inspectionReport
                : [
                    {
                      id: uuidv4(),
                      description: "",
                      inspectionDone: false,
                      inspectionDate: null,
                      tasks: [],
                    },
                  ],
            }))
          : state.globalElements,
        globalSpaces: Array.isArray(action.payload.globalSpaces)
          ? action.payload.globalSpaces
          : state.globalSpaces,
        globalDocuments: Array.isArray(action.payload.globalDocuments)
          ? action.payload.globalDocuments
          : state.globalDocuments,
        offerGroups: Array.isArray(action.payload.offerGroups)
          ? action.payload.offerGroups
          : state.offerGroups,
      };

    case "SET_ERRORS":
      return { ...state, errors: action.payload };

    case "SET_TAB_ERRORS":
      return { ...state, tabErrors: action.payload };

    case "SET_SAVING":
      return { ...state, isSaving: action.payload };

    case "SET_SUCCESS":
      return { ...state, success: action.payload };

    case "SET_ERROR_MESSAGE":
      return { ...state, errorMessage: action.payload, openErrorDialog: true };

    case "ADD_GLOBAL_ELEMENT":
      return {
        ...state,
        globalElements: [...state.globalElements, action.payload],
      };

    case "ADD_TASK":
      const updatedElementsWithTask = state.globalElements.map((element) =>
        element.id === action.payload.elementId
          ? {
              ...element,
              tasks: [...(element.tasks || []), ...action.payload.tasks],
            }
          : element
      );
      return {
        ...state,
        globalElements: updatedElementsWithTask,
      };

    case "ADD_GLOBAL_SPACE":
      return { ...state, globalSpaces: [...state.globalSpaces, action.payload] };

    case "EDIT_GLOBAL_SPACE":
      const editedGlobalSpaces = state.globalSpaces.map((space) =>
        space.id === action.payload.id ? action.payload : space
      );
      return {
        ...state,
        globalSpaces: editedGlobalSpaces,
      };

    case "DELETE_GLOBAL_SPACE":
      const remainingGlobalSpaces = state.globalSpaces.filter(
        (space) => space.id !== action.payload
      );
      return {
        ...state,
        globalSpaces: remainingGlobalSpaces,
      };

    case "SET_NEW_SPACE":
      return {
        ...state,
        newSpace: { ...state.newSpace, ...action.payload },
      };

    case "RESET_NEW_SPACE":
      return {
        ...state,
        newSpace: initialState.newSpace,
      };

    case "SET_NEW_ELEMENT":
      return {
        ...state,
        newElement: { ...state.newElement, ...action.payload },
      };

    case "RESET_NEW_ELEMENT":
      return {
        ...state,
        newElement: initialState.newElement,
      };

    case "UPDATE_GEBREKEN":
      return {
        ...state,
        newElement: {
          ...state.newElement,
          gebreken: {
            ...state.newElement.gebreken,
            [action.payload.category]: action.payload.gebrekenList,
          },
        },
      };

    case "ADD_GEBREK": {
      const { category, material, severityCategory, gebrekName } = action.payload;

      // Prevent adding duplicates
      const existingGebreken =
        state.newElement.gebreken[category]?.[material]?.[severityCategory] || [];
      if (existingGebreken.includes(gebrekName)) {
        console.warn(`Gebrek "${gebrekName}" is al toegevoegd onder ${severityCategory}.`);
        return state;
      }

      return {
        ...state,
        newElement: {
          ...state.newElement,
          gebreken: {
            ...state.newElement.gebreken,
            [category]: {
              ...state.newElement.gebreken[category],
              [material]: {
                ...state.newElement.gebreken[category]?.[material],
                [severityCategory]: [
                  ...(state.newElement.gebreken[category]?.[material]?.[severityCategory] || []),
                  gebrekName,
                ],
              },
            },
          },
        },
      };
    }

    case "REMOVE_GEBREK": {
      const {
        category: removeCategory,
        material: removeMaterial,
        severityCategory: removeSeverityCategory,
        gebrekName: removeGebrekName,
      } = action.payload;

      if (
        !state.newElement.gebreken[removeCategory] ||
        !state.newElement.gebreken[removeCategory][removeMaterial] ||
        !state.newElement.gebreken[removeCategory][removeMaterial][removeSeverityCategory]
      ) {
        console.warn(`Gebrek "${removeGebrekName}" niet gevonden onder ${removeSeverityCategory}.`);
        return state;
      }

      const updatedSeverityList = state.newElement.gebreken[removeCategory][removeMaterial][removeSeverityCategory].filter(
        (g) => g !== removeGebrekName
      );

      const updatedGebreken = {
        ...state.newElement.gebreken,
        [removeCategory]: {
          ...state.newElement.gebreken[removeCategory],
          [removeMaterial]: {
            ...state.newElement.gebreken[removeCategory][removeMaterial],
            [removeSeverityCategory]: updatedSeverityList,
          },
        },
      };

      // Clean up empty arrays and objects
      if (updatedSeverityList.length === 0) {
        delete updatedGebreken[removeCategory][removeMaterial][removeSeverityCategory];
      }

      if (Object.keys(updatedGebreken[removeCategory][removeMaterial] || {}).length === 0) {
        delete updatedGebreken[removeCategory][removeMaterial];
      }

      if (Object.keys(updatedGebreken[removeCategory] || {}).length === 0) {
        delete updatedGebreken[removeCategory];
      }

      return {
        ...state,
        newElement: {
          ...state.newElement,
          gebreken: updatedGebreken,
        },
      };
    }

    // **Nieuwe Acties voor Gebreken op Bestaande Elementen**

    // Actie om een gebrek toe te voegen aan een bestaand element
    case "ADD_GEBREK_TO_ELEMENT": {
      const { elementId, category, material, severityCategory, gebrekName } = action.payload;

      return {
        ...state,
        globalElements: state.globalElements.map((element) => {
          if (element.id === elementId) {
            const existingGebreken = element.gebreken?.[category]?.[material]?.[severityCategory] || [];
            if (existingGebreken.includes(gebrekName)) {
              console.warn(`Gebrek "${gebrekName}" is al toegevoegd onder ${severityCategory}.`);
              return element;
            }
            return {
              ...element,
              gebreken: {
                ...element.gebreken,
                [category]: {
                  ...element.gebreken?.[category],
                  [material]: {
                    ...element.gebreken?.[category]?.[material],
                    [severityCategory]: [
                      ...existingGebreken,
                      gebrekName,
                    ],
                  },
                },
              },
            };
          }
          return element;
        }),
      };
    }

    // Actie om een gebrek te verwijderen van een bestaand element
    case "REMOVE_GEBREK_FROM_ELEMENT": {
      const {
        elementId: removeElementId,
        category: removeCategory,
        material: removeMaterial,
        severityCategory: removeSeverityCategory,
        gebrekName: removeGebrekName,
      } = action.payload;

      return {
        ...state,
        globalElements: state.globalElements.map((element) => {
          if (element.id === removeElementId) {
            if (
              !element.gebreken?.[removeCategory]?.[removeMaterial]?.[removeSeverityCategory]
            ) {
              console.warn(`Gebrek "${removeGebrekName}" niet gevonden onder ${removeSeverityCategory}.`);
              return element;
            }

            const updatedSeverityList = element.gebreken[removeCategory][removeMaterial][removeSeverityCategory].filter(
              (g) => g !== removeGebrekName
            );

            // Clean up empty arrays and objects
            const updatedGebreken = { ...element.gebreken };

            if (updatedSeverityList.length === 0) {
              delete updatedGebreken[removeCategory][removeMaterial][removeSeverityCategory];
            } else {
              updatedGebreken[removeCategory][removeMaterial][removeSeverityCategory] = updatedSeverityList;
            }

            if (Object.keys(updatedGebreken[removeCategory][removeMaterial] || {}).length === 0) {
              delete updatedGebreken[removeCategory][removeMaterial];
            }

            if (Object.keys(updatedGebreken[removeCategory] || {}).length === 0) {
              delete updatedGebreken[removeCategory];
            }

            return {
              ...element,
              gebreken: updatedGebreken,
            };
          }
          return element;
        }),
      };
    }

    // ... overige cases

    default:
      return state;
  }
};

// Provider component
export const MjopProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, dispatch] = useReducer(mjopReducer, initialState);
  const [mjopId, setMjopId] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Logging functie
  const logAction = useCallback((action, data) => {
    console.log(
      `[${new Date().toISOString()}] ${action}:`,
      JSON.stringify(data, null, 2)
    );
  }, []);

  // Functie om data te initialiseren
  const initializeData = useCallback(
    async (id) => {
      try {
        const data = await fetchMJOPData(id);
        const payload = {
          generalInfo: data.generalInfo || initialState.generalInfo,
          cashInfo: data.cashInfo || initialState.cashInfo,
          mjop: data.mjop || initialState.mjop,
          globalElements: Array.isArray(data.globalElements)
            ? data.globalElements.map((element) => ({
                ...element,
                gebreken: element.gebreken || {},
                inspectionReport: Array.isArray(element.inspectionReport)
                  ? element.inspectionReport
                  : [
                      {
                        id: uuidv4(),
                        description: "",
                        inspectionDone: false,
                        inspectionDate: null,
                        tasks: [],
                      },
                    ],
              }))
            : [],
          globalSpaces: Array.isArray(data.globalSpaces) ? data.globalSpaces : [],
          globalDocuments: Array.isArray(data.globalDocuments)
            ? data.globalDocuments
            : [],
          offerGroups: Array.isArray(data.offerGroups) ? data.offerGroups : [],
        };
        dispatch({ type: "SET_DATA", payload });
        setIsDataLoaded(true);
      } catch (err) {
        console.error("[initializeData] Error fetching MJOP data:", err);
        dispatch({
          type: "SET_ERROR_MESSAGE",
          payload: "Error fetching data",
        });
      }
    },
    [dispatch]
  );

  // Effect om data te fetchen op basis van URL parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get("mjop-id");
    if (id && id !== mjopId) {
      setMjopId(id);
      initializeData(id);
    }
  }, [location.search, mjopId, initializeData]);

  // Functie voor validatie
  const handleValidation = useCallback(() => {
    const { newErrors, newTabErrors, isValid } = validate({
      generalInfo: state.generalInfo,
      cashInfo: state.cashInfo,
      totalWorth: state.cashInfo.totalWorth,
      globalElements: state.globalElements,
    });
    if (!isValid) {
      dispatch({ type: "SET_ERRORS", payload: newErrors });
      dispatch({ type: "SET_TAB_ERRORS", payload: newTabErrors });
    }
    return isValid;
  }, [state, dispatch]);

  // Optimized saveData functie met useCallback
  const saveData = useCallback(
    async (updatedGlobalElements, skipValidation = false) => {
      try {
        const formData = new FormData();
        formData.append("mjop", JSON.stringify(state.mjop));
        formData.append("generalInfo", JSON.stringify(state.generalInfo));
        formData.append("cashInfo", JSON.stringify(state.cashInfo));
        formData.append("globalElements", JSON.stringify(updatedGlobalElements));
        formData.append("globalSpaces", JSON.stringify(state.globalSpaces));
        formData.append("globalDocuments", JSON.stringify(state.globalDocuments));
        formData.append("offerGroups", JSON.stringify(state.offerGroups));

        // Voeg propertyImage toe als het een File object is (niet een string)
        if (
          state.generalInfo.propertyImage &&
          typeof state.generalInfo.propertyImage !== "string"
        ) {
          formData.append("propertyImage", state.generalInfo.propertyImage);
        }

        console.log("Preparing to save data with the following details:", {
          mjopId,
          generalInfo: state.generalInfo,
          cashInfo: state.cashInfo,
          globalElements: updatedGlobalElements,
          globalSpaces: state.globalSpaces,
          globalDocuments: state.globalDocuments,
          offerGroups: state.offerGroups,
        });

        const config = {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        };
        await saveMJOPData(mjopId, formData, config);

        dispatch({
          type: "SET_SUCCESS",
          payload: "Data successfully saved.",
        });
        console.log("Data successfully saved.");
      } catch (err) {
        console.error("Error saving data:", err);
        dispatch({
          type: "SET_ERRORS",
          payload: { general: "Error saving data. Please try again later." },
        });
      }
    },
    [state, mjopId, dispatch]
  );

  // Functie om formulier in te dienen
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      dispatch({ type: "SET_SAVING", payload: true });
      dispatch({ type: "SET_ERRORS", payload: {} });
      dispatch({ type: "SET_SUCCESS", payload: null });

      console.log("Form submission started with current state:", state);

      if (!handleValidation()) {
        console.warn("Validation failed, form will not be submitted.");
        dispatch({ type: "SET_SAVING", payload: false });
        dispatch({
          type: "SET_ERRORS",
          payload: { general: "There are validation errors that need to be resolved." },
        });
        return;
      }

      await saveData(state.globalElements, false);
      dispatch({ type: "SET_SAVING", payload: false });
    },
    [handleValidation, saveData, state, dispatch]
  );

  // Functie om offer groups in te stellen
  const setOfferGroups = useCallback(
    (offerGroups) => {
      logAction("Setting Offer Groups", offerGroups);
      dispatch({ type: "SET_DATA", payload: { offerGroups } });
    },
    [dispatch, logAction]
  );

  // Functie om global elements in te stellen
  const setGlobalElements = useCallback(
    (globalElements) => {
      const sanitizedElements = Array.isArray(globalElements)
        ? globalElements.map((element) => ({
            ...element,
            gebreken: element.gebreken || {},
            inspectionReport: Array.isArray(element.inspectionReport)
              ? element.inspectionReport
              : [
                  {
                    id: uuidv4(),
                    description: "",
                    inspectionDone: false,
                    inspectionDate: null,
                    tasks: [],
                  },
                ],
          }))
        : [];
      logAction("Setting Global Elements", sanitizedElements);
      dispatch({ type: "SET_DATA", payload: { globalElements: sanitizedElements } });
    },
    [dispatch, logAction]
  );

  // Functie om global spaces in te stellen
  const setGlobalSpaces = useCallback(
    (globalSpaces) => {
      logAction("Setting Global Spaces", globalSpaces);
      dispatch({ type: "SET_DATA", payload: { globalSpaces } });
    },
    [dispatch, logAction]
  );

  // Functie om nieuwe space velden in te stellen
  const setNewSpace = useCallback(
    (updatedFields) => {
      dispatch({ type: "SET_NEW_SPACE", payload: updatedFields });
    },
    [dispatch]
  );

  // Functie om nieuwe space velden te resetten
  const resetNewSpace = useCallback(() => {
    dispatch({ type: "RESET_NEW_SPACE" });
  }, [dispatch]);

  // Functie om nieuwe element velden in te stellen
  const setNewElementFields = useCallback(
    (updatedFields) => {
      dispatch({ type: "SET_NEW_ELEMENT", payload: updatedFields });
    },
    [dispatch]
  );

  // Functie om nieuwe element velden te resetten
  const resetNewElement = useCallback(() => {
    dispatch({ type: "RESET_NEW_ELEMENT" });
  }, [dispatch]);

  // Functie om general info in te stellen
  const setGeneralInfo = useCallback(
    (updatedFields) => {
      logAction("Setting General Info", updatedFields);
      dispatch({ type: "SET_GENERAL_INFO", payload: updatedFields });
    },
    [logAction, dispatch]
  );

  // Functie om een nieuwe space toe te voegen
  const handleAddSpace = useCallback(
    (space) => {
      const spaceWithId = { ...space, id: uuidv4() };
      logAction("Adding Space", { spaceWithId });
      dispatch({ type: "ADD_GLOBAL_SPACE", payload: spaceWithId });
    },
    [dispatch, logAction]
  );

  // Functie om een bestaande space te bewerken
  const handleEditSpace = useCallback(
    (space) => {
      logAction("Editing Space", { space });
      dispatch({ type: "EDIT_GLOBAL_SPACE", payload: space });
    },
    [dispatch, logAction]
  );

  // Functie om een space te verwijderen
  const handleDeleteSpace = useCallback(
    (id) => {
      logAction("Deleting Space", { id });
      dispatch({ type: "DELETE_GLOBAL_SPACE", payload: id });
    },
    [dispatch, logAction]
  );

  // Functie om een nieuw element toe te voegen
  const handleAddElement = useCallback(
    (element) => {
      const elementWithId = {
        ...element,
        id: uuidv4(),
        inspectionReport: Array.isArray(element.inspectionReport)
          ? element.inspectionReport
          : [
              {
                id: uuidv4(),
                description: "",
                inspectionDone: false,
                inspectionDate: null,
                tasks: [],
              },
            ],
      };
      logAction("Adding Element", { elementWithId });

      dispatch({ type: "ADD_GLOBAL_ELEMENT", payload: elementWithId });
      return elementWithId; // Retourneer het toegevoegde element
    },
    [dispatch, logAction]
  );

  // Functie om een bestaand element te bewerken
  const handleEditElement = useCallback(
    (element) => {
      logAction("Editing Element", { element });
      dispatch({
        type: "SET_DATA",
        payload: {
          globalElements: state.globalElements.map((el) =>
            el.id === element.id
              ? {
                  ...element,
                  gebreken: el.gebreken || {},
                  inspectionReport: Array.isArray(element.inspectionReport)
                    ? element.inspectionReport
                    : [
                        {
                          id: uuidv4(),
                          description: "",
                          inspectionDone: false,
                          inspectionDate: null,
                          tasks: [],
                        },
                      ],
                }
              : el
          ),
        },
      });
    },
    [dispatch, state.globalElements, logAction]
  );

  // Functie om een element te verwijderen
  const handleDeleteElement = useCallback(
    (id) => {
      logAction("Deleting Element", { id });
      dispatch({
        type: "SET_DATA",
        payload: {
          globalElements: state.globalElements.filter((el) => el.id !== id),
        },
      });
    },
    [dispatch, state.globalElements, logAction]
  );

  // Functie om een item toe te voegen aan planning
  const handleAddItemToPlanning = useCallback(
    (task, elementId) => {
      logAction("Adding Item to Planning", { task, elementId });

      dispatch({
        type: "ADD_TASK",
        payload: { elementId, tasks: [{ ...task, id: uuidv4() }] },
      });
    },
    [dispatch, logAction]
  );

  // Functie om een item te wijzigen
  const handleItemChange = useCallback(
    (taskId, field, value) => {
      logAction("Changing Item", { taskId, field, value });
      dispatch({
        type: "SET_DATA",
        payload: {
          globalElements: state.globalElements.map((element) => ({
            ...element,
            tasks: element.tasks?.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    [field]: value,
                  }
                : task
            ),
          })),
        },
      });
    },
    [dispatch, state.globalElements, logAction]
  );

  // Functie om een item te verwijderen
  const handleDeleteItem = useCallback(
    (taskId) => {
      logAction("Deleting Item", { taskId });
      dispatch({
        type: "SET_DATA",
        payload: {
          globalElements: state.globalElements.map((element) => ({
            ...element,
            tasks: element.tasks?.filter((task) => task.id !== taskId),
          })),
        },
      });
    },
    [dispatch, state.globalElements, logAction]
  );

  // Functie om een aangepast item toe te voegen
  const handleAddCustomItem = useCallback(
    (item) => {
      logAction("Adding Custom Item", { item });
      const generalElement = state.globalElements.find(
        (el) => el.name === "Algemeen" // Zorg ervoor dat de naam correct is
      );

      if (generalElement) {
        const updatedInspectionReports = generalElement.inspectionReport.map((report) => ({
          ...report,
          tasks: [
            ...report.tasks,
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
        }));

        dispatch({
          type: "SET_DATA",
          payload: {
            globalElements: state.globalElements.map((element) =>
              element.name === "Algemeen"
                ? { ...element, inspectionReport: updatedInspectionReports }
                : element
            ),
          },
        });
      } else {
        dispatch({
          type: "SET_DATA",
          payload: {
            globalElements: [
              ...state.globalElements,
              {
                id: uuidv4(),
                name: "Algemeen", // Zorg ervoor dat de naam correct is
                description: "",
                inspectionReport: [
                  {
                    id: uuidv4(),
                    description: "",
                    inspectionDone: false,
                    inspectionDate: null,
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
            ],
          },
        });
      }
    },
    [dispatch, state.globalElements, logAction]
  );

  // **Functies voor Gebreken met Ernst**

  // Functie om gebreken te updaten voor newElement
  const updateGebrekenFunc = useCallback(
    (category, gebrekenList) => {
      logAction("Updating Gebreken", { category, gebrekenList });
      dispatch({
        type: "UPDATE_GEBREKEN",
        payload: { category, gebrekenList },
      });
    },
    [dispatch, logAction]
  );

  // Functie om een specifiek gebrek toe te voegen aan newElement
  const addGebrekFunc = useCallback(
    (category, material, severityCategory, gebrekName) => {
      logAction("Adding Gebrek to newElement", { category, material, severityCategory, gebrekName });
      dispatch({
        type: "ADD_GEBREK",
        payload: { category, material, severityCategory, gebrekName },
      });
    },
    [dispatch, logAction]
  );

  // Functie om een specifiek gebrek te verwijderen van newElement
  const removeGebrekFunc = useCallback(
    (category, material, severityCategory, gebrekName) => {
      logAction("Removing Gebrek from newElement", { category, material, severityCategory, gebrekName });
      dispatch({
        type: "REMOVE_GEBREK",
        payload: { category, material, severityCategory, gebrekName },
      });
    },
    [dispatch, logAction]
  );

  // **Nieuwe Functies voor Gebreken op Bestaande Elementen**

  // Functie om een gebrek toe te voegen aan een bestaand element
  const addGebrekToElement = useCallback(
    (elementId, category, material, severityCategory, gebrekName) => {
      logAction("Adding Gebrek to Element", { elementId, category, material, severityCategory, gebrekName });
      dispatch({
        type: "ADD_GEBREK_TO_ELEMENT",
        payload: { elementId, category, material, severityCategory, gebrekName },
      });
    },
    [dispatch, logAction]
  );

  // Functie om een gebrek te verwijderen van een bestaand element
  const removeGebrekFromElement = useCallback(
    (elementId, category, material, severityCategory, gebrekName) => {
      logAction("Removing Gebrek from Element", { elementId, category, material, severityCategory, gebrekName });
      dispatch({
        type: "REMOVE_GEBREK_FROM_ELEMENT",
        payload: { elementId, category, material, severityCategory, gebrekName },
      });
    },
    [dispatch, logAction]
  );

  // Functie om errors in te stellen
  const setErrorsFunc = useCallback(
    (errors) => {
      dispatch({ type: "SET_ERRORS", payload: errors });
    },
    [dispatch]
  );

  // Functie om een succesbericht in te stellen
  const setSuccessMessageFunc = useCallback(
    (message) => {
      dispatch({ type: "SET_SUCCESS", payload: message });
    },
    [dispatch]
  );

  // Memoize de context waarde om onnodige re-renders te voorkomen
  const contextValue = useMemo(
    () => ({
      state,
      dispatch,
      saveData, // Accepteert updatedGlobalElements als parameter
      calculateCurrentCash,
      getSaldoColor,
      setOfferGroups,
      setGlobalElements,
      setGeneralInfo,
      setGlobalSpaces,
      handleAddSpace,
      handleEditSpace,
      handleDeleteSpace,
      handleValidation,
      handleSubmit,
      handleAddElement,
      handleEditElement,
      handleDeleteElement,
      handleAddItemToPlanning,
      handleItemChange,
      handleDeleteItem,
      handleAddCustomItem,
      setNewSpace,
      resetNewSpace,
      setNewElement: setNewElementFields,
      resetNewElement,
      updateGebreken: updateGebrekenFunc,
      addGebrek: addGebrekFunc,
      removeGebrek: removeGebrekFunc,
      // **Nieuwe Gebreken Functies voor Bestaande Elementen**
      addGebrekToElement,
      removeGebrekFromElement,
      setErrors: setErrorsFunc, // Inclusief setErrors
      setSuccessMessage: setSuccessMessageFunc, // Inclusief setSuccessMessage
    }),
    [
      state,
      dispatch,
      saveData,
      calculateCurrentCash,
      getSaldoColor,
      setOfferGroups,
      setGlobalElements,
      setGeneralInfo,
      setGlobalSpaces,
      handleAddSpace,
      handleEditSpace,
      handleDeleteSpace,
      handleValidation,
      handleSubmit,
      handleAddElement,
      handleEditElement,
      handleDeleteElement,
      handleAddItemToPlanning,
      handleItemChange,
      handleDeleteItem,
      handleAddCustomItem,
      setNewSpace,
      resetNewSpace,
      setNewElementFields,
      resetNewElement,
      updateGebrekenFunc,
      addGebrekFunc,
      removeGebrekFunc,
      addGebrekToElement,
      removeGebrekFromElement,
      setErrorsFunc,
      setSuccessMessageFunc,
    ]
  );

  return (
    <MjopContext.Provider value={contextValue}>{children}</MjopContext.Provider>
  );
};
