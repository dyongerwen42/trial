// src/MjopContext.js
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

// **1. Definieer Actietypen als Constants**
const SET_GENERAL_INFO = "SET_GENERAL_INFO";
const SET_DATA = "SET_DATA";
const SET_ERRORS = "SET_ERRORS";
const SET_TAB_ERRORS = "SET_TAB_ERRORS";
const SET_SAVING = "SET_SAVING";
const SET_SUCCESS = "SET_SUCCESS";
const SET_ERROR_MESSAGE = "SET_ERROR_MESSAGE";
const ADD_GLOBAL_ELEMENT = "ADD_GLOBAL_ELEMENT";
const EDIT_GLOBAL_ELEMENT = "EDIT_GLOBAL_ELEMENT";
const DELETE_GLOBAL_ELEMENT = "DELETE_GLOBAL_ELEMENT";
const ADD_TASK = "ADD_TASK";
const ADD_GLOBAL_SPACE = "ADD_GLOBAL_SPACE";
const EDIT_GLOBAL_SPACE = "EDIT_GLOBAL_SPACE";
const DELETE_GLOBAL_SPACE = "DELETE_GLOBAL_SPACE";
const SET_NEW_SPACE = "SET_NEW_SPACE";
const RESET_NEW_SPACE = "RESET_NEW_SPACE";
const SET_NEW_ELEMENT = "SET_NEW_ELEMENT";
const RESET_NEW_ELEMENT = "RESET_NEW_ELEMENT";
const ADD_GEBREK = "ADD_GEBREK";
const REMOVE_GEBREK = "REMOVE_GEBREK";
const ADD_GEBREKEN = "ADD_GEBREKEN";
const ADD_GEBREKEN_TO_ELEMENT = "ADD_GEBREKEN_TO_ELEMENT";
const REMOVE_GEBREKEN_FROM_ELEMENT = "REMOVE_GEBREKEN_FROM_ELEMENT";

// **2. Creëer de Context**
const MjopContext = createContext();

// **3. Custom Hook om de Context te Gebruiken**
export const useMjopContext = () => useContext(MjopContext);

// **4. Initialiseer de State**
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
    description: "", // Nieuw veld
    interval: 0,       // Nieuw veld (in maanden)
    annotations: [],   // Nieuw veld
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
    interval: 0, // Nieuw veld
    documents: [],
    photos: [],
    spaceId: "",
    gebreken: { // Aangepaste structuur
      ernstig: [],
      serieus: [],
      gering: [],
    },
    inspectionReport: [
      {
        id: uuidv4(),
        description: "",
        inspectionDone: false,
        inspectionDate: null,
        tasks: [],
      },
    ],
    annotations: [], // Nieuw veld
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

