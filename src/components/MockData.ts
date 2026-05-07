export const mockTemplates = [
  {
    id: 2,
    charityId: 1,
    version: 'v2026-02-29',
    title: 'Financial Disclosure',
    description: 'Standardized reporting for annual revenue.',
    dataJson: JSON.stringify({
      commonFields: [
        { id: 101, key: 'Statutory Organization Tax Identification Number (UK Charity Commission)', value: 'GB-TX-192837465-HMRC-RECOGNIZED', comment: 'Required for all HMRC GIFT AID claims and annual baseline reporting.' },
        { id: 102, key: 'Total Audited Annual Gross Revenue (Previous Fiscal Year)', value: '£5,248,900.00 (verified by KPMG LLP)', comment: 'Must match the official figure on the submitted Form 990 / Charity Accounts.' },
        { id: 103, key: 'Restricted Funds Allocation and Overhead Expenditure Narrative', value: 'Overhead is capped at 12.5% for all core operations, with 87.5% directed towards community projects.', comment: 'High-priority transparency metric for institutional grantors.' }
      ]
    })
  }

];

export const initialApplications = [
  {
    id: 1, charity_id: 1, application_number: 'APP-001', project_name: 'Education Support Project',
    funder_name: 'ABC Foundation', common_data_id: 1, selected_common_keys: '[101, 102]',
    application_data_json: JSON.stringify({ applicationFields: [] }), created_at: '2024-03-20T10:00:00Z',
    created_by: 2, status: 'SUBMITTED', outcome_comments: 'Awaiting board review.'
  },
  {
    id: 2, charity_id: 1, application_number: 'APP-102', project_name: 'Clean Water Initiative',
    funder_name: 'Global Welfare Org', common_data_id: 1, selected_common_keys: '[101]',
    application_data_json: JSON.stringify({ applicationFields: [] }), created_at: '2024-03-22T14:30:00Z',
    created_by: 2, status: 'FUNDED', outcome_comments: 'Project fully funded.'
  },
  {
    id: 3, charity_id: 1, application_number: 'APP-105', project_name: 'Solar Power for Schools',
    funder_name: 'Green Energy Fund', common_data_id: 2, selected_common_keys: '[201, 202]',
    application_data_json: JSON.stringify({ applicationFields: [] }), created_at: '2024-03-25T09:12:00Z',
    created_by: 2, status: 'DRAFT', outcome_comments: ''
  },
  {
    id: 4, charity_id: 1, application_number: 'APP-201', project_name: 'Urban Literacy Drive',
    funder_name: 'City Council', common_data_id: 1, selected_common_keys: '[102]',
    application_data_json: JSON.stringify({ applicationFields: [] }), created_at: '2024-03-28T11:45:00Z',
    created_by: 2, status: 'REJECTED', outcome_comments: 'Budget cuts.'
  },
  {
    id: 5, charity_id: 1, application_number: 'APP-088', project_name: 'Healthcare Outreach',
    funder_name: 'Medical Trust', common_data_id: 1, selected_common_keys: '[101, 103]',
    application_data_json: JSON.stringify({ applicationFields: [] }), created_at: '2024-03-29T16:00:00Z',
    created_by: 2, status: 'SUBMITTED', outcome_comments: 'Phase 1 passed.'
  },
  {
    id: 6, charity_id: 1, application_number: 'APP-301', project_name: 'Youth Mentor Program',
    funder_name: 'City Council', common_data_id: 2, selected_common_keys: '[201]',
    application_data_json: JSON.stringify({ applicationFields: [] }), created_at: '2024-03-30T10:00:00Z',
    created_by: 2, status: 'FUNDED', outcome_comments: 'Strong focus on scalability.'
  },
  {
    id: 7, charity_id: 1, application_number: 'APP-305', project_name: 'Rural Connectivity',
    funder_name: 'ABC Foundation', common_data_id: 1, selected_common_keys: '[101]',
    application_data_json: JSON.stringify({ applicationFields: [] }), created_at: '2024-04-01T12:00:00Z',
    created_by: 2, status: 'SUBMITTED', outcome_comments: 'Technical review pending.'
  },
  {
    id: 8, charity_id: 1, application_number: 'APP-401', project_name: 'Community Garden',
    funder_name: 'City Council', common_data_id: 2, selected_common_keys: '[202]',
    application_data_json: JSON.stringify({ applicationFields: [] }), created_at: '2024-04-02T15:30:00Z',
    created_by: 2, status: 'FUNDED', outcome_comments: 'High community engagement noted.'
  },
  {
    id: 9, charity_id: 1, application_number: 'APP-405', project_name: 'Digital Skills Training',
    funder_name: 'Global Welfare Org', common_data_id: 1, selected_common_keys: '[102]',
    application_data_json: JSON.stringify({ applicationFields: [] }), created_at: '2024-04-05T09:00:00Z',
    created_by: 2, status: 'REJECTED', outcome_comments: 'Out of scope for this round.'
  },
  {
    id: 10, charity_id: 1, application_number: 'APP-502', project_name: 'Art Therapy Workshop',
    funder_name: 'Medical Trust', common_data_id: 1, selected_common_keys: '[101]',
    application_data_json: JSON.stringify({ applicationFields: [] }), created_at: '2024-04-08T14:20:00Z',
    created_by: 2, status: 'FUNDED', outcome_comments: 'Innovative therapeutic approach.'
  },
  {
    id: 11, charity_id: 1, application_number: 'APP-508', project_name: 'Waste Management Pilot',
    funder_name: 'Green Energy Fund', common_data_id: 2, selected_common_keys: '[201, 202]',
    application_data_json: JSON.stringify({ applicationFields: [] }), created_at: '2024-04-10T11:00:00Z',
    created_by: 2, status: 'SUBMITTED', outcome_comments: 'Initial appraisal positive.'
  },
  {
    id: 12, charity_id: 1, application_number: 'APP-601', project_name: 'Homelessness Prevention',
    funder_name: 'ABC Foundation', common_data_id: 1, selected_common_keys: '[101, 102]',
    application_data_json: JSON.stringify({ applicationFields: [] }), created_at: '2024-04-12T16:45:00Z',
    created_by: 2, status: 'FUNDED', outcome_comments: 'Urgent social impact alignment.'
  }
];
