import { CourseEntity } from './course.model';
import { MOCK_INSTRUCTORS_REPO, MOCK_CREATORS_REPO } from './course.model';

export const INITIAL_COURSES_ENTITIES: CourseEntity[] = [
  {
    courseId: 'crs-brac-101',
    code: 'CRS-MF-OPS-2026',
    title: 'BRAC Microfinance Operations & Client Protection Principles',
    description: 'Master BRAC’s gold-standard microfinance methodologies: group lending discipline, transparent pricing, client financial capability development, safeguarding against over-indebtedness, and digitized collection workflows.',
    ownerId: 'usr-brac-tanvir',
    ownerName: 'Tanvir Hossain',
    ownerEmail: 'tanvir.hossain@brac.net',
    ownerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    category: 'Microfinance & Compliance',
    tags: ['Microfinance', 'Client Protection', 'Compliance', 'Smart Campaign', 'VO Operations'],
    difficulty: 'Intermediate',
    durationMinutes: 180,
    coverImage: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=800&q=80',
    lmsId: 'LMS-1972-01',
    lmsName: 'BRAC Microfinance Operations & Enterprise Academy',
    tenantId: 'tenant-brac',
    structureConfig: {
      layerCount: 3,
      layerLabels: ['Chapter', 'Topic', 'Lesson']
    },
    structure: [
      {
        nodeId: 'ch-1',
        layer: 1,
        title: 'Chapter 1: Foundational Framework & Regulatory Covenants',
        description: 'Core ethics, regulatory standards, and grassroots compliance.',
        order: 1,
        instructorTags: [MOCK_INSTRUCTORS_REPO[0]], // Tanvir tagged at Layer 1 (Exclusivity active)
        children: [
          {
            nodeId: 'top-1-1',
            layer: 2,
            title: 'Topic 1.1: The Village Organization (VO) Ecosystem',
            order: 1,
            instructorTags: [],
            children: [
              {
                nodeId: 'les-1-1-1',
                layer: 3,
                title: 'Lesson 1.1.1: VO Formation & Meeting Governance',
                order: 1,
                instructorTags: [],
                content: [
                  {
                    contentId: 'cnt-1',
                    title: 'VO Grassroots Structure & Member Onboarding Video',
                    family: 'learning',
                    learning: {
                      subtype: 'video',
                      mediaUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
                      durationMinutes: 20,
                      summary: 'Video breakdown of weekly VO meeting discipline and social cohesion.'
                    },
                    assessment: null,
                    authors: [
                      {
                        personId: MOCK_CREATORS_REPO[0].id,
                        name: MOCK_CREATORS_REPO[0].name,
                        email: MOCK_CREATORS_REPO[0].email,
                        avatar: MOCK_CREATORS_REPO[0].avatar,
                        kind: 'authorOnly',
                        source: 'creator_mgmt'
                      }
                    ],
                    order: 1
                  },
                  {
                    contentId: 'cnt-2',
                    title: 'BRAC Client Protection Manual (SOP Ref Guide)',
                    family: 'learning',
                    learning: {
                      subtype: 'reading',
                      durationMinutes: 25,
                      summary: 'Standard operating procedures for preventing over-indebtedness.',
                      contentHtml: '<p>Every field worker is bound by strict ethical standards safeguarding client dignity.</p>'
                    },
                    assessment: null,
                    authors: [
                      {
                        personId: MOCK_INSTRUCTORS_REPO[0].id,
                        name: MOCK_INSTRUCTORS_REPO[0].name,
                        email: MOCK_INSTRUCTORS_REPO[0].email,
                        avatar: MOCK_INSTRUCTORS_REPO[0].avatar,
                        kind: 'both',
                        source: 'instructor_mgmt'
                      }
                    ],
                    order: 2
                  },
                  {
                    contentId: 'cnt-3',
                    title: 'Formative Check: Client Dignity & Code of Conduct Quiz',
                    family: 'assessment',
                    learning: null,
                    assessment: {
                      subtype: 'quiz',
                      gradingMode: 'auto',
                      passingScorePercent: 80,
                      durationMinutes: 15,
                      questions: [
                        {
                          id: 'q1',
                          question: 'What is the primary objective of BRAC Client Protection Standards?',
                          options: [
                            'Ensuring respectful, transparent, and fair treatment for all members',
                            'Maximizing loan collection velocity regardless of hardship',
                            'Eliminating all documentation during field visits',
                            'Requiring collateral for ultra-poor households'
                          ],
                          correctAnswerIndex: 0,
                          points: 50
                        }
                      ]
                    },
                    authors: [
                      {
                        personId: MOCK_CREATORS_REPO[1].id,
                        name: MOCK_CREATORS_REPO[1].name,
                        email: MOCK_CREATORS_REPO[1].email,
                        avatar: MOCK_CREATORS_REPO[1].avatar,
                        kind: 'authorOnly',
                        source: 'creator_mgmt'
                      }
                    ],
                    order: 3
                  }
                ]
              }
            ]
          },
          {
            nodeId: 'top-1-2',
            layer: 2,
            title: 'Topic 1.2: Credit Appraisal & Manual Loan Evaluation',
            order: 2,
            instructorTags: [],
            children: [
              {
                nodeId: 'les-1-2-1',
                layer: 3,
                title: 'Lesson 1.2.1: Micro-enterprise Cashflow Synthesis',
                order: 1,
                instructorTags: [],
                content: [
                  {
                    contentId: 'cnt-4',
                    title: 'Field Case Study: Simulated Household Credit Audit',
                    family: 'assessment',
                    learning: null,
                    assessment: {
                      subtype: 'assignment',
                      gradingMode: 'manual', // MANUAL GRADING (Covered by Tanvir at Chapter 1!)
                      passingScorePercent: 75,
                      durationMinutes: 45,
                      instructions: 'Review the attached agricultural household financial ledger and write a 500-word risk assessment report.'
                    },
                    authors: [
                      {
                        personId: MOCK_CREATORS_REPO[1].id,
                        name: MOCK_CREATORS_REPO[1].name,
                        email: MOCK_CREATORS_REPO[1].email,
                        avatar: MOCK_CREATORS_REPO[1].avatar,
                        kind: 'authorOnly',
                        source: 'creator_mgmt'
                      }
                    ],
                    order: 1
                  }
                ]
              }
            ]
          }
        ]
      }
    ],
    reviewsConfig: {
      contentReviewsEnabled: true,
      instructorReviewsEnabled: true,
      scale: '5-star-likert',
      allowComments: true
    },
    version: {
      versionNumber: 1,
      label: 'v1.0',
      state: 'published-current',
      publishedAt: '15/01/2026 10:00:00',
      publishedBy: 'Tanvir Hossain',
      changeSummary: 'Initial baseline accreditation curriculum for nationwide branch rollout.',
      lockedInPhasesCount: 4,
      lockedPhaseNames: ['Phase 1: Foundation (Cohort A)', 'Phase 1: Foundation (Cohort B)']
    },
    versionHistory: [
      {
        versionNumber: 1,
        label: 'v1.0',
        publishedAt: '15/01/2026 10:00:00',
        publishedBy: 'Tanvir Hossain',
        changeSummary: 'Initial baseline accreditation release.',
        structureConfig: { layerCount: 3, layerLabels: ['Chapter', 'Topic', 'Lesson'] },
        structure: [],
        lockedInPhases: [
          { phaseId: 'phase-01', phaseName: 'Phase 1: Foundation Onboarding', planName: 'FY26 Officer Induction Plan', lockedAt: '18/01/2026' }
        ]
      }
    ],
    status: 'published',
    usedInPlansCount: 3,
    usedInPhasesCount: 4,
    createdFromTemplateId: 'CTMP-1972-01',
    createdFromTemplateName: 'Standard Microfinance Branch Officer Foundation Blueprint',
    createdBy: 'Tanvir Hossain',
    createdById: 'usr-brac-tanvir',
    createdAt: '10/01/2026',
    updatedAt: '24/02/2026'
  },
  {
    courseId: 'crs-brac-102',
    code: 'CRS-UPG-COACH-02',
    title: 'Ultra-Poor Graduation Household Coaching & Asset Transfer',
    description: 'Specialized 2-layer pedagogical program for frontline graduation mentors working with ultra-poor families to achieve sustainable food security and economic self-reliance.',
    ownerId: 'usr-brac-nusrat',
    ownerName: 'Nusrat Jahan',
    ownerEmail: 'nusrat.jahan@brac.net',
    ownerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    category: 'Ultra-Poor Graduation',
    tags: ['Ultra-Poor', 'Mentorship', 'Asset Transfer', 'Livelihoods'],
    difficulty: 'Intermediate',
    durationMinutes: 120,
    coverImage: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
    lmsId: 'LMS-1972-01',
    lmsName: 'BRAC Microfinance Operations & Enterprise Academy',
    tenantId: 'tenant-brac',
    structureConfig: {
      layerCount: 2,
      layerLabels: ['Module', 'Lesson']
    },
    structure: [
      {
        nodeId: 'mod-upg-1',
        layer: 1,
        title: 'Module 1: Household Selection & Livelihood Asset Diagnostics',
        description: 'Targeting methodologies and productive asset matching.',
        order: 1,
        instructorTags: [MOCK_INSTRUCTORS_REPO[2]], // Nusrat Jahan tagged at Module layer
        children: [
          {
            nodeId: 'les-upg-1-1',
            layer: 2,
            title: 'Lesson 1.1: Participatory Rural Appraisal (PRA) Techniques',
            order: 1,
            instructorTags: [],
            content: [
              {
                contentId: 'cnt-upg-1',
                title: 'PRA Field Video Demonstration',
                family: 'learning',
                learning: {
                  subtype: 'video',
                  mediaUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
                  durationMinutes: 25,
                  summary: 'Conducting wealth ranking and village resource mapping.'
                },
                authors: [
                  {
                    personId: MOCK_INSTRUCTORS_REPO[2].id,
                    name: MOCK_INSTRUCTORS_REPO[2].name,
                    email: MOCK_INSTRUCTORS_REPO[2].email,
                    avatar: MOCK_INSTRUCTORS_REPO[2].avatar,
                    kind: 'instructor',
                    source: 'instructor_mgmt'
                  }
                ],
                order: 1
              },
              {
                contentId: 'cnt-upg-2',
                title: 'Household Asset Feasibility Rubric Evaluation',
                family: 'assessment',
                learning: null,
                assessment: {
                  subtype: 'assignment',
                  gradingMode: 'manual', // MANUAL GRADING (Covered by Nusrat at Module 1)
                  durationMinutes: 30,
                  passingScorePercent: 80,
                  instructions: 'Evaluate the sample household profile and select the optimal livelihood package.'
                },
                authors: [
                  {
                    personId: MOCK_CREATORS_REPO[2].id,
                    name: MOCK_CREATORS_REPO[2].name,
                    email: MOCK_CREATORS_REPO[2].email,
                    avatar: MOCK_CREATORS_REPO[2].avatar,
                    kind: 'authorOnly',
                    source: 'creator_mgmt'
                  }
                ],
                order: 2
              }
            ]
          }
        ]
      }
    ],
    reviewsConfig: {
      contentReviewsEnabled: true,
      instructorReviewsEnabled: true,
      scale: '5-star-likert'
    },
    version: {
      versionNumber: 2,
      label: 'v2.0',
      state: 'published-current',
      publishedAt: '20/02/2026 14:00:00',
      publishedBy: 'Nusrat Jahan',
      changeSummary: 'Updated PRA rubric and added interactive livestock health module.',
      lockedInPhasesCount: 2,
      lockedPhaseNames: ['Phase 2: Household Immersion']
    },
    versionHistory: [
      {
        versionNumber: 1,
        label: 'v1.0',
        publishedAt: '05/01/2026 09:00:00',
        publishedBy: 'Nusrat Jahan',
        changeSummary: 'Initial version 1.0 rollout.',
        structureConfig: { layerCount: 2, layerLabels: ['Module', 'Lesson'] },
        structure: [],
        lockedInPhases: [
          { phaseId: 'phase-old-01', phaseName: 'Winter 2025 Field Mentorship', planName: 'Graduation Fast Track', lockedAt: '08/01/2026' }
        ]
      },
      {
        versionNumber: 2,
        label: 'v2.0',
        publishedAt: '20/02/2026 14:00:00',
        publishedBy: 'Nusrat Jahan',
        changeSummary: 'Enhanced assessment rubrics.',
        structureConfig: { layerCount: 2, layerLabels: ['Module', 'Lesson'] },
        structure: [],
        lockedInPhases: [
          { phaseId: 'phase-upg-02', phaseName: 'Phase 2: Household Immersion', planName: 'UPG National Accelerator', lockedAt: '22/02/2026' }
        ]
      }
    ],
    status: 'published',
    usedInPlansCount: 2,
    usedInPhasesCount: 3,
    createdBy: 'Nusrat Jahan',
    createdById: 'usr-brac-nusrat',
    createdAt: '01/01/2026',
    updatedAt: '20/02/2026'
  },
  {
    courseId: 'crs-brac-103',
    code: 'CRS-CLIM-EMERG-03',
    title: 'Climate Disaster Rapid Response & Cold-Chain Relief Logistics',
    description: 'Field emergency protocols, early warning recognition, medical ration cold-chain preservation, and Rapid Damage Needs Assessment (RDNA) toolkits.',
    ownerId: 'usr-brac-shakil',
    ownerName: 'Shakil Anwar',
    ownerEmail: 'shakil.anwar@brac.net',
    ownerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    category: 'Climate Resilience',
    tags: ['Climate Change', 'Disaster Response', 'Cold Chain', 'Emergency Relief'],
    difficulty: 'Advanced',
    durationMinutes: 150,
    coverImage: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80',
    lmsId: 'LMS-1972-04',
    lmsName: 'Climate Resilience & Disaster Management Hub',
    tenantId: 'tenant-brac',
    structureConfig: {
      layerCount: 3,
      layerLabels: ['Chapter', 'Topic', 'Lesson']
    },
    structure: [
      {
        nodeId: 'ch-clim-1',
        layer: 1,
        title: 'Chapter 1: Early Warning Levels & Evacuation Mobilization',
        order: 1,
        instructorTags: [MOCK_INSTRUCTORS_REPO[3]], // Shakil Anwar tagged at Chapter 1
        children: [
          {
            nodeId: 'top-clim-1-1',
            layer: 2,
            title: 'Topic 1.1: Coastal Siren Warnings & Community Shelters',
            order: 1,
            instructorTags: [],
            children: [
              {
                nodeId: 'les-clim-1-1-1',
                layer: 3,
                title: 'Lesson 1.1.1: Cyclone Warning Matrix and Protocol',
                order: 1,
                instructorTags: [],
                content: [
                  {
                    contentId: 'cnt-clim-1',
                    title: 'Signal Level 1-10 Operational Decision Matrix (PDF)',
                    family: 'learning',
                    learning: {
                      subtype: 'document',
                      durationMinutes: 20,
                      summary: 'Detailed evacuation triggering criteria for coastal unions.'
                    },
                    authors: [
                      {
                        personId: MOCK_INSTRUCTORS_REPO[3].id,
                        name: MOCK_INSTRUCTORS_REPO[3].name,
                        email: MOCK_INSTRUCTORS_REPO[3].email,
                        avatar: MOCK_INSTRUCTORS_REPO[3].avatar,
                        kind: 'both',
                        source: 'instructor_mgmt'
                      }
                    ],
                    order: 1
                  },
                  {
                    contentId: 'cnt-clim-2',
                    title: 'Emergency Decision Multi-Choice Assessment',
                    family: 'assessment',
                    learning: null,
                    assessment: {
                      subtype: 'quiz',
                      gradingMode: 'auto',
                      passingScorePercent: 85,
                      durationMinutes: 20,
                      questions: [
                        {
                          id: 'cq1',
                          question: 'At what disaster warning level must community evacuation become mandatory?',
                          options: ['Signal 7 and above', 'Signal 3 only', 'After storm landfall', 'Signal 1 advisory'],
                          correctAnswerIndex: 0,
                          points: 50
                        }
                      ]
                    },
                    authors: [
                      {
                        personId: MOCK_CREATORS_REPO[2].id,
                        name: MOCK_CREATORS_REPO[2].name,
                        email: MOCK_CREATORS_REPO[2].email,
                        avatar: MOCK_CREATORS_REPO[2].avatar,
                        kind: 'authorOnly',
                        source: 'creator_mgmt'
                      }
                    ],
                    order: 2
                  }
                ]
              }
            ]
          }
        ]
      }
    ],
    reviewsConfig: {
      contentReviewsEnabled: true,
      instructorReviewsEnabled: true,
      scale: '5-star-likert'
    },
    version: {
      versionNumber: 1,
      label: 'v1.0',
      state: 'published-current',
      publishedAt: '02/02/2026 11:30:00',
      publishedBy: 'Shakil Anwar',
      changeSummary: 'Baseline coastal disaster emergency curriculum.',
      lockedInPhasesCount: 1,
      lockedPhaseNames: ['Rapid Response Readiness Track']
    },
    versionHistory: [
      {
        versionNumber: 1,
        label: 'v1.0',
        publishedAt: '02/02/2026 11:30:00',
        publishedBy: 'Shakil Anwar',
        changeSummary: 'Baseline release.',
        structureConfig: { layerCount: 3, layerLabels: ['Chapter', 'Topic', 'Lesson'] },
        structure: [],
        lockedInPhases: [
          { phaseId: 'ph-clim-1', phaseName: 'Rapid Response Readiness Track', planName: 'Coastal Resilience Plan 2026', lockedAt: '03/02/2026' }
        ]
      }
    ],
    status: 'published',
    usedInPlansCount: 1,
    usedInPhasesCount: 1,
    createdBy: 'Shakil Anwar',
    createdById: 'usr-brac-shakil',
    createdAt: '01/02/2026',
    updatedAt: '15/02/2026'
  },
  {
    courseId: 'crs-brac-104',
    code: 'CRS-SEC-AUDIT-04',
    title: 'Enterprise Cyber Hygiene & Data Protection Compliance (Draft In Progress)',
    description: 'Mandatory information security protocols, multi-factor authentication requirements, phishing defense, and GDPR/client privacy governance.',
    ownerId: 'usr-brac-farhana',
    ownerName: 'Farhana Ahmed',
    ownerEmail: 'farhana.ahmed@brac.net',
    ownerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    category: 'Compliance & Security',
    tags: ['Cybersecurity', 'Privacy', 'Compliance', 'Audit'],
    difficulty: 'Beginner',
    durationMinutes: 90,
    coverImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
    lmsId: 'LMS-1972-01',
    lmsName: 'BRAC Microfinance Operations & Enterprise Academy',
    tenantId: 'tenant-brac',
    structureConfig: {
      layerCount: 2,
      layerLabels: ['Module', 'Topic']
    },
    structure: [
      {
        nodeId: 'mod-sec-1',
        layer: 1,
        title: 'Module 1: Password Security & Social Engineering Defense',
        order: 1,
        instructorTags: [MOCK_INSTRUCTORS_REPO[1]], // Farhana Ahmed tagged at Module 1
        children: [
          {
            nodeId: 'top-sec-1-1',
            layer: 2,
            title: 'Topic 1.1: Phishing Vector Recognition',
            order: 1,
            instructorTags: [],
            content: [
              {
                contentId: 'cnt-sec-1',
                title: 'Spotting Malicious Inbound Communications',
                family: 'learning',
                learning: {
                  subtype: 'interactive',
                  durationMinutes: 20,
                  summary: 'Simulated email inbox review and malicious link inspection.'
                },
                authors: [
                  {
                    personId: MOCK_CREATORS_REPO[0].id,
                    name: MOCK_CREATORS_REPO[0].name,
                    email: MOCK_CREATORS_REPO[0].email,
                    avatar: MOCK_CREATORS_REPO[0].avatar,
                    kind: 'authorOnly',
                    source: 'creator_mgmt'
                  }
                ],
                order: 1
              }
            ]
          }
        ]
      }
    ],
    reviewsConfig: {
      contentReviewsEnabled: false,
      instructorReviewsEnabled: false
    },
    version: {
      versionNumber: 1,
      label: 'v1.0-draft',
      state: 'draft',
      lockedInPhasesCount: 0
    },
    versionHistory: [],
    status: 'draft',
    usedInPlansCount: 0,
    usedInPhasesCount: 0,
    createdBy: 'Farhana Ahmed',
    createdById: 'usr-brac-farhana',
    createdAt: '22/02/2026',
    updatedAt: '27/02/2026'
  },
  {
    courseId: 'crs-brac-105-blocked',
    code: 'CRS-HEALTH-EMERG-05',
    title: 'Maternal & Neonatal Emergency Field Response (Publish Blocked Demo)',
    description: 'Clinical escalation and grassroots emergency triage protocols. (Demonstrates Publish Blocker Rule Engine #3: Manual assessment with missing instructor).',
    ownerId: 'usr-brac-sadia',
    ownerName: 'Sadia Rahman',
    ownerEmail: 'sadia.rahman@brac.net',
    ownerAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
    category: 'Healthcare',
    tags: ['Healthcare', 'Maternal Health', 'Triage', 'Emergency'],
    difficulty: 'Advanced',
    durationMinutes: 110,
    coverImage: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
    lmsId: 'LMS-1972-01',
    lmsName: 'BRAC Microfinance Operations & Enterprise Academy',
    tenantId: 'tenant-brac',
    structureConfig: {
      layerCount: 2,
      layerLabels: ['Module', 'Lesson']
    },
    structure: [
      {
        nodeId: 'mod-hlth-1',
        layer: 1,
        title: 'Module 1: High-Risk Triage Identification',
        order: 1,
        instructorTags: [], // NO INSTRUCTOR TAGGED HERE!
        children: [
          {
            nodeId: 'les-hlth-1-1',
            layer: 2,
            title: 'Lesson 1.1: Vital Sign Assessment',
            order: 1,
            instructorTags: [],
            content: [
              {
                contentId: 'cnt-hlth-1',
                title: 'Clinical Symptom Evaluation Manual Case Review',
                family: 'assessment',
                learning: null,
                assessment: {
                  subtype: 'assignment',
                  gradingMode: 'manual', // MANUAL GRADING WITH NO INSTRUCTOR ABOVE! -> TRIGGERS RULE ENGINE #3 BLOCKER!
                  durationMinutes: 40,
                  instructions: 'Write a comprehensive patient escalation plan for review by medical director.'
                },
                authors: [
                  {
                    personId: MOCK_CREATORS_REPO[1].id,
                    name: MOCK_CREATORS_REPO[1].name,
                    email: MOCK_CREATORS_REPO[1].email,
                    avatar: MOCK_CREATORS_REPO[1].avatar,
                    kind: 'authorOnly',
                    source: 'creator_mgmt'
                  }
                ],
                order: 1
              }
            ]
          }
        ]
      }
    ],
    reviewsConfig: {
      contentReviewsEnabled: true,
      instructorReviewsEnabled: true
    },
    version: {
      versionNumber: 1,
      label: 'v1.0-draft',
      state: 'draft',
      lockedInPhasesCount: 0
    },
    versionHistory: [],
    status: 'draft',
    usedInPlansCount: 0,
    usedInPhasesCount: 0,
    createdBy: 'Sadia Rahman',
    createdById: 'usr-brac-sadia',
    createdAt: '24/02/2026',
    updatedAt: '28/02/2026'
  }
];
