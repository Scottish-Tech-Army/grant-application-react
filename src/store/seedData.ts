import type { CommonField } from "../types/grants";

const now = () => new Date().toISOString();

let counter = 0;
const createId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `seed-${Date.now()}-${++counter}`;
};

const field = (group: string, label: string, value: string): CommonField => ({
  id: createId(),
  group,
  label,
  value,
  version: 1,
  versions: [
    {
      version: 1,
      label,
      value,
      updatedAt: now(),
    },
  ],
  createdAt: now(),
  updatedAt: now(),
});

export const createSeedFields = (): CommonField[] => [
  // ── Group 1: Organizational Biographical and General Information (18%) ──
  field(
    "Organizational Biographical and General Information",
    "Organization contact information",
    "Name: [Organisation Name]\nAddress: [Street, City, Postcode]\nPhone: [Phone]\nEmail: [Email]\nWebsite: [URL]"
  ),
  field(
    "Organizational Biographical and General Information",
    "Primary applicant contact information",
    "Name: [Full Name]\nTitle: [Job Title]\nEmail: [Email]\nPhone: [Phone]"
  ),
  field(
    "Organizational Biographical and General Information",
    "Organization founding date and history",
    "[Organisation Name] was founded in [Year]. We were established to [brief founding purpose]. Over the past [X] years we have grown to serve [number] beneficiaries annually."
  ),
  field(
    "Organizational Biographical and General Information",
    "Organization legal status",
    "Registered Charity Number: [Number]\nCompany Number (if applicable): [Number]\nJurisdiction: [e.g. England and Wales]"
  ),
  field(
    "Organizational Biographical and General Information",
    "Total number of staff",
    "Full-time: [Number]\nPart-time: [Number]\nTotal paid staff: [Number]\nTotal staff hours per week: [Number]"
  ),
  field(
    "Organizational Biographical and General Information",
    "Staff qualifications and experience",
    "[Summarise key qualifications, relevant professional experience, and any shared backgrounds of project staff.]"
  ),
  field(
    "Organizational Biographical and General Information",
    "Organization social media",
    "Facebook: [URL]\nTwitter/X: [URL]\nInstagram: [URL]\nLinkedIn: [URL]"
  ),

  // ── Group 2: Miscellaneous (3%) ──
  field(
    "Miscellaneous",
    "Authorised signatory and declarations",
    "Signatory name: [Full Name]\nTitle/Position: [Title]\nDate: [Date]\n\nI confirm that the information provided is accurate, that I am authorised to submit this application, and I accept the terms and conditions of the funding body."
  ),
  field(
    "Miscellaneous",
    "Related applications to supporting organisations",
    "[List any other funders or supporting organisations you are applying to, and describe the nature of each relationship — e.g. financial support, thought partnership, in-kind expert staff support.]"
  ),

  // ── Group 3: Corporate Delegation and Oversight (5%) ──
  field(
    "Corporate Delegation and Oversight",
    "Board of directors information",
    "Total board members: [Number]\nTotal executive staff: [Number]\nBoard contributes financially: [Yes/No — approx. £X per year]\n\nKey board characteristics: [Summarise relevant professional affiliations, backgrounds, and length of service.]"
  ),
  field(
    "Corporate Delegation and Oversight",
    "Board/CEO contact information",
    "Chair: [Name, Email, Phone]\nCEO/Executive Director: [Name, Email, Phone]"
  ),
  field(
    "Corporate Delegation and Oversight",
    "Strategies for continual improvement",
    "[Describe how the organisation ensures ongoing development of staff and governance — e.g. annual reviews, board training, external evaluations.]"
  ),

  // ── Group 4: Data Handling, Measurement, Evaluation and Reporting (4%) ──
  field(
    "Data Handling, Measurement and Evaluation",
    "Data collection and outcomes overview",
    "[Describe the types of data collected, key outcomes measured, deliverables tracked, and evaluation methods used for the project.]"
  ),
  field(
    "Data Handling, Measurement and Evaluation",
    "Data security policies and monitoring",
    "[Outline policies and procedures for data protection, secure storage, regular monitoring, and compliance with GDPR or equivalent regulations.]"
  ),
  field(
    "Data Handling, Measurement and Evaluation",
    "Methods for measuring impact",
    "[Describe the theories, frameworks, or tools used to measure outcomes — e.g. logic models, Theory of Change, pre/post surveys, validated scales.]"
  ),

  // ── Group 5: Project Demographics/Orientation/Status (2%) ──
  field(
    "Project Demographics and Status",
    "Populations served",
    "Annual number served: [Number]\nGeography: [Areas/regions]\nAge groups: [e.g. 18–25, 65+]\nEthnic populations: [Breakdown if known]\nGender: [Breakdown]\nDisability status: [% or description]\nSocioeconomic status: [Description]"
  ),
  field(
    "Project Demographics and Status",
    "Total population counts",
    "Total unique individuals served in the last year: [Number]\nProjected to serve next year: [Number]"
  ),

  // ── Group 6: Alternative Supports (<1%) ──
  field(
    "Alternative Supports",
    "Non-financial resources and partnerships",
    "[Describe non-financial resources available to support the project — e.g. pro-bono legal advice, volunteer networks, donated facilities, partner organisations providing in-kind expertise.]"
  ),

  // ── Group 7: How Did You Hear of Us (<1%) ──
  field(
    "How Did You Hear of Us",
    "How you heard about the funder",
    "[Explain how your organisation learned about this funding opportunity — e.g. referral from another charity, online search, funder directory, sector network event.]"
  ),

  // ── Group 8: COVID-19 Impact (<1%) ──
  field(
    "COVID-19 Impact",
    "Impact of COVID-19 on the organisation",
    "[Describe how the pandemic affected your organisation, current projects, service delivery, and anticipated future work. Note any lasting operational changes.]"
  ),

  // ── Group 9: Organizational Budgeting, Revenue Practices and Forecasts (20%) ──
  field(
    "Budgeting, Revenue and Forecasts",
    "Current operating budget",
    "Current year operating budget: £[Amount]\nExpected next year budget: £[Amount]\nFiscal year: [Start date] to [End date]"
  ),
  field(
    "Budgeting, Revenue and Forecasts",
    "Financial health summary",
    "[Rate and describe the condition of your finances, including strengths, challenges, and months of cash reserves remaining.]"
  ),
  field(
    "Budgeting, Revenue and Forecasts",
    "Revenue and funding sources",
    "[List main revenue streams — e.g. individual donors, government grants, earned income, corporate sponsors — with approximate amounts.]"
  ),
  field(
    "Budgeting, Revenue and Forecasts",
    "Financial management structure",
    "CFO/Finance lead: [Name, Qualifications]\n\n[Describe the financial management processes, internal controls, and audit history that demonstrate good stewardship of resources.]"
  ),
  field(
    "Budgeting, Revenue and Forecasts",
    "Long-term fundraising and sustainability plan",
    "[Outline your strategy for long-term financial sustainability — diversification of income, reserves policy, and plans for project continuation beyond the grant period.]"
  ),

  // ── Group 10: Collaborative Partnerships and Community Support (5%) ──
  field(
    "Collaborative Partnerships and Community Support",
    "Key collaborating organisations",
    "[List current partner organisations, their contributions, and their roles in supporting your work. Indicate which are most essential.]"
  ),
  field(
    "Collaborative Partnerships and Community Support",
    "Community needs and how they were identified",
    "[Describe the specific community needs your project addresses, their root causes, and how they were identified — e.g. needs assessments, community consultations, data analysis.]"
  ),
  field(
    "Collaborative Partnerships and Community Support",
    "Volunteer engagement",
    "Total volunteers: [Number]\nTotal volunteer hours per year: [Number]\n\n[Describe how volunteers are recruited, managed, and supported.]"
  ),

  // ── Group 11: Requested Grant Funding Related (20%) ──
  field(
    "Requested Grant Funding",
    "Why the grant is needed",
    "[Briefly describe why funding is needed, how the project originated, what communities are involved, and what opportunities exist if funded.]"
  ),
  field(
    "Requested Grant Funding",
    "Grant amount and type requested",
    "Amount requested: £[Amount]\nType: [Project-specific / General operating]\nGrant period: [Start date] to [End date]\nNumber of years: [X]"
  ),
  field(
    "Requested Grant Funding",
    "Itemised budget of planned grant spending",
    "[Provide a breakdown of how the grant funds will be allocated — e.g. staff costs, programme delivery, equipment, overheads, evaluation.]"
  ),
  field(
    "Requested Grant Funding",
    "Project timeline",
    "[Outline key milestones and deliverables with target dates for the project duration.]"
  ),
  field(
    "Requested Grant Funding",
    "Planned alternatives if not approved",
    "[Describe what the organisation will do if this grant application is unsuccessful — e.g. seek alternative funders, scale down the project, delay implementation.]"
  ),

  // ── Group 12: Time Spent Filling Out the Form (<1%) ──
  field(
    "Time Spent on Application",
    "Hours spent completing this application",
    "[Enter the approximate number of hours spent preparing and completing this grant application.]"
  ),

  // ── Group 13: What the Organization Does (22%) ──
  field(
    "What the Organization Does",
    "Mission statement",
    "[State the mission of your organisation in one to two sentences.]"
  ),
  field(
    "What the Organization Does",
    "Current programmes and services",
    "[List and briefly describe the organisation's current programmes, services, and activities.]"
  ),
  field(
    "What the Organization Does",
    "Geographic location and focus areas",
    "Headquarters: [Location]\nOperating areas: [List regions/communities]\nMain focus populations: [Description]"
  ),
  field(
    "What the Organization Does",
    "Project classification",
    "[Select all that apply: Arts & Culture, Community Development, Education, Health, Housing & Shelter, Public Safety, Environment, Other: ___]"
  ),
  field(
    "What the Organization Does",
    "Project impact areas and achievements",
    "[Describe the identified impact areas, key achievements from the past year, and the two main overall successes of the project.]"
  ),
  field(
    "What the Organization Does",
    "Project challenges and mitigation",
    "[Identify the main project risks — social, legal, financial, operational — and describe your mitigation strategies.]"
  ),
  field(
    "What the Organization Does",
    "Commitment to equity and inclusion",
    "[Describe how the organisation addresses internal inequalities and external disparities, including racial equity approaches and nondiscrimination policies.]"
  ),
];
