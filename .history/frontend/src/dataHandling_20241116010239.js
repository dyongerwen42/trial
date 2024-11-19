// dataHandling.js
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export const  fetchMJOPData = async (
  id,
  setMJOP,
  setGeneralInfo,
  setCashInfo,
  setOfferGroups, // Add this line to set the offerGroups
  setTotalWorth,
  setGlobalElements,
  setGlobalSpaces,
  setGlobalDocuments
) => {
  try {
    const response = await axios.get(`http://localhost:5000/mjop/${id}`, { withCredentials: true });
    const data = response.data;
    return(data)
    setMJOP(data.mjop);
    setGeneralInfo(data.generalInfo);
    setCashInfo(data.cashInfo);

    setOfferGroups(data.offerGroups || []); // Set offerGroups from the fetched data

    setTotalWorth(data.totalWorth || 0);
    setGlobalElements(data.globalElements || []);
    setGlobalSpaces(data.globalSpaces || []);
    setGlobalDocuments(data.globalDocuments || []);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error fetching MJOP:`, err);
  }
};



export const saveMJOPData = async (id, formData, config, navigate) => {
  try {
    console.log(`[${new Date().toISOString()}] Preparing to save MJOP data. ID: ${id}`);

    // Validate and parse global elements and offer groups
    const globalElements = JSON.parse(formData.get('globalElements') || '[]').map((element) => ({
      ...element,
      inspectionReport: Array.isArray(element.inspectionReport) ? element.inspectionReport : [],
    }));
    
    const offerGroups = JSON.parse(formData.get('offerGroups') || '[]');

    // Build payload with validated fields
    const payload = {
      mjop: formData.get('mjop'),
      generalInfo: formData.get('generalInfo'),
      cashInfo: formData.get('cashInfo'),
      globalElements: JSON.stringify(globalElements),
      globalSpaces: formData.get('globalSpaces'),
      globalDocuments: formData.get('globalDocuments'),
      offerGroups: JSON.stringify(offerGroups),
    };

    console.log("Final payload prepared for server:", JSON.stringify(payload));

    if (id) {
      // Update existing MJOP entry
      console.log(`[${new Date().toISOString()}] Updating existing MJOP with ID: ${id}`);
      await axios.put(`http://localhost:5000/mjop/${id}`, payload, config);
    } else {
      // Create new MJOP entry
      console.log(`[${new Date().toISOString()}] Creating new MJOP`);
      const response = await axios.post('http://localhost:5000/save-mjop', payload, config);
      const newId = response.data.id;
      console.log(`New MJOP created with ID: ${newId}`);

      if (navigate) navigate(`/mjop/${newId}`);
    }

  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error saving MJOP data:`, err);
    throw new Error('Error saving MJOP data'); // Re-throw error for higher-level handling
  }
};



export const calculateCurrentCash = (cashInfo, globalElements) => {
  let remainingCash = parseFloat(cashInfo.currentCash || 0);
  const monthlyContribution = parseFloat(cashInfo.monthlyContribution || 0);
  const reserveStartDate = new Date(cashInfo.reserveDate);

  const tasks = globalElements.flatMap(element =>
    element.inspectionReport.flatMap(report => report.tasks || [])
  );

  tasks
    .sort((a, b) => new Date(a.planned?.workDate || a.ultimateDate) - new Date(b.planned?.workDate || b.ultimateDate))
    .forEach((task) => {
      const taskDate = new Date(task.planned?.workDate || task.ultimateDate);
      const monthsDifference = (taskDate.getFullYear() - reserveStartDate.getFullYear()) * 12 + (taskDate.getMonth() - reserveStartDate.getMonth());
      const totalContribution = monthsDifference * monthlyContribution;

      let taskCost = 0;
      if (task.planned?.invoicePrice) {
        taskCost = parseFloat(task.planned.invoicePrice);
      } else if (task.planned?.offerPrice) {
        taskCost = parseFloat(task.planned.offerPrice);
      } else if (task.planned?.estimatedPrice) {
        taskCost = parseFloat(task.planned.estimatedPrice);
      }

      remainingCash += totalContribution - taskCost;
    });

  return remainingCash;
};

export const getSaldoColor = (currentCash, totalWorth) => {
  const minimumRequired = parseFloat(totalWorth) * 0.005;
  if (currentCash < 0) return 'bg-red-500';
  if (currentCash < minimumRequired) return 'bg-orange-500';
  return 'bg-green-500';
};
