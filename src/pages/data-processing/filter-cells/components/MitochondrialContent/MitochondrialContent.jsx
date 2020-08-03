/* eslint-disable no-param-reassign */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */

import React from 'react';
import {
  Collapse, Row, Col, List, Space, Switch,
  InputNumber, Form, Input, Select, Slider,
} from 'antd';
import _ from 'lodash';
import { Vega } from '../../../../../../node_modules/react-vega';
import plot1Pic from '../../../../../../static/media/plot3.png';
import plot2Pic from '../../../../../../static/media/plot4.png';

import plotData from './data2.json';
import TitleDesign from '../../../../plots-and-tables/components/TitleDesign';
import FontDesign from '../../../../plots-and-tables/components/FontDesign';

const { Panel } = Collapse;
const { Option } = Select;
class MitochondrialContent extends React.Component {
  constructor(props) {
    super(props);
    this.defaultConfig = {
      plotToDraw: true,
      data: plotData,
      legendEnabled: true,
      minCellSize: 1000,
      xAxisText: 'Fraction of mitochondrial reads',
      yAxisText: 'Fraction of cells',
      xAxisText2: 'log10(#UMI in cell)',
      yAxisText2: 'Average % mitochondrial',
      xDefaultTitle: 'Fraction of mitochondrial reads',
      yDefaultTitle: 'Fraction of cells',
      legendOrientation: 'top-right',
      gridWeight: 0,
      titleSize: 12,
      titleText: '',
      titleAnchor: 'start',
      masterFont: 'sans-serif',
      masterSize: 13,
    };
    this.state = {
      config: _.cloneDeep(this.defaultConfig),
      data: plotData,
    };
    this.updatePlotWithChanges = this.updatePlotWithChanges.bind(this);
  }

  generateData() {
    const { data } = this.state;
    return data;
  }

  updatePlotWithChanges(obj) {
    this.setState((prevState) => {
      const newState = _.cloneDeep(prevState);

      _.merge(newState.config, obj);

      return newState;
    });
  }

