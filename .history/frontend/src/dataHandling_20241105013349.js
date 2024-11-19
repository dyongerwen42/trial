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


export const saveMJOPData = async (id, formData, config, setIsSaving, setSuccess, setErrors, navigate) => {
  try {
    console.log(`[${new Date().toISOString()}] Preparing to save MJOP data. ID: ${id}`);

    // Ensure inspectionReports within globalElements are arrays
    const validGlobalElements = JSON.parse(formData.get('globalElements')).map(element => ({
      ...element,
      inspectionReport: Array.isArray(element.inspectionReport) ? element.inspectionReport : []
    }));

    // Include offerGroups in the payload
    const offerGroups = JSON.parse(formData.get('offerGroups'));

    // Create the payload
    const payload = {
      mjop: formData.get('mjop'),
      generalInfo: formData.get('generalInfo'),
      cashInfo: formData.get('cashInfo'),
      globalElements: JSON.stringify(validGlobalElements),
      globalSpaces: formData.get('globalSpaces'),
      globalDocuments: formData.get('globalDocuments'),
      offerGroups: JSON.stringify(offerGroups) // Add offerGroups to the payload
    };

    // Log the payload to inspect the structure and values
    console.log("Payload being sent to the server:", payload);

    if (id) {
      console.log(`[${new Date().toISOString()}] Updating existing MJOP with ID: ${id}`);
      await axios.put(`http://localhost:5000/mjop/${id}`, payload, config);

    } else {
      console.log(`[${new Date().toISOString()}] Creating new MJOP`);
      const response = await axios.post('http://localhost:5000/save-mjop', payload, config);
      const newId = response.data.id;
   
      navigate(`/mjop/${newId}`);
    }

    setIsSaving(false);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error saving MJOP data:`, err);
    setIsSaving(false);
    setErrors({ general: 'generateMJOP.error' });
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
