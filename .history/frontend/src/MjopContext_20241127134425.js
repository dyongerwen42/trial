// MjopProvider Component

export const MjopProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, dispatch] = useReducer(mjopReducer, initialState);
  const [mjopId, setMjopId] = React.useState(null);

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
        const data = await fetchMJOPData(id); // Ensure fetchMJOPData is correctly implemented
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
        dispatch({ type: SET_DATA_LOADED, payload: true }); // Set data as loaded
        console.log("Data initialization completed.");
      } catch (err) {
        console.error("[initializeData] Error fetching MJOP data:", err);
        dispatch({
          type: SET_ERROR_MESSAGE,
          payload: "Error fetching data",
        });
        dispatch({ type: SET_DATA_LOADED, payload: false }); // Ensure data is not marked as loaded on error
      }
    },
    [dispatch]
  );

  // Effect to fetch data based on URL parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get("mjop-id");
    console.log("Extracted mjop-id:", id); // Debug log
    if (id && id !== mjopId) {
      console.log(`MJOP ID found in URL: ${id}`);
      setMjopId(id);
      initializeData(id);
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
    async (updatedGlobalElements = state.globalElements) => {
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
        await saveMJOPData(mjopId, formData, config); // Ensure saveMJOPData is correctly implemented

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

  // **OfferGroups Functions**

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

      // Find the element containing the task
      const element = state.globalElements.find((el) =>
        el.tasks?.some((task) => task.id === taskId)
      );

      if (element) {
        dispatch({
          type: EDIT_TASK,
          payload: {
            elementId: element.id,
            task: { id: taskId, [field]: value },
          },
        });
      }
    },
    [dispatch, logAction, state.globalElements]
  );

  // Function to delete a task item
  const handleDeleteItem = useCallback(
    (taskId) => {
      logAction("Deleting Item", { taskId });

      // Find the element containing the task
      const element = state.globalElements.find((el) =>
        el.tasks?.some((task) => task.id === taskId)
      );

      if (element) {
        dispatch({
          type: DELETE_TASK,
          payload: { elementId: element.id, taskId },
        });
      }
    },
    [dispatch, logAction, state.globalElements]
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

  // **7. Memoize the Context Value to Prevent Unnecessary Re-renders**
  const contextValue = useMemo(
    () => ({
      state,
      dispatch,
      isDataLoaded: state.isDataLoaded, // Include isDataLoaded
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