  generateSpec() {
    const { config } = this.state;
    let legend = null;
    if (config.legendEnabled) {
      legend = [
        {
          fill: 'color',
          orient: config.legendOrientation,
          encode: {
            title: {
              update: {
                fontSize: { value: 14 },
              },
            },
            labels: {
              interactive: true,
              update: {
                fontSize: { value: 12 },
                fill: { value: 'black' },
              },
              hover: {
                fill: { value: 'firebrick' },
              },
            },
            symbols: {
              update: {
                stroke: { value: 'transparent' },
              },
            },
            legend: {
              update: {
                stroke: { value: '#ccc' },
                strokeWidth: { value: 1.5 },
              },
            },
          },
        },
      ];
    } else {
      legend = null;
    }
    if (config.plotToDraw) {
      return {
        $schema: 'https://vega.github.io/schema/vega/v5.json',
        description: 'An interactive histogram for visualizing a univariate distribution.',
        width: 430,
        height: 300,
        padding: 5,

        signals: [
          {
            name: 'binStep',
            value: 0.05,
            bind: {
              input: 'range', min: 0.001, max: 0.4, step: 0.001,
            },
          },
        ],

        data: [
          {
            name: 'plotData',
          },
          {
            name: 'binned',
            source: 'plotData',
            transform: [
              {
                type: 'bin',
                field: 'fracMito',
                extent: [0, 1],
                step: { signal: 'binStep' },
                nice: false,
              },
              {
                type: 'aggregate',
                key: 'bin0',
                groupby: ['bin0', 'bin1'],
                fields: ['bin0'],
                ops: ['count'],
                as: ['count'],
              },
              {
                type: 'formula',
                as: 'count',
                expr: 'datum.count/10000',
              },
              {
                type: 'formula',
                as: 'status',
                expr: "(datum.bin1 <= 0.1) ? 'Real' : 'Mitochondrial'",
              },
            ],
          },
        ],

        scales: [
          {
            name: 'xscale',
            type: 'linear',
            range: 'width',
            domain: [0, 1],
          },
          {
            name: 'yscale',
            type: 'linear',
            range: 'height',
            round: true,
            domain: { data: 'binned', field: 'count' },
            zero: true,
            nice: true,
          },
          {
            name: 'color',
            type: 'ordinal',
            range:
              [
                'blue', 'green',
              ],
            domain: {
              data: 'binned',
              field: 'status',
              sort: true,
            },
          },
        ],

        axes: [
          {
            orient: 'bottom',
            scale: 'xscale',
            zindex: 1,
            title: { value: config.xAxisText },
            titleFont: { value: config.masterFont },
            labelFont: { value: config.masterFont },
            titleFontSize: { value: config.masterSize },
            labelFontSize: { value: config.masterSize },
          },
          {
            orient: 'left',
            scale: 'yscale',
            tickCount: 5,
            zindex: 1,
            title: { value: config.yAxisText },
            titleFont: { value: config.masterFont },
            labelFont: { value: config.masterFont },
            titleFontSize: { value: config.masterSize },
            labelFontSize: { value: config.masterSize },
          },
        ],

        marks: [
          {
            type: 'rect',
            from: { data: 'binned' },
            encode: {
              update: {
                x: { scale: 'xscale', field: 'bin0' },
                x2: {
                  scale: 'xscale',
                  field: 'bin1',
                  offset: { signal: 'binStep > 0.02 ? -0.5 : 0' },
                },
                y: { scale: 'yscale', field: 'count' },
                y2: { scale: 'yscale', value: 0 },
                fill: {
                  scale: 'color',
                  field: 'status',
                },
              },
              hover: { fill: { value: 'firebrick' } },
            },
          },
          {
            type: 'rect',
            from: { data: 'plotData' },
            encode: {
              enter: {
                x: { scale: 'xscale', field: 'datum.fracMito' },
                width: { value: 1 },
                y: { value: 25, offset: { signal: 'height' } },
                height: { value: 5 },
                fill: { value: 'steelblue' },
                fillOpacity: { value: 0.4 },
                fill: {
                  scale: 'color',
                  field: 'status',
                },
              },
            },
          },
        ],
        legends: legend,
        title:
        {
          text: { value: config.titleText },
          anchor: { value: config.titleAnchor },
          font: { value: config.masterFont },
          dx: 10,
          fontSize: { value: config.titleSize },
        },
      };
    }
    return {
      $schema: 'https://vega.github.io/schema/vega/v5.json',
      description: 'An interactive histogram for visualizing a univariate distribution.',
      width: 430,
      height: 300,
      padding: 5,

      signals: [
        {
          name: 'binStep',
          value: 0.05,
          bind: {
            input: 'range', min: 0.001, max: 0.5, step: 0.001,
          },
        },
      ],

      data: [
        {
          name: 'plotData',
        },
        {
          name: 'binned',
          source: 'plotData',
          transform: [
            {
              type: 'bin',
              field: 'cellSize',
              extent: [0, 6],
              step: { signal: 'binStep' },
              nice: false,
            },
            {
              type: 'aggregate',
              key: 'bin0',
              groupby: ['bin0', 'bin1'],
              fields: ['fracMito'],
              ops: ['average'],
              as: ['averageFracMito'],
            },
          ],
        },
      ],

      scales: [
        {
          name: 'xscale',
          type: 'linear',
          range: 'width',
          domain: [0, 6],
        },
        {
          name: 'yscale',
          type: 'linear',
          range: 'height',
          round: true,
          domain: { data: 'binned', field: 'averageFracMito' },
          zero: true,
          nice: true,
        },
        {
          name: 'color',
          type: 'ordinal',
          range:
            [
              'green', 'blue',
            ],
          domain: {
            data: 'plotData',
            field: 'status',
            sort: true,
          },
        },
      ],

      axes: [
        {
          orient: 'bottom',
          scale: 'xscale',
          zindex: 1,
          title: { value: config.xAxisText2 },
          titleFont: { value: config.masterFont },
          labelFont: { value: config.masterFont },
          titleFontSize: { value: config.masterSize },
          labelFontSize: { value: config.masterSize },

        },
        {
          orient: 'left',
          scale: 'yscale',
          tickCount: 5,
          zindex: 1,
          title: { value: config.yAxisText2 },
          titleFont: { value: config.masterFont },
          labelFont: { value: config.masterFont },
          titleFontSize: { value: config.masterSize },
          labelFontSize: { value: config.masterSize },
        },
      ],

      marks: [
        {
          type: 'rect',
          from: { data: 'binned' },
          encode: {
            update: {
              x: { scale: 'xscale', field: 'bin0' },
              x2: {
                scale: 'xscale',
                field: 'bin1',
                offset: { signal: 'binStep > 0.02 ? -0.5 : 0' },
              },
              y: { scale: 'yscale', field: 'averageFracMito' },
              y2: { scale: 'yscale', value: 0 },
              fill: {
                scale: 'color',
                field: 'status',
              },
            },
            hover: { fill: { value: 'firebrick' } },
          },
        },
      ],
      title:
      {
        text: { value: config.titleText },
        anchor: { value: config.titleAnchor },
        font: { value: config.masterFont },
        dx: 10,
        fontSize: { value: config.titleSize },
      },
    };
  }

