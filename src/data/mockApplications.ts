export type AppStatus = "SUBMITTED" | "DRAFT" | "IN_PROGRESS" | "ARCHIVED";

export type GrantApplication = {
  applicationId: string;
  name: string;
  funderName: string;
  status: string;
  createdDate: string;
  [key: string]: any; // Allow any additional fields from API
};

export const mockApplications: GrantApplication[] = [
  {
    applicationId: "1",
    name: "Youth Empowerment Grant",
    funderName: "National Charity Fund",
    status: "SUBMITTED",
    createdDate: "2024-04-18",
  },
  {
    applicationId: "2",
    name: "Community Health Initiative",
    funderName: "HealthCare Foundation",
    status: "DRAFT",
    createdDate: "2024-04-15",
  },
  {
    applicationId: "3",
    name: "Arts Education Program",
    funderName: "Cultural Arts Council",
    status: "SUBMITTED",
    createdDate: "2024-03-30",
  },
  {
    applicationId: "4",
    name: "Homeless Support Project",
    funderName: "City Welfare Trust",
    status: "IN_PROGRESS",
    createdDate: "2024-03-25",
  },
  {
    applicationId: "5",
    name: "Environmental Sustainability Grant",
    funderName: "Green Future Foundation",
    status: "SUBMITTED",
    createdDate: "2024-03-10",
  },
  {
    applicationId: "6",
    name: "Senior Services Fund",
    funderName: "Aging Well Foundation",
    status: "ARCHIVED",
    createdDate: "2024-02-28",
  },
];

export const mockCreateApplicationResponse =
{
  "userId": "aaaaaaaa-0001-0001-0001-000000000001",
  "fields": [
    {
      "fieldKey": "Organisation Name",
      "type": "PREDEFINED",
      "currentVersion": 1,
      "versions": {
        "1": {
          "value": "Alice Johnson Charity",
          "timeStamp": "2026-01-15"
        }
      }
    },
    {
      "fieldKey": "Registered Charity Number",
      "type": "PREDEFINED",
      "currentVersion": 2,
      "versions": {
        "1": {
          "value": "1234567",
          "timeStamp": "2026-01-15"
        },
        "2": {
          "value": "7654321",
          "timeStamp": "2026-03-01"
        }
      }
    },
    {
      "fieldKey": "Organisation Address",
      "type": "PREDEFINED",
      "currentVersion": 1,
      "versions": {
        "1": {
          "value": "123 High Street, London, EC1A 1BB",
          "timeStamp": "2026-01-15"
        }
      }
    },
    {
      "fieldKey": "Organisation Email",
      "type": "PREDEFINED",
      "currentVersion": 1,
      "versions": {
        "1": {
          "value": "alice@example.com",
          "timeStamp": "2026-01-15"
        }
      }
    },
    {
      "fieldKey": "Organisation Phone",
      "type": "PREDEFINED",
      "currentVersion": 1,
      "versions": {
        "1": {
          "value": "+44 20 7946 0958",
          "timeStamp": "2026-01-15"
        }
      }
    },
    {
      "fieldKey": "Organisation Website",
      "type": "PREDEFINED",
      "currentVersion": 1,
      "versions": {
        "1": {
          "value": "https://www.alicecharity.org",
          "timeStamp": "2026-01-15"
        }
      }
    },
    {
      "fieldKey": "Year Founded",
      "type": "PREDEFINED",
      "currentVersion": 1,
      "versions": {
        "1": {
          "value": "2010",
          "timeStamp": "2026-01-15"
        }
      }
    },
    {
      "fieldKey": "Total Full-Time Staff",
      "type": "PREDEFINED",
      "currentVersion": 2,
      "versions": {
        "1": {
          "value": "12",
          "timeStamp": "2026-01-15"
        },
        "2": {
          "value": "15",
          "timeStamp": "2026-03-10"
        }
      }
    },
    {
      "fieldKey": "Total Part-Time Staff",
      "type": "PREDEFINED",
      "currentVersion": 1,
      "versions": {
        "1": {
          "value": "5",
          "timeStamp": "2026-01-15"
        }
      }
    },
    {
      "fieldKey": "Annual Turnover (Â£)",
      "type": "PREDEFINED",
      "currentVersion": 2,
      "versions": {
        "1": {
          "value": "250000",
          "timeStamp": "2026-01-15"
        },
        "2": {
          "value": "310000",
          "timeStamp": "2026-02-20"
        }
      }
    }
  ]
}

export const mockFAQs = [
  {
    "fieldKey": "Mission Statement",
    "type": "PREDEFINED",
    "currentVersion": 2,
    "versions": {
      "1": {
        "value": "We empower underserved communities through education and digital skills training.",
        "timeStamp": "2026-01-15"
      },
      "2": {
        "value": "We empower underserved communities through education, digital skills, and employment pathways.",
        "timeStamp": "2026-02-10"
      }
    }
  },
  {
    "fieldKey": "What the Organisation Does",
    "type": "PREDEFINED",
    "currentVersion": 1,
    "versions": {
      "1": {
        "value": "We deliver free coding bootcamps, mentoring programmes, and job-readiness workshops to young people aged 16-25 in deprived areas.",
        "timeStamp": "2026-01-15"
      }
    }
  },
  {
    "fieldKey": "Target Beneficiaries",
    "type": "PREDEFINED",
    "currentVersion": 1,
    "versions": {
      "1": {
        "value": "Young people aged 16-25 from low-income households, particularly those not in education, employment, or training (NEET).",
        "timeStamp": "2026-01-15"
      }
    }
  },
  {
    "fieldKey": "Geographic Area of Operation",
    "type": "PREDEFINED",
    "currentVersion": 2,
    "versions": {
      "1": {
        "value": "Greater London and the South East of England.",
        "timeStamp": "2026-01-15"
      },
      "2": {
        "value": "Greater London, South East England, and the West Midlands.",
        "timeStamp": "2026-03-05"
      }
    }
  },
  {
    "fieldKey": "How has COVID-19 Impacted Your Work",
    "type": "PREDEFINED",
    "currentVersion": 1,
    "versions": {
      "1": {
        "value": "COVID-19 accelerated our pivot to online delivery. We moved all bootcamps to virtual platforms, which increased reach by 40% but required significant investment in digital infrastructure.",
        "timeStamp": "2026-01-15"
      }
    }
  },
  {
    "fieldKey": "Measurement and Evaluation Approach",
    "type": "PREDEFINED",
    "currentVersion": 1,
    "versions": {
      "1": {
        "value": "We track participant outcomes at 3, 6, and 12 months post-programme, measuring employment rates, income changes, and self-reported wellbeing scores.",
        "timeStamp": "2026-01-15"
      }
    }
  },
  {
    "fieldKey": "Collaborative Partnerships",
    "type": "PREDEFINED",
    "currentVersion": 1,
    "versions": {
      "1": {
        "value": "We work closely with local councils, DWP job centres, Tech Nation, and a network of 30+ employer partners who provide mentors and job placements.",
        "timeStamp": "2026-01-15"
      }
    }
  },
  {
    "fieldKey": "Safeguarding Policy",
    "type": "PREDEFINED",
    "currentVersion": 1,
    "versions": {
      "1": {
        "value": "Our safeguarding policy is reviewed annually by the board. All staff and volunteers hold current DBS checks. A designated safeguarding lead is in post.",
        "timeStamp": "2026-01-15"
      }
    }
  }
]
