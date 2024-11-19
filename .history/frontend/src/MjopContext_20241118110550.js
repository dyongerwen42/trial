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

const MjopContext = createContext();

export const useMjopContext = () => useContext(MjopContext);

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
    gebreken: {}, // Added for gebreken with severity
    inspectionReport: [
      {
        id: uuidv4(),
        description: "",
        inspectionDone: false,
        inspectionDate: null,
        tasks: [],
      },
    ],
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
              inspectionReport: element.inspectionReport || [
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

    case "ADD_GEBREK":
      const { category, material, severityCategory, gebrekName } = action.payload;
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

    case "REMOVE_GEBREK":
      const {
        category: removeCategory,
        material: removeMaterial,
        severityCategory: removeSeverity,
        gebrekName: removeGebrekName,
      } = action.payload;
      return {
        ...state,
        newElement: {
          ...state.newElement,
          gebreken: {
            ...state.newElement.gebreken,
            [removeCategory]: {
              ...state.newElement.gebreken[removeCategory],
              [removeMaterial]: {
                ...state.newElement.gebreken[removeCategory]?.[removeMaterial],
                [removeSeverity]: state.newElement.gebreken[removeCategory]?.[removeMaterial]?.[
                  removeSeverity
                ].filter((g) => g !== removeGebrekName),
              },
            },
          },
        },
      };

    default:
      return state;
  }
};

export const MjopProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, dispatch] = useReducer(mjopReducer, initialState);
  const [mjopId, setMjopId] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Logging function
  const logAction = useCallback((action, data) => {
    console.log(
      `[${new Date().toISOString()}] ${action}:`,
      JSON.stringify(data, null, 2)
    );
  }, []);

  // Function to initialize data
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
                inspectionReport: element.inspectionReport || [
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

  // Effect to fetch data based on URL parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get("mjop-id");
    if (id && id !== mjopId) {
      setMjopId(id);
      initializeData(id);
    }
  }, [location.search, mjopId, initializeData]);

  // Function to handle validation
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

  // Optimized saveData function using useCallback
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

        // Append propertyImage if it's a File object (not a string)
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

  // Function to handle form submission
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

  // Function to set offer groups
  const setOfferGroups = useCallback(
    (offerGroups) => {
      logAction("Setting Offer Groups", offerGroups);
      dispatch({ type: "SET_DATA", payload: { offerGroups } });
    },
    [dispatch, logAction]
  );

  // Function to set global elements
  const setGlobalElements = useCallback(
    (globalElements) => {
      const sanitizedElements = Array.isArray(globalElements)
        ? globalElements.map((element) => ({
            ...element,
            gebreken: element.gebreken || {},
            inspectionReport: element.inspectionReport || [
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

  // Function to set global spaces
  const setGlobalSpaces = useCallback(
    (globalSpaces) => {
      logAction("Setting Global Spaces", globalSpaces);
      dispatch({ type: "SET_DATA", payload: { globalSpaces } });
    },
    [dispatch, logAction]
  );

  // Function to set new space fields
  const setNewSpace = useCallback(
    (updatedFields) => {
      dispatch({ type: "SET_NEW_SPACE", payload: updatedFields });
    },
    [dispatch]
  );

  // Function to reset new space fields
  const resetNewSpace = useCallback(() => {
    dispatch({ type: "RESET_NEW_SPACE" });
  }, [dispatch]);

  // Function to set new element fields
  const setNewElement = useCallback(
    (updatedFields) => {
      dispatch({ type: "SET_NEW_ELEMENT", payload: updatedFields });
    },
    [dispatch]
  );

  // Function to reset new element fields
  const resetNewElement = useCallback(() => {
    dispatch({ type: "RESET_NEW_ELEMENT" });
  }, [dispatch]);

  // Function to set general info
  const setGeneralInfo = useCallback(
    (updatedFields) => {
      logAction("Setting General Info", updatedFields);
      dispatch({ type: "SET_GENERAL_INFO", payload: updatedFields });
    },
    [logAction, dispatch]
  );

  // Function to add a new space
  const handleAddSpace = useCallback(
    (space) => {
      const spaceWithId = { ...space, id: uuidv4() };
      logAction("Adding Space", { spaceWithId });
      dispatch({ type: "ADD_GLOBAL_SPACE", payload: spaceWithId });
    },
    [dispatch, logAction]
  );

  // Function to edit an existing space
  const handleEditSpace = useCallback(
    (space) => {
      logAction("Editing Space", { space });
      dispatch({ type: "EDIT_GLOBAL_SPACE", payload: space });
    },
    [dispatch, logAction]
  );

  // Function to delete a space
  const handleDeleteSpace = useCallback(
    (id) => {
      logAction("Deleting Space", { id });
      dispatch({ type: "DELETE_GLOBAL_SPACE", payload: id });
    },
    [dispatch, logAction]
  );

  // Function to add a new element
  const handleAddElement = useCallback(
    (element) => {
      const elementWithId = {
        ...element,
        id: uuidv4(),
        inspectionReport: element.inspectionReport || [
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
      return elementWithId; // Return the added element
    },
    [dispatch, logAction]
  );

  // Function to edit an existing element
  const handleEditElement = useCallback(
    (element) => {
      logAction("Editing Element", { element });
      dispatch({
        type: "SET_DATA",
        payload: {
          globalElements: state.globalElements.map((el) =>
            el.id === element.id ? { ...element, inspectionReport: el.inspectionReport || [] } : el
          ),
        },
      });
    },
    [dispatch, state.globalElements, logAction]
  );

  // Function to delete an element
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

  // Function to add an item to planning
  const handleAddItemToPlanning = useCallback(
    (task, elementId) => {
      logAction("Adding Item to Planning", { task, elementId });

      dispatch({
        type: "SET_DATA",
        payload: {
          globalElements: state.globalElements.map((element) => {
            if (element.id === elementId) {
              return {
                ...element,
                tasks: [
                  ...(element.tasks || []),
                  {
                    ...task,
                    id: uuidv4(), // Add a unique ID to the task
                  },
                ],
              };
            }
            return element;
          }),
        },
      });
    },
    [dispatch, state.globalElements, logAction]
  );

  // Function to handle changes in an item
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

  // Function to delete an item
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

  // Function to add a custom item
  const handleAddCustomItem = useCallback(
    (item) => {
      logAction("Adding Custom Item", { item });
      const generalElement = state.globalElements.find(
        (el) => el.name === "Algemeen" // Correct name
      );

      if (generalElement) {
        dispatch({
          type: "SET_DATA",
          payload: {
            globalElements: state.globalElements.map((element) =>
              element.name === "Algemeen" // Correct name
                ? {
                    ...element,
                    inspectionReport: [
                      {
                        id: uuidv4(),
                        element: "Algemeen",
                        description: "",
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
                  }
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
                name: "Algemeen", // Correct name
                description: "",
                inspectionReport: [
                  {
                    id: uuidv4(),
                    element: "Algemeen",
                    description: "",
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

  // **Functions for Gebreken with Severity**

  // Function to update gebreken via UPDATE_GEBREKEN
  const updateGebreken = useCallback(
    (category, gebrekenList) => {
      logAction("Updating Gebreken", { category, gebrekenList });
      dispatch({
        type: "UPDATE_GEBREKEN",
        payload: { category, gebrekenList },
      });
    },
    [dispatch, logAction]
  );

  // Function to add a specific gebrek
  const addGebrek = useCallback(
    (category, material, severityCategory, gebrekName) => {
      logAction("Adding Gebrek", { category, material, severityCategory, gebrekName });
      dispatch({
        type: "ADD_GEBREK",
        payload: { category, material, severityCategory, gebrekName },
      });
    },
    [dispatch, logAction]
  );

  // Function to remove a specific gebrek
  const removeGebrek = useCallback(
    (category, material, severityCategory, gebrekName) => {
      logAction("Removing Gebrek", { category, material, severityCategory, gebrekName });
      dispatch({
        type: "REMOVE_GEBREK",
        payload: { category, material, severityCategory, gebrekName },
      });
    },
    [dispatch, logAction]
  );

  // Function to set errors
  const setErrors = useCallback(
    (errors) => {
      dispatch({ type: "SET_ERRORS", payload: errors });
    },
    [dispatch]
  );

  // Function to set success message
  const setSuccessMessage = useCallback(
    (message) => {
      dispatch({ type: "SET_SUCCESS", payload: message });
    },
    [dispatch]
  );

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      state,
      dispatch,
      saveData, // Accepts updatedGlobalElements as a parameter
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
      setNewElement,
      resetNewElement,
      updateGebreken,
      addGebrek,
      removeGebrek,
      setErrors, // Included setErrors
      setSuccessMessage, // Included setSuccessMessage
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
      setNewElement,
      resetNewElement,
      updateGebreken,
      addGebrek,
      removeGebrek,
      setErrors,
      setSuccessMessage,
    ]
  );

  return (
    <MjopContext.Provider value={contextValue}>{children}</MjopContext.Provider>
  );
};
