import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Checkbox,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import { MoreVert, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const DataTable = ({
  columns,
  data,
  pagination,
  onPageChange,
  onRowsPerPageChange,
  onSort,
  onRowClick,
  onRowSelect,
  selectable = false,
  loading = false,
  error = null,
  actions = [],
  expandable = false,
  renderExpandedRow,
  emptyMessage = 'データがありません',
}) => {
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('');
  const [selected, setSelected] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [actionRowId, setActionRowId] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    const newOrder = isAsc ? 'desc' : 'asc';
    setOrder(newOrder);
    setOrderBy(property);
    if (onSort) {
      onSort(property, newOrder);
    }
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = data.map((row) => row.id);
      setSelected(newSelected);
      if (onRowSelect) {
        onRowSelect(newSelected);
      }
    } else {
      setSelected([]);
      if (onRowSelect) {
        onRowSelect([]);
      }
    }
  };

  const handleRowSelect = (id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
    if (onRowSelect) {
      onRowSelect(newSelected);
    }
  };

  const handleActionClick = (event, rowId) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setActionRowId(rowId);
  };

  const handleActionClose = () => {
    setAnchorEl(null);
    setActionRowId(null);
  };

  const handleExpandRow = (rowId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedRows(newExpanded);
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  const formatCellValue = (value, column) => {
    if (value === null || value === undefined) {
      return '-';
    }

    switch (column.type) {
      case 'date':
        return new Date(value).toLocaleDateString('ja-JP');
      case 'datetime':
        return new Date(value).toLocaleString('ja-JP');
      case 'number':
        return value.toLocaleString();
      case 'boolean':
        return value ? 'はい' : 'いいえ';
      case 'chip':
        return (
          <Chip
            label={value}
            size="small"
            color={column.chipColor?.(value) || 'default'}
            variant={column.chipVariant || 'filled'}
          />
        );
      case 'custom':
        return column.render ? column.render(value, column) : value;
      default:
        return String(value);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {expandable && <TableCell />}
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={selected.length > 0 && selected.length < data.length}
                    checked={data.length > 0 && selected.length === data.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  style={{ minWidth: column.minWidth }}
                  sortDirection={orderBy === column.id ? order : false}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleRequestSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
              {actions.length > 0 && <TableCell align="center">アクション</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => {
              const isItemSelected = isSelected(row.id);
              const isExpanded = expandedRows.has(row.id);

              return (
                <React.Fragment key={row.id}>
                  <TableRow
                    hover
                    onClick={() => onRowClick && onRowClick(row)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    selected={isItemSelected}
                    sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    {expandable && (
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExpandRow(row.id);
                          }}
                        >
                          {isExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                        </IconButton>
                      </TableCell>
                    )}
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          checked={isItemSelected}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowSelect(row.id);
                          }}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell key={column.id} align={column.align || 'left'}>
                        {formatCellValue(row[column.id], column)}
                      </TableCell>
                    ))}
                    {actions.length > 0 && (
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={(e) => handleActionClick(e, row.id)}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                  {expandable && isExpanded && (
                    <TableRow>
                      <TableCell colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0) + 1}>
                        <Box sx={{ p: 2 }}>
                          {renderExpandedRow && renderExpandedRow(row)}
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      {pagination && (
        <TablePagination
          rowsPerPageOptions={[10, 20, 50]}
          component="div"
          count={pagination.total}
          rowsPerPage={pagination.limit}
          page={pagination.page - 1}
          onPageChange={(event, newPage) => onPageChange && onPageChange(newPage + 1)}
          onRowsPerPageChange={(event) => 
            onRowsPerPageChange && onRowsPerPageChange(parseInt(event.target.value, 10))
          }
          labelRowsPerPage="1ページあたりの行数:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} / ${count !== -1 ? count : `${to}以上`}`
          }
        />
      )}

      {/* アクションメニュー */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleActionClose}
      >
        {actions.map((action, index) => (
          <MenuItem
            key={index}
            onClick={() => {
              action.onClick(actionRowId);
              handleActionClose();
            }}
            disabled={action.disabled}
          >
            {action.icon && <Box sx={{ mr: 1 }}>{action.icon}</Box>}
            {action.label}
          </MenuItem>
        ))}
      </Menu>
    </Paper>
  );
};

export default DataTable;