import { detectBqSqlFormat, parseBqSql } from './bq-sql.js';
import { detectFwReportFormat, parseFwReport } from './fw-report.js';

export function detectFormat(text) {
  if (detectBqSqlFormat(text)) return 'bq-sql';
  if (detectFwReportFormat(text)) return 'fw-report';
  return null;
}

export function loadCsv(text) {
  const fmt = detectFormat(text);
  switch (fmt) {
    case 'bq-sql':    return parseBqSql(text);
    case 'fw-report': return parseFwReport(text);
    default:          throw new Error('Unrecognized CSV format');
  }
}
