import jsPDF from 'jspdf';
const COLOR = {
  navy: '#0c1f3d',
  emerald: '#0f766e',
  teal: '#22c1aa',
  paperBlue: '#f1f6fb',
  paperMint: '#effaf7',
  card: '#ffffff',
  text: '#1f2937',
  muted: '#64748b',
  border: '#d8e2ea',
};

const PAGE = { top: 18, right: 16, bottom: 18, left: 16 };

const safeStr = (value) => {
  if (value === undefined || value === null) return '';
  return String(value).replace(/[^\x00-\xFF]/g, '');
};

const read = (obj, keys, fallback = '') => {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return fallback;
};

const parseMaybeJson = (raw, fallback) => {
  if (raw === undefined || raw === null || raw === '') return fallback;
  if (typeof raw === 'object') return raw;
  if (typeof raw !== 'string') return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const pageWidth = (doc) => doc.internal.pageSize.getWidth();
const pageHeight = (doc) => doc.internal.pageSize.getHeight();
const maxY = (doc) => pageHeight(doc) - PAGE.bottom;

const normalizeFields = (raw) => {
  const parsed = parseMaybeJson(raw, raw);

  if (Array.isArray(parsed)) {
    return parsed.map((field, index) => ({
      id: read(field, ['id'], index + 1),
      key: safeStr(read(field, ['key', 'label', 'name'], `Field ${index + 1}`)),
      value: safeStr(read(field, ['value'], '')),
      comments: safeStr(read(field, ['comments', 'comment', 'remarks'], '')),
    }));
  }

  if (parsed && Array.isArray(parsed.commonFields)) return normalizeFields(parsed.commonFields);
  if (parsed && Array.isArray(parsed.applicationFields)) return normalizeFields(parsed.applicationFields);
  return [];
};

const getValueByKey = (fields, expectedKeys) => {
  const lowered = expectedKeys.map((k) => k.toLowerCase());
  const hit = fields.find((f) => lowered.includes(String(f.key || '').toLowerCase()));
  return hit ? hit.value : '';
};

const getTemplateMeta = (app, integratedData) => {
  const fromObject = (obj) => {
    if (!obj || typeof obj !== 'object') return { title: '', version: '' };
    return {
      title: safeStr(read(obj, ['templateTitle', 'template_title', 'templateName', 'template_name'], '')),
      version: safeStr(read(obj, ['version', 'templateVersion', 'template_version'], '')),
    };
  };

  const direct = fromObject(app);
  if (direct.title || direct.version) return direct;

  const nestedTemplate = fromObject(read(app, ['template', 'templateInfo', 'commonData', 'common_data'], null));
  if (nestedTemplate.title || nestedTemplate.version) return nestedTemplate;

  const parsedTemplate = fromObject(parseMaybeJson(read(app, ['templateJson', 'template_json', 'linkedTemplateJson', 'linked_template_json'], ''), null));
  if (parsedTemplate.title || parsedTemplate.version) return parsedTemplate;

  const fromFields = {
    title: safeStr(getValueByKey(integratedData, ['templateTitle', 'template_title', 'templateName', 'template_name'])),
    version: safeStr(getValueByKey(integratedData, ['templateVersion', 'template_version', 'version'])),
  };
  return fromFields;
};

const formatTemplateDisplay = (title, version) => {
  const hasTitle = Boolean(title && title.trim());
  const hasVersion = Boolean(version && version.trim());
  if (hasTitle && hasVersion) return `${title} (${version})`;
  if (hasTitle) return title;
  if (hasVersion) return `Version ${version}`;
  return '-';
};

const normalizeApplication = (app, user) => {
  const integratedData = normalizeFields(read(app, ['dataJson', 'data_json'], []));
  const applicationSpecificData = normalizeFields(read(app, ['applicationDataJson', 'application_data_json'], []));

  const organizationName = getValueByKey(integratedData, ['organizationName', 'organisationName', 'ngoName']);
  const templateMeta = getTemplateMeta(app, integratedData);

  return {
    applicationNumber: safeStr(read(app, ['applicationNumber', 'application_number'], 'UNKNOWN-APP')),
    projectName: safeStr(read(app, ['projectName', 'project_name'], 'N/A')),
    funderName: safeStr(read(app, ['funderName', 'funder_name'], 'N/A')),
    comments: safeStr(read(app, ['comments', 'outcome_comments'], '')),
    createdAt: safeStr(read(app, ['createdAt', 'created_at'], '')),
    templateTitle: safeStr(templateMeta.title),
    templateVersion: safeStr(templateMeta.version),
    charityName: safeStr(read(user, ['charityName'], organizationName || 'Charity Applicant')),
    organizationName: safeStr(organizationName || '-'),
    integratedData,
    applicationSpecificData,
  };
};

const ensureSpace = (doc, y, requiredHeight, withHeader = false, app = null) => {
  if (y + requiredHeight <= maxY(doc)) return y;
  doc.addPage();
  if (withHeader && app) drawPageHeader(doc, app);
  return 38;
};

const drawPageHeader = (doc, app) => {
  const w = pageWidth(doc);

  doc.setFillColor(COLOR.navy);
  doc.rect(0, 0, w, 34, 'F');

  doc.setFillColor(COLOR.teal);
  doc.rect(0, 34, w, 2.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('FUNDING PROPOSAL DOSSIER', PAGE.left, 12.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Application: ${safeStr(app.applicationNumber)}`, PAGE.left, 21);
  doc.text(`Funder: ${safeStr(app.funderName)}`, w - PAGE.right, 21, { align: 'right' });
  doc.text(`Template: ${safeStr(formatTemplateDisplay(app.templateTitle, app.templateVersion))}`, PAGE.left, 28);
};

const drawCoverSummary = (doc, y, app) => {
  const w = pageWidth(doc) - PAGE.left - PAGE.right;

  doc.setFillColor(COLOR.paperBlue);
  doc.roundedRect(PAGE.left, y, w, 24, 3, 3, 'F');
  doc.setDrawColor(197, 216, 232);
  doc.roundedRect(PAGE.left, y, w, 24, 3, 3, 'S');

  doc.setTextColor(COLOR.navy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(safeStr(app.projectName), PAGE.left + 5, y + 10);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLOR.muted);
  const createdDate = app.createdAt ? new Date(app.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
  doc.text(`Submitted by ${safeStr(app.charityName)} on ${createdDate}`, PAGE.left + 5, y + 17);

  return y + 30;
};

const drawSectionTitle = (doc, y, title) => {
  const w = pageWidth(doc) - PAGE.left - PAGE.right;

  doc.setFillColor(243, 248, 253);
  doc.roundedRect(PAGE.left, y, w, 10, 2, 2, 'F');
  doc.setDrawColor(COLOR.border);
  doc.roundedRect(PAGE.left, y, w, 10, 2, 2, 'S');

  doc.setTextColor(COLOR.navy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(safeStr(title), PAGE.left + 4, y + 6.7);

  return y + 14;
};

const drawOverviewGrid = (doc, y, rows) => {
  let cursor = y;
  const contentW = pageWidth(doc) - PAGE.left - PAGE.right;
  const labelW = 52;

  rows.forEach((row) => {
    const valueLines = doc.splitTextToSize(safeStr(row.value || '-'), contentW - labelW - 7);
    const h = Math.max(10, valueLines.length * 5 + 4);

    doc.setFillColor(COLOR.card);
    doc.roundedRect(PAGE.left, cursor, contentW, h, 2, 2, 'F');
    doc.setDrawColor(COLOR.border);
    doc.roundedRect(PAGE.left, cursor, contentW, h, 2, 2, 'S');

    doc.setTextColor(COLOR.muted);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(`${safeStr(row.label)}`, PAGE.left + 4, cursor + 6.4);

    doc.setTextColor(COLOR.text);
    doc.setFont('helvetica', 'normal');
    doc.text(valueLines, PAGE.left + labelW, cursor + 6.4);

    cursor += h + 3;
  });

  return cursor;
};

const drawFieldCard = (doc, y, field, index, showValueLabel = true) => {
  const w = pageWidth(doc) - PAGE.left - PAGE.right;
  const value = safeStr(field.value || '-');
  const comments = safeStr(field.comments || '');
  const valueLines = doc.splitTextToSize(value, w - 12);
  const hasComments = comments && comments.trim() !== '';
  const commentLines = hasComments ? doc.splitTextToSize(comments, w - 12) : [];
  const h = 24 + valueLines.length * 5 + (hasComments ? commentLines.length * 5 + 8 : 0);

  doc.setFillColor(COLOR.card);
  doc.roundedRect(PAGE.left, y, w, h, 3, 3, 'F');
  doc.setDrawColor(COLOR.border);
  doc.roundedRect(PAGE.left, y, w, h, 3, 3, 'S');

  doc.setFillColor(236, 246, 255);
  doc.roundedRect(PAGE.left + 3, y + 3, w - 6, 8, 2, 2, 'F');
  doc.setTextColor(COLOR.navy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`${index + 1}. ${safeStr(field.key || `Field ${index + 1}`)}`, PAGE.left + 6, y + 8.4);

  const bodyY = y + 15;
  if (showValueLabel) {
    doc.setTextColor(COLOR.muted);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Value', PAGE.left + 6, bodyY);
  }

  doc.setTextColor(COLOR.text);
  doc.setFont('helvetica', 'normal');
  doc.text(valueLines, PAGE.left + 6, bodyY + 5);

  if (hasComments) {
    const commentY = bodyY + 6 + valueLines.length * 5;
    doc.setTextColor(COLOR.muted);
    doc.setFont('helvetica', 'bold');
    doc.text('Comments', PAGE.left + 6, commentY);

    doc.setTextColor(COLOR.text);
    doc.setFont('helvetica', 'normal');
    doc.text(commentLines, PAGE.left + 6, commentY + 5);
  }

  return y + h + 4;
};

const drawNoData = (doc, y, message) => {
  const w = pageWidth(doc) - PAGE.left - PAGE.right;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(PAGE.left, y, w, 12, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(PAGE.left, y, w, 12, 2, 2, 'S');

  doc.setTextColor(COLOR.muted);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.text(safeStr(message), PAGE.left + 4, y + 7.2);

  return y + 16;
};

const addFooter = (doc, app) => {
  const totalPages = doc.internal.getNumberOfPages();
  const w = pageWidth(doc);
  const h = pageHeight(doc);

  for (let i = 1; i <= totalPages; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(214, 224, 234);
    doc.line(PAGE.left, h - 10, w - PAGE.right, h - 10);

    doc.setTextColor(COLOR.muted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Confidential | ${safeStr(app.funderName)} | ${safeStr(app.applicationNumber)}`, PAGE.left, h - 5.3);
    doc.text(`Page ${i} of ${totalPages}`, w - PAGE.right, h - 5.3, { align: 'right' });
  }
};

export const exportApplicationPDF = (app, user) => {
  try {
    const doc = new jsPDF();
    const data = normalizeApplication(app, user);
    let y = PAGE.top;

    console.log('[PDF Export] Starting generation for app:', data.applicationNumber);

    drawPageHeader(doc, data);
    y = 38;
    y = drawCoverSummary(doc, y, data);
    y += 2;

    // 1. PROJECT & FUNDER OVERVIEW
    y = ensureSpace(doc, y, 60, true, data);
    y = drawSectionTitle(doc, y, '1. PROJECT & FUNDER OVERVIEW');
    const overviewRows = [
      { label: 'Project Name', value: data.projectName },
      { label: 'Funder Name', value: data.funderName },
      { label: 'Template', value: formatTemplateDisplay(data.templateTitle, data.templateVersion) },
      { label: 'Applicant', value: data.charityName },
    ];
    if (data.comments && data.comments.trim() !== '') {
      overviewRows.push({ label: 'Comments', value: data.comments });
    }
    y = drawOverviewGrid(doc, y, overviewRows);
    y += 6;

    // 2. INTEGRATED CHARITY DATA
    y = ensureSpace(doc, y, 24, true, data);
    y = drawSectionTitle(doc, y, '2. INTEGRATED CHARITY DATA');

    if (!data.integratedData.length) {
      y = drawNoData(doc, y, 'No integrated charity data found');
    } else {
      data.integratedData.forEach((field, index) => {
        y = ensureSpace(doc, y, 40, true, data);
        y = drawFieldCard(doc, y, field, index, false);
      });
    }

    y += 4;

    // 3. APPLICATION SPECIFIC DETAILS
    y = ensureSpace(doc, y, 24, true, data);
    y = drawSectionTitle(doc, y, '3. APPLICATION SPECIFIC DETAILS');

    if (!data.applicationSpecificData.length) {
      y = drawNoData(doc, y, 'No application specific fields found');
    } else {
      data.applicationSpecificData.forEach((field, index) => {
        y = ensureSpace(doc, y, 40, true, data);
        y = drawFieldCard(doc, y, field, index, false);
      });
    }

    addFooter(doc, data);
    doc.save(safeStr(`${data.applicationNumber}_Funder_Proposal.pdf`));
    console.log('[PDF Export] PDF Generated Successfully.');
  } catch (err) {
    console.error('[PDF Export] Failed to generate PDF:', err);
    alert('PDF could not be generated. Please verify the application data format.');
  }
};

export const exportApplicationToExcel = (app, user) => {
  try {
    const data = normalizeApplication(app, user);
    console.log('[Excel Export] Starting generation for app:', data.applicationNumber);

    // Create CSV content
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `Application Report - ${data.applicationNumber}\n\n`;
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

    // Header Section
    csvContent += `FUNDING PROPOSAL DOSSIER\n`;
    csvContent += `Application,${data.applicationNumber}\n`;
    csvContent += `Funder,${data.funderName}\n`;
    csvContent += `Template,${formatTemplateDisplay(data.templateTitle, data.templateVersion)}\n\n`;

    // Cover Summary
    csvContent += `Project Name,${data.projectName}\n`;
    csvContent += `Applicant,${data.charityName}\n`;
    csvContent += `Submitted,${data.createdAt ? new Date(data.createdAt).toLocaleString() : 'N/A'}\n\n`;

    // Overview Grid
    csvContent += `SECTION 1: PROJECT & FUNDER OVERVIEW\n`;
    csvContent += `Field,Value\n`;
    csvContent += `Project Name,${data.projectName}\n`;
    csvContent += `Funder Name,${data.funderName}\n`;
    csvContent += `Template,${formatTemplateDisplay(data.templateTitle, data.templateVersion)}\n`;
    csvContent += `Applicant,${data.charityName}\n`;
    if (data.comments && data.comments.trim() !== '') {
      csvContent += `Comments,"${data.comments.replace(/"/g, '""')}"\n`;
    }
    csvContent += '\n';

    // Integrated Charity Data
    csvContent += `SECTION 2: INTEGRATED CHARITY DATA\n`;
    if (data.integratedData.length === 0) {
      csvContent += `No integrated charity data found\n`;
    } else {
      csvContent += `Field Name,Value,Comments\n`;
      data.integratedData.forEach((field) => {
        csvContent += `"${field.key.replace(/"/g, '""')}","${field.value.replace(/"/g, '""')}","${(field.comments || '').replace(/"/g, '""')}"\n`;
      });
    }
    csvContent += '\n';

    // Application Specific Details
    csvContent += `SECTION 3: APPLICATION SPECIFIC DETAILS\n`;
    if (data.applicationSpecificData.length === 0) {
      csvContent += `No application specific fields found\n`;
    } else {
      csvContent += `Field Name,Value,Comments\n`;
      data.applicationSpecificData.forEach((field) => {
        csvContent += `"${field.key.replace(/"/g, '""')}","${field.value.replace(/"/g, '""')}","${(field.comments || '').replace(/"/g, '""')}"\n`;
      });
    }

    // Download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${safeStr(data.applicationNumber)}_Funder_Proposal.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('[Excel Export] CSV Generated Successfully.');
  } catch (err) {
    console.error('[Excel Export] Failed to generate Excel:', err);
    alert('Excel export could not be generated. Please verify the application data format.');
  }
};

export const exportApplicationToWord = (app, user) => {
  try {
    const data = normalizeApplication(app, user);
    console.log('[Word Export] Starting generation for app:', data.applicationNumber);

    // Create HTML content styled for Word
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; 
            margin: 1in; 
            line-height: 1.6; 
            color: #1f2937;
            background: white;
          }
          .header { 
            background: linear-gradient(135deg, #0c1f3d 0%, #0f766e 100%);
            color: white; 
            padding: 30px; 
            margin: -1in -1in 0 -1in;
            margin-bottom: 30px;
            page-break-after: avoid;
          }
          .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 15px; }
          .header-info { display: flex; flex-direction: column; font-size: 11px; opacity: 0.9; gap: 5px; }
          .header-info div { flex: 1; text-align: left; }
          
          .summary-box {
            background: #f1f6fb;
            border-left: 5px solid #22c1aa;
            padding: 20px;
            margin: 20px 0;
            page-break-inside: avoid;
          }
          .summary-box h3 { color: #0c1f3d; font-size: 16px; margin-bottom: 10px; }
          .summary-box p { font-size: 11px; color: #64748b; margin: 5px 0; }
          
          h2 { 
            color: #0c1f3d;
            font-size: 16px; 
            font-weight: 700;
            margin-top: 25px; 
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 3px solid #22c1aa;
            page-break-after: avoid;
          }
          
          h3 { 
            color: #334155;
            font-size: 12px; 
            font-weight: 600;
            margin-top: 15px; 
            margin-bottom: 8px;
          }
          
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 15px 0;
            page-break-inside: avoid;
          }
          
          thead {
            background: #e6f1ef;
          }
          
          th { 
            background-color: #e6f1ef;
            color: #0c1f3d;
            padding: 12px 10px;
            text-align: left;
            font-weight: 700;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: 1px solid #d8e2ea;
          }
          
          td { 
            padding: 10px;
            border: 1px solid #e2e8f0;
            font-size: 11px;
            word-wrap: break-word;
          }
          
          tbody tr:nth-child(2n) {
            background-color: #f8fafc;
          }
          
          tbody tr:hover {
            background-color: #eef9f7;
          }
          
          .field-label { 
            font-weight: 700;
            color: #0c1f3d;
            width: 30%;
            white-space: nowrap;
            background: #f0f5f9;
          }
          
          .no-data { 
            font-style: italic; 
            color: #94a3b8; 
            padding: 15px; 
            text-align: center;
            background: #f8fafc;
            border: 1px dashed #cbd5e1;
            border-radius: 4px;
          }
          
          .section-divider {
            height: 1px;
            background: #e2e8f0;
            margin: 30px 0;
            page-break-after: avoid;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 1px solid #d8e2ea;
            font-size: 9px;
            color: #94a3b8;
            text-align: center;
            page-break-before: avoid;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FUNDING PROPOSAL DOSSIER</h1>
          <div class="header-info">
            <div><strong>Application:</strong> ${safeStr(data.applicationNumber)}</div>
            <div><strong>Funder:</strong> ${safeStr(data.funderName)}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
          </div>
        </div>

        <div class="summary-box">
          <h3>📋 ${safeStr(data.projectName)}</h3>
          <p><strong>Applicant:</strong> ${safeStr(data.charityName)}</p>
          <p><strong>Organization:</strong> ${safeStr(data.organizationName)}</p>
          <p><strong>Template:</strong> ${safeStr(formatTemplateDisplay(data.templateTitle, data.templateVersion))}</p>
          <p><strong>Submitted:</strong> ${data.createdAt ? new Date(data.createdAt).toLocaleString() : 'N/A'}</p>
        </div>

        <div class="section-divider"></div>

        <h2>PROJECT & FUNDER OVERVIEW</h2>
        <table>
          <tbody>
            <tr><td class="field-label">Project Name</td><td>${safeStr(data.projectName)}</td></tr>
            <tr><td class="field-label">Funder Name</td><td>${safeStr(data.funderName)}</td></tr>
            <tr><td class="field-label">Template</td><td>${safeStr(formatTemplateDisplay(data.templateTitle, data.templateVersion))}</td></tr>
            <tr><td class="field-label">Applicant Organization</td><td>${safeStr(data.charityName)}</td></tr>
            ${data.comments && data.comments.trim() !== '' ? `<tr><td class="field-label">Comments</td><td>${safeStr(data.comments)}</td></tr>` : ''}
          </tbody>
        </table>

        ${data.integratedData.length > 0 ? `
          <div class="section-divider"></div>
          <h2>INTEGRATED CHARITY DATA</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 30%;">Field</th>
                <th style="width: 50%;">Value</th>
                <th style="width: 20%;">Comments</th>
              </tr>
            </thead>
            <tbody>
              ${data.integratedData.map((f, i) => `
                <tr>
                  <td><strong>${safeStr(f.key)}</strong></td>
                  <td>${safeStr(f.value)}</td>
                  <td>${safeStr(f.comments || '-')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        ${data.applicationSpecificData.length > 0 ? `
          <div class="section-divider"></div>
          <h2>APPLICATION SPECIFIC DETAILS</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 30%;">Field</th>
                <th style="width: 50%;">Value</th>
                <th style="width: 20%;">Comments</th>
              </tr>
            </thead>
            <tbody>
              ${data.applicationSpecificData.map((f, i) => `
                <tr>
                  <td><strong>${safeStr(f.key)}</strong></td>
                  <td>${safeStr(f.value)}</td>
                  <td>${safeStr(f.comments || '-')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <div class="footer">
          <p>Confidential | ${safeStr(data.funderName)} | ${safeStr(data.applicationNumber)}</p>
          <p>Page documents generated on ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeStr(data.applicationNumber)}_Funder_Proposal.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('[Word Export] Document Generated Successfully.');
  } catch (err) {
    console.error('[Word Export] Failed to generate Word document:', err);
    alert('Word document could not be generated. Please verify the application data format.');
  }
};

// Backward-compatible export for existing call sites.
export const exportApplicationToPDF = (app, user) => exportApplicationPDF(app, user);
