export const MjopProvider = ({ children }) => {
  const [state, dispatch] = useReducer(mjopReducer, initialState);

  // Add a useEffect to initialize global spaces and elements if needed
  useEffect(() => {
    if (!state.globalSpaces.length) {
      dispatch({ type: 'SET_DATA', payload: { globalSpaces: [] } });
    }
    if (!state.globalElements.length) {
      dispatch({ type: 'SET_DATA', payload: { globalElements: [] } });
    }
  }, [state.globalSpaces, state.globalElements]);

  return (
    <MjopContext.Provider value={{ state, dispatch }}>
      {children}
    </MjopContext.Provider>
  );
};
