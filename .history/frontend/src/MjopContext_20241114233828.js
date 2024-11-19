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
    unitType: "",
    quantity: "",
    prices: {
      prijs_per_vierkante_meter: 0,
      prijs_per_strekkende_meter: 0,
      prijs_per_stuk: 0,
    },
    gebreken: {}, // Toegevoegd voor gebreken met ernst
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
      console.log(
        "Updated Global Elements Array after ADD_GLOBAL_ELEMENT:",
        updatedGlobalElements
      );
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
      console.log(
        "Updated Global Elements Array after ADD_TASK:",
        updatedElementsWithTask
      );
      return {
        ...state,
        globalElements: updatedElementsWithTask,
      };

    case "ADD_GLOBAL_SPACE":
      const updatedGlobalSpaces = [...state.globalSpaces, action.payload];
      console.log("Reducer - Adding Global Space:", action.payload);
      console.log(
        "Updated Global Spaces Array after ADD_GLOBAL_SPACE:",
        updatedGlobalSpaces
      );
      return { ...state, globalSpaces: updatedGlobalSpaces };

    case "EDIT_GLOBAL_SPACE":
      console.log("Reducer - Editing Global Space:", action.payload);
      const editedGlobalSpaces = state.globalSpaces.map((space) =>
        space.id === action.payload.id ? action.payload : space
      );
      console.log(
        "Updated Global Spaces Array after EDIT_GLOBAL_SPACE:",
        editedGlobalSpaces
      );
      return {
        ...state,
        globalSpaces: editedGlobalSpaces,
      };

    case "DELETE_GLOBAL_SPACE":
      console.log("Reducer - Deleting Global Space:", action.payload);
      const remainingGlobalSpaces = state.globalSpaces.filter(
        (space) => space.id !== action.payload
      );
      console.log(
        "Updated Global Spaces Array after DELETE_GLOBAL_SPACE:",
        remainingGlobalSpaces
      );
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

    case "SET_NEW_ELEMENT":
      console.log("Reducer - Setting New Element:", action.payload);
      return {
        ...state,
        newElement: { ...state.newElement, ...action.payload },
      };

    case "RESET_NEW_ELEMENT":
      console.log("Reducer - Resetting New Element");
      return {
        ...state,
        newElement: {
          name: "",
          description: "",
          inspectionDate: null,
          interval: "",
          documents: [],
          photos: [],
          spaceId: "",
          unitType: "",
          quantity: "",
          prices: {
            prijs_per_vierkante_meter: 0,
            prijs_per_strekkende_meter: 0,
            prijs_per_stuk: 0,
          },
          gebreken: {}, // Reset gebreken ook
        },
      };

    case "UPDATE_GEBREKEN":
      console.log("Reducer - Updating Gebreken:", action.payload);
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
      console.log("Reducer - Adding Gebrek:", action.payload);
      const { category, gebrek } = action.payload;
      return {
        ...state,
        newElement: {
          ...state.newElement,
          gebreken: {
            ...state.newElement.gebreken,
            [category]: [
              ...(state.newElement.gebreken[category] || []),
              { name: gebrek.name, severity: gebrek.severity },
            ],
          },
        },
      };

    case "REMOVE_GEBREK":
      console.log("Reducer - Removing Gebrek:", action.payload);
      const { category: removeCategory, gebrekName } = action.payload;
      return {
        ...state,
        newElement: {
          ...state.newElement,
          gebreken: {
            ...state.newElement.gebreken,
            [removeCategory]: state.newElement.gebreken[removeCategory].filter(
              (g) => g.name !== gebrekName
            ),
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
    [logAction, dispatch]
  );

  const setGlobalElements = useCallback(
    (globalElements) => {
      logAction("Setting Global Elements", globalElements);
      dispatch({ type: "SET_DATA", payload: { globalElements } });
    },
    [logAction, dispatch]
  );

  const setGlobalSpaces = useCallback(
    (globalSpaces) => {
      logAction("Setting Global Spaces", globalSpaces);
      dispatch({ type: "SET_DATA", payload: { globalSpaces } });
    },
    [logAction, dispatch]
  );

  const setNewSpace = useCallback(
    (updatedFields) => {
      dispatch({ type: "SET_NEW_SPACE", payload: updatedFields });
    },
    [dispatch]
  );

  const resetNewSpace = useCallback(() => {
    dispatch({ type: "RESET_NEW_SPACE" });
  }, [dispatch]);

  // Toegevoegd om newElement te kunnen beheren
  const setNewElement = useCallback(
    (updatedFields) => {
      dispatch({ type: "SET_NEW_ELEMENT", payload: updatedFields });
    },
    [dispatch]
  );

  const resetNewElement = useCallback(() => {
    dispatch({ type: "RESET_NEW_ELEMENT" });
  }, [dispatch]);

  const setGeneralInfo = useCallback(
    (updatedFields) => {
      logAction("Setting General Info", updatedFields);
      dispatch({ type: "SET_GENERAL_INFO", payload: updatedFields });
    },
    [logAction, dispatch]
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

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get("mjop-id");
    if (id && id !== mjopId) {
      setMjopId(id);
      initializeData(id); // Haal data op wanneer mjopId verandert
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
      // Sla validatie over indien gespecificeerd (voor het direct toevoegen van elementen)
      if (!skipValidation && !handleValidation()) {
        console.warn("Validatie mislukt, data wordt niet opgeslagen.");
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

        // Log data voordat deze naar de backend wordt verzonden
        console.log("Voorbereiden om data op te slaan met de volgende details:", {
          mjopId,
          generalInfo: state.generalInfo,
          cashInfo: state.cashInfo,
          globalElements: state.globalElements,
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
          payload: "Data succesvol opgeslagen.",
        });
        console.log("Data succesvol opgeslagen.");
      } catch (err) {
        console.error("Fout bij het opslaan van data:", err);
        dispatch({
          type: "SET_ERRORS",
          payload: { general: "Fout bij het opslaan van data. Probeer later opnieuw." },
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

      console.log("Formulier inzending gestart met huidige staat:", state);

      if (!handleValidation()) {
        console.warn("Validatie mislukt, formulier wordt niet verzonden.");
        dispatch({ type: "SET_SAVING", payload: false });
        dispatch({
          type: "SET_ERRORS",
          payload: { general: "Er zijn validatiefouten die moeten worden opgelost." },
        });
        return;
      }

      await saveData(false);
      dispatch({ type: "SET_SAVING", payload: false });
    },
    [handleValidation, saveData, state]
  );

  const handleAddSpace = useCallback(
    (space) => {
      const spaceWithId = { ...space, id: uuidv4() };
      logAction("Ruimte toevoegen", { spaceWithId });
      dispatch({ type: "ADD_GLOBAL_SPACE", payload: spaceWithId });
    },
    [dispatch, logAction]
  );

  const handleEditSpace = useCallback(
    (space) => {
      logAction("Ruimte bewerken", { space });
      dispatch({ type: "EDIT_GLOBAL_SPACE", payload: space });
    },
    [dispatch, logAction]
  );

  const handleDeleteSpace = useCallback(
    (id) => {
      logAction("Ruimte verwijderen", { id });
      dispatch({ type: "DELETE_GLOBAL_SPACE", payload: id });
    },
    [dispatch, logAction]
  );

  const handleAddElement = useCallback(
    async (element) => {
      const elementWithId = { ...element, id: uuidv4() };
      logAction("Element toevoegen", { elementWithId });

      dispatch({ type: "ADD_GLOBAL_ELEMENT", payload: elementWithId });
      await saveData(true); // Geef `true` door om validatie over te slaan indien nodig
    },
    [dispatch, logAction, saveData]
  );

  const handleEditElement = useCallback(
    (element) => {
      logAction("Element bewerken", { element });
      dispatch({
        type: "SET_DATA",
        payload: {
          globalElements: state.globalElements.map((el) =>
            el.id === element.id ? element : el
          ),
        },
      });
    },
    [state.globalElements, logAction, dispatch]
  );

  const handleDeleteElement = useCallback(
    (id) => {
      logAction("Element verwijderen", { id });
      dispatch({
        type: "SET_DATA",
        payload: {
          globalElements: state.globalElements.filter((el) => el.id !== id),
        },
      });
    },
    [state.globalElements, logAction, dispatch]
  );

  const handleAddItemToPlanning = useCallback(
    (task, elementId) => {
      logAction("Item toevoegen aan planning", { task, elementId });
      dispatch({
        type: "SET_DATA",
        payload: {
          globalElements: state.globalElements.map((element) => {
            if (element.id === elementId) {
              return {
                ...element,
                tasks: [...(element.tasks || []), task],
              };
            }
            return element;
          }),
        },
      });
    },
    [state.globalElements, logAction, dispatch]
  );

  const handleItemChange = useCallback(
    (taskId, field, value) => {
      logAction("Item wijzigen", { taskId, field, value });
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
    [state.globalElements, logAction, dispatch]
  );

  const handleDeleteItem = useCallback(
    (taskId) => {
      logAction("Item verwijderen", { taskId });
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
    [state.globalElements, logAction, dispatch]
  );

  const handleAddCustomItem = useCallback(
    (item) => {
      logAction("Aangepast item toevoegen", { item });
      const generalElement = state.globalElements.find(
        (el) => el.name === "Algemeneen"
      );

      if (generalElement) {
        dispatch({
          type: "SET_DATA",
          payload: {
            globalElements: state.globalElements.map((element) =>
              element.name === "Algemeneen"
                ? {
                    ...element,
                    inspectionReport: [
                      {
                        id: uuidv4(),
                        element: "Algemeneen",
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
                name: "Algemeneen",
                description: "",
                inspectionReport: [
                  {
                    id: uuidv4(),
                    element: "Algemeneen",
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
    [state.globalElements, logAction, dispatch]
  );

  // **Functies voor Gebreken Met Ernst**

  // Functie om gebreken bij te werken via UPDATE_GEBREKEN
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

  // Functie om een specifiek gebrek toe te voegen
  const addGebrek = useCallback(
    (category, gebrek) => {
      logAction("Adding Gebrek", { category, gebrek });
      dispatch({
        type: "ADD_GEBREK",
        payload: { category, gebrek },
      });
    },
    [dispatch, logAction]
  );

  // Functie om een specifiek gebrek te verwijderen
  const removeGebrek = useCallback(
    (category, gebrekName) => {
      logAction("Removing Gebrek", { category, gebrekName });
      dispatch({
        type: "REMOVE_GEBREK",
        payload: { category, gebrekName },
      });
    },
    [dispatch, logAction]
  );

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
      handleAddItemToPlanning,
      handleItemChange,
      handleDeleteItem,
      handleAddCustomItem,
      setNewSpace,
      resetNewSpace,
      setNewElement, // Toegevoegd
      resetNewElement, // Toegevoegd
      updateGebreken, // Toegevoegd
      addGebrek, // Toegevoegd
      removeGebrek, // Toegevoegd
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
      handleAddItemToPlanning,
      handleItemChange,
      handleDeleteItem,
      handleAddCustomItem,
      setNewSpace,
      resetNewSpace,
      setNewElement, // Toegevoegd
      resetNewElement, // Toegevoegd
      updateGebreken, // Toegevoegd
      addGebrek, // Toegevoegd
      removeGebrek, // Toegevoegd
    ]
  );

  return (
    <MjopContext.Provider value={contextValue}>{children}</MjopContext.Provider>
  );
};
