/**
 * analyzer.js — Local Grant Application Intelligence Engine
 * Pure JavaScript, no external APIs. Runs entirely in the browser.
 */

// Key sections that grant funders consistently look for
const KEY_SECTIONS = [
  {
    key: 'mission',
    label: 'Mission Statement',
    keywords: ['mission', 'purpose', 'aim', 'vision', 'exist to', 'founded'],
    tip: 'Funders prioritise a clear, compelling mission. Aim for 50–100 words.',
  },
  {
    key: 'beneficiaries',
    label: 'Beneficiaries & Impact',
    keywords: ['beneficiar', 'impact', 'reach', 'serve', 'support', 'people', 'community', 'number of'],
    tip: 'Include specific numbers and demographics of who you help.',
  },
  {
    key: 'budget',
    label: 'Financial Information',
    keywords: ['budget', 'cost', 'income', 'expenditure', 'financial', 'funding', 'grant', 'reserves', 'salary'],
    tip: 'Most funders require a clear budget breakdown and evidence of financial health.',
  },
  {
    key: 'governance',
    label: 'Governance & Team',
    keywords: ['trustee', 'board', 'governance', 'staff', 'volunteer', 'team', 'ceo', 'director', 'lead officer'],
    tip: 'Demonstrate strong organisational leadership and accountability.',
  },
  {
    key: 'outcomes',
    label: 'Outcomes & Evaluation',
    keywords: ['outcome', 'measure', 'evaluate', 'evidence', 'success', 'kpi', 'monitor', 'impact', 'result'],
    tip: 'Show how you will measure and report on your results.',
  },
  {
    key: 'geography',
    label: 'Geographic Reach',
    keywords: ['area', 'region', 'location', 'geographic', 'community', 'local', 'national', 'county', 'district'],
    tip: 'Specify where your work happens — many funders have geographic restrictions.',
  },
]

// Smart word-count targets by field type
const WORD_TARGETS = {
  mission: 50,
  beneficiaries: 30,
  budget: 10,
  governance: 20,
  outcomes: 40,
  geography: 15,
  default: 25,
}

// ─── AI Content Suggestion Templates ────────────────────────────────────────
// Suggested content, key phrases, and checklists for each key section
const SUGGESTED_CONTENT = {
  mission: {
    template:
      '[Organisation name] exists to [core purpose]. We work with [target group] in [area] to [key activity], with the vision of [long-term goal]. Since [year founded], we have [key achievement or milestone].',
    keyPhrases: [
      'our mission', 'we exist to', 'our purpose', 'our vision',
      'core values', 'founded in', 'committed to', 'we believe',
    ],
    checklist: [
      'Why your organisation exists',
      'Who you primarily serve',
      'What activities you deliver',
      'Your long-term vision or goal',
      'Any founding story or key milestone',
    ],
    strongExample:
      'Bright Futures Foundation exists to break the cycle of youth homelessness in Greater Manchester. Since 2015, we have supported over 2,000 young people aged 16–25 through emergency housing, mentoring, and employment training. Our vision is a city where no young person faces a night without safe shelter.',
  },
  beneficiaries: {
    template:
      'Our work directly benefits [number] [target group] per year across [geographic area]. Our beneficiaries include [demographics, e.g. age, background, needs]. In the last year, [specific impact statistic, e.g. "85% of participants reported improved wellbeing"].',
    keyPhrases: [
      'beneficiaries', 'people we serve', 'target group', 'demographics',
      'per year', 'directly benefits', 'impact on', 'reach',
    ],
    checklist: [
      'Specific number of beneficiaries',
      'Demographics (age, background, location)',
      'How they are identified or referred',
      'Evidence of need in this group',
      'At least one measurable impact statistic',
    ],
    strongExample:
      'We support 350 isolated older adults (aged 65+) annually across rural Shropshire, many of whom live alone and have limited mobility. 92% of participants report reduced loneliness after joining our befriending programme, and 78% said it improved their mental health.',
  },
  budget: {
    template:
      'Total project cost: £[amount]. We are requesting £[amount] from [funder name]. Match funding of £[amount] is confirmed from [source]. Our annual organisational income is £[amount], with free reserves of £[amount], representing [X] months of operating costs.',
    keyPhrases: [
      'total cost', 'requesting', 'match funding', 'annual income',
      'reserves', 'budget breakdown', 'cost per beneficiary', 'value for money',
    ],
    checklist: [
      'Total project cost with breakdown',
      'Amount requested from this funder',
      'Other funding sources (confirmed/pending)',
      'Annual organisational income',
      'Free reserves and policy',
      'Cost per beneficiary if applicable',
    ],
    strongExample:
      'The total project cost is £45,000 over 12 months. We are requesting £30,000 from this fund. Match funding of £10,000 is confirmed from the local council, with £5,000 from our own reserves. Our annual income is £180,000, with free reserves of £42,000 (3 months operating costs).',
  },
  governance: {
    template:
      'Our board comprises [number] trustees with expertise in [areas, e.g. finance, safeguarding, sector knowledge]. The project will be led by [role and name], supported by [number] staff and [number] volunteers. We hold [relevant accreditation or quality mark].',
    keyPhrases: [
      'trustees', 'board', 'governance structure', 'led by',
      'staff team', 'volunteers', 'safeguarding', 'accountability',
    ],
    checklist: [
      'Number of trustees and key expertise',
      'Project lead role and relevant experience',
      'Staff and volunteer capacity',
      'Safeguarding policies in place',
      'Any quality marks or accreditations',
    ],
    strongExample:
      'Our board of 8 trustees includes a qualified accountant, a safeguarding lead, and three members with lived experience. The programme is managed by our full-time Project Coordinator (in post since 2021), supported by 4 part-time staff and 12 trained volunteers. We hold the NCVO Trusted Charity mark.',
  },
  outcomes: {
    template:
      'We will measure success through the following outcomes:\n1. [Outcome 1] — measured via [method]\n2. [Outcome 2] — measured via [method]\n3. [Outcome 3] — measured via [method]\n\nData will be collected using [tools, e.g. surveys, case tracking] and reported [frequency]. Our theory of change is grounded in [evidence base].',
    keyPhrases: [
      'outcomes', 'measure', 'KPIs', 'theory of change',
      'evaluation', 'evidence', 'data collection', 'reported quarterly',
    ],
    checklist: [
      'At least 3 specific, measurable outcomes',
      'Clear measurement methods for each',
      'Data collection tools (surveys, tracking)',
      'Reporting frequency and to whom',
      'Evidence base or theory of change',
    ],
    strongExample:
      'Key outcomes: (1) 80% of participants gain a recognised qualification — tracked via certification records; (2) 60% enter employment within 6 months — tracked via follow-up calls; (3) 90% report improved confidence — measured via pre/post validated wellbeing surveys. We report quarterly to our board and annually to funders.',
  },
  geography: {
    template:
      'This project will operate in [specific areas, boroughs, postcodes]. We serve [local/regional/national] communities, focusing on [area characteristics, e.g. high deprivation, rural isolation]. The area is ranked in the [X]% most deprived nationally (IMD data).',
    keyPhrases: [
      'geographic area', 'operates in', 'local community', 'borough',
      'deprivation', 'postcode', 'regional', 'nationwide',
    ],
    checklist: [
      'Specific area, borough, or postcode(s)',
      'Whether local, regional, or national',
      'Characteristics of the area and why it matters',
      'Deprivation data or needs evidence',
      'Any funder geographic restrictions addressed',
    ],
    strongExample:
      'The project serves three wards in Tower Hamlets (Whitechapel, Shadwell, and Stepney Green), an area ranked in the 10% most deprived nationally. 38% of children live in poverty and access to youth services has halved since 2015. We deliver all activities within walking distance of participants\' homes.',
  },
  default: {
    template:
      '[Provide a clear, specific answer to this question. Include relevant facts, figures, and evidence where possible. Most funders value concise, jargon-free language.]',
    keyPhrases: [
      'specific evidence', 'clear and concise', 'measurable', 'demonstrate',
    ],
    checklist: [
      'Answer the question directly',
      'Include specific facts or figures',
      'Keep language clear and jargon-free',
      'Provide evidence where possible',
    ],
    strongExample: null,
  },
}

// ─── Success Metric Weights ─────────────────────────────────────────────────
// Weights used to calculate which improvements matter most for success
const SUCCESS_METRICS = {
  sectionCoverage: { weight: 0.30, label: 'Section Coverage', description: 'Cover all 6 key sections funders look for' },
  answerQuality:   { weight: 0.25, label: 'Answer Quality',   description: 'Provide detailed, specific answers (not brief)' },
  wordCount:       { weight: 0.15, label: 'Word Count',       description: 'Most successful applications have 500+ words' },
  keyPhrases:      { weight: 0.15, label: 'Key Phrases',      description: 'Include terminology funders expect to see' },
  completeness:    { weight: 0.15, label: 'Completeness',     description: 'Fill in every field — empty fields score zero' },
}

function getFieldAnswer(field) {
  return (field.value || field.answer || '').trim()
}

function wordCount(text) {
  return text ? text.trim().split(/\s+/).filter(Boolean).length : 0
}

function charCount(text) {
  return text ? text.trim().length : 0
}

function detectFieldSection(label) {
  const lowerLabel = label.toLowerCase()
  for (const section of KEY_SECTIONS) {
    if (section.keywords.some((kw) => lowerLabel.includes(kw))) {
      return section.key
    }
  }
  return 'default'
}

function getFieldQuality(answer, sectionKey) {
  const wc = wordCount(answer)
  const target = WORD_TARGETS[sectionKey] || WORD_TARGETS.default

  if (!answer || wc === 0) return { level: 'empty', label: 'Empty', color: 'red', score: 0 }
  if (wc < Math.round(target * 0.3)) return { level: 'brief', label: 'Brief', color: 'orange', score: 30 }
  if (wc < Math.round(target * 0.7)) return { level: 'fair', label: 'Fair', color: 'yellow', score: 65 }
  return { level: 'good', label: 'Strong', color: 'green', score: 100 }
}

/**
 * Main analysis function — call with a full application object from the API
 */
