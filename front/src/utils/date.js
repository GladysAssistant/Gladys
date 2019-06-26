import dayjs from 'dayjs';

function getYearsMonthsAndDays(selectedYear, selectedMonth) {
  const today = dayjs();
  let date;
  if (selectedYear && selectedMonth) {
    date = dayjs()
      .set('month', selectedMonth - 1)
      .set('year', selectedYear)
      .startOf('month');
  } else {
    date = dayjs();
  }
  const startYear = today.year();
  const endYear = 1900;
  const startDay = 1;
  const endDay = date.daysInMonth();
  const startMonth = 1;
  const endMonth = 12;

  const years = [];
  const months = [];
  const days = [];

  // fill all 3 arrays
  let i = startYear;
  while (i >= endYear) {
    years.push(i);
    i--;
  }
  i = startDay;
  while (i <= endDay) {
    days.push(i);
    i++;
  }
  i = startMonth;
  while (i <= endMonth) {
    months.push(i);
    i++;
  }
  return {
    days,
    months,
    years
  };
}

export { getYearsMonthsAndDays };