  render() {
    const data = { plotData: this.generateData() };
    const { config } = this.state;
    // eslint-disable-next-line react/prop-types
    const { filtering } = this.props;

    const changePlot = (val) => {
      const { config } = this.state;
      this.updatePlotWithChanges({ plotToDraw: val });
      if (!config.plotToDraw) {
        this.updatePlotWithChanges({
          xDefaultTitle: config.xAxisText,
          yDefaultTitle: config.yAxisText,
        });
      } else {
        this.updatePlotWithChanges({
          xDefaultTitle: config.xAxisText2,
          yDefaultTitle: config.yAxisText2,
        });
      }
    };
    const setAxis = (val, axe) => {
      if (axe === 'x') {
        if (config.plotToDraw) {
          this.updatePlotWithChanges({ xAxisText: val.target.value });
        } else {
          this.updatePlotWithChanges({ xAxisText2: val.target.value });
        }
      }
      if (axe === 'y') {
        if (config.plotToDraw) {
          this.updatePlotWithChanges({ yAxisText: val.target.value });
        } else {
          this.updatePlotWithChanges({ yAxisText2: val.target.value });
        }
      }
    };

    return (
      <>
        <Row>

          <Col span={13}>
            <Vega data={data} spec={this.generateSpec()} renderer='canvas' />
          </Col>

          <Col span={3}>
            <Space direction='vertical'>
              <img
                alt=''
                src={plot1Pic}
                style={{
                  height: '100px',
                  width: '100px',
                  align: 'center',
                  padding: '8px',
                  border: '1px solid #000',
                }}
                onClick={() => changePlot(true)}
              />
              <img
                alt=''
                src={plot2Pic}
                style={{
                  height: '100px',
                  width: '100px',
                  align: 'center',
                  padding: '8px',
                  border: '1px solid #000',
                }}
                onClick={() => changePlot(false)}
              />
            </Space>
          </Col>


          <Col span={8}>
            <Space direction='vertical'>
              <Collapse>
                <Panel header='Filtering settings' disabled={!filtering}>
                  Method:
                  <Space direction='vertical'>
                    <Select
                      defaultValue='option1'
                      style={{ width: 200 }}
                      disabled={!filtering}
                    >
                      <Option value='option1'>Absolute threshold</Option>
                      <Option value='option2'>option2</Option>
                      <Option value='option3'>option3</Option>
                    </Select>
                    <Space>
                      Max fraction:
                      <InputNumber disabled={!filtering} defaultValue={0} />
                    </Space>
                  </Space>
                </Panel>

                <Panel header='Plot Styling'>
                  <Space direction='vertical' style={{ width: '100%' }} />

                  <Form.Item label='Toggle Legend'>
                    <Switch
                      defaultChecked
                      onChange={(val) => this.updatePlotWithChanges({ legendEnabled: val })}
                    />
                  </Form.Item>
                  <Collapse accordion>
                    <Panel header='Axes'>
                      <Form.Item
                        label='X axis Title'
                      >
                        <Input
                          placeholder={config.xDefaultTitle}
                          onPressEnter={(val) => setAxis(val, 'x')}
                        />
                      </Form.Item>
                      <Form.Item
                        label='Y axis Title'
                      >
                        <Input
                          placeholder={config.yDefaultTitle}
                          onPressEnter={(val) => setAxis(val, 'y')}
                        />
                      </Form.Item>
                    </Panel>
                    <Panel header='Title'>
                      <TitleDesign
                        config={config}
                        onUpdate={this.updatePlotWithChanges}
                      />
                    </Panel>
                    <Panel header='Font' key='9'>
                      <FontDesign
                        config={config}
                        onUpdate={this.updatePlotWithChanges}
                      />
                      Font size
                      <Slider
                        defaultValue={13}
                        min={5}
                        max={21}
                        onAfterChange={(value) => {
                          this.updatePlotWithChanges({ masterSize: value });
                        }}
                      />
                    </Panel>
                  </Collapse>
                </Panel>
              </Collapse>
            </Space>
          </Col>
        </Row>
      </>
    );
  }
}

export default MitochondrialContent;