export function analyzeApplication(application) {
  if (!application) return null

  const commonFields = (application.common_fields || []).map((f) => ({
    label: f.label,
    answer: f.value || '',
    type: 'common',
    group: f.group_name || null,
  }))

  const customFields = (application.custom_fields || []).map((f) => ({
    label: f.label,
    answer: f.answer || '',
    type: 'custom',
    group: null,
  }))

  // Also handle the export format (fields array with question/answer)
  const exportFields = (application.fields || []).map((f) => ({
    label: f.question,
    answer: f.answer || '',
    type: f.type || 'common',
    group: f.group || null,
  }))

  const allFields = exportFields.length > 0
    ? exportFields
    : [...commonFields, ...customFields]

  if (allFields.length === 0) {
    return {
      score: 0,
      readiness: 'No Fields',
      readinessLevel: 'empty',
      totalFields: 0,
      emptyCount: 0,
      briefCount: 0,
      fairCount: 0,
      goodCount: 0,
      fieldAnalysis: [],
      missingSections: KEY_SECTIONS,
      suggestions: [],
      presentSections: [],
      successProbability: 0,
    }
  }

  // Per-field analysis
  const fieldAnalysis = allFields.map((f) => {
    const answer = getFieldAnswer(f)
    const section = detectFieldSection(f.label)
    const quality = getFieldQuality(answer, section)
    const wc = wordCount(answer)
    const cc = charCount(answer)
    return { ...f, answer, section, quality, wordCount: wc, charCount: cc }
  })

  const emptyFields = fieldAnalysis.filter((f) => f.quality.level === 'empty')
  const briefFields = fieldAnalysis.filter((f) => f.quality.level === 'brief')
  const fairFields = fieldAnalysis.filter((f) => f.quality.level === 'fair')
  const goodFields = fieldAnalysis.filter((f) => f.quality.level === 'good')

  // Overall score (weighted)
  const totalWeightedScore = fieldAnalysis.reduce((sum, f) => sum + f.quality.score, 0)
  const score = allFields.length === 0 ? 0 : Math.round(totalWeightedScore / allFields.length)

  // Detect which key sections are covered
  const allText = allFields.map((f) => `${f.label} ${getFieldAnswer(f)}`).join(' ').toLowerCase()
  const presentSections = KEY_SECTIONS.filter((s) =>
    s.keywords.some((kw) => allText.includes(kw))
  )
  const missingSections = KEY_SECTIONS.filter((s) =>
    !s.keywords.some((kw) => allText.includes(kw))
  )

  // Readiness
  let readiness, readinessLevel
  if (emptyFields.length === 0 && score >= 80 && missingSections.length <= 1) {
    readiness = 'Ready to Submit'; readinessLevel = 'ready'
  } else if (score >= 60 && emptyFields.length <= 2) {
    readiness = 'Nearly Ready'; readinessLevel = 'nearly'
  } else if (score >= 35) {
    readiness = 'In Progress'; readinessLevel = 'progress'
  } else {
    readiness = 'Just Started'; readinessLevel = 'started'
  }

  // Success probability estimate (simple heuristic)
  const sectionCoverage = presentSections.length / KEY_SECTIONS.length
  const successProbability = Math.round(
    score * 0.6 + sectionCoverage * 100 * 0.4
  )

  // Suggestions
  const suggestions = []

  if (emptyFields.length > 0) {
    suggestions.push({
      type: 'error',
      icon: 'alert',
      title: `${emptyFields.length} unanswered field${emptyFields.length > 1 ? 's' : ''}`,
      detail: emptyFields.slice(0, 3).map((f) => f.label).join(', ') +
        (emptyFields.length > 3 ? ` and ${emptyFields.length - 3} more` : ''),
    })
  }

  if (briefFields.length > 0) {
    suggestions.push({
      type: 'warning',
      icon: 'pencil',
      title: `${briefFields.length} answer${briefFields.length > 1 ? 's are' : ' is'} too brief`,
      detail: 'Short answers may not satisfy funder requirements. Aim for more detail.',
    })
  }

  if (missingSections.length > 0) {
    const top = missingSections.slice(0, 2)
    suggestions.push({
      type: 'info',
      icon: 'lightbulb',
      title: `Missing key sections: ${top.map((s) => s.label).join(', ')}`,
      detail: top[0]?.tip || 'Add fields covering these areas to strengthen your application.',
    })
  }

  if (!application.funder_name) {
    suggestions.push({
      type: 'warning',
      icon: 'building',
      title: 'No funder name recorded',
      detail: 'Recording the funder makes it easier to track outcomes and spot duplicate applications.',
    })
  }

  const totalWords = fieldAnalysis.reduce((sum, f) => sum + f.wordCount, 0)
  if (totalWords < 200 && allFields.length >= 3) {
    suggestions.push({
      type: 'warning',
      icon: 'text',
      title: 'Application is very short overall',
      detail: `Only ${totalWords} words across all fields. Most successful applications have 500+ words.`,
    })
  }

  return {
    score,
    readiness,
    readinessLevel,
    totalFields: allFields.length,
    emptyCount: emptyFields.length,
    briefCount: briefFields.length,
    fairCount: fairFields.length,
    goodCount: goodFields.length,
    fieldAnalysis,
    missingSections,
    presentSections,
    suggestions,
    successProbability,
    totalWords,
  }
}

/**
 * Analyse a list of applications for dashboard-level insights
 */
