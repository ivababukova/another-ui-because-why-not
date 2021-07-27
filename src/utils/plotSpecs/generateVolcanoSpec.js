import _ from 'lodash';

const generateSpec = (configSrc, data) => {
  const config = _.cloneDeep(configSrc);

  let maxNegativeLogpValue = 0;

  data.forEach((o) => {
    Object.keys(o).forEach((k) => {
      if (k === 'p_val_adj' && o[k] && o[k] !== 0) {
        maxNegativeLogpValue = Math.max(
          maxNegativeLogpValue, -Math.log10(o[k]),
        );
      }
    });
  });

  const logFoldChangeFilterExpr = (config.logFoldChangeDomain)
    ? `datum.avg_log2FC > ${config.logFoldChangeDomain * -1} && datum.avg_log2FC < ${config.logFoldChangeDomain}`
    : 'true';

  const negativeLogpValueFilterExpr = (config.maxNegativeLogpValueDomain)
    ? `datum.neglogpvalue < ${config.maxNegativeLogpValueDomain}`
    : 'true';

  const logFoldChangeThresholdColor = config.showLogFoldChangeThresholdGuides
    ? config.logFoldChangeThresholdColor
    : '#ffffff00';

  const pvalueThresholdColor = config.showpvalueThresholdGuides
    ? config.pvalueThresholdColor
    : '#ffffff00';

  if (config.colour.toggleInvert === '#000000') {
    config.colour.reverseColourBar = true;
    config.colour.masterColour = '#FFFFFF';
  }
  if (config.colour.toggleInvert === '#FFFFFF') {
    config.colour.reverseColourBar = false;
    config.colour.masterColour = '#000000';
  }
  // Domain specifiers for the volcano plot axes.
  // If a logFoldChangeDomain is defined by the user (e.g. through the
  // interface by deselecting Auto and entering a custom value), use
  // their specified range. If not, scale the plot based on the range of
  // the data in the set.
  const logFoldChangeDomain = config.logFoldChangeDomain
    ? [config.logFoldChangeDomain * -1, config.logFoldChangeDomain]
    : { data: 'data', field: 'avg_log2FC' };

  const maxNegativeLogpValueDomain = config.maxNegativeLogpValueDomain
    ? [0, config.maxNegativeLogpValueDomain]
    : { data: 'data', field: 'neglogpvalue' };

  // adding gene labels above the set Y value only for the significant genes
  const geneLabelsEquation = `datum.avg_log2FC !== 'NA' && (datum.neglogpvalue >${config.textThresholdValue} && (datum.status == 'Upregulated' || datum.status == 'Downregulated'))`;

  let legend = [];
  if (config.legend.enabled) {
    legend = [
      {
        fill: 'color',
        orient: config.legend.position,
        encode: {
          title: {
            update: {
              fontSize: 14,
            },
          },
          labels: {
            update: {
              fontSize: { value: 12 },
              fill: { value: config.colour.masterColour },
            },
          },
          symbols: {
            update: {
              stroke: 'transparent',
            },
          },
          legend: {
            update: {
              stroke: '#ccc',
              strokeWidth: 1.5,
            },
          },
        },
      },
    ];
  }
  const spec = {
    width: config.dimensions.width,
    height: config.dimensions.height,
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    background: config.colour.toggleInvert,
    padding: 5,

    data: [
      {
        name: 'data',
        transform: [
          {
            type: 'filter',
            expr: 'datum.avg_log2FC && datum.p_val_adj && datum.avg_log2FC !== 0 && datum.p_val_adj !== 0',
          },
          {
            type: 'formula',
            as: 'neglogpvalue',

            expr: '-(log(datum.p_val_adj) / LN10)',
          },
          {
            type: 'filter',
            expr: logFoldChangeFilterExpr,
          },
          {
            type: 'filter',
            expr: negativeLogpValueFilterExpr,
          },
        ],
      },
      {
        name: 'dex2',
        source: 'data',
        transform: [
          {
            type: 'filter',
            expr: geneLabelsEquation,
          }],
      },

    ],

    scales: [
      {
        name: 'x',
        type: 'linear',
        round: true,
        nice: true,
        domain: logFoldChangeDomain,
        range: 'width',
      },
      {
        name: 'y',
        type: 'linear',
        round: true,
        nice: true,
        zero: true,
        domain: maxNegativeLogpValueDomain,
        range: 'height',
      },
      {
        name: 'color',
        type: 'ordinal',

        // specifying a domain and a range like this works
        // like a map of values to colours
        domain: [
          'Upregulated',
          'No difference',
          'Downregulated',
        ],
        range:
          [
            config.significantUpregulatedColor,
            config.noDifferenceColor,
            config.significantDownregulatedColor,
          ],
      },
    ],

    axes: [
      {
        scale: 'x',
        grid: true,
        domain: true,
        orient: 'bottom',
        title: config.axes.xAxisText,
        titleFont: config.fontStyle.font,
        labelFont: config.fontStyle.font,
        labelColor: config.colour.masterColour,
        tickColor: config.colour.masterColour,
        gridColor: config.colour.masterColour,
        gridOpacity: (config.axes.gridOpacity / 20),
        gridWidth: (config.axes.gridWidth / 20),
        offset: config.axes.offset,
        titleFontSize: config.axes.titleFontSize,
        titleColor: config.colour.masterColour,
        labelFontSize: config.axes.labelFontSize,
        domainWidth: config.axes.domainWidth,
        labelAngle: config.axes.xAxisRotateLabels ? 45 : 0,
        labelAlign: config.axes.xAxisRotateLabels ? 'left' : 'center',
      },
      {
        scale: 'y',
        grid: true,
        domain: true,
        orient: 'left',
        title: config.axes.yAxisText,
        titleFont: config.fontStyle.font,
        labelFont: config.fontStyle.font,
        labelColor: config.colour.masterColour,
        tickColor: config.colour.masterColour,
        gridColor: config.colour.masterColour,
        gridOpacity: (config.axes.gridOpacity / 20),
        gridWidth: (config.axes.gridWidth / 20),
        offset: config.axes.offset,
        titleFontSize: config.axes.titleFontSize,
        titleColor: config.colour.masterColour,
        labelFontSize: config.axes.labelFontSize,
        domainWidth: config.axes.domainWidth,
      },
    ],

    title:
    {
      text: config.title.text,
      color: config.colour.masterColour,
      anchor: config.title.anchor,
      font: config.fontStyle.font,
      dx: 10,
      fontSize: config.title.fontSize,
    },

    marks: [
      {
        type: 'symbol',
        from: { data: 'data' },
        encode: {
          enter: {
            x: { scale: 'x', field: 'avg_log2FC' },
            y: { scale: 'y', field: 'neglogpvalue' },
            size: config.marker.size,
            shape: config.marker.shape,
            strokeWidth: 1,
            strokeOpacity: config.strokeOpa,
            stroke: {
              scale: 'color',
              field: 'status',
            },
            fillOpacity: config.marker.opacity / 10,
            fill: {
              scale: 'color',
              field: 'status',
            },
          },
        },
      },
      {
        type: 'text',
        from: { data: 'dex2' },
        encode: {
          enter: {
            x: { scale: 'x', field: 'avg_log2FC' },
            y: { scale: 'y', field: 'neglogpvalue' },

            fill: { value: config.colour.masterColour },
            text: { field: 'gene_names' },
          },
          transform: [
            { type: 'label', size: ['width', 'height'] }],
        },
      },
      {
        type: 'rule',
        encode: {
          update: {
            x: {
              scale: 'x',
              value: config.logFoldChangeThreshold,
              round: true,
            },
            y: 0,
            y2: { field: { group: 'height' } },
            stroke: {
              value: logFoldChangeThresholdColor,
            },
            strokeWidth: {
              value: config.thresholdGuideWidth,
            },
          },
        },
      },
      {
        type: 'rule',
        encode: {
          update: {
            x: {
              scale: 'x',
              value: config.logFoldChangeThreshold * -1,
              round: true,
            },
            y: 0,
            y2: { field: { group: 'height' } },
            stroke: {
              value: logFoldChangeThresholdColor,
            },
            strokeWidth: {
              value: config.thresholdGuideWidth,
            },
          },
        },
      },
      {
        type: 'rule',
        encode: {
          update: {
            y: {
              scale: 'y',
              value: config.negLogpValueThreshold,
              round: true,
            },
            x: 0,
            x2: { field: { group: 'width' } },
            stroke: {
              value: pvalueThresholdColor,
            },
            strokeWidth: {
              value: config.thresholdGuideWidth,
            },
          },
        },
      },
    ],

    legends: legend,
  };

  return {
    spec, maxNegativeLogpValue,
  };
};

const generateData = () => { };

export { generateSpec, generateData };
