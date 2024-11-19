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
    id: "",
    name: "",
    description: "",
    inspectionDate: null,
    interval: "",
    documents: [],
    photos: [],
    spaceId: "",
    type: "",
    material: "",
    customMaterial: "",
    gebreken: {},
    levensduur: "",
    aanschafDatum: null,
    vervangingsKosten: "",
    annotations: [],
    unitType: "",
    quantity: "",
    prices: {
      prijs_per_vierkante_meter: 0,
      prijs_per_strekkende_meter: 0,
      prijs_per_stuk: 0,
    },
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
        globalElements: action.payload.globalElements || state.globalElements,
        globalSpaces: action.payload.globalSpaces || state.globalSpaces,
        globalDocuments: action.payload.globalDocuments || state.globalDocuments,
        offerGroups: action.payload.offerGroups || state.offerGroups,
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

    case "EDIT_GLOBAL_ELEMENT":
      return {
        ...state,
        globalElements: state.globalElements.map((element) =>
          element.id === action.payload.id ? action.payload : element
        ),
      };

    case "DELETE_GLOBAL_ELEMENT":
      return {
        ...state,
        globalElements: state.globalElements.filter(
          (element) => element.id !== action.payload
        ),
      };

    case "ADD_GLOBAL_SPACE":
      return { ...state, globalSpaces: [...state.globalSpaces, action.payload] };

    case "EDIT_GLOBAL_SPACE":
      return {
        ...state,
        globalSpaces: state.globalSpaces.map((space) =>
          space.id === action.payload.id ? action.payload : space
        ),
      };

    case "DELETE_GLOBAL_SPACE":
      return {
        ...state,
        globalSpaces: state.globalSpaces.filter(
          (space) => space.id !== action.payload
        ),
      };

    case "SET_NEW_SPACE":
      return {
        ...state,
        newSpace: { ...state.newSpace, ...action.payload },
      };

    case "RESET_NEW_SPACE":
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

  const logAction = useCallback((action, data) => {
    console.log(
      `[${new Date().toISOString()}] ${action}:`,
      JSON.stringify(data, null, 2)
    );
  }, []);

  const setOfferGroups = useCallback(
    (offerGroups) => {
      logAction("Setting Offer Groups", offerGroups);
      dispatch({ type: "SET_DATA", payload: { offerGroups } });
    },
    [logAction]
  );

  const setGlobalElements = useCallback(
    (globalElements) => {
      logAction("Setting Global Elements", globalElements);
      dispatch({ type: "SET_DATA", payload: { globalElements } });
    },
    [logAction]
  );

  const setGlobalSpaces = useCallback(
    (globalSpaces) => {
      logAction("Setting Global Spaces", globalSpaces);
      dispatch({ type: "SET_DATA", payload: { globalSpaces } });
    },
    [logAction]
  );

  const setNewSpace = useCallback(
    (updatedFields) => {
      dispatch({ type: "SET_NEW_SPACE", payload: updatedFields });
    },
    []
  );

  const resetNewSpace = useCallback(() => {
    dispatch({ type: "RESET_NEW_SPACE" });
  }, []);

  const setGeneralInfo = useCallback(
    (updatedFields) => {
      logAction("Setting General Info", updatedFields);
      dispatch({ type: "SET_GENERAL_INFO", payload: updatedFields });
    },
    [logAction]
  );

  const initializeData = useCallback(
    async (id) => {
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

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get("mjop-id");
    if (id && id !== mjopId) {
      setMjopId(id);
      initializeData(id);
    }
  }, [location.search, mjopId, initializeData]);

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
        formData.append(
          "globalElements",
          JSON.stringify(state.globalElements)
        );
        formData.append("globalSpaces", JSON.stringify(state.globalSpaces));
        formData.append(
          "globalDocuments",
          JSON.stringify(state.globalDocuments)
        );
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

        dispatch({
          type: "SET_SUCCESS",
          payload: "Data saved successfully.",
        });
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

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      dispatch({ type: "SET_SAVING", payload: true });
      dispatch({ type: "SET_ERRORS", payload: {} });
      dispatch({ type: "SET_SUCCESS", payload: null });

      if (!handleValidation()) {
        console.warn("Validation failed, preventing form submission.");
        dispatch({ type: "SET_SAVING", payload: false });
        dispatch({
          type: "SET_ERRORS",
          payload: { general: "Validation errors need to be resolved." },
        });
        return;
      }

      await saveData(false);
    },
    [handleValidation, saveData]
  );

  const handleAddSpace = useCallback(
    (space) => {
      const spaceWithId = { ...space, id: uuidv4() };
      logAction("Handle add space", { spaceWithId });
      dispatch({ type: "ADD_GLOBAL_SPACE", payload: spaceWithId });
    },
    [dispatch, logAction]
  );

  const handleEditSpace = useCallback(
    (space) => {
      logAction("Handle edit space", { space });
      dispatch({ type: "EDIT_GLOBAL_SPACE", payload: space });
    },
    [dispatch, logAction]
  );

  const handleDeleteSpace = useCallback(
    (id) => {
      logAction("Handle delete space", { id });
      dispatch({ type: "DELETE_GLOBAL_SPACE", payload: id });
    },
    [dispatch, logAction]
  );

  const handleAddElement = useCallback(
    async (element) => {
      const elementWithId = { ...element, id: uuidv4() };
      logAction("Handle add element", { elementWithId });

      dispatch({ type: "ADD_GLOBAL_ELEMENT", payload: elementWithId });
      await saveData(true);
    },
    [dispatch, logAction, saveData]
  );

  const handleEditElement = useCallback(
    (element) => {
      logAction("Handle edit element", { element });
      dispatch({
        type: "EDIT_GLOBAL_ELEMENT",
        payload: element,
      });
    },
    [logAction, dispatch]
  );

  const handleDeleteElement = useCallback(
    (id) => {
      logAction("Handle delete element", { id });
      dispatch({
        type: "DELETE_GLOBAL_ELEMENT",
        payload: id,
      });
    },
    [logAction, dispatch]
  );

  // ... (rest of your code remains unchanged)

  const contextValue = useMemo(
    () => ({
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
      setNewSpace,
      resetNewSpace,
    }),
    [
      state,
      dispatch,
      saveData,
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
      setNewSpace,
      resetNewSpace,
    ]
  );

  return (
    <MjopContext.Provider value={contextValue}>{children}</MjopContext.Provider>
  );
};