export function analyzePortfolio(applications) {
  if (!applications || applications.length === 0) {
    return { successRate: 0, avgScore: 0, topFunder: null, needsAttention: [] }
  }

  const decided = applications.filter(
    (a) => a.status === 'accepted' || a.status === 'rejected'
  )
  const accepted = applications.filter((a) => a.status === 'accepted')
  const successRate = decided.length > 0 ? Math.round((accepted.length / decided.length) * 100) : null

  // Applications needing attention (drafts with long inactivity or no funder)
  const now = Date.now()
  const needsAttention = applications
    .filter((a) => {
      if (a.status !== 'draft') return false
      const daysSince = (now - new Date(a.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      return daysSince > 7 || !a.funder_name
    })
    .slice(0, 3)

  // Top funder (most applications)
  const funderMap = {}
  applications.forEach((a) => {
    if (a.funder_name) {
      funderMap[a.funder_name] = (funderMap[a.funder_name] || 0) + 1
    }
  })
  const topFunder = Object.entries(funderMap).sort((a, b) => b[1] - a[1])[0]?.[0] || null

  return { successRate, accepted: accepted.length, decided: decided.length, needsAttention, topFunder }
}

// ─── AI Content Suggestion Functions ──────────────────────────────────────────

/**
 * Get AI-suggested content for a specific field based on its label.
 * Returns template, key phrases, checklist, example, quality, and improvement tips.
 */
export function getFieldSuggestion(label, currentAnswer = '') {
  const sectionKey = detectFieldSection(label)
  const content = SUGGESTED_CONTENT[sectionKey] || SUGGESTED_CONTENT.default
  const section = KEY_SECTIONS.find((s) => s.key === sectionKey)
  const quality = getFieldQuality(currentAnswer, sectionKey)
  const wc = wordCount(currentAnswer)
  const target = WORD_TARGETS[sectionKey] || WORD_TARGETS.default

  // Detect which key phrases are already present in the answer
  const lowerAnswer = currentAnswer.toLowerCase()
  const matchedPhrases = content.keyPhrases.filter((p) => lowerAnswer.includes(p.toLowerCase()))
  const missingPhrases = content.keyPhrases.filter((p) => !lowerAnswer.includes(p.toLowerCase()))

  // Detect which checklist items appear covered
  const checklistStatus = content.checklist.map((item) => {
    const itemWords = item.toLowerCase().split(/\s+/)
    const covered = itemWords.some((w) => w.length > 3 && lowerAnswer.includes(w))
    return { text: item, covered }
  })

  // Build specific improvement tips based on current answer state
  const improvements = []
  if (!currentAnswer || wc === 0) {
    improvements.push({ priority: 'high', text: 'Start with the template below — fill in the bracketed placeholders with your details.' })
  } else if (quality.level === 'brief') {
    improvements.push({ priority: 'high', text: `Your answer is ${wc} words. Aim for at least ${target} words to satisfy funders.` })
    if (missingPhrases.length > 0) {
      improvements.push({ priority: 'medium', text: `Try including: "${missingPhrases.slice(0, 3).join('", "')}"` })
    }
  } else if (quality.level === 'fair') {
    improvements.push({ priority: 'medium', text: `Good start at ${wc} words. A few more specifics will strengthen this answer.` })
    if (missingPhrases.length > 0) {
      improvements.push({ priority: 'low', text: `Consider mentioning: "${missingPhrases.slice(0, 2).join('", "')}"` })
    }
  }

  // Check for missing checklist items
  const uncovered = checklistStatus.filter((c) => !c.covered)
  if (uncovered.length > 0 && wc > 0) {
    improvements.push({
      priority: quality.level === 'good' ? 'low' : 'medium',
      text: `Consider addressing: ${uncovered.slice(0, 2).map((c) => c.text).join(', ')}`,
    })
  }

  return {
    sectionKey,
    sectionLabel: section?.label || 'General',
    tip: section?.tip || content.checklist[0],
    template: content.template,
    keyPhrases: content.keyPhrases,
    matchedPhrases,
    missingPhrases,
    checklist: checklistStatus,
    strongExample: content.strongExample,
    quality,
    wordCount: wc,
    wordTarget: target,
    improvements,
  }
}

/**
 * Analyse current form state and return prioritised next actions for success.
 * Designed for real-time display while the user is filling in the form.
 */
export function getSuccessGuidance(application) {
  const analysis = analyzeApplication(application)
  if (!analysis) return null

  const actions = []

  // Prioritised actions based on success metrics
  if (analysis.emptyCount > 0) {
    actions.push({
      priority: 1,
      metric: 'completeness',
      label: `Fill ${analysis.emptyCount} empty field${analysis.emptyCount > 1 ? 's' : ''}`,
      detail: 'Empty fields score zero and significantly reduce your success probability.',
      impact: '+' + Math.round((analysis.emptyCount / analysis.totalFields) * 30) + '% potential score boost',
    })
  }

  if (analysis.missingSections.length > 0) {
    const top = analysis.missingSections[0]
    actions.push({
      priority: 2,
      metric: 'sectionCoverage',
      label: `Add content about: ${top.label}`,
      detail: top.tip,
      impact: `+${Math.round(100 / KEY_SECTIONS.length)}% section coverage`,
    })
  }

  if (analysis.briefCount > 0) {
    actions.push({
      priority: 3,
      metric: 'answerQuality',
      label: `Expand ${analysis.briefCount} brief answer${analysis.briefCount > 1 ? 's' : ''}`,
      detail: 'Brief answers suggest lack of detail. Funders prefer thorough, evidence-based responses.',
      impact: 'Moves answers from 30 to 65+ quality score',
    })
  }

  const totalWords = analysis.totalWords || 0
  if (totalWords < 500 && analysis.totalFields >= 3) {
    actions.push({
      priority: 4,
      metric: 'wordCount',
      label: `Add more content (${totalWords}/500+ words)`,
      detail: 'Successful grant applications typically contain 500–1,500 words across all fields.',
      impact: `${500 - totalWords} more words recommended`,
    })
  }

  // Calculate per-metric scores for the radar
  const metricScores = {
    sectionCoverage: Math.round((analysis.presentSections.length / KEY_SECTIONS.length) * 100),
    answerQuality: analysis.score,
    wordCount: Math.min(100, Math.round((totalWords / 500) * 100)),
    completeness: analysis.totalFields > 0
      ? Math.round(((analysis.totalFields - analysis.emptyCount) / analysis.totalFields) * 100)
      : 0,
  }

  // Key phrase coverage across all fields
  const allText = (application.common_fields || []).map((f) => `${f.label} ${f.value || ''}`)
    .concat((application.custom_fields || []).map((f) => `${f.label} ${f.answer || ''}`))
    .join(' ').toLowerCase()
  const allKeyPhrases = KEY_SECTIONS.flatMap((s) => SUGGESTED_CONTENT[s.key]?.keyPhrases || [])
  const uniquePhrases = [...new Set(allKeyPhrases)]
  const matched = uniquePhrases.filter((p) => allText.includes(p.toLowerCase()))
  metricScores.keyPhrases = Math.round((matched.length / uniquePhrases.length) * 100)

  return {
    ...analysis,
    actions: actions.sort((a, b) => a.priority - b.priority),
    metricScores,
    metrics: SUCCESS_METRICS,
  }
}

// Re-export constants and utilities for use by UI components
export { KEY_SECTIONS, SUGGESTED_CONTENT, WORD_TARGETS, detectFieldSection, getFieldQuality, wordCount }

/**
 * Post-decision review — analyses an accepted or rejected application to show
 * what went right or wrong, with actionable lessons for future applications.
 */
export function getPostDecisionReview(application, status) {
  const analysis = analyzeApplication(application)
  if (!analysis) return null

  const strengths = []
  const weaknesses = []
  const lessons = []

  // ── Strengths ──
  if (analysis.goodCount > 0) {
    strengths.push({
      label: `${analysis.goodCount} strong answer${analysis.goodCount > 1 ? 's' : ''}`,
      detail: 'These fields had detailed, well-structured content.',
      fields: analysis.fieldAnalysis.filter((f) => f.quality.level === 'good').map((f) => f.label),
    })
  }
  if (analysis.fairCount > 0 && analysis.goodCount === 0) {
    strengths.push({
      label: `${analysis.fairCount} fair answer${analysis.fairCount > 1 ? 's' : ''}`,
      detail: 'These answers provided reasonable detail.',
    })
  }
  if (analysis.presentSections.length > 0) {
    strengths.push({
      label: `${analysis.presentSections.length}/6 key sections covered`,
      detail: analysis.presentSections.map((s) => s.label).join(', '),
    })
  }
  if ((analysis.totalWords || 0) >= 500) {
    strengths.push({
      label: 'Good application length',
      detail: `${analysis.totalWords} words — above the 500-word threshold.`,
    })
  }
  if (application.funder_name) {
    strengths.push({
      label: 'Funder recorded',
      detail: `Applied to ${application.funder_name} — useful for tracking patterns.`,
    })
  }

  // ── Weaknesses ──
  if (analysis.emptyCount > 0) {
    weaknesses.push({
      label: `${analysis.emptyCount} unanswered field${analysis.emptyCount > 1 ? 's' : ''}`,
      detail: 'Empty fields may have signalled an incomplete application.',
      fields: analysis.fieldAnalysis.filter((f) => f.quality.level === 'empty').map((f) => f.label),
    })
  }
  if (analysis.briefCount > 0) {
    weaknesses.push({
      label: `${analysis.briefCount} brief answer${analysis.briefCount > 1 ? 's' : ''}`,
      detail: 'Short answers may not have provided enough evidence for the funder.',
      fields: analysis.fieldAnalysis.filter((f) => f.quality.level === 'brief').map((f) => f.label),
    })
  }
  if (analysis.missingSections.length > 0) {
    weaknesses.push({
      label: `Missing sections: ${analysis.missingSections.map((s) => s.label).join(', ')}`,
      detail: 'Funders expect these key areas to be addressed.',
    })
  }
  if ((analysis.totalWords || 0) < 500 && analysis.totalFields >= 3) {
    weaknesses.push({
      label: `Short overall (${analysis.totalWords} words)`,
      detail: 'Applications under 500 words may appear underdeveloped to funders.',
    })
  }

  // ── Lessons learned ──
  if (status === 'accepted') {
    if (analysis.goodCount > 0) {
      lessons.push('Save your strong answers as common fields to reuse in future bids.')
    }
    if (analysis.presentSections.length >= 5) {
      lessons.push('Your comprehensive section coverage likely contributed to success — keep this up.')
    }
    if (analysis.score >= 70) {
      lessons.push('High answer quality was a key strength — maintain this standard in future applications.')
    }
    if (weaknesses.length > 0) {
      lessons.push('Even successful applications have room to improve — addressing the weak areas could increase your success rate further.')
    }
    if (weaknesses.length === 0) {
      lessons.push('This application hit all the key markers. Use it as a template for future bids.')
    }
  } else {
    // rejected
    if (analysis.missingSections.length > 0) {
      lessons.push(`Address ${analysis.missingSections.map((s) => s.label).join(', ')} in your next application to this funder.`)
    }
    if (analysis.emptyCount > 0 || analysis.briefCount > 0) {
      lessons.push('Ensure all fields have detailed, evidence-based answers before submitting.')
    }
    if (analysis.score < 60) {
      lessons.push('Focus on improving answer quality — use specific facts, figures, and real examples.')
    }
    if (analysis.score >= 70 && weaknesses.length <= 1) {
      lessons.push('Your application was strong on content — the rejection may be due to funding priorities, capacity, or competition rather than quality.')
    }
    lessons.push('Request feedback from the funder where possible — many are happy to explain their decision.')
  }

  return {
    status,
    score: analysis.score,
    totalFields: analysis.totalFields,
    totalWords: analysis.totalWords || 0,
    strengths,
    weaknesses,
    lessons,
    presentSections: analysis.presentSections,
    missingSections: analysis.missingSections,
    fieldAnalysis: analysis.fieldAnalysis,
    goodCount: analysis.goodCount,
    fairCount: analysis.fairCount,
    briefCount: analysis.briefCount,
    emptyCount: analysis.emptyCount,
  }
}