// **5. Reducer Functie om de State te Beheren**
const mjopReducer = (state, action) => {
  switch (action.type) {
    case SET_GENERAL_INFO:
      console.log(
        JSON.stringify({ action: "SET_GENERAL_INFO", payload: action.payload }, null, 2)
      );
      return {
        ...state,
        generalInfo: { ...state.generalInfo, ...action.payload },
      };

    case SET_DATA:
      console.log(
        JSON.stringify({ action: "SET_DATA", payload: action.payload }, null, 2)
      );
      return {
        ...state,
        generalInfo: {
          ...state.generalInfo,
          ...action.payload.generalInfo,
          description: action.payload.generalInfo?.description || state.generalInfo.description,
          interval: action.payload.generalInfo?.interval !== undefined ? action.payload.generalInfo.interval : state.generalInfo.interval,
          annotations: action.payload.generalInfo?.annotations || state.generalInfo.annotations,
        },
        cashInfo: action.payload.cashInfo || state.cashInfo,
        mjop: action.payload.mjop || state.mjop,
        globalElements: Array.isArray(action.payload.globalElements)
          ? action.payload.globalElements.map((element) => ({
              ...element,
              gebreken: {
                ernstig: element.gebreken?.ernstig || [],
                serieus: element.gebreken?.serieus || [],
                gering: element.gebreken?.gering || [],
              },
              inspectionReport: Array.isArray(element.inspectionReport)
                ? (element.inspectionReport.length > 0
                  ? element.inspectionReport
                  : [
                      {
                        id: uuidv4(),
                        description: "",
                        inspectionDone: false,
                        inspectionDate: null,
                        tasks: [],
                      },
                    ])
                : [
                    {
                      id: uuidv4(),
                      description: "",
                      inspectionDone: false,
                      inspectionDate: null,
                      tasks: [],
                    },
                  ],
              annotations: element.annotations || [],
            }))
          : state.globalElements,
        globalSpaces: Array.isArray(action.payload.globalSpaces) ? action.payload.globalSpaces : state.globalSpaces,
        globalDocuments: Array.isArray(action.payload.globalDocuments) ? action.payload.globalDocuments : state.globalDocuments,
        offerGroups: Array.isArray(action.payload.offerGroups) ? action.payload.offerGroups : state.offerGroups,
      };

    case SET_ERRORS:
      console.log(
        JSON.stringify({ action: "SET_ERRORS", payload: action.payload }, null, 2)
      );
      return { ...state, errors: action.payload };

    case SET_TAB_ERRORS:
      console.log(
        JSON.stringify({ action: "SET_TAB_ERRORS", payload: action.payload }, null, 2)
      );
      return { ...state, tabErrors: action.payload };

    case SET_SAVING:
      console.log(
        JSON.stringify({ action: "SET_SAVING", payload: action.payload }, null, 2)
      );
      return { ...state, isSaving: action.payload };

    case SET_SUCCESS:
      console.log(
        JSON.stringify({ action: "SET_SUCCESS", payload: action.payload }, null, 2)
      );
      return { ...state, success: action.payload };

    case SET_ERROR_MESSAGE:
      console.warn(
        JSON.stringify({ action: "SET_ERROR_MESSAGE", payload: action.payload }, null, 2)
      );
      return { ...state, errorMessage: action.payload, openErrorDialog: true };

    case ADD_GLOBAL_ELEMENT:
      console.log(
        JSON.stringify({ action: "ADD_GLOBAL_ELEMENT", payload: action.payload }, null, 2)
      );
      return {
        ...state,
        globalElements: [
          ...state.globalElements,
          {
            ...action.payload,
            gebreken: {
              ernstig: [],
              serieus: [],
              gering: [],
            },
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
          },
        ],
      };

    case EDIT_GLOBAL_ELEMENT:
      console.log(
        JSON.stringify({ action: "EDIT_GLOBAL_ELEMENT", payload: action.payload }, null, 2)
      );
      return {
        ...state,
        globalElements: state.globalElements.map((el) =>
          el.id === action.payload.id
            ? {
                ...action.payload,
                gebreken: {
                  ernstig: action.payload.gebreken?.ernstig || [],
                  serieus: action.payload.gebreken?.serieus || [],
                  gering: action.payload.gebreken?.gering || [],
                },
                inspectionReport: Array.isArray(action.payload.inspectionReport)
                  ? (action.payload.inspectionReport.length > 0
                    ? action.payload.inspectionReport
                    : [
                        {
                          id: uuidv4(),
                          description: "",
                          inspectionDone: false,
                          inspectionDate: null,
                          tasks: [],
                        },
                      ])
                  : [
                      {
                        id: uuidv4(),
                        description: "",
                        inspectionDone: false,
                        inspectionDate: null,
                        tasks: [],
                      },
                    ],
                annotations: action.payload.annotations || el.annotations,
              }
            : el
        ),
      };

    case DELETE_GLOBAL_ELEMENT:
      console.log(
        JSON.stringify({ action: "DELETE_GLOBAL_ELEMENT", payload: action.payload }, null, 2)
      );
      return {
        ...state,
        globalElements: state.globalElements.filter((el) => el.id !== action.payload),
      };

    case ADD_TASK:
      console.log(
        JSON.stringify({ action: "ADD_TASK", payload: action.payload }, null, 2)
      );
      const updatedElementsWithTask = state.globalElements.map((element) =>
        element.id === action.payload.elementId
          ? {
              ...element,
              inspectionReport: element.inspectionReport.map((report) => ({
                ...report,
                tasks: [...(report.tasks || []), ...action.payload.tasks],
              })),
            }
          : element
      );
      return {
        ...state,
        globalElements: updatedElementsWithTask,
      };

    case ADD_GLOBAL_SPACE:
      console.log(
        JSON.stringify({ action: "ADD_GLOBAL_SPACE", payload: action.payload }, null, 2)
      );
      return { ...state, globalSpaces: [...state.globalSpaces, action.payload] };

    case EDIT_GLOBAL_SPACE:
      console.log(
        JSON.stringify({ action: "EDIT_GLOBAL_SPACE", payload: action.payload }, null, 2)
      );
      const editedGlobalSpaces = state.globalSpaces.map((space) =>
        space.id === action.payload.id ? action.payload : space
      );
      return {
        ...state,
        globalSpaces: editedGlobalSpaces,
      };

    case DELETE_GLOBAL_SPACE:
      console.log(
        JSON.stringify({ action: "DELETE_GLOBAL_SPACE", payload: action.payload }, null, 2)
      );
      const remainingGlobalSpaces = state.globalSpaces.filter(
        (space) => space.id !== action.payload
      );
      return {
        ...state,
        globalSpaces: remainingGlobalSpaces,
      };

    case SET_NEW_SPACE:
      console.log(
        JSON.stringify({ action: "SET_NEW_SPACE", payload: action.payload }, null, 2)
      );
      return {
        ...state,
        newSpace: { ...state.newSpace, ...action.payload },
      };

    case RESET_NEW_SPACE:
      console.log(
        JSON.stringify({ action: "RESET_NEW_SPACE" }, null, 2)
      );
      return {
        ...state,
        newSpace: initialState.newSpace,
      };

    case SET_NEW_ELEMENT:
      console.log(
        JSON.stringify({ action: "SET_NEW_ELEMENT", payload: action.payload }, null, 2)
      );
      return {
        ...state,
        newElement: { ...state.newElement, ...action.payload },
      };

    case RESET_NEW_ELEMENT:
      console.log(
        JSON.stringify({ action: "RESET_NEW_ELEMENT" }, null, 2)
      );
      return {
        ...state,
        newElement: initialState.newElement,
      };

    case ADD_GEBREK:
      const { category, gebrekName } = action.payload;
      console.log(
        JSON.stringify({ action: "ADD_GEBREK", payload: { category, gebrekName } }, null, 2)
      );

      // Controleer of de categorie geldig is
      if (!["ernstig", "serieus", "gering"].includes(category)) {
        console.warn(
          JSON.stringify({ warning: `Onbekende categorie: ${category}` }, null, 2)
        );
        return {
          ...state,
          errorMessage: `Onbekende categorie: ${category}`,
          openErrorDialog: true,
        };
      }

      // Prevent duplicates
      if (state.newElement.gebreken[category].includes(gebrekName)) {
        console.warn(
          JSON.stringify({ warning: `Gebrek "${gebrekName}" is al toegevoegd onder ${category}.` }, null, 2)
        );
        return {
          ...state,
          errorMessage: `Gebrek "${gebrekName}" is al toegevoegd onder ${category}.`,
          openErrorDialog: true,
        };
      }

      const updatedGebrekenAdd = {
        ...state.newElement.gebreken,
        [category]: [...state.newElement.gebreken[category], gebrekName],
      };

      console.log(
        JSON.stringify({ action: "Nieuwe gebreken na ADD_GEBREK", gebreken: updatedGebrekenAdd }, null, 2)
      );

      return {
        ...state,
        newElement: {
          ...state.newElement,
          gebreken: updatedGebrekenAdd,
        },
      };

    case REMOVE_GEBREK:
      const { category: remCategory, gebrekName: remGebrekName } = action.payload;
      console.log(
        JSON.stringify({ action: "REMOVE_GEBREK", payload: { remCategory, remGebrekName } }, null, 2)
      );

      if (!["ernstig", "serieus", "gering"].includes(remCategory)) {
        console.warn(
          JSON.stringify({ warning: `Onbekende categorie: ${remCategory}` }, null, 2)
        );
        return {
          ...state,
          errorMessage: `Onbekende categorie: ${remCategory}`,
          openErrorDialog: true,
        };
      }

      const updatedGebrekenRemove = {
        ...state.newElement.gebreken,
        [remCategory]: state.newElement.gebreken[remCategory].filter(
          (g) => g !== remGebrekName
        ),
      };

      console.log(
        JSON.stringify({ action: "Nieuwe gebreken na REMOVE_GEBREK", gebreken: updatedGebrekenRemove }, null, 2)
      );

      return {
        ...state,
        newElement: {
          ...state.newElement,
          gebreken: updatedGebrekenRemove,
        },
      };

    case ADD_GEBREKEN:
      const { category: addCategoryMultiple, gebrekenList } = action.payload;
      console.log(
        JSON.stringify({ action: "ADD_GEBREKEN", payload: { addCategoryMultiple, gebrekenList } }, null, 2)
      );

      if (!["ernstig", "serieus", "gering"].includes(addCategoryMultiple)) {
        console.warn(
          JSON.stringify({ warning: `Onbekende categorie: ${addCategoryMultiple}` }, null, 2)
        );
        return {
          ...state,
          errorMessage: `Onbekende categorie: ${addCategoryMultiple}`,
          openErrorDialog: true,
        };
      }

      const uniqueGebrekenToAddMultiple = gebrekenList.filter(
        (g) => !state.newElement.gebreken[addCategoryMultiple].includes(g)
      );

      if (uniqueGebrekenToAddMultiple.length === 0) {
        console.warn(
          JSON.stringify({ warning: `Geen nieuwe gebreken om toe te voegen onder ${addCategoryMultiple}.` }, null, 2)
        );
        return {
          ...state,
          errorMessage: `Geen nieuwe gebreken om toe te voegen onder ${addCategoryMultiple}.`,
          openErrorDialog: true,
        };
      }

      const updatedGebrekenMultiple = {
        ...state.newElement.gebreken,
        [addCategoryMultiple]: [
          ...state.newElement.gebreken[addCategoryMultiple],
          ...uniqueGebrekenToAddMultiple,
        ],
      };

      console.log(
        JSON.stringify({ action: "Nieuwe gebreken na ADD_GEBREKEN", gebreken: updatedGebrekenMultiple }, null, 2)
      );

      return {
        ...state,
        newElement: {
          ...state.newElement,
          gebreken: updatedGebrekenMultiple,
        },
      };

    case ADD_GEBREKEN_TO_ELEMENT:
      const { elementId, category: addElCategoryMultiple, gebrekenList: addElGebrekenList } = action.payload;
      console.log(
        JSON.stringify({ action: "ADD_GEBREKEN_TO_ELEMENT", payload: { elementId, addElCategoryMultiple, addElGebrekenList } }, null, 2)
      );

      if (!["ernstig", "serieus", "gering"].includes(addElCategoryMultiple)) {
        console.warn(
          JSON.stringify({ warning: `Onbekende categorie: ${addElCategoryMultiple}` }, null, 2)
        );
        return {
          ...state,
          errorMessage: `Onbekende categorie: ${addElCategoryMultiple}`,
          openErrorDialog: true,
        };
      }

      const updatedGlobalElementsAdd = state.globalElements.map((element) => {
        if (element.id === elementId) {
          const existingGebreken = element.gebreken[addElCategoryMultiple] || [];
          const uniqueGebrekenToAddEl = addElGebrekenList.filter(
            (g) => !existingGebreken.includes(g)
          );

          if (uniqueGebrekenToAddEl.length === 0) {
            console.warn(
              JSON.stringify({ warning: `Geen nieuwe gebreken om toe te voegen onder ${addElCategoryMultiple} voor element ${elementId}.` }, null, 2)
            );
            return element; // No changes
          }

          const updatedGebrekenEl = {
            ...element.gebreken,
            [addElCategoryMultiple]: [
              ...existingGebreken,
              ...uniqueGebrekenToAddEl,
            ],
          };

          console.log(
            JSON.stringify(
              { action: `Nieuwe gebreken voor element ${elementId} na ADD_GEBREKEN_TO_ELEMENT`, gebreken: updatedGebrekenEl },
              null,
              2
            )
          );

          return {
            ...element,
            gebreken: updatedGebrekenEl,
          };
        }
        return element;
      });

      return {
        ...state,
        globalElements: updatedGlobalElementsAdd,
      };

    case REMOVE_GEBREKEN_FROM_ELEMENT:
      const { elementId: remElId, category: remElCategory, gebrekenList: remElGebrekenList } = action.payload;
      console.log(
        JSON.stringify({ action: "REMOVE_GEBREKEN_FROM_ELEMENT", payload: { remElId, remElCategory, remElGebrekenList } }, null, 2)
      );

      if (!["ernstig", "serieus", "gering"].includes(remElCategory)) {
        console.warn(
          JSON.stringify({ warning: `Onbekende categorie: ${remElCategory}` }, null, 2)
        );
        return {
          ...state,
          errorMessage: `Onbekende categorie: ${remElCategory}`,
          openErrorDialog: true,
        };
      }

      const updatedGlobalElementsRemove = state.globalElements.map((element) => {
        if (element.id === remElId) {
          const existingGebreken = element.gebreken[remElCategory] || [];
          const updatedGebreken = existingGebreken.filter(
            (g) => !remElGebrekenList.includes(g)
          );

          console.log(
            JSON.stringify(
              { action: `Nieuwe gebreken voor element ${remElId} na REMOVE_GEBREKEN_FROM_ELEMENT`, gebreken: updatedGebreken },
              null,
              2
            )
          );

          return {
            ...element,
            gebreken: {
              ...element.gebreken,
              [remElCategory]: updatedGebreken,
            },
          };
        }
        return element;
      });

      return {
        ...state,
        globalElements: updatedGlobalElementsRemove,
      };

    default:
      return state;
  }
};

