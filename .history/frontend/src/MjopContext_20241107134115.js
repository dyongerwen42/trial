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
      console.log("Reducer - Setting General Info:", action.payload);
      return {
        ...state,
        generalInfo: { ...state.generalInfo, ...action.payload },
      };

    case "SET_DATA":
      console.log("Reducer - Setting Data:", action.payload);
      const newStateWithData = {
        ...state,
        generalInfo: action.payload.generalInfo || state.generalInfo,
        cashInfo: action.payload.cashInfo || state.cashInfo,
        mjop: action.payload.mjop || state.mjop,
        globalElements: action.payload.globalElements || state.globalElements,
        globalSpaces: action.payload.globalSpaces || state.globalSpaces,
        globalDocuments: action.payload.globalDocuments || state.globalDocuments,
        offerGroups: action.payload.offerGroups || state.offerGroups,
      };
      console.log("Updated State with SET_DATA:", newStateWithData);
      return newStateWithData;

    case "SET_ERRORS":
      console.log("Reducer - Setting Errors:", action.payload);
      return { ...state, errors: action.payload };

    case "SET_TAB_ERRORS":
      console.log("Reducer - Setting Tab Errors:", action.payload);
      return { ...state, tabErrors: action.payload };

    case "SET_SAVING":
      console.log("Reducer - Setting Saving Status:", action.payload);
      return { ...state, isSaving: action.payload };

    case "SET_SUCCESS":
      console.log("Reducer - Setting Success:", action.payload);
      return { ...state, success: action.payload };

    case "SET_ERROR_MESSAGE":
      console.log("Reducer - Setting Error Message:", action.payload);
      return { ...state, errorMessage: action.payload, openErrorDialog: true };

    case "ADD_GLOBAL_ELEMENT":
      console.log("Reducer - Adding Global Element:", action.payload);
      const updatedGlobalElements = [...state.globalElements, action.payload];
      console.log("Updated Global Elements Array after ADD_GLOBAL_ELEMENT:", updatedGlobalElements);
      return {
        ...state,
        globalElements: updatedGlobalElements,
      };

    case "ADD_TASK":
      console.log("Reducer - Adding Task:", action.payload);
      const updatedElementsWithTask = state.globalElements.map((element) =>
        element.id === action.payload.elementId
          ? {
              ...element,
              tasks: [...(element.tasks || []), ...action.payload.tasks],
            }
          : element
      );
      console.log("Updated Global Elements Array after ADD_TASK:", updatedElementsWithTask);
      return {
        ...state,
        globalElements: updatedElementsWithTask,
      };

    case "ADD_GLOBAL_SPACE":
      const updatedGlobalSpaces = [...state.globalSpaces, action.payload];
      console.log("Reducer - Adding Global Space:", action.payload);
      console.log("Updated Global Spaces Array after ADD_GLOBAL_SPACE:", updatedGlobalSpaces);
      return { ...state, globalSpaces: updatedGlobalSpaces };

    case "EDIT_GLOBAL_SPACE":
      console.log("Reducer - Editing Global Space:", action.payload);
      const editedGlobalSpaces = state.globalSpaces.map((space) =>
        space.id === action.payload.id ? action.payload : space
      );
      console.log("Updated Global Spaces Array after EDIT_GLOBAL_SPACE:", editedGlobalSpaces);
      return {
        ...state,
        globalSpaces: editedGlobalSpaces,
      };

    case "DELETE_GLOBAL_SPACE":
      console.log("Reducer - Deleting Global Space:", action.payload);
      const remainingGlobalSpaces = state.globalSpaces.filter(
        (space) => space.id !== action.payload
      );
      console.log("Updated Global Spaces Array after DELETE_GLOBAL_SPACE:", remainingGlobalSpaces);
      return {
        ...state,
        globalSpaces: remainingGlobalSpaces,
      };

    case "SET_NEW_SPACE":
      console.log("Reducer - Setting New Space:", action.payload);
      return {
        ...state,
        newSpace: { ...state.newSpace, ...action.payload },
      };

    case "RESET_NEW_SPACE":
      console.log("Reducer - Resetting New Space");
      return {
        ...state,
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
  const [pendingSave, setPendingSave] = useState(false);

  const logAction = useCallback((action, data) => {
    console.log(
      `[${new Date().toISOString()}] ${action}:`,
      JSON.stringify(data, null, 2)
    );
  }, []);

  const handleAddElement = useCallback(
    (element) => {
      const elementWithId = { ...element, id: uuidv4() };
      logAction("Handle add element", { elementWithId });

      dispatch({ type: "ADD_GLOBAL_ELEMENT", payload: elementWithId });
      setPendingSave(true);
    },
    [dispatch, logAction]
  );

  useEffect(() => {
    if (pendingSave) {
      saveData(true);
      setPendingSave(false);
    }
  }, [state.globalElements]);

  const saveData = useCallback(
    async (skipValidation = false) => {
      if (!skipValidation && !handleValidation()) {
        console.warn("Validation failed, data will not be saved.");
        return;
      }

      try {
        const formData = new FormData();
        formData.append("mjop", JSON.stringify(state.mjop));
        formData.append("generalInfo", JSON.stringify(state.generalInfo));
        formData.append("cashInfo", JSON.stringify(state.cashInfo));
        formData.append("globalElements", JSON.stringify(state.globalElements));
        formData.append("globalSpaces", JSON.stringify(state.globalSpaces));
        formData.append("globalDocuments", JSON.stringify(state.globalDocuments));
        formData.append("offerGroups", JSON.stringify(state.offerGroups));

        if (
          state.generalInfo.propertyImage &&
          typeof state.generalInfo.propertyImage !== "string"
        ) {
          formData.append("propertyImage", state.generalInfo.propertyImage);
        }

        const config = {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        };
        await saveMJOPData(mjopId, formData, config);

        dispatch({ type: "SET_SUCCESS", payload: "Data saved successfully." });
        console.log("Data saved successfully.");
      } catch (err) {
        console.error("Error saving data:", err);
        dispatch({
          type: "SET_ERRORS",
          payload: { general: "Error saving data. Please try again later." },
        });
      }
    },
    [state, mjopId, handleValidation]
  );

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
  }, [state]);

  const initializeData = useCallback(
    async (id) => {
      if (isDataLoaded) return;
      try {
        const data = await fetchMJOPData(id);
        const payload = {
          generalInfo: data.generalInfo || initialState.generalInfo,
          cashInfo: data.cashInfo || initialState.cashInfo,
          mjop: data.mjop || initialState.mjop,
          globalElements: Array.isArray(data.globalElements)
            ? data.globalElements
            : [],
          globalSpaces: Array.isArray(data.globalSpaces)
            ? data.globalSpaces
            : [],
          globalDocuments: Array.isArray(data.globalDocuments)
            ? data.globalDocuments
            : [],
          offerGroups: Array.isArray(data.offerGroups) ? data.offerGroups : [],
        };
        dispatch({ type: "SET_DATA", payload });
        setIsDataLoaded(true);
      } catch (err) {
        console.error("[initializeData] Error fetching MJOP data:", err);
        dispatch({ type: "SET_ERROR_MESSAGE", payload: "Error fetching data" });
      }
    },
    [dispatch, isDataLoaded]
  );

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get("mjop-id");
    if (id && id !== mjopId) {
      setIsDataLoaded(false);
      setMjopId(id);
      initializeData(id);
    }
  }, [location.search, mjopId, initializeData]);

  const contextValue = useMemo(
    () => ({
      state,
      dispatch,
      saveData,
      calculateCurrentCash,
      getSaldoColor,
      handleAddElement,
      /* ... other handlers as needed ... */
    }),
    [state, dispatch, saveData, calculateCurrentCash, getSaldoColor, handleAddElement]
  );

  return (
    <MjopContext.Provider value={contextValue}>{children}</MjopContext.Provider>
  );
};