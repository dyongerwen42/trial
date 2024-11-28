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

// **1. Define Action Types as Constants**
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
const EDIT_TASK = "EDIT_TASK";
const DELETE_TASK = "DELETE_TASK";
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

// **New Action Types for OfferGroups**
const ADD_OFFER_GROUP = "ADD_OFFER_GROUP";
const EDIT_OFFER_GROUP = "EDIT_OFFER_GROUP";
const DELETE_OFFER_GROUP = "DELETE_OFFER_GROUP";

// **2. Create the Context**
const MjopContext = createContext();

// **3. Custom Hook to Use the Context**
export const useMjopContext = () => useContext(MjopContext);

// **4. Initialize the State**
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
    description: "", // New field
    interval: 0,       // New field (in months)
    annotations: [],   // New field
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
    interval: 0, // New field
    documents: [],
    photos: [],
    spaceId: "",
    gebreken: { // Adjusted structure
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
        mistakes: [],
        overallConditionScore: 1, // Initialize score
        remarks: "",
      },
    ],
    annotations: [], // New field
    categories: [],
    type: "",
    material: "",
    customMaterial: "",
    levensduur: "",
    aanschafDatum: "",
    vervangingsKosten: "",
    tasks: [], // Ensure tasks array is initialized
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

// **5. Helper Function to Calculate Condition Score**
const calculateConditionScore = (mistakes) => {
  if (!Array.isArray(mistakes)) {
    console.warn("Mistakes is not an array:", mistakes);
    return 1; // Default value
  }

  let score = 0;
  mistakes.forEach((mistake) => {
    switch (mistake.severity) {
      case "ernstig":
        score += 3;
        break;
      case "serieus":
        score += 2;
        break;
      case "gering":
        score += 1;
        break;
      default:
        break;
    }
  });
  return score;
};

// **6. Reducer Function to Manage State**
const mjopReducer = (state, action) => {
  console.log("Dispatched action:", action.type, action.payload);
  switch (action.type) {
    case SET_GENERAL_INFO:
      return {
        ...state,
        generalInfo: { ...state.generalInfo, ...action.payload },
      };

    case SET_DATA:
      return {
        ...state,
        generalInfo: {
          ...state.generalInfo,
          ...action.payload.generalInfo,
          description:
            action.payload.generalInfo?.description || state.generalInfo.description,
          interval:
            action.payload.generalInfo?.interval || state.generalInfo.interval,
          annotations: Array.isArray(action.payload.generalInfo?.annotations)
            ? action.payload.generalInfo.annotations
            : state.generalInfo.annotations,
        },
        cashInfo: action.payload.cashInfo || state.cashInfo,
        mjop: action.payload.mjop || state.mjop,
        globalElements: Array.isArray(action.payload.globalElements)
          ? action.payload.globalElements.map((element) => ({
              ...element,
              gebreken: {
                ernstig: Array.isArray(element.gebreken?.ernstig) ? element.gebreken.ernstig : [],
                serieus: Array.isArray(element.gebreken?.serieus) ? element.gebreken.serieus : [],
                gering: Array.isArray(element.gebreken?.gering) ? element.gebreken.gering : [],
              },
              inspectionReport: Array.isArray(element.inspectionReport)
                ? element.inspectionReport.map(report => ({
                    ...report,
                    mistakes: Array.isArray(report.mistakes) ? report.mistakes : [],
                    overallConditionScore: calculateConditionScore(report.mistakes || []),
                    remarks: report.remarks || "",
                  }))
                : [
                    {
                      id: uuidv4(),
                      description: "",
                      inspectionDone: false,
                      inspectionDate: null,
                      mistakes: [],
                      overallConditionScore: 1,
                      remarks: "",
                    },
                  ],
              annotations: Array.isArray(element.annotations) ? element.annotations : [],
              tasks: Array.isArray(element.tasks) ? element.tasks : [], // Ensure tasks array is initialized
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

    case SET_ERRORS:
      return { ...state, errors: action.payload };

    case SET_TAB_ERRORS:
      return { ...state, tabErrors: action.payload };

    case SET_SAVING:
      return { ...state, isSaving: action.payload };

    case SET_SUCCESS:
      return { ...state, success: action.payload };

    case SET_ERROR_MESSAGE:
      return { ...state, errorMessage: action.payload, openErrorDialog: true };

    case ADD_GLOBAL_ELEMENT:
      console.log("Reducer ADD_GLOBAL_ELEMENT called with:", action.payload);
      return {
        ...state,
        globalElements: [
          ...state.globalElements,
          {
            ...action.payload,
            gebreken: {
              ernstig: Array.isArray(action.payload.gebreken?.ernstig) ? action.payload.gebreken.ernstig : [],
              serieus: Array.isArray(action.payload.gebreken?.serieus) ? action.payload.gebreken.serieus : [],
              gering: Array.isArray(action.payload.gebreken?.gering) ? action.payload.gebreken.gering : [],
            },
            inspectionReport: Array.isArray(action.payload.inspectionReport)
              ? action.payload.inspectionReport.map(report => ({
                  ...report,
                  mistakes: Array.isArray(report.mistakes) ? report.mistakes : [],
                  overallConditionScore: calculateConditionScore(report.mistakes || []),
                  remarks: report.remarks || "",
                }))
              : [
                  {
                    id: uuidv4(),
                    description: "",
                    inspectionDone: false,
                    inspectionDate: null,
                    mistakes: [],
                    overallConditionScore: 1,
                    remarks: "",
                  },
                ],
            annotations: Array.isArray(action.payload.annotations) ? action.payload.annotations : [],
            tasks: Array.isArray(action.payload.tasks) ? action.payload.tasks : [], // Initialize tasks
          },
        ],
      };

    case EDIT_GLOBAL_ELEMENT:
      console.log("Reducer EDIT_GLOBAL_ELEMENT called with:", action.payload);
      return {
        ...state,
        globalElements: state.globalElements.map((el) =>
          el.id === action.payload.id
            ? {
                ...el,
                ...action.payload,
                gebreken: {
                  ernstig: Array.isArray(action.payload.gebreken?.ernstig)
                    ? action.payload.gebreken.ernstig
                    : el.gebreken.ernstig,
                  serieus: Array.isArray(action.payload.gebreken?.serieus)
                    ? action.payload.gebreken.serieus
                    : el.gebreken.serieus,
                  gering: Array.isArray(action.payload.gebreken?.gering)
                    ? action.payload.gebreken.gering
                    : el.gebreken.gering,
                },
                inspectionReport: Array.isArray(action.payload.inspectionReport)
                  ? action.payload.inspectionReport.map(report => ({
                      ...report,
                      mistakes: Array.isArray(report.mistakes) ? report.mistakes : [],
                      overallConditionScore: calculateConditionScore(report.mistakes || []),
                      remarks: report.remarks || "",
                    }))
                  : el.inspectionReport,
                annotations: Array.isArray(action.payload.annotations)
                  ? action.payload.annotations
                  : el.annotations,
                tasks: Array.isArray(action.payload.tasks) ? action.payload.tasks : el.tasks, // Update tasks if provided
              }
            : el
        ),
      };

    case DELETE_GLOBAL_ELEMENT:
      console.log("Reducer DELETE_GLOBAL_ELEMENT called with ID:", action.payload);
      return {
        ...state,
        globalElements: state.globalElements.filter((el) => el.id !== action.payload),
      };

    case ADD_TASK:
      console.log("Reducer ADD_TASK called with:", action.payload);
      return {
        ...state,
        globalElements: state.globalElements.map((element) =>
          element.id === action.payload.elementId
            ? {
                ...element,
                tasks: Array.isArray(element.tasks)
                  ? [...element.tasks, ...action.payload.tasks]
                  : [...action.payload.tasks],
              }
            : element
        ),
      };

    case EDIT_TASK:
      console.log("Reducer EDIT_TASK called with:", action.payload);
      return {
        ...state,
        globalElements: state.globalElements.map((element) => {
          if (element.id === action.payload.elementId) {
            return {
              ...element,
              tasks: Array.isArray(element.tasks)
                ? element.tasks.map((task) =>
                    task.id === action.payload.task.id
                      ? { ...task, ...action.payload.task }
                      : task
                  )
                : [],
            };
          }
          return element;
        }),
      };

    case DELETE_TASK:
      console.log("Reducer DELETE_TASK called with:", action.payload);
      return {
        ...state,
        globalElements: state.globalElements.map((element) => {
          if (element.id === action.payload.elementId) {
            return {
              ...element,
              tasks: Array.isArray(element.tasks)
                ? element.tasks.filter((task) => task.id !== action.payload.taskId)
                : [],
            };
          }
          return element;
        }),
      };

    case ADD_GLOBAL_SPACE:
      console.log("Reducer ADD_GLOBAL_SPACE called with:", action.payload);
      return { ...state, globalSpaces: [...state.globalSpaces, action.payload] };

    case EDIT_GLOBAL_SPACE:
      console.log("Reducer EDIT_GLOBAL_SPACE called with:", action.payload);
      const editedGlobalSpaces = state.globalSpaces.map((space) =>
        space.id === action.payload.id ? action.payload : space
      );
      return {
        ...state,
        globalSpaces: editedGlobalSpaces,
      };

    case DELETE_GLOBAL_SPACE:
      console.log("Reducer DELETE_GLOBAL_SPACE called with ID:", action.payload);
      const remainingGlobalSpaces = state.globalSpaces.filter(
        (space) => space.id !== action.payload
      );
      return {
        ...state,
        globalSpaces: remainingGlobalSpaces,
      };

    case SET_NEW_SPACE:
      console.log("Reducer SET_NEW_SPACE called with:", action.payload);
      return {
        ...state,
        newSpace: { ...state.newSpace, ...action.payload },
      };

    case RESET_NEW_SPACE:
      console.log("Reducer RESET_NEW_SPACE called");
      return {
        ...state,
        newSpace: initialState.newSpace,
      };

    case SET_NEW_ELEMENT:
      console.log("Reducer SET_NEW_ELEMENT called with:", action.payload);
      return {
        ...state,
        newElement: { ...state.newElement, ...action.payload },
      };

    case RESET_NEW_ELEMENT:
      console.log("Reducer RESET_NEW_ELEMENT called");
      return {
        ...state,
        newElement: initialState.newElement,
      };

    case ADD_GEBREK:
      const { category, gebrekName } = action.payload;
      console.log("Reducer ADD_GEBREK called with:", { category, gebrekName });

      // Validate category
      if (!["ernstig", "serieus", "gering"].includes(category)) {
        console.warn(`Unknown category: ${category}`);
        return state;
      }

      // Prevent duplicates
      if (state.newElement.gebreken[category].includes(gebrekName)) {
        console.warn(`Gebrek "${gebrekName}" is already added under ${category}.`);
        return state;
      }

      const updatedGebrekenAdd = {
        ...state.newElement.gebreken,
        [category]: [...state.newElement.gebreken[category], gebrekName],
      };

      console.log("New gebreken after ADD_GEBREK:", updatedGebrekenAdd);

      // Add corresponding mistake to all inspectionReports
      const updatedInspectionReportAdd = state.newElement.inspectionReport.map(
        (report) => ({
          ...report,
          mistakes: Array.isArray(report.mistakes)
            ? [
                ...report.mistakes,
                {
                  id: uuidv4(),
                  category: gebrekName,
                  severity: category,
                  omvang: "", // Add default value or obtain from user
                  description: "", // Add default value or obtain from user
                  images: [],
                },
              ]
            : [
                {
                  id: uuidv4(),
                  category: gebrekName,
                  severity: category,
                  omvang: "",
                  description: "",
                  images: [],
                },
              ],
          overallConditionScore: calculateConditionScore([
            ...(Array.isArray(report.mistakes) ? report.mistakes : []),
            {
              category: gebrekName,
              severity: category,
            },
          ]),
        })
      );

      return {
        ...state,
        newElement: {
          ...state.newElement,
          gebreken: updatedGebrekenAdd,
          inspectionReport: updatedInspectionReportAdd,
        },
      };

    case REMOVE_GEBREK:
      const { category: remCategory, gebrekName: remGebrekName } = action.payload;
      console.log("Reducer REMOVE_GEBREK called with:", { remCategory, remGebrekName });

      if (!["ernstig", "serieus", "gering"].includes(remCategory)) {
        console.warn(`Unknown category: ${remCategory}`);
        return state;
      }

      const updatedGebrekenRemove = {
        ...state.newElement.gebreken,
        [remCategory]: state.newElement.gebreken[remCategory].filter(
          (g) => g !== remGebrekName
        ),
      };

      console.log("New gebreken after REMOVE_GEBREK:", updatedGebrekenRemove);

      // Remove corresponding mistake from all inspectionReports
      const updatedInspectionReportRemove = state.newElement.inspectionReport.map(
        (report) => ({
          ...report,
          mistakes: Array.isArray(report.mistakes)
            ? report.mistakes.filter(
                (mistake) =>
                  !(
                    mistake.category === remGebrekName &&
                    mistake.severity === remCategory
                  )
              )
            : [],
          overallConditionScore: calculateConditionScore(
            Array.isArray(report.mistakes)
              ? report.mistakes.filter(
                  (mistake) =>
                    !(
                      mistake.category === remGebrekName &&
                      mistake.severity === remCategory
                    )
                )
              : []
          ),
        })
      );

      return {
        ...state,
        newElement: {
          ...state.newElement,
          gebreken: updatedGebrekenRemove,
          inspectionReport: updatedInspectionReportRemove,
        },
      };

    // **New Actions for Defects on Existing Elements**

    // Action to add multiple defects to newElement
    case ADD_GEBREKEN:
      const { category: addCategoryMultiple, gebrekenList } = action.payload;
      console.log("Reducer ADD_GEBREKEN called with:", { addCategoryMultiple, gebrekenList });

      if (!["ernstig", "serieus", "gering"].includes(addCategoryMultiple)) {
        console.warn(`Unknown category: ${addCategoryMultiple}`);
        return state;
      }

      const uniqueGebrekenToAddMultiple = gebrekenList.filter(
        (g) => !state.newElement.gebreken[addCategoryMultiple].includes(g)
      );

      if (uniqueGebrekenToAddMultiple.length === 0) {
        console.warn(`No new defects to add under ${addCategoryMultiple}.`);
        return state;
      }

      const updatedGebrekenMultiple = {
        ...state.newElement.gebreken,
        [addCategoryMultiple]: [
          ...state.newElement.gebreken[addCategoryMultiple],
          ...uniqueGebrekenToAddMultiple,
        ],
      };

      console.log("New defects after ADD_GEBREKEN:", updatedGebrekenMultiple);

      // Add corresponding mistakes to all inspectionReports
      const newMistakes = uniqueGebrekenToAddMultiple.map((gebrekName) => ({
        id: uuidv4(),
        category: gebrekName,
        severity: addCategoryMultiple,
        omvang: "",
        description: "",
        images: [],
      }));

      const updatedInspectionReportAddMultiple = state.newElement.inspectionReport.map((report) => ({
        ...report,
        mistakes: Array.isArray(report.mistakes)
          ? [...report.mistakes, ...newMistakes]
          : [...newMistakes],
        overallConditionScore: calculateConditionScore([...report.mistakes, ...newMistakes]),
      }));

      return {
        ...state,
        newElement: {
          ...state.newElement,
          gebreken: updatedGebrekenMultiple,
          inspectionReport: updatedInspectionReportAddMultiple,
        },
      };

    // Action to add multiple defects to an existing element
    case ADD_GEBREKEN_TO_ELEMENT:
      const {
        elementId,
        category: addElCategoryMultiple,
        gebrekenList: addElGebrekenList,
      } = action.payload;
      console.log("Reducer ADD_GEBREKEN_TO_ELEMENT called with:", { elementId, addElCategoryMultiple, addElGebrekenList });

      if (!["ernstig", "serieus", "gering"].includes(addElCategoryMultiple)) {
        console.warn(`Unknown category: ${addElCategoryMultiple}`);
        return state;
      }

      const updatedGlobalElementsAdd = state.globalElements.map((element) => {
        if (element.id === elementId) {
          const existingGebreken = Array.isArray(element.gebreken[addElCategoryMultiple]) ? element.gebreken[addElCategoryMultiple] : [];

          const uniqueGebrekenToAddEl = addElGebrekenList.filter(
            (g) => !existingGebreken.includes(g)
          );

          if (uniqueGebrekenToAddEl.length === 0) {
            console.warn(`No new defects to add under ${addElCategoryMultiple} for element ${elementId}.`);
            return element;
          }

          const updatedGebrekenEl = {
            ...element.gebreken,
            [addElCategoryMultiple]: [
              ...existingGebreken,
              ...uniqueGebrekenToAddEl,
            ],
          };

          console.log(`New defects for element ${elementId} after ADD_GEBREKEN_TO_ELEMENT:`, updatedGebrekenEl);

          // Add corresponding mistakes to all inspectionReports of the element
          const updatedInspectionReports = Array.isArray(element.inspectionReport)
            ? element.inspectionReport.map((report) => ({
                ...report,
                mistakes: Array.isArray(report.mistakes)
                  ? [
                      ...report.mistakes,
                      ...uniqueGebrekenToAddEl.map((gebrekName) => ({
                        id: uuidv4(),
                        category: gebrekName,
                        severity: addElCategoryMultiple,
                        omvang: "",
                        description: "",
                        images: [],
                      })),
                    ]
                  : uniqueGebrekenToAddEl.map((gebrekName) => ({
                      id: uuidv4(),
                      category: gebrekName,
                      severity: addElCategoryMultiple,
                      omvang: "",
                      description: "",
                      images: [],
                    })),
                overallConditionScore: calculateConditionScore([
                  ...(Array.isArray(report.mistakes) ? report.mistakes : []),
                  ...uniqueGebrekenToAddEl.map((gebrekName) => ({
                    category: gebrekName,
                    severity: addElCategoryMultiple,
                  })),
                ]),
              }))
            : [];

          return {
            ...element,
            gebreken: updatedGebrekenEl,
            inspectionReport: updatedInspectionReports,
          };
        }
        return element;
      });

      return {
        ...state,
        globalElements: updatedGlobalElementsAdd,
      };

    // Action to remove multiple defects from an existing element
    case REMOVE_GEBREKEN_FROM_ELEMENT:
      const {
        elementId: remElId,
        category: remElCategory,
        gebrekenList: remElGebrekenList,
      } = action.payload;
      console.log("Reducer REMOVE_GEBREKEN_FROM_ELEMENT called with:", { remElId, remElCategory, remElGebrekenList });

      if (!["ernstig", "serieus", "gering"].includes(remElCategory)) {
        console.warn(`Unknown category: ${remElCategory}`);
        return state;
      }

      const updatedGlobalElementsRemove = state.globalElements.map((element) => {
        if (element.id === remElId) {
          const existingGebreken = Array.isArray(element.gebreken[remElCategory]) ? element.gebreken[remElCategory] : [];
          const updatedGebreken = existingGebreken.filter(
            (g) => !remElGebrekenList.includes(g)
          );

          console.log(`New defects for element ${remElId} after REMOVE_GEBREKEN_FROM_ELEMENT:`, updatedGebreken);

          // Remove corresponding mistakes from all inspectionReports of the element
          const updatedInspectionReports = Array.isArray(element.inspectionReport)
            ? element.inspectionReport.map((report) => ({
                ...report,
                mistakes: Array.isArray(report.mistakes)
                  ? report.mistakes.filter(
                      (mistake) =>
                        !(
                          remElGebrekenList.includes(mistake.category) &&
                          mistake.severity === remElCategory
                        )
                    )
                  : [],
                overallConditionScore: calculateConditionScore(
                  Array.isArray(report.mistakes)
                    ? report.mistakes.filter(
                        (mistake) =>
                          !(
                            remElGebrekenList.includes(mistake.category) &&
                            mistake.severity === remElCategory
                          )
                      )
                    : []
                ),
              }))
            : [];

          return {
            ...element,
            gebreken: {
              ...element.gebreken,
              [remElCategory]: updatedGebreken,
            },
            inspectionReport: updatedInspectionReports,
          };
        }
        return element;
      });

      return {
        ...state,
        globalElements: updatedGlobalElementsRemove,
      };

    // **New Actions for OfferGroups**

    case ADD_OFFER_GROUP:
      console.log("Reducer ADD_OFFER_GROUP called with:", action.payload);
      return {
        ...state,
        offerGroups: [...state.offerGroups, action.payload],
      };

    case EDIT_OFFER_GROUP:
      console.log("Reducer EDIT_OFFER_GROUP called with:", action.payload);
      return {
        ...state,
        offerGroups: state.offerGroups.map((og) =>
          og.offerGroupId === action.payload.offerGroupId ? { ...og, ...action.payload } : og
        ),
      };

    case DELETE_OFFER_GROUP:
      console.log("Reducer DELETE_OFFER_GROUP called with ID:", action.payload);
      return {
        ...state,
        offerGroups: state.offerGroups.filter((og) => og.offerGroupId !== action.payload),
      };

    default:
      return state;
  }
};

// **7. Provider Component**
export const MjopProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, dispatch] = useReducer(mjopReducer, initialState);
  const [mjopId, setMjopId] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false); // Existing state

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
        console.log(`Initializing data for MJOP ID: ${id}`);
        const data = await fetchMJOPData(id);
        console.log("Data fetched:", data); // Log fetched data
        const payload = {
          generalInfo: {
            ...initialState.generalInfo,
            ...data.generalInfo,
            description:
              data.generalInfo?.description || initialState.generalInfo.description,
            interval:
              data.generalInfo?.interval || initialState.generalInfo.interval,
            annotations: Array.isArray(data.generalInfo?.annotations)
              ? data.generalInfo.annotations
              : initialState.generalInfo.annotations,
          },
          cashInfo: data.cashInfo || initialState.cashInfo,
          mjop: data.mjop || initialState.mjop,
          globalElements: Array.isArray(data.globalElements)
            ? data.globalElements.map((element) => ({
                ...element,
                gebreken: {
                  ernstig: Array.isArray(element.gebreken?.ernstig) ? element.gebreken.ernstig : [],
                  serieus: Array.isArray(element.gebreken?.serieus) ? element.gebreken.serieus : [],
                  gering: Array.isArray(element.gebreken?.gering) ? element.gebreken.gering : [],
                },
                inspectionReport: Array.isArray(element.inspectionReport)
                  ? element.inspectionReport.map(report => ({
                      ...report,
                      mistakes: Array.isArray(report.mistakes) ? report.mistakes : [],
                      overallConditionScore: calculateConditionScore(report.mistakes || []),
                      remarks: report.remarks || "",
                    }))
                  : [
                      {
                        id: uuidv4(),
                        description: "",
                        inspectionDone: false,
                        inspectionDate: null,
                        mistakes: [],
                        overallConditionScore: 1,
                        remarks: "",
                      },
                    ],
                annotations: Array.isArray(element.annotations)
                  ? element.annotations
                  : [],
                tasks: Array.isArray(element.tasks) ? element.tasks : [], // Ensure tasks array is initialized
              }))
            : [], // Ensure this is an empty array if data.globalElements is not an array
          globalSpaces: Array.isArray(data.globalSpaces) ? data.globalSpaces : [],
          globalDocuments: Array.isArray(data.globalDocuments)
            ? data.globalDocuments
            : [],
          offerGroups: Array.isArray(data.offerGroups) ? data.offerGroups : [],
        };
        console.log("Payload for SET_DATA:", payload);
        dispatch({ type: SET_DATA, payload });
        setIsDataLoaded(true);
        console.log("Data initialization completed.");
      } catch (err) {
        console.error("[initializeData] Error fetching MJOP data:", err);
        dispatch({
          type: SET_ERROR_MESSAGE,
          payload: "Error fetching data",
        });
        setIsDataLoaded(false); // Ensure it's false on error
      }
    },
    [dispatch]
  );

  // Effect to fetch data based on URL parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get("mjop-id");
    if (id && id !== mjopId) {
      console.log(`MJOP ID found in URL: ${id}`);
      setMjopId(id);
      initializeData(id);
    } else {
      console.log("No valid MJOP ID found in URL.");
    }
  }, [location.search, mjopId, initializeData]);

  // Validation function
  const handleValidation = useCallback(() => {
    console.log("Validation started.");
    const { newErrors, newTabErrors, isValid } = validate({
      generalInfo: state.generalInfo,
      cashInfo: state.cashInfo,
      totalWorth: state.cashInfo.totalWorth,
      globalElements: state.globalElements,
    });
    if (!isValid) {
      console.log("Validation failed with errors:", newErrors);
      dispatch({ type: SET_ERRORS, payload: newErrors });
      dispatch({ type: SET_TAB_ERRORS, payload: newTabErrors });
    } else {
      console.log("Validation successful.");
    }
    return isValid;
  }, [state]);

  // Optimized saveData function with useCallback
  const saveData = useCallback(
    async (updatedGlobalElements = state.globalElements, skipValidation = false) => {
      try {
        console.log("saveData called.");

        // Ensure 'gebreken' and 'tasks' are correctly structured in updatedGlobalElements
        updatedGlobalElements.forEach((element) => {
          if (!element.gebreken) {
            element.gebreken = { ernstig: [], serieus: [], gering: [] };
          }
          if (!element.inspectionReport) {
            element.inspectionReport = [
              {
                id: uuidv4(),
                description: "",
                inspectionDone: false,
                inspectionDate: null,
                mistakes: [],
                overallConditionScore: 1,
                remarks: "",
              },
            ];
          } else {
            // Ensure each inspectionReport has mistakes and overallConditionScore
            element.inspectionReport = element.inspectionReport.map((report) => ({
              ...report,
              mistakes: Array.isArray(report.mistakes) ? report.mistakes : [],
              overallConditionScore: calculateConditionScore(report.mistakes || []),
              remarks: report.remarks || "",
            }));
          }
          if (!Array.isArray(element.tasks)) {
            element.tasks = [];
          }
        });

        const formData = new FormData();
        formData.append("mjop", JSON.stringify(state.mjop));
        formData.append("generalInfo", JSON.stringify(state.generalInfo));
        formData.append("cashInfo", JSON.stringify(state.cashInfo));
        formData.append("globalElements", JSON.stringify(updatedGlobalElements));
        formData.append("globalSpaces", JSON.stringify(state.globalSpaces));
        formData.append("globalDocuments", JSON.stringify(state.globalDocuments));
        formData.append("offerGroups", JSON.stringify(state.offerGroups));

        // Add propertyImage if it's a File object (not a string)
        if (
          state.generalInfo.propertyImage &&
          typeof state.generalInfo.propertyImage !== "string"
        ) {
          formData.append("propertyImage", state.generalInfo.propertyImage);
          console.log("propertyImage added to formData.");
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

        // Additional logging to verify 'gebreken' and 'tasks'
        console.log(
          "Global Elements before saving:",
          JSON.stringify(updatedGlobalElements, null, 2)
        );

        const config = {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        };
        await saveMJOPData(mjopId, formData, config);

        dispatch({
          type: SET_SUCCESS,
          payload: "Data successfully saved.",
        });
        console.log("Data successfully saved.");
      } catch (err) {
        console.error("Error saving data:", err);
        dispatch({
          type: SET_ERRORS,
          payload: { general: "Error saving data. Please try again later." },
        });
      }
    },
    [state, mjopId]
  );

  // Function to submit the form
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      console.log("Form submission started.");
      dispatch({ type: SET_SAVING, payload: true });
      dispatch({ type: SET_ERRORS, payload: {} });
      dispatch({ type: SET_SUCCESS, payload: null });

      console.log("Current state during submit:", state);

      if (!handleValidation()) {
        console.warn("Validation failed, form will not be submitted.");
        dispatch({ type: SET_SAVING, payload: false });
        dispatch({
          type: SET_ERRORS,
          payload: { general: "There are validation errors that need to be resolved." },
        });
        return;
      }

      await saveData();
      dispatch({ type: SET_SAVING, payload: false });
      console.log("Form submission completed.");
    },
    [handleValidation, saveData, state]
  );

  // Function to set offer groups
  const setOfferGroups = useCallback(
    (offerGroups) => {
      logAction("Setting Offer Groups", offerGroups);
      dispatch({ type: SET_DATA, payload: { offerGroups } });
    },
    [dispatch, logAction]
  );

  // **New Functions for OfferGroups**

  // Function to add a new offer group
  const addOfferGroup = useCallback(
    (offerGroup) => {
      logAction("Adding Offer Group", offerGroup);
      dispatch({ type: ADD_OFFER_GROUP, payload: offerGroup });
    },
    [dispatch, logAction]
  );

  // Function to edit an existing offer group
  const editOfferGroup = useCallback(
    (offerGroup) => {
      logAction("Editing Offer Group", offerGroup);
      dispatch({ type: EDIT_OFFER_GROUP, payload: offerGroup });
    },
    [dispatch, logAction]
  );

  // Function to delete an offer group
  const deleteOfferGroup = useCallback(
    (offerGroupId) => {
      logAction("Deleting Offer Group", offerGroupId);
      dispatch({ type: DELETE_OFFER_GROUP, payload: offerGroupId });
    },
    [dispatch, logAction]
  );

  // Function to set global elements
  const setGlobalElements = useCallback(
    (globalElements) => {
      const sanitizedElements = Array.isArray(globalElements)
        ? globalElements.map((element) => ({
            ...element,
            gebreken: {
              ernstig: Array.isArray(element.gebreken?.ernstig) ? element.gebreken.ernstig : [],
              serieus: Array.isArray(element.gebreken?.serieus) ? element.gebreken.serieus : [],
              gering: Array.isArray(element.gebreken?.gering) ? element.gebreken.gering : [],
            },
            inspectionReport: Array.isArray(element.inspectionReport)
              ? element.inspectionReport.map(report => ({
                  ...report,
                  mistakes: Array.isArray(report.mistakes) ? report.mistakes : [],
                  overallConditionScore: calculateConditionScore(report.mistakes || []),
                  remarks: report.remarks || "",
                }))
              : [
                  {
                    id: uuidv4(),
                    description: "",
                    inspectionDone: false,
                    inspectionDate: null,
                    mistakes: [],
                    overallConditionScore: 1,
                    remarks: "",
                  },
                ],
            annotations: Array.isArray(element.annotations) ? element.annotations : [],
            tasks: Array.isArray(element.tasks) ? element.tasks : [], // Ensure tasks array is initialized
          }))
        : [];
      logAction("Setting Global Elements", sanitizedElements);
      dispatch({ type: SET_DATA, payload: { globalElements: sanitizedElements } });
    },
    [dispatch, logAction]
  );

  // Function to set global spaces
  const setGlobalSpaces = useCallback(
    (globalSpaces) => {
      logAction("Setting Global Spaces", globalSpaces);
      dispatch({ type: SET_DATA, payload: { globalSpaces } });
    },
    [dispatch, logAction]
  );

  // Function to set new space fields
  const setNewSpace = useCallback(
    (updatedFields) => {
      console.log("setNewSpace called with:", updatedFields);
      dispatch({ type: SET_NEW_SPACE, payload: updatedFields });
    },
    [dispatch]
  );

  // Function to reset new space fields
  const resetNewSpace = useCallback(() => {
    console.log("resetNewSpace called.");
    dispatch({ type: RESET_NEW_SPACE });
  }, [dispatch]);

  // Function to set new element fields
  const setNewElementFields = useCallback(
    (updatedFields) => {
      console.log("setNewElementFields called with:", updatedFields);
      dispatch({ type: SET_NEW_ELEMENT, payload: updatedFields });
    },
    [dispatch]
  );

  // Function to reset new element fields
  const resetNewElement = useCallback(() => {
    console.log("resetNewElement called.");
    dispatch({ type: RESET_NEW_ELEMENT });
  }, [dispatch]);

  // Function to set general info
  const setGeneralInfo = useCallback(
    (updatedFields) => {
      logAction("Setting General Info", updatedFields);
      dispatch({ type: SET_GENERAL_INFO, payload: updatedFields });
    },
    [logAction, dispatch]
  );

  // Function to add a new space
  const handleAddSpace = useCallback(
    (space) => {
      const spaceWithId = { ...space, id: uuidv4() };
      logAction("Adding Space", { spaceWithId });

      dispatch({ type: ADD_GLOBAL_SPACE, payload: spaceWithId });
    },
    [dispatch, logAction]
  );

  // Function to edit an existing space
  const handleEditSpace = useCallback(
    (space) => {
      logAction("Editing Space", { space });
      dispatch({ type: EDIT_GLOBAL_SPACE, payload: space });
    },
    [dispatch, logAction]
  );

  // Function to delete a space
  const handleDeleteSpace = useCallback(
    (id) => {
      logAction("Deleting Space", { id });
      dispatch({ type: DELETE_GLOBAL_SPACE, payload: id });
    },
    [dispatch, logAction]
  );

  // Function to add a new element
  const handleAddElement = useCallback(
    (element) => {
      const elementWithId = {
        ...element,
        id: uuidv4(),
        inspectionReport: Array.isArray(element.inspectionReport)
          ? element.inspectionReport.map(report => ({
              ...report,
              mistakes: Array.isArray(report.mistakes) ? report.mistakes : [],
              overallConditionScore: calculateConditionScore(report.mistakes || []),
              remarks: report.remarks || "",
            }))
          : [
              {
                id: uuidv4(),
                description: "",
                inspectionDone: false,
                inspectionDate: null,
                mistakes: [],
                overallConditionScore: 1,
                remarks: "",
              },
            ],
        gebreken: element.gebreken || { // Ensure defects are correctly set
          ernstig: [],
          serieus: [],
          gering: [],
        },
        annotations: Array.isArray(element.annotations) ? element.annotations : [],
        tasks: Array.isArray(element.tasks) ? element.tasks : [], // Initialize tasks
      };
      logAction("Adding Element", { elementWithId });

      dispatch({ type: ADD_GLOBAL_ELEMENT, payload: elementWithId });
      return elementWithId; // Return the added element
    },
    [dispatch, logAction]
  );

  // Function to edit an existing element
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

  // Function to delete an element
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

  // Function to add an item to planning (tasks)
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

  // Function to change a task item
  const handleItemChange = useCallback(
    (taskId, field, value) => {
      logAction("Changing Item", { taskId, field, value });

      // **Note:** The `elementId` should be known to associate the task. If it's not provided, consider revising this function.
      // For demonstration, let's assume `elementId` is part of the task or can be derived.
      dispatch({
        type: EDIT_TASK,
        payload: { elementId: null, task: { id: taskId, [field]: value } }, // elementId is not required here
      });
    },
    [dispatch, logAction]
  );

  // Function to delete a task item
  const handleDeleteItem = useCallback(
    (taskId) => {
      logAction("Deleting Item", { taskId });

      // **Note:** Similar to `handleItemChange`, you need the `elementId` to delete a task from the correct element.
      dispatch({
        type: DELETE_TASK,
        payload: { elementId: null, taskId },
      });
    },
    [dispatch, logAction]
  );

  // Function to add a custom item
  const handleAddCustomItem = useCallback(
    (item) => {
      logAction("Adding Custom Item", { item });
      const generalElement = state.globalElements.find(
        (el) => el.name === "Algemeen" // Ensure the name is correct
      );

      if (generalElement) {
        dispatch({
          type: ADD_TASK,
          payload: {
            elementId: generalElement.id,
            tasks: [
              {
                ...item,
                id: uuidv4(),
                planned: {
                  workDate: item.workDate ? new Date(item.workDate).toISOString() : null,
                  startDate: item.startDate ? new Date(item.startDate).toISOString() : null,
                  endDate: item.endDate ? new Date(item.endDate).toISOString() : null,
                  offerAccepted: !item.offerteNeeded,
                  comment: item.comment || "",
                  contractCost: item.contractCost || 0,
                  contractDuration: item.contractDuration || 0,
                  useInterval: item.useInterval || false,
                  intervalYears: item.intervalYears || 0,
                  totalYears: item.totalYears || 0,
                  inflationRate: item.inflationRate || 0,
                  offerFiles: item.offerFiles || [],
                  invoiceFiles: item.invoiceFiles || [],
                },
              },
            ],
          },
        });
      } else {
        console.warn(
          "'Algemeen' element not found, a new element will be added."
        );
        const newElement = {
          id: uuidv4(),
          name: "Algemeen", // Ensure the name is correct
          description: "",
          inspectionReport: [
            {
              id: uuidv4(),
              description: "",
              inspectionDone: false,
              inspectionDate: null,
              mistakes: [],
              overallConditionScore: 1, // Initialize the score
              remarks: "",
            },
          ],
          gebreken: {
            ernstig: [],
            serieus: [],
            gering: [],
          },
          annotations: [],
          tasks: [
            {
              ...item,
              id: uuidv4(),
              planned: {
                workDate: item.workDate ? new Date(item.workDate).toISOString() : null,
                startDate: item.startDate ? new Date(item.startDate).toISOString() : null,
                endDate: item.endDate ? new Date(item.endDate).toISOString() : null,
                offerAccepted: !item.offerteNeeded,
                comment: item.comment || "",
                contractCost: item.contractCost || 0,
                contractDuration: item.contractDuration || 0,
                useInterval: item.useInterval || false,
                intervalYears: item.intervalYears || 0,
                totalYears: item.totalYears || 0,
                inflationRate: item.inflationRate || 0,
                offerFiles: item.offerFiles || [],
                invoiceFiles: item.invoiceFiles || [],
              },
            },
          ],
        };
        handleAddElement(newElement);
      }
    },
    [dispatch, state.globalElements, logAction, handleAddElement]
  );

  // **Functions for Defects on New Elements**

  // Function to update defects for newElement
  const updateGebrekenFunc = useCallback(
    (category, gebrekName) => {
      logAction("Updating Defects", { category, gebrekName });
      dispatch({
        type: ADD_GEBREK,
        payload: { category, gebrekName },
      });
    },
    [dispatch, logAction]
  );

  // Function to add a specific defect to newElement
  const addGebrekFunc = useCallback(
    (category, gebrekName) => {
      console.log("addGebrekFunc called with:", { category, gebrekName });
      logAction("Adding Defect to newElement", { category, gebrekName });
      dispatch({
        type: ADD_GEBREK,
        payload: { category, gebrekName },
      });
    },
    [dispatch, logAction]
  );

  // Function to remove a specific defect from newElement
  const removeGebrekFunc = useCallback(
    (category, gebrekName) => {
      console.log("removeGebrekFunc called with:", { category, gebrekName });
      logAction("Removing Defect from newElement", { category, gebrekName });
      dispatch({
        type: REMOVE_GEBREK,
        payload: { category, gebrekName },
      });
    },
    [dispatch, logAction]
  );

  // **New Functions for Defects on Existing Elements**

  // Function to add a defect to an existing element
  const addGebrekToElement = useCallback(
    (elementId, category, gebrekName) => {
      logAction("Adding Defect to Element", { elementId, category, gebrekName });
      dispatch({
        type: ADD_GEBREKEN_TO_ELEMENT,
        payload: { elementId, category, gebrekenList: [gebrekName] }, // Use gebrekenList for consistency
      });
    },
    [dispatch, logAction]
  );

  // Function to add multiple defects to an existing element
  const addGebrekenToElement = useCallback(
    (elementId, category, gebrekenList) => {
      logAction("Adding Defects to Element", { elementId, category, gebrekenList });
      dispatch({
        type: ADD_GEBREKEN_TO_ELEMENT,
        payload: { elementId, category, gebrekenList },
      });
    },
    [dispatch, logAction]
  );

  // Function to remove a defect from an existing element
  const removeGebrekFromElement = useCallback(
    (elementId, category, gebrekName) => {
      console.log("removeGebrekFromElement called with:", { elementId, category, gebrekName });
      logAction("Removing Defect from Element", { elementId, category, gebrekName });
      dispatch({
        type: REMOVE_GEBREKEN_FROM_ELEMENT,
        payload: { elementId, category, gebrekenList: [gebrekName] }, // Use gebrekenList for consistency
      });
    },
    [dispatch, logAction]
  );

  // Function to remove multiple defects from an existing element
  const removeGebrekenFromElement = useCallback(
    (elementId, category, gebrekenList) => {
      console.log("removeGebrekenFromElement called with:", { elementId, category, gebrekenList });
      logAction("Removing Defects from Element", { elementId, category, gebrekenList });
      dispatch({
        type: REMOVE_GEBREKEN_FROM_ELEMENT,
        payload: { elementId, category, gebrekenList },
      });
    },
    [dispatch, logAction]
  );

  // **New Function for Select All Defects**
  const addMultipleGebrekenToNewElement = useCallback(
    (category, gebrekenList) => {
      console.log("addMultipleGebrekenToNewElement called with:", { category, gebrekenList });
      logAction("Adding multiple Defects to newElement", { category, gebrekenList });
      dispatch({
        type: ADD_GEBREKEN,
        payload: { category, gebrekenList },
      });
    },
    [dispatch, logAction]
  );

  // **OfferGroup Functions**

  // Function to add an offer group
  // const handleAddOfferGroup = useCallback(
  //   (offerGroup) => {
  //     addOfferGroup(offerGroup);
  //   },
  //   [addOfferGroup]
  // );

  // Function to edit an offer group
  // const handleEditOfferGroup = useCallback(
  //   (offerGroup) => {
  //     editOfferGroup(offerGroup);
  //   },
  //   [editOfferGroup]
  // );

  // Function to delete an offer group
  // const handleDeleteOfferGroup = useCallback(
  //   (offerGroupId) => {
  //     deleteOfferGroup(offerGroupId);
  //   },
  //   [deleteOfferGroup]
  // );

  // **Functions to Set Errors and Success Messages**

  // Function to set errors
  const setErrorsFunc = useCallback(
    (errors) => {
      console.log("setErrorsFunc called with:", errors);
      dispatch({ type: SET_ERRORS, payload: errors });
    },
    [dispatch]
  );

  // Function to set a success message
  const setSuccessMessageFunc = useCallback(
    (message) => {
      console.log("setSuccessMessageFunc called with:", message);
      dispatch({ type: SET_SUCCESS, payload: message });
    },
    [dispatch]
  );

  // **8. Memoize the Context Value to Prevent Unnecessary Re-renders**
  const contextValue = useMemo(
    () => ({
      state,
      dispatch,
      isDataLoaded, // Added isDataLoaded here
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
      setNewElement: setNewElementFields,
      resetNewElement,
      updateGebreken: updateGebrekenFunc,
      addGebrek: addGebrekFunc,
      removeGebrek: removeGebrekFunc,
      // **New Defect Functions for Existing Elements**
      addGebrekToElement,
      addGebrekenToElement,
      removeGebrekFromElement,
      removeGebrekenFromElement,
      setErrors: setErrorsFunc, // Including setErrors
      setSuccessMessage: setSuccessMessageFunc, // Including setSuccessMessage
      // **New Select All Function**
      addMultipleGebrekenToNewElement,
      // **OfferGroup Functions**
      addOfferGroup,      // Exposed directly
      editOfferGroup,     // Exposed directly
      deleteOfferGroup,   // Exposed directly
    }),
    [
      state,
      dispatch,
      isDataLoaded, // Added isDataLoaded to dependencies
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
      addGebrekenToElement,
      removeGebrekFromElement,
      removeGebrekenFromElement,
      setErrorsFunc,
      setSuccessMessageFunc,
      addMultipleGebrekenToNewElement,
      addOfferGroup,      // Exposed directly
      editOfferGroup,     // Exposed directly
      deleteOfferGroup,   // Exposed directly
    ]
  );

  return (
    <MjopContext.Provider value={contextValue}>{children}</MjopContext.Provider>
  );
};
