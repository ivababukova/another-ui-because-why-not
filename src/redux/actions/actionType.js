
const CELL_SETS = 'CELL_SETS';
const LOAD_CELL_SETS = `${CELL_SETS}.LOAD`;
const UPDATE_CELL_SETS = `${CELL_SETS}.UPDATE`;
const CREATE_CLUSTER = `${CELL_SETS}.CREATE`;
const CELL_SETS_COLOR = `${CELL_SETS}.COLOR`;

const CELLS = 'CELLS';
const LOAD_CELLS = `${CELLS}.LOAD`;

const GENE_LIST = 'GENE_LIST';
const LOAD_GENE_LIST = `${GENE_LIST}.LOAD`;
const UPDATE_GENE_LIST = `${GENE_LIST}.UPDATE`;

const DIFF_EXPR = 'DIFF_EXPR';
const LOAD_DIFF_EXPR = `${DIFF_EXPR}.LOAD`;
const UPDATE_DIFF_EXPR = `${DIFF_EXPR}.UPDATE`;

export {
  LOAD_CELL_SETS, UPDATE_CELL_SETS, CREATE_CLUSTER, LOAD_CELLS, CELL_SETS_COLOR,
  LOAD_GENE_LIST, UPDATE_GENE_LIST,
  LOAD_DIFF_EXPR, UPDATE_DIFF_EXPR,
};