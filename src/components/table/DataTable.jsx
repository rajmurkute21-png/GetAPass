import React from 'react';
import { MoreHorizontal, Filter, Download, Check } from 'lucide-react';
import Button from '../common/Button';

export default function DataTable({
  title = 'Event bookings',
  subtitle = 'This page: 9 bookings · 7 paid · 1 pending · 1 failed',
  columns,
  data = [],
  selectedIds = [],
  onSelectRow,
  onSelectAll,
  onRowAction,
  onFilterClick,
  onExportClick,
  currentPage = 1,
  totalPages = 5,
  totalItems = 42,
  onPageChange
}) {
  const allSelected = data.length > 0 && data.every((row) => selectedIds.includes(row.id));

  return (
    <div
      className="gateapass-table-container"
      style={{
        backgroundColor: 'var(--color-white)',
        border: 'var(--border-default)',
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden'
      }}
    >
      {/* Table Header Bar */}
      <div
        style={{
          padding: '20px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          borderBottom: '1px solid var(--color-gray)'
        }}
      >
        <div>
          <h3
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--color-dark-text)',
              letterSpacing: '-0.3px'
            }}
          >
            {title}
          </h3>
          {subtitle && (
            <p style={{ fontSize: '13px', color: 'var(--color-muted-text)', marginTop: '2px' }}>
              {subtitle}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button variant="outline" size="compact" icon={Filter} onClick={onFilterClick}>
            Filter
          </Button>
          <Button variant="outline" size="compact" icon={Download} onClick={onExportClick}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Table Body */}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '14px'
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--color-gray)',
                backgroundColor: 'var(--color-white)'
              }}
            >
              <th style={{ width: '48px', padding: '12px 16px' }}>
                <div
                  onClick={() => onSelectAll && onSelectAll(!allSelected)}
                  style={{
                    width: '18px',
                    height: '18px',
                    border: '1px solid var(--color-gray)',
                    borderRadius: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    backgroundColor: allSelected ? 'var(--color-black)' : 'var(--color-white)',
                    color: 'var(--color-white)'
                  }}
                >
                  {allSelected && <Check size={12} strokeWidth={3} />}
                </div>
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    padding: '12px 16px',
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: 'var(--color-dark-text)'
                  }}
                >
                  {col.header}
                </th>
              ))}
              <th style={{ width: '48px', padding: '12px 16px' }} />
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const isSelected = selectedIds.includes(row.id);
              return (
                <tr
                  key={row.id}
                  style={{
                    borderBottom: '1px solid var(--color-gray)',
                    backgroundColor: isSelected ? 'var(--color-light-violet)' : 'transparent',
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  <td style={{ padding: '16px' }}>
                    <div
                      onClick={() => onSelectRow && onSelectRow(row.id)}
                      style={{
                        width: '18px',
                        height: '18px',
                        border: isSelected ? '1px solid var(--color-black)' : '1px solid var(--color-gray)',
                        borderRadius: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'var(--color-black)' : 'var(--color-white)',
                        color: 'var(--color-white)'
                      }}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </td>
                  {columns.map((col) => (
                    <td key={col.key} style={{ padding: '16px' }}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => onRowAction && onRowAction(row)}
                      style={{
                        width: '32px',
                        height: '32px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: 'var(--color-dark-text)',
                        borderRadius: '4px'
                      }}
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar matching Screenshot 27 */}
      <div
        style={{
          padding: '16px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '13px',
          color: 'var(--color-muted-text)',
          borderTop: '1px solid var(--color-gray)'
        }}
      >
        <div>
          Showing 1–{data.length} of {totalItems} bookings
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange && onPageChange(currentPage - 1)}
            style={{
              width: '32px',
              height: '32px',
              border: '1px solid var(--color-gray)',
              borderRadius: '4px',
              backgroundColor: 'var(--color-white)',
              color: 'var(--color-dark-text)',
              fontSize: '13px'
            }}
          >
            ‹
          </button>

          {[...Array(totalPages)].map((_, i) => {
            const page = i + 1;
            const isCurrent = page === currentPage;
            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange && onPageChange(page)}
                style={{
                  width: '32px',
                  height: '32px',
                  border: isCurrent ? '1px solid var(--color-black)' : '1px solid var(--color-gray)',
                  borderRadius: '4px',
                  backgroundColor: isCurrent ? 'var(--color-black)' : 'var(--color-white)',
                  color: isCurrent ? 'var(--color-white)' : 'var(--color-dark-text)',
                  fontSize: '13px',
                  fontWeight: isCurrent ? 600 : 400
                }}
              >
                {page}
              </button>
            );
          })}

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange && onPageChange(currentPage + 1)}
            style={{
              width: '32px',
              height: '32px',
              border: '1px solid var(--color-gray)',
              borderRadius: '4px',
              backgroundColor: 'var(--color-white)',
              color: 'var(--color-dark-text)',
              fontSize: '13px'
            }}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
