import dayjs from 'dayjs';
import XLSX from 'xlsx-js-style';

export function prepareAndDownloadXLSX(chart, fileName) {
  const { series, chart: chartConfig } = chart.w.config;
  const isTimelineChart = chartConfig.type === 'rangeBar';

  const workbook = XLSX.utils.book_new();
  let timestamps = new Set();
  let xlsxRows;
  if (isTimelineChart) {
    series.forEach(serie => {
      serie.data.forEach(point => {
        timestamps.add(point.y[0]);
        timestamps.add(point.y[1]);
      });
    });
    xlsxRows = [['Date', 'Time', ...new Set(series.flatMap(serie => serie.data.map(point => point.x)))]];
  } else {
    series.forEach(serie => {
      serie.data.forEach(point => {
        timestamps.add(point[0]);
      });
    });
    xlsxRows = [['Date', 'Time', ...new Set(series.map(serie => serie.name))]];
  }
  timestamps = Array.from(timestamps).sort((a, b) => a - b);

  timestamps.forEach(timestamp => {
    let date = dayjs(new Date(timestamp));
    let dateString = date.format('DD/MM/YYYY');
    let timeString = date.format('HH:mm:ss');
    let row = [dateString, timeString];

    let statusMap = {};
    series.forEach(serie => {
      if (isTimelineChart) {
        serie.data.forEach(point => {
          if (point.y[0] === timestamp) {
            statusMap[point.x] = serie.name === 'On' ? '1' : '0';
          } else if (point.y[1] === timestamp) {
            statusMap[point.x] = serie.name === 'Off' ? '1' : '0';
          }
        });
      } else {
        let point = serie.data.find(p => p[0] === timestamp);
        row.push(point ? point[1] : '');
      }
    });
    if (isTimelineChart) {
      let uniqueNames = Array.from(new Set(series.flatMap(serie => serie.data.map(point => point.x))));
      uniqueNames.forEach(name => {
        row.push(statusMap[name] || '');
      });
    }
    xlsxRows.push(row);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(xlsxRows);

  // Centering and automatic widening of columns
  worksheet['!cols'] = xlsxRows[0].map((_, colIndex) => ({
    wch: Math.max(...xlsxRows.map(row => (row[colIndex] ? row[colIndex].toString().length : 10))) + 2
  }));
  // Apply alignment style to all cells
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell_address = { c: C, r: R };
      const cell_ref = XLSX.utils.encode_cell(cell_address);
      if (!worksheet[cell_ref]) continue;
      worksheet[cell_ref].s = {
        alignment: {
          horizontal: 'center',
          vertical: 'center'
        }
      };
    }
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  const dateWriteFile = new Date()
    .toISOString()
    .replace(/T/, ' ')
    .replace(/\..+/, '')
    .replace(/:/g, '-');
  XLSX.writeFile(workbook, `${fileName}-${dateWriteFile}.xlsx`, { bookType: 'xlsx', cellStyles: true });
}

export function prepareAndDownloadCSV(chart, fileName) {
  const { series, chart: chartConfig } = chart.w.config;
  const isTimelineChart = chartConfig.type === 'rangeBar';

  let timestamps = new Set();
  let csvRows;
  if (isTimelineChart) {
    series.forEach(serie => {
      serie.data.forEach(point => {
        timestamps.add(point.y[0]);
        timestamps.add(point.y[1]);
      });
    });
    csvRows = [['Date', 'Time', ...new Set(series.flatMap(serie => serie.data.map(point => point.x)))].join(';')];
  } else {
    series.forEach(serie => {
      serie.data.forEach(point => {
        timestamps.add(point[0]);
      });
    });
    csvRows = [['Date', 'Time', ...new Set(series.map(serie => serie.name))].join(';')];
  }
  timestamps = Array.from(timestamps).sort((a, b) => a - b);

  timestamps.forEach(timestamp => {
    let date = dayjs(new Date(timestamp));
    let dateString = date.format('DD/MM/YYYY');
    let timeString = date.format('HH:mm:ss');
    let row = [dateString, timeString];

    let statusMap = {};
    series.forEach(serie => {
      if (isTimelineChart) {
        serie.data.forEach(point => {
          if (point.y[0] === timestamp) {
            statusMap[point.x] = serie.name === 'On' ? '1' : '0';
          } else if (point.y[1] === timestamp) {
            statusMap[point.x] = serie.name === 'Off' ? '1' : '0';
          }
        });
      } else {
        let point = serie.data.find(p => p[0] === timestamp);
        row.push(point ? point[1] : '');
      }
    });
    if (isTimelineChart) {
      let uniqueNames = Array.from(new Set(series.flatMap(serie => serie.data.map(point => point.x))));
      uniqueNames.forEach(name => {
        row.push(statusMap[name] || '');
      });
    }
    csvRows.push(row.join(';'));
  });

  // Convert CSV array to string
  let csvString = csvRows.join('\n');

  // Add BOM to the beginning of the CSV string
  let bom = '\uFEFF';
  let csvContent = bom + csvString;

  let blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  let link = document.createElement('a');
  if (link.download !== undefined) {
    let url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `${fileName}-${new Date()
        .toISOString()
        .replace(/T/, ' ')
        .replace(/\..+/, '')
        .replace(/:/g, '-')}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
