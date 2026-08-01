import React from 'react';

export const Table = ({ 
    headers = [], 
    columns = [],
    rows = [],
    children, 
    className = '' 
}) => {
    const hasColumnsAndRows = columns && columns.length > 0;

    return (
        <div className={`overflow-x-auto border border-slate-100 bg-white rounded-2xl shadow-sm ${className}`}>
            <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                    <tr>
                        {hasColumnsAndRows ? (
                            columns.map((col, idx) => (
                                <th
                                    key={col.key || idx}
                                    scope="col"
                                    className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 ${col.className || ''}`}
                                >
                                    {col.header}
                                </th>
                            ))
                        ) : (
                            headers.map((header, idx) => (
                                <th
                                    key={idx}
                                    scope="col"
                                    className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                                >
                                    {header}
                                </th>
                            ))
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-sm text-slate-700">
                    {hasColumnsAndRows ? (
                        rows.map((row, rowIdx) => (
                            <TableRow key={rowIdx}>
                                {columns.map((col, colIdx) => (
                                    <TableCell key={col.key || colIdx} className={col.className}>
                                        {row[col.key]}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        children
                    )}
                </tbody>
            </table>
        </div>
    );
};

export const TableRow = ({ children, className = '' }) => (
    <tr className={`hover:bg-slate-50/50 transition-colors ${className}`}>
        {children}
    </tr>
);

export const TableCell = ({ children, className = '' }) => (
    <td className={`px-6 py-4 whitespace-nowrap align-middle ${className}`}>
        {children}
    </td>
);
