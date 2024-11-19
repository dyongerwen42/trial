const validate = ({ generalInfo, cashInfo, totalWorth, globalElements }) => {
  const newErrors = {};
  const newTabErrors = {
    generalInfo: false,
    cashInfo: false,
    globalSpaces: false,
    globalElements: false,
    inspectionReport: false,
    planning: false,
    globalDocuments: false,
  };

  if (!generalInfo.projectNumber) {
    newErrors.projectNumber = 'Projectnummer is verplicht.';
    newTabErrors.generalInfo = true;
  }
  if (!generalInfo.projectName) {
    newErrors.projectName = 'Projectnaam is verplicht.';
    newTabErrors.generalInfo = true;
  }
  if (!cashInfo.currentCash) {
    newErrors.currentCash = 'Huidige kaspositie is verplicht.';
    newTabErrors.cashInfo = true;
  }
  if (!cashInfo.monthlyContribution) {
    newErrors.monthlyContribution = 'Maandelijkse bijdrage is verplicht.';
    newTabErrors.cashInfo = true;
  }
  if (!cashInfo.reserveDate) {
    newErrors.reserveDate = 'Reserveringsdatum is verplicht.';
    newTabErrors.cashInfo = true;
  }
  if (!totalWorth) {
    newErrors.totalWorth = 'Totale waarde is verplicht.';
    newTabErrors.cashInfo = true;
  }

  globalElements.forEach((element, elementIndex) => {
    if (!element.name) {
      if (!newErrors.elements) newErrors.elements = [];
      newErrors.elements[elementIndex] = { name: 'Elementnaam is verplicht.' };
      newTabErrors.globalElements = true;
    }
  });

  const isValid = Object.keys(newErrors).length === 0;
  return { newErrors, newTabErrors, isValid };
};

export default validate;