// **6. Provider Component**
export const MjopProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, dispatch] = useReducer(mjopReducer, initialState);
  const [mjopId, setMjopId] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Logging functie
  const logAction = useCallback((action, data) => {
    console.log(
      JSON.stringify(
        { timestamp: new Date().toISOString(), action, data },
        null,
        2
      )
    );
  }, []);

  // Functie om data te initialiseren
  const initializeData = useCallback(
    async (id) => {
      try {
        logAction("Initialiseer data voor MJOP ID", { id });
        const data = await fetchMJOPData(id);
        const payload = {
          generalInfo: {
            ...initialState.generalInfo,
            ...data.generalInfo,
            description: data.generalInfo?.description || initialState.generalInfo.description,
            interval: data.generalInfo?.interval !== undefined ? data.generalInfo.interval : initialState.generalInfo.interval,
            annotations: data.generalInfo?.annotations || initialState.generalInfo.annotations,
          },
          cashInfo: data.cashInfo || initialState.cashInfo,
          mjop: data.mjop || initialState.mjop,
          globalElements: Array.isArray(data.globalElements)
            ? data.globalElements.map((element) => ({
                ...element,
                gebreken: {
                  ernstig: element.gebreken?.ernstig || [],
                  serieus: element.gebreken?.serieus || [],
                  gering: element.gebreken?.gering || [],
                },
                inspectionReport: Array.isArray(element.inspectionReport)
                  ? (element.inspectionReport.length > 0
                    ? element.inspectionReport
                    : [
                        {
                          id: uuidv4(),
                          description: "",
                          inspectionDone: false,
                          inspectionDate: null,
                          tasks: [],
                        },
                      ])
                  : [
                      {
                        id: uuidv4(),
                        description: "",
                        inspectionDone: false,
                        inspectionDate: null,
                        tasks: [],
                      },
                    ],
                annotations: element.annotations || [],
              }))
            : [],
          globalSpaces: Array.isArray(data.globalSpaces) ? data.globalSpaces : [],
          globalDocuments: Array.isArray(data.globalDocuments)
            ? data.globalDocuments
            : [],
          offerGroups: Array.isArray(data.offerGroups) ? data.offerGroups : [],
        };
        logAction("Payload voor SET_DATA", payload);
        dispatch({ type: SET_DATA, payload });
        setIsDataLoaded(true);
        logAction("Data initialisatie voltooid", { id });
      } catch (err) {
        console.error("[initializeData] Error fetching MJOP data:", err);
        dispatch({
          type: SET_ERROR_MESSAGE,
          payload: "Error fetching data",
        });
      }
    },
    [logAction]
  );

  // Effect om data te fetchen op basis van URL parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get("mjop-id");
    if (id && id !== mjopId) {
      logAction("MJOP ID gevonden in URL", { id });
      setMjopId(id);
      initializeData(id);
    }
  }, [location.search, mjopId, initializeData, logAction]);

  // Functie voor validatie
  const handleValidation = useCallback(() => {
    logAction("Validatie gestart", {});
    const { newErrors, newTabErrors, isValid } = validate({
      generalInfo: state.generalInfo,
      cashInfo: state.cashInfo,
      totalWorth: state.cashInfo.totalWorth,
      globalElements: state.globalElements,
    });
    if (!isValid) {
      logAction("Validatie mislukt met fouten", { newErrors });
      dispatch({ type: SET_ERRORS, payload: newErrors });
      dispatch({ type: SET_TAB_ERRORS, payload: newTabErrors });
    } else {
      logAction("Validatie succesvol", {});
    }
    return isValid;
  }, [state.generalInfo, state.cashInfo, state.globalElements, logAction]);

  // Optimized saveData functie met useCallback
  const saveData = useCallback(
    async (updatedGlobalElements = state.globalElements, skipValidation = false) => {
      try {
        logAction("saveData aangeroepen", {});
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
          logAction("propertyImage toegevoegd aan formData", { propertyImage: state.generalInfo.propertyImage.name });
        }

        logAction("Preparing to save data", {
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
          type: SET_SUCCESS,
          payload: "Data successfully saved.",
        });
        logAction("Data successfully saved", {});
      } catch (err) {
        console.error("Error saving data:", err);
        dispatch({
          type: SET_ERRORS,
          payload: { general: "Error saving data. Please try again later." },
        });
      }
    },
    [state, mjopId, logAction]
  );

  // Functie om formulier in te dienen
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      logAction("Form submission gestart", {});
      dispatch({ type: SET_SAVING, payload: true });
      dispatch({ type: SET_ERRORS, payload: {} });
      dispatch({ type: SET_SUCCESS, payload: null });

      logAction("Huidige staat tijdens submit", { state });

      if (!handleValidation()) {
        logAction("Validatie mislukt, formulier wordt niet ingediend", {});
        dispatch({ type: SET_SAVING, payload: false });
        dispatch({
          type: SET_ERRORS,
          payload: { general: "There are validation errors that need to be resolved." },
        });
        return;
      }

      await saveData();
      dispatch({ type: SET_SAVING, payload: false });
      logAction("Form submission voltooid", {});
    },
    [handleValidation, saveData, state, logAction]
  );

  // Functie om offer groups in te stellen
  const setOfferGroups = useCallback(
    (offerGroups) => {
      logAction("Setting Offer Groups", offerGroups);
      dispatch({ type: SET_DATA, payload: { offerGroups } });
    },
    [dispatch, logAction]
  );

  // Functie om global elements in te stellen
  const setGlobalElements = useCallback(
    (globalElements) => {
      const sanitizedElements = Array.isArray(globalElements)
        ? globalElements.map((element) => ({
            ...element,
            gebreken: {
              ernstig: element.gebreken?.ernstig || [],
              serieus: element.gebreken?.serieus || [],
              gering: element.gebreken?.gering || [],
            },
            inspectionReport: Array.isArray(element.inspectionReport)
              ? (element.inspectionReport.length > 0
                ? element.inspectionReport
                : [
                    {
                      id: uuidv4(),
                      description: "",
                      inspectionDone: false,
                      inspectionDate: null,
                      tasks: [],
                    },
                  ])
              : [
                  {
                    id: uuidv4(),
                    description: "",
                    inspectionDone: false,
                    inspectionDate: null,
                    tasks: [],
                  },
                ],
            annotations: element.annotations || [],
          }))
        : [];
      logAction("Setting Global Elements", sanitizedElements);
      dispatch({ type: SET_DATA, payload: { globalElements: sanitizedElements } });
    },
    [dispatch, logAction]
  );

  // Functie om global spaces in te stellen
  const setGlobalSpaces = useCallback(
    (globalSpaces) => {
      logAction("Setting Global Spaces", globalSpaces);
      dispatch({ type: SET_DATA, payload: { globalSpaces } });
    },
    [dispatch, logAction]
  );

  // Functie om nieuwe space velden in te stellen
  const setNewSpace = useCallback(
    (updatedFields) => {
      logAction("setNewSpace aangeroepen", updatedFields);
      dispatch({ type: SET_NEW_SPACE, payload: updatedFields });
    },
    [dispatch, logAction]
  );

  // Functie om nieuwe space velden te resetten
  const resetNewSpace = useCallback(() => {
    logAction("resetNewSpace aangeroepen", {});
    dispatch({ type: RESET_NEW_SPACE });
  }, [dispatch, logAction]);

  // Functie om nieuwe element velden in te stellen
  const setNewElementFields = useCallback(
    (updatedFields) => {
      // Stel standaardwaarden in als velden undefined zijn
      const sanitizedFields = {
        ...updatedFields,
        description: updatedFields.description !== undefined ? updatedFields.description : state.newElement.description,
        interval: updatedFields.interval !== undefined ? updatedFields.interval : state.newElement.interval,
      };
      logAction("setNewElementFields aangeroepen", sanitizedFields);
      dispatch({ type: SET_NEW_ELEMENT, payload: sanitizedFields });
    },
    [dispatch, state.newElement.description, state.newElement.interval, logAction]
  );

  // Functie om nieuwe element velden te resetten
  const resetNewElement = useCallback(() => {
    logAction("resetNewElement aangeroepen", {});
    dispatch({ type: RESET_NEW_ELEMENT });
  }, [dispatch, logAction]);

  // Functie om general info in te stellen
  const setGeneralInfo = useCallback(
    (updatedFields) => {
      logAction("Setting General Info", updatedFields);
      dispatch({ type: SET_GENERAL_INFO, payload: updatedFields });
    },
    [logAction, dispatch]
  );

  // Functie om een nieuwe space toe te voegen
  const handleAddSpace = useCallback(
    (space) => {
      const spaceWithId = { ...space, id: uuidv4() };
      logAction("Adding Space", { spaceWithId });

      dispatch({ type: ADD_GLOBAL_SPACE, payload: spaceWithId });
    },
    [dispatch, logAction]
  );

  // Functie om een bestaande space te bewerken
  const handleEditSpace = useCallback(
    (space) => {
      logAction("Editing Space", { space });
      dispatch({ type: EDIT_GLOBAL_SPACE, payload: space });
    },
    [dispatch, logAction]
  );

  // Functie om een space te verwijderen
  const handleDeleteSpace = useCallback(
    (id) => {
      logAction("Deleting Space", { id });
      dispatch({ type: DELETE_GLOBAL_SPACE, payload: id });
    },
    [dispatch, logAction]
  );

  // Functie om een nieuw element toe te voegen
  const handleAddElement = useCallback(
    (element) => {
      const elementWithId = {
        ...element,
        id: uuidv4(),
        inspectionReport: Array.isArray(element.inspectionReport) && element.inspectionReport.length > 0
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
        gebreken: {
          ernstig: element.gebreken?.ernstig || [],
          serieus: element.gebreken?.serieus || [],
          gering: element.gebreken?.gering || [],
        },
        annotations: element.annotations || [],
      };
      logAction("Adding Element", { elementWithId });

      dispatch({ type: ADD_GLOBAL_ELEMENT, payload: elementWithId });
      return elementWithId; // Retourneer het toegevoegde element
    },
    [dispatch, logAction]
  );

  // Functie om een bestaand element te bewerken
  const handleEditElement = useCallback(
    (element) => {
      logAction("Editing Element", { element });
      dispatch({
        type: EDIT_GLOBAL_ELEMENT,
        payload: element,
      });
    },
    [dispatch, logAction]
  );

  // Functie om een element te verwijderen
  const handleDeleteElement = useCallback(
    (id) => {
      logAction("Deleting Element", { id });
      dispatch({
        type: DELETE_GLOBAL_ELEMENT,
        payload: id,
      });
    },
    [dispatch, logAction]
  );

  // Functie om een item toe te voegen aan planning
  const handleAddItemToPlanning = useCallback(
    (task, elementId) => {
      logAction("Adding Item to Planning", { task, elementId });

      dispatch({
        type: ADD_TASK,
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
        type: SET_DATA,
        payload: {
          globalElements: state.globalElements.map((element) => ({
            ...element,
            inspectionReport: element.inspectionReport.map((report) => ({
              ...report,
              tasks: report.tasks?.map((task) =>
                task.id === taskId
                  ? {
                      ...task,
                      [field]: value,
                    }
                  : task
              ),
            })),
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
        type: SET_DATA,
        payload: {
          globalElements: state.globalElements.map((element) => ({
            ...element,
            inspectionReport: element.inspectionReport.map((report) => ({
              ...report,
              tasks: report.tasks?.filter((task) => task.id !== taskId),
            })),
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

        logAction("Updated Inspection Reports voor 'Algemeen' element", { updatedInspectionReports });

        dispatch({
          type: SET_DATA,
          payload: {
            globalElements: state.globalElements.map((element) =>
              element.name === "Algemeen"
                ? { ...element, inspectionReport: updatedInspectionReports }
                : element
            ),
          },
        });
      } else {
        console.warn(
          JSON.stringify(
            { warning: "'Algemeen' element niet gevonden, een nieuw element wordt toegevoegd." },
            null,
            2
          )
        );
        dispatch({
          type: SET_DATA,
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
                gebreken: {
                  ernstig: [],
                  serieus: [],
                  gering: [],
                },
                annotations: [],
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
    (category, gebrekName) => {
      logAction("Updating Gebreken", { category, gebrekName });
      dispatch({
        type: ADD_GEBREK,
        payload: { category, gebrekName },
      });
    },
    [dispatch, logAction]
  );

  // Functie om een specifiek gebrek toe te voegen aan newElement
  const addSingleGebrek = useCallback(
    (category, gebrekName) => {
      logAction("Adding Single Gebrek to newElement", { category, gebrekName });
      dispatch({
        type: ADD_GEBREK,
        payload: { category, gebrekName },
      });
    },
    [dispatch, logAction]
  );

  // Functie om meerdere gebreken toe te voegen aan newElement
  const addMultipleGebreken = useCallback(
    (category, gebrekenList) => {
      logAction("Adding Multiple Gebreken to newElement", { category, gebrekenList });
      dispatch({
        type: ADD_GEBREKEN,
        payload: { category, gebrekenList },
      });
    },
    [dispatch, logAction]
  );

  // Functie om een specifiek gebrek te verwijderen van newElement
  const removeGebrek = useCallback(
    (category, gebrekName) => {
      logAction("Removing Gebrek from newElement", { category, gebrekName });
      dispatch({
        type: REMOVE_GEBREK,
        payload: { category, gebrekName },
      });
    },
    [dispatch, logAction]
  );

  // **Nieuwe Functies voor Gebreken op Bestaande Elementen**

  // Functie om een gebrek toe te voegen aan een bestaand element
  const addGebrekToElement = useCallback(
    (elementId, category, gebrekName) => {
      logAction("Adding Gebrek to Element", { elementId, category, gebrekName });
      dispatch({
        type: ADD_GEBREKEN_TO_ELEMENT,
        payload: { elementId, category, gebrekenList: [gebrekName] }, // Gebruik gebrekenList voor consistentie
      });
    },
    [dispatch, logAction]
  );

  // Functie om meerdere gebreken toe te voegen aan een bestaand element
  const addGebrekenToElement = useCallback(
    (elementId, category, gebrekenList) => {
      logAction("Adding Gebreken to Element", { elementId, category, gebrekenList });
      dispatch({
        type: ADD_GEBREKEN_TO_ELEMENT,
        payload: { elementId, category, gebrekenList },
      });
    },
    [dispatch, logAction]
  );

  // Functie om een gebrek te verwijderen van een bestaand element
  const removeGebrekFromElement = useCallback(
    (elementId, category, gebrekName) => {
      logAction("Removing Gebrek from Element", { elementId, category, gebrekName });
      dispatch({
        type: REMOVE_GEBREKEN_FROM_ELEMENT,
        payload: { elementId, category, gebrekenList: [gebrekName] }, // Gebruik gebrekenList voor consistentie
      });
    },
    [dispatch, logAction]
  );

  // Functie om meerdere gebreken te verwijderen van een bestaand element
  const removeGebrekenFromElement = useCallback(
    (elementId, category, gebrekenList) => {
      logAction("Removing Gebreken from Element", { elementId, category, gebrekenList });
      dispatch({
        type: REMOVE_GEBREKEN_FROM_ELEMENT,
        payload: { elementId, category, gebrekenList },
      });
    },
    [dispatch, logAction]
  );

  // Functie om errors in te stellen
  const setErrorsFunc = useCallback(
    (errors) => {
      logAction("setErrorsFunc aangeroepen", { errors });
      dispatch({ type: SET_ERRORS, payload: errors });
    },
    [dispatch, logAction]
  );

  // Functie om een succesbericht in te stellen
  const setSuccessMessageFunc = useCallback(
    (message) => {
      logAction("setSuccessMessageFunc aangeroepen", { message });
      dispatch({ type: SET_SUCCESS, payload: message });
    },
    [dispatch, logAction]
  );

  // **7. Memoize de Context Waarde om Onnodige Re-renders te Voorkomen**
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
      addSingleGebrek, // Enkelvoudige gebrek toevoegen
      addMultipleGebreken, // Meervoudige gebreken toevoegen
      removeGebrek,
      // **Nieuwe Gebreken Functies voor Bestaande Elementen**
      addGebrekToElement,
      addGebrekenToElement,
      removeGebrekFromElement,
      removeGebrekenFromElement,
      setErrors: setErrorsFunc, // Inclusief setErrors
      setSuccessMessage: setSuccessMessageFunc, // Inclusief setSuccessMessage
    }),
    [
      state,
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
      addSingleGebrek,
      addMultipleGebreken,
      removeGebrek,
      addGebrekToElement,
      addGebrekenToElement,
      removeGebrekFromElement,
      removeGebrekenFromElement,
      setErrorsFunc,
      setSuccessMessageFunc,
    ]
  );

  return (
    <MjopContext.Provider value={contextValue}>{children}</MjopContext.Provider>
  );
};
