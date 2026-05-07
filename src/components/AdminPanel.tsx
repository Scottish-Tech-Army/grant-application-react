import { useState, useEffect, useRef } from 'react';
import CharityBot from './CharityBot';
import styles from './AdminPanel.module.css';
import { authFetch } from '../utils/auth';

import { User, Template, TemplateField } from '../types';

interface AdminPanelProps {
  user: User;
}

export default function AdminPanel({ user }: AdminPanelProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editFields, setEditFields] = useState<TemplateField[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isBotEnabled, setIsBotEnabled] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      console.log(`[Admin] Synchronizing Schema Directory for Charity ${user.charityId || 101}...`);

      try {
        const charityId = user.charityId || 101;
        const response = await authFetch(`http://localhost:8081/app/common-data/charity/${charityId}`);
        if (!response.ok) throw new Error('Backend unreachable');
        const data = await response.json();
        setTemplates(data);
      } catch (err) {
        console.warn("[Admin] API Fetch failed, restoring High-Fidelity Mock Directory.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, [user.charityId]);

  const handleEdit = (tmpl: Template) => {
    setEditingTemplate(tmpl);
    setValidationErrors([]);
    // dataJson may arrive as a stringified JSON string from the backend — parse it if so
    let fields: TemplateField[] = [];
    if (typeof tmpl.dataJson === 'string') {
      try {
        fields = JSON.parse(tmpl.dataJson as string);
      } catch {
        fields = [];
      }
    } else {
      fields = tmpl.dataJson || [];
    }
    setEditFields(fields);
  };

  const handleCreateNew = () => {
    const freshTemplate: Template = {
      id: Date.now(),
      charity_id: user.charityId,
      version: "0",
      title: '', // Start empty for validation
      description: '',
      created_at: new Date().toISOString(),
      is_active: true,
      data_json: ''
    };
    setEditingTemplate(freshTemplate);
    setEditFields([]);
    setValidationErrors([]);
  };

  const addField = () => {
    setEditFields([...editFields, { id: Date.now() + Math.random(), key: '', value: '', comments: '' }]);
  };

  const updateField = (index: number, fieldName: keyof TemplateField, newVal: string) => {
    const updated = [...editFields];
    (updated[index] as any)[fieldName] = newVal;
    setEditFields(updated);
    
    // Dynamically clear schema error if user is typing
    if (newVal.trim() !== '') {
      setValidationErrors(prev => prev.filter(err => !err.includes("schema")));
    }
  };

  const removeField = (index: number) => {
    const updated = editFields.filter((_, i) => i !== index);
    setEditFields(updated);
  };

  const saveAsNewVersion = async () => {
    if (!editingTemplate) return;
    setValidationErrors([]);

    const errors: string[] = [];
    if (!editingTemplate.templateTitle || editingTemplate.templateTitle.trim() === '') {
      errors.push("Template Title is required.");
    }

    const filteredFields = editFields.filter(f => f.key.trim() !== '' || f.value.trim() !== '');
    if (filteredFields.length === 0) {
      errors.push("At least one schema field is required in the template.");
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Now send the array directly as requested, not a stringified version
    const dataJson = filteredFields.map(f => ({
      key: f.key,
      value: f.value,
      comments: f.comments || ""
    }));

    const nextVersion = new Date().toISOString().split('.')[0];
    
    const apiPayload = {
      templateTitle: editingTemplate.templateTitle || editingTemplate.title || "New Template",
      description: editingTemplate.description || "",
      charityId: user.charityId,
       dataJson: JSON.stringify(dataJson), // Stringified version
      version: nextVersion
    };
    let id = String();

    try {
      const response = await authFetch('http://localhost:8081/app/common-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload)
      });

      if (!response.ok){
         throw new Error('API failed');
      }
      id = String((await response.text()).trim());
      console.log("Template saved successfully to backend.");
    } catch (err) {
      console.warn("API save failed, persisting locally for now.");
    }

    // Local state update to ensure UI is snappy
    const newTmpl: Template = {
      ...editingTemplate,
      id:id,
      charity_id: user.charityId,
      version: nextVersion,
      dataJson: filteredFields,
      created_at: new Date().toISOString()
    };

    setTemplates([newTmpl, ...templates]);
    setEditingTemplate(null);
    setEditFields([]);
  };

  // Filter templates based on search term
  const filteredTemplates = templates.filter(t => {
    const title = t.templateTitle || t.title || '';
    const desc = t.description || '';
    return title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      desc.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Sort logic
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    let aVal: string | number = '';
    let bVal: string | number = '';

    if (sortConfig.key === 'title') {
      aVal = (a.templateTitle || a.title || '').toLowerCase();
      bVal = (b.templateTitle || b.title || '').toLowerCase();
    } else if (sortConfig.key === 'version') {
      aVal = a.version || '';
      bVal = b.version || '';
    } else if (sortConfig.key === 'date') {
      aVal = new Date(a.createdAt || a.created_at || 0).getTime();
      bVal = new Date(b.createdAt || b.created_at || 0).getTime();
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  if (editingTemplate) {
    return (
      <div className={`animate-fade-in ${styles.root}`}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 className={styles.pageTitle}>Edit Charity Data Template</h2>
          <p className={styles.pageSubtitle}>
            Charity: {user.charityName || editingTemplate.charity_id}
          </p>
        </div>

        {validationErrors.length > 0 && (
          <div className={styles.errorBanner}>
            <h4 className={styles.errorTitle}>
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
              Mandatory Data Required
            </h4>
            <ul className={styles.errorList}>
              {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}

        <div className={`card mb-4 ${styles.editCard}`}>
          <div className={styles.editMetaRow}>
            <div className={`form-group mb-0 ${styles.editMetaField}`}>
              <label className={`form-label ${styles.editMetaLabel}`}>
                Template Title <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input type="text" className={`form-control ${validationErrors.some(e => e.includes("Title")) ? 'is-invalid' : ''}`} 
                style={validationErrors.some(e => e.includes("Title")) ? { border: '1px solid #ef4444' } : {}}
                value={editingTemplate.templateTitle}
                onChange={e => {
                  setEditingTemplate({ ...editingTemplate, templateTitle: e.target.value });
                  if (e.target.value.trim() !== '') {
                    setValidationErrors(prev => prev.filter(err => !err.includes("Title")));
                  }
                }} />
            </div>
            <div className={`form-group mb-0 ${styles.editMetaField}`}>
              <label className={`form-label ${styles.editMetaLabel}`}>Description</label>
              <input type="text" className="form-control" value={editingTemplate.description}
                onChange={e => setEditingTemplate({ ...editingTemplate, description: e.target.value })} />
            </div>
          </div>

          <h3 className={styles.sectionTitle}>
            Schema Fields <span style={{ color: '#ef4444' }}>*</span>
          </h3>
          <p className={styles.sectionHint}>Configure the required key-value pairs inline using text areas.</p>

          <div className={styles.schemaFieldsList} style={validationErrors.some(e => e.includes("schema")) ? { 
            border: '2px solid #fee2e2', 
            padding: '1rem', 
            borderRadius: '12px',
            backgroundColor: '#fffafb'
          } : {}}>
            {editFields.length === 0 && (
              <div className={styles.schemaEmptyState}>
                <p className={styles.schemaEmptyText}>No schema fields defined yet.</p>
                <button className="btn btn-primary" onClick={addField}>+ Start Adding Schema Fields</button>
              </div>
            )}
            {editFields.map((f, i) => (
              <div key={f.id} className={styles.schemaFieldRow}>
                <textarea className={`form-control ${styles.textareaKey}`} placeholder="Key (e.g. tax_id)"
                  value={f.key} onChange={e => updateField(i, 'key', e.target.value)} />
                <textarea className={`form-control ${styles.textareaValue}`} placeholder="Value / Default Text"
                  value={f.value} onChange={e => updateField(i, 'value', e.target.value)} />
                <textarea className={`form-control ${styles.textareaComment}`} placeholder="Notes..."
                  value={f.comments || ''} onChange={e => updateField(i, 'comments', e.target.value)} />

                <div className={styles.schemaActionCol}>
                  {i === editFields.length - 1 && (
                    <>
                      <button className={styles.btnAdd} onClick={addField} title="Add Field">+</button>
                      <button className={styles.btnRemove} onClick={() => removeField(i)} title="Delete Field">−</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.editActions}>
          <button className={`btn btn-outline ${styles.btnDiscard}`} onClick={() => setEditingTemplate(null)}>Discard Changes</button>
          <button className={`btn btn-primary ${styles.btnSaveTemplate}`} onClick={saveAsNewVersion}>Save as New Template</button>
        </div>

        <CharityBot isEnabled={isBotEnabled} />
      </div>
    );
  }

  // ---- RENDER LIST VIEW ---- //
  return (
    <div className={`animate-fade-in ${styles.root}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className={styles.pageTitle}>Charity Data Templates</h2>
          <p className={styles.pageSubtitle}>
            MANAGE STRUCTURAL APPLICATION SCHEMAS FOR: {user.charityName?.toUpperCase() || `CHARITY #${user.charityId}`}
          </p>
        </div>
        <div className="flex items-center" style={{ gap: '1rem' }}>
          <div className={styles.voiceAssistantBadge}>
            <span className={styles.voiceAssistantLabel}>VOICE ASSISTANT</span>
            <input type="checkbox" checked={isBotEnabled} onChange={e => setIsBotEnabled(e.target.checked)} className={styles.voiceAssistantCheckbox} />
          </div>
          <button className="btn btn-primary" onClick={handleCreateNew}>+ Create New Template</button>
        </div>
      </div>

      <div className={styles.directoryActionRow}>
        <h3 className={styles.tableHeader}>Template Directory</h3>
        <div className={styles.searchWrapper}>
          <svg className={styles.searchIcon} width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" className={styles.searchInput} placeholder="Search templates by title or description..." 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

        <div className={`table-container ${styles.tableContainer}`} style={{ borderRadius: '12px', overflow: 'hidden' }}>
          <table>
            <thead>
              <tr className={styles.theadRow}>
                <th className={styles.thSortable} style={{ width: '30%' }} onClick={() => requestSort('title')}>
                  Template Title <span className={styles.thSortIcon}>{getSortIcon('title')}</span>
                </th>
                <th className={styles.th} style={{ width: '30%' }}>Description</th>
                <th className={styles.thSortable} style={{ width: '10%' }} onClick={() => requestSort('version')}>
                  Version <span className={styles.thSortIcon}>{getSortIcon('version')}</span>
                </th>
                <th className={styles.thSortable} style={{ width: '15%' }} onClick={() => requestSort('date')}>
                  Created Date <span className={styles.thSortIcon}>{getSortIcon('date')}</span>
                </th>
                <th className={styles.th} style={{ width: '15%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedTemplates.length === 0 ? (
                <tr>
                  <td colSpan={5} className={`text-center ${styles.tdEmpty}`}>
                    <div className={styles.emptyStateContainer}>
                      <div className={styles.emptyStateIcon}>🔍</div>
                      <p>{isLoading ? 'Synchronizing Template Directory...' : 'No templates found matching your search.'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedTemplates.map(t => {
                  const displayTitle = t.templateTitle || t.title || 'Untitled Template';
                  const dateStr = t.createdAt || t.created_at || '';
                  const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
                  return (
                    <tr key={t.id}>
                      <td>
                        <div className="flex items-center">
                          <div className={styles.templateIconWrap}>
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                          </div>
                          <strong style={{ color: 'var(--primary)', fontSize: '0.95rem', marginLeft: '0.9rem' }}>{displayTitle}</strong>
                        </div>
                      </td>
                      <td className={styles.tdDescription}>{t.description}</td>
                      <td><span className="badge badge-blue">v{t.version || '1'}</span></td>
                      <td className={styles.tdDate}>{formattedDate}</td>
                      <td>
                        <button className={`btn btn-outline ${styles.btnViewEdit}`} onClick={() => handleEdit(t)}>View / Edit</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
}
