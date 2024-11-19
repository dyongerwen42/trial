import React from 'react';
import { useMjopContext } from './MjopContext';

const PlanningView = () => {
  const { state, calculateCurrentCash, getSaldoColor } = useMjopContext();
  const currentCash = state.cashInfo?.currentCash || 0; // Safe access with default

  return (
    <div>
      <h2>Planning View</h2>
      <p>Current Cash: {currentCash}</p>
      <p>Calculated Cash: {calculateCurrentCash()}</p>
      <p>Saldo Color: {getSaldoColor()}</p>
      {/* Rest of the component */}
    </div>
  );
};

export default PlanningView;
