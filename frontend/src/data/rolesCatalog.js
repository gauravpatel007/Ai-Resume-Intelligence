export const IT_ROLES_CATALOG = [
  // Software Engineering
  {
    domain: "Software Engineering",
    name: "Backend Developer",
    req_skills: ["Python", "Docker", "SQL", "Git", "REST APIs"],
    pref_skills: ["Kubernetes", "AWS", "CI/CD", "Redis", "Microservices"],
    min_exp: 2
  },
  {
    domain: "Software Engineering",
    name: "Frontend Developer",
    req_skills: ["JavaScript", "React", "HTML", "CSS", "Git"],
    pref_skills: ["TypeScript", "Next.js", "Redux", "Tailwind CSS", "Jest"],
    min_exp: 1
  },
  {
    domain: "Software Engineering",
    name: "Full Stack Developer",
    req_skills: ["JavaScript", "React", "Node.js", "SQL", "Git"],
    pref_skills: ["TypeScript", "Docker", "AWS", "MongoDB", "GraphQL"],
    min_exp: 3
  },
  {
    domain: "Software Engineering",
    name: "Mobile Developer (React Native)",
    req_skills: ["JavaScript", "React Native", "Redux", "REST APIs", "Git"],
    pref_skills: ["TypeScript", "iOS/Android Native", "Firebase", "App Store Deployment"],
    min_exp: 2
  },
  {
    domain: "Software Engineering",
    name: "Mobile Developer (Flutter)",
    req_skills: ["Dart", "Flutter", "REST APIs", "Git"],
    pref_skills: ["Firebase", "State Management", "Native Integration"],
    min_exp: 2
  },
  {
    domain: "Software Engineering",
    name: "iOS Developer",
    req_skills: ["Swift", "iOS SDK", "Core Data", "Git"],
    pref_skills: ["Objective-C", "SwiftUI", "XCTest", "CI/CD"],
    min_exp: 2
  },
  {
    domain: "Software Engineering",
    name: "Android Developer",
    req_skills: ["Kotlin", "Android SDK", "Room", "Git"],
    pref_skills: ["Java", "Jetpack Compose", "Coroutines", "Dagger/Hilt"],
    min_exp: 2
  },
  {
    domain: "Software Engineering",
    name: "Embedded Systems Engineer",
    req_skills: ["C", "C++", "Microcontrollers", "RTOS"],
    pref_skills: ["Python", "Hardware Debugging", "IoT Protocols"],
    min_exp: 3
  },
  {
    domain: "Software Engineering",
    name: "Game Developer",
    req_skills: ["C#", "Unity", "3D Math", "Git"],
    pref_skills: ["C++", "Unreal Engine", "Shader Programming"],
    min_exp: 2
  },

  // Cloud & DevOps
  {
    domain: "Cloud & DevOps",
    name: "DevOps Engineer",
    req_skills: ["Linux", "Docker", "Kubernetes", "CI/CD", "Git"],
    pref_skills: ["Terraform", "AWS", "Jenkins", "Ansible", "Python"],
    min_exp: 3
  },
  {
    domain: "Cloud & DevOps",
    name: "Cloud Architect (AWS)",
    req_skills: ["AWS", "Architecture Design", "Networking", "Security", "Terraform"],
    pref_skills: ["Kubernetes", "Python", "Serverless", "Cost Optimization"],
    min_exp: 5
  },
  {
    domain: "Cloud & DevOps",
    name: "Site Reliability Engineer (SRE)",
    req_skills: ["Linux", "Python", "Kubernetes", "Monitoring", "CI/CD"],
    pref_skills: ["Golang", "Incident Management", "Terraform", "SLIs/SLOs"],
    min_exp: 4
  },
  {
    domain: "Cloud & DevOps",
    name: "System Administrator",
    req_skills: ["Linux", "Windows Server", "Networking", "Active Directory", "Bash"],
    pref_skills: ["VMware", "Cloud Basics", "Security Basics"],
    min_exp: 2
  },
  {
    domain: "Cloud & DevOps",
    name: "Platform Engineer",
    req_skills: ["Kubernetes", "Docker", "CI/CD", "Infrastructure as Code", "Python"],
    pref_skills: ["GitOps", "ArgoCD", "Terraform", "Backstage"],
    min_exp: 4
  },

  // AI, ML & Data
  {
    domain: "AI, ML & Data",
    name: "Machine Learning Engineer",
    req_skills: ["Python", "Machine Learning", "SQL", "Docker", "Scikit-Learn"],
    pref_skills: ["PyTorch", "TensorFlow", "FastAPI", "Kubernetes", "AWS"],
    min_exp: 2
  },
  {
    domain: "AI, ML & Data",
    name: "Data Scientist",
    req_skills: ["Python", "SQL", "Machine Learning", "Statistics", "Pandas"],
    pref_skills: ["Deep Learning", "NLP", "A/B Testing", "Tableau"],
    min_exp: 2
  },
  {
    domain: "AI, ML & Data",
    name: "Data Engineer",
    req_skills: ["SQL", "Python", "ETL", "Data Warehousing", "Spark"],
    pref_skills: ["Airflow", "Kafka", "AWS", "Snowflake", "dbt"],
    min_exp: 3
  },
  {
    domain: "AI, ML & Data",
    name: "Data Analyst",
    req_skills: ["SQL", "Excel", "Data Visualization", "Python"],
    pref_skills: ["Tableau", "PowerBI", "Statistics", "Google Analytics"],
    min_exp: 1
  },
  {
    domain: "AI, ML & Data",
    name: "NLP Engineer",
    req_skills: ["Python", "NLP", "PyTorch", "Transformers", "Machine Learning"],
    pref_skills: ["LLMs", "LangChain", "Vector Databases", "Docker"],
    min_exp: 3
  },
  {
    domain: "AI, ML & Data",
    name: "Computer Vision Engineer",
    req_skills: ["Python", "Computer Vision", "OpenCV", "PyTorch", "Deep Learning"],
    pref_skills: ["C++", "CUDA", "Object Detection", "Image Segmentation"],
    min_exp: 3
  },
  {
    domain: "AI, ML & Data",
    name: "BI Analyst",
    req_skills: ["SQL", "Power BI", "Data Modeling", "Excel"],
    pref_skills: ["Python", "ETL Basics", "DAX", "Tableau"],
    min_exp: 2
  },

  // Cybersecurity
  {
    domain: "Cybersecurity",
    name: "Cybersecurity Analyst",
    req_skills: ["Networking", "SIEM", "Incident Response", "Linux", "Security Protocols"],
    pref_skills: ["Python", "Threat Hunting", "Cloud Security", "CompTIA Sec+"],
    min_exp: 2
  },
  {
    domain: "Cybersecurity",
    name: "Penetration Tester",
    req_skills: ["Linux", "Networking", "Vulnerability Assessment", "Metasploit", "Python"],
    pref_skills: ["OWASP", "Burp Suite", "CEH", "OSCP"],
    min_exp: 3
  },
  {
    domain: "Cybersecurity",
    name: "Information Security Engineer",
    req_skills: ["Network Security", "Firewalls", "Linux", "Python", "IAM"],
    pref_skills: ["Cloud Security", "Cryptography", "Risk Assessment", "CISSP"],
    min_exp: 4
  },
  {
    domain: "Cybersecurity",
    name: "SOC Analyst",
    req_skills: ["SIEM", "Log Analysis", "Networking", "Incident Triage", "Linux"],
    pref_skills: ["Python", "Wireshark", "EDR Tools"],
    min_exp: 1
  },

  // QA & Testing
  {
    domain: "QA & Testing",
    name: "QA Automation Engineer",
    req_skills: ["Python", "Selenium", "Test Automation", "Git", "API Testing"],
    pref_skills: ["Cypress", "CI/CD", "Postman", "SQL", "Docker"],
    min_exp: 2
  },
  {
    domain: "QA & Testing",
    name: "SDET",
    req_skills: ["Java", "Test Automation", "CI/CD", "Git", "System Design"],
    pref_skills: ["Performance Testing", "Docker", "Kubernetes", "AWS"],
    min_exp: 3
  },
  {
    domain: "QA & Testing",
    name: "Manual QA Tester",
    req_skills: ["Test Case Design", "Bug Tracking", "Jira", "Regression Testing"],
    pref_skills: ["SQL", "API Testing", "Postman", "Agile"],
    min_exp: 1
  },

  // Systems & Architecture
  {
    domain: "Systems & Architecture",
    name: "Solutions Architect",
    req_skills: ["System Design", "Cloud Architecture", "Microservices", "Security", "Networking"],
    pref_skills: ["Serverless", "Kubernetes", "AWS", "Azure"],
    min_exp: 6
  },
  {
    domain: "Systems & Architecture",
    name: "Technical Product Manager",
    req_skills: ["Agile", "Scrum", "Product Roadmap", "Stakeholder Management", "Jira"],
    pref_skills: ["SQL", "UI/UX Basics", "Software Development"],
    min_exp: 4
  },
  {
    domain: "Systems & Architecture",
    name: "Database Administrator (DBA)",
    req_skills: ["SQL", "Database Optimization", "Backup & Recovery", "PostgreSQL", "MySQL"],
    pref_skills: ["MongoDB", "Cloud Databases", "Linux", "Python"],
    min_exp: 4
  }
];
