import { COMMON_FIELD_GROUPS } from '../constants/commonFieldGroups';
import type { Application, CommonField } from '../types/models';

function normalizeLines(text: string) {
  return text.replaceAll('\r\n', '\n').trimEnd();
}

export function buildApplicationExport(
  application: Application,
  commonFields: CommonField[],
) {
  const byId = new Map(commonFields.map((f) => [f.id, f] as const));

  const selectedCommon = application.commonFieldIds
    .map((id) => byId.get(id))
    .filter(Boolean) as CommonField[];

  const groupedCommon = selectedCommon.reduce((acc, field) => {
    if (!acc.has(field.group)) {
      acc.set(field.group, []);
    }
    acc.get(field.group)?.push(field);
    return acc;
  }, new Map<string, CommonField[]>());

  const orderedGroups = [
    ...COMMON_FIELD_GROUPS,
    ...[...groupedCommon.keys()].filter((group) => !COMMON_FIELD_GROUPS.includes(group)),
  ];

  const lines: string[] = [];
  lines.push(`Application: ${application.name}`, `Created: ${application.createdAt}`, '');

  if (selectedCommon.length > 0) {
    lines.push('Common Fields');
    for (const group of orderedGroups) {
      const groupFields = groupedCommon.get(group);
      if (!groupFields || groupFields.length === 0) continue;
      lines.push(group);
      for (const field of groupFields) {
        lines.push(`  - ${field.label}: ${field.value}`);
      }
    }
    lines.push('');
  }

  if (application.customFields.length > 0) {
    lines.push('Application Fields');
    for (const field of application.customFields) {
      lines.push(`- ${field.label}: ${field.value}`);
    }
    lines.push('');
  }

  return normalizeLines(lines.join('\n')) + '\n';
}

export function exportFileName(application: Application) {
  const safeName = application.name
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/(^-+|-+$)/g, '')
    .slice(0, 60);

  const date = new Date(application.createdAt);
  const ymd = Number.isNaN(date.getTime())
    ? 'export'
    : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate(),
      ).padStart(2, '0')}`;

  return `${safeName || 'application'}_${ymd}.txt`;
}
