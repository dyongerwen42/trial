// MjopContext.js

import React, { createContext, useContext, useReducer, useEffect, useCallback, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import {
  fetchMJOPData,
  saveMJOPData,
  calculateCurrentCash,
  getSaldoColor,
} from "./dataHandling";
import validate from "./validation";

// ... (bestaande code en actie types)

const MjopProvider = ({ children }) => {
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
      if (isDataLoaded && state.mjop.id === id) {
        console.log('Data is al geladen voor dit ID.');
        return;
      }
      try {
        console.log(`Initializing data for MJOP ID: ${id}`);
        const data = await fetchMJOPData(id);
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
          // ... rest van payload
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
      }
    },
    [dispatch, isDataLoaded, state.mjop.id]
  );

  // Effect to fetch data based on URL parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get("mjop-id");
    if (id && id !== mjopId) {
      console.log(`MJOP ID found in URL: ${id}`);
      setMjopId(id);
      initializeData(id);
    }
  }, [location.search, mjopId, initializeData]);

  // ... (rest van de provider code)

  // **8. Memoize the Context Value to Prevent Unnecessary Re-renders**
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
      setErrors: setErrorsFunc,
      setSuccessMessage: setSuccessMessageFunc,
      addMultipleGebrekenToNewElement,
      // **OfferGroup Functions**
      addOfferGroup,
      editOfferGroup,
      deleteOfferGroup,
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
      addGebrekFunc,
      removeGebrekFunc,
      addGebrekToElement,
      addGebrekenToElement,
      removeGebrekFromElement,
      setErrorsFunc,
      setSuccessMessageFunc,
      addMultipleGebrekenToNewElement,
      addOfferGroup,
      editOfferGroup,
      deleteOfferGroup,
    ]
  );

  return (
    <MjopContext.Provider value={contextValue}>{children}</MjopContext.Provider>
  );
};

export const useMjopContext = () => useContext(MjopContext);
export { MjopProvider };
