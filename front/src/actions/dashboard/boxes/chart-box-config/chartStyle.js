const OPTIONS_COMMON = {
  chart: {
    fontFamily: 'inherit',
    width: '100%',
    offsetX: 0,
    offsetY: 0,
    parentHeightOffset: 0,
    redrawOnParentResize: true,
    sparkline: {
      enabled: true
    },
    zoom: {
      enabled: true,
      type: 'x'
    },
    toolbar: {
      show: false
    },
    animations: {
      enabled: false
    }
  },
  xaxis: {
    tickPlacement: 'on',
    offsetX: 0,
    offsetY: 0,
    labels: {
      padding: 0
    },
    tooltip: {
      enabled: false
    },
    type: 'datetime'
  },
  yaxis: {
    offsetX: 0,
    offsetY: 0,
    labels: {
      padding: 0
    }
  },
  axisTicks: {
    offsetX: 0,
    offsetY: 0
  },
  dataLabels: {
    enabled: false,
    offsetX: 0,
    offsetY: 0
  },
  grid: {
    show: false,
    padding: {
      top: 0,
      right: 0,
      bottom: 40, // default value for multi feature set to 0 for one feature
      left: 0
    }
  },
  colors: ['#206bc4', '#a8aeb7', '#2098c4', '#20aec4'],
  legend: {
    show: true,
    position: 'bottom',
    height: 32,
    offsetY: 0,
    markers: {
      width: 8,
      height: 8,
      radius: 100
    },
    itemMargin: {
      horizontal: 2
    }
  },
  tooltip: {
    enabled: true,
    shared: true,
    followCursor: true,
    theme: 'dark',
    x: {
      show: true,
      format: 'dd MMM yyyy',
      formatter: undefined
    },
    y: [],
    marker: {
      show: true
    }
  }
};

const OPTIONS_LINE = {
  chart: {},
  fill: {
    opacity: 1
  },
  stroke: {
    width: [2, 2, 2, 2, 2],
    dashArray: [0, 0, 0, 0],
    lineCap: 'round',
    curve: 'smooth'
  }
};

const OPTIONS_AREA = {
  chart: {},
  fill: {
    opacity: 0.16,
    type: 'solid'
  },
  stroke: {
    width: 2,
    lineCap: 'round',
    curve: 'smooth'
  }
};

const OPTIONS_BAR = {
  chart: {},
  fill: {
    opacity: 1
  },
  plotOptions: {
    bar: {
      columnWidth: '55%',
      endingShape: 'rounded'
    }
  }
};

module.exports.OPTIONS_COMMON = OPTIONS_COMMON;
module.exports.OPTIONS_LINE = OPTIONS_LINE;
module.exports.OPTIONS_AREA = OPTIONS_AREA;
module.exports.OPTIONS_BAR = OPTIONS_BAR;
