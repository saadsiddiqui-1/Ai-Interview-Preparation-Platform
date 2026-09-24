const TYPE_SEQUENCE = {
  HR: ["HR"],
  Technical: ["Technical"],
  Behavioral: ["Behavioral"],
  Mixed: ["Technical", "Behavioral", "HR"],
};

const FOCUS_AREAS = [
  "communication",
  "problem solving",
  "teamwork",
  "planning",
  "quality",
  "customer impact",
  "time management",
  "risk management",
  "learning",
  "leadership",
  "adaptability",
  "ownership",
  "decision making",
  "collaboration",
  "continuous improvement",
];

const ROLE_DOMAINS = [
  {
    keywords: ["doctor", "nurse", "medical", "health", "pharmac", "clinical", "dentist", "therapist"],
    competencies: ["Patient Assessment", "Clinical Decision-Making", "Patient Safety", "Healthcare Ethics", "Clear Patient Communication"],
  },
  {
    keywords: ["teacher", "professor", "lecturer", "education", "tutor", "trainer", "principal"],
    competencies: ["Lesson Planning", "Student Assessment", "Classroom Management", "Inclusive Teaching", "Student Engagement"],
  },
  {
    keywords: ["account", "finance", "bank", "audit", "tax", "investment", "insurance"],
    competencies: ["Financial Analysis", "Risk Management", "Regulatory Compliance", "Financial Reporting", "Data Accuracy"],
  },
  {
    keywords: ["lawyer", "legal", "advocate", "attorney", "paralegal", "compliance"],
    competencies: ["Legal Research", "Case Analysis", "Professional Ethics", "Negotiation", "Written Advocacy"],
  },
  {
    keywords: ["civil", "mechanical", "electrical", "electronics", "chemical", "industrial", "architect", "engineer"],
    competencies: ["Engineering Design", "Safety Standards", "Technical Calculations", "Quality Assurance", "Project Planning"],
  },
  {
    keywords: ["designer", "ui", "ux", "graphic", "creative", "artist", "animation"],
    competencies: ["User Research", "Design Thinking", "Visual Communication", "Accessibility", "Design Critique"],
  },
  {
    keywords: ["sales", "marketing", "brand", "business development", "advertising", "social media"],
    competencies: ["Customer Needs Analysis", "Market Research", "Campaign Measurement", "Negotiation", "Relationship Management"],
  },
  {
    keywords: ["human resource", "hr ", "recruit", "talent", "people operations"],
    competencies: ["Candidate Assessment", "Employee Relations", "Labor Compliance", "Performance Management", "Conflict Resolution"],
  },
  {
    keywords: ["operations", "supply chain", "logistics", "procurement", "warehouse", "quality manager"],
    competencies: ["Process Improvement", "Resource Planning", "Vendor Management", "Quality Control", "Operational Risk"],
  },
  {
    keywords: ["hotel", "hospitality", "chef", "cook", "restaurant", "travel", "tourism"],
    competencies: ["Customer Service", "Food or Guest Safety", "Service Quality", "Team Coordination", "Complaint Resolution"],
  },
  {
    keywords: ["research", "scientist", "laboratory", "chemist", "biologist", "physicist"],
    competencies: ["Research Methodology", "Experimental Design", "Data Interpretation", "Research Ethics", "Scientific Communication"],
  },
  {
    keywords: ["government", "public administration", "civil service", "policy", "social worker"],
    competencies: ["Public Service Ethics", "Policy Implementation", "Stakeholder Communication", "Record Management", "Community Impact"],
  },
  {
    keywords: ["developer", "software", "data", "cyber", "cloud", "devops", "network", "system administrator", "machine learning", "artificial intelligence"],
    competencies: ["System Design", "Testing and Quality", "Security", "Performance", "Technical Problem-Solving"],
  },
];

const UNIVERSAL_ROLE_COMPETENCIES = [
  "Core Role Responsibilities",
  "Professional Standards",
  "Quality and Accuracy",
  "Problem-Solving",
  "Stakeholder Communication",
];

const getRoleCompetencies = (role) => {
  const normalizedRole = ` ${role.toLowerCase()} `;
  const domain = ROLE_DOMAINS.find(({ keywords }) =>
    keywords.some((keyword) => normalizedRole.includes(keyword))
  );
  return domain?.competencies || UNIVERSAL_ROLE_COMPETENCIES;
};

const HR_TEMPLATES = {
  Beginner: [
    ({ role }) => `Introduce yourself and explain your interest in becoming a ${role}.`,
    ({ role }) => `What basic strengths would help you succeed as a ${role}?`,
    () => "What motivates you to do your best work?",
    () => "What is one skill you are currently trying to improve?",
    () => "Describe the type of team environment you enjoy.",
    () => "How do you organize your daily tasks?",
    ({ role }) => `What do you hope to learn in your first year as a ${role}?`,
    () => "Why is punctuality and reliability important at work?",
  ],
  Intermediate: [
    ({ role }) => `Summarize your experience and explain why it prepares you for this ${role} position.`,
    ({ role }) => `Which achievement best demonstrates your suitability for the ${role} role?`,
    () => "How do you prioritize competing assignments with similar deadlines?",
    () => "Describe constructive feedback you received and how it changed your work.",
    () => "How do you maintain motivation during repetitive or difficult assignments?",
    ({ role }) => `What professional gap must you close to become a stronger ${role}?`,
    () => "What factors do you consider when evaluating a new job opportunity?",
    () => "How do you build effective working relationships with new colleagues?",
  ],
  Advanced: [
    ({ role }) => `What strategic value would you bring to this organization as an experienced ${role}?`,
    () => "Describe a difficult ethical decision at work and the principles that guided you.",
    () => "How do you influence stakeholders when you have no direct authority over them?",
    () => "Tell me about a major professional setback and how it changed your leadership approach.",
    ({ role }) => `Which industry change will most affect the ${role} profession, and how are you preparing for it?`,
    () => "How do you balance short-term delivery pressure with long-term organizational quality?",
    () => "Describe how you measure your professional impact beyond completing assigned tasks.",
    () => "What conditions would cause you to challenge a senior leader's decision, and how would you do it?",
  ],
};

const BEHAVIORAL_TEMPLATES = {
  Beginner: [
    () => "Tell me about a simple problem you solved during a project or assignment.",
    () => "Describe a time you helped a teammate complete a task.",
    () => "Give an example of how you handled a new responsibility.",
    () => "Tell me about a time you completed work before a deadline.",
    () => "Describe a mistake you made and the basic lesson you learned.",
    () => "Give an example of when you asked for help appropriately.",
    () => "Tell me about a time you explained an idea clearly to someone.",
    ({ experience }) => `Using an example from ${experience}, describe your contribution to the result.`,
  ],
  Intermediate: [
    () => "Describe a difficult problem you solved. Explain the situation, your actions, and the measurable result.",
    () => "Tell me about a disagreement within a team and how you reached a workable resolution.",
    () => "Give an example of receiving critical feedback and applying it to improve your performance.",
    () => "Describe a time you learned an unfamiliar skill quickly to deliver an important task.",
    () => "Tell me about a situation where you took ownership beyond your assigned responsibilities.",
    () => "Give an example of managing competing priorities under pressure.",
    () => "Describe a decision you made using incomplete information and explain the outcome.",
    ({ experience }) => `Using an example from ${experience}, explain how your individual actions improved a team result.`,
  ],
  Advanced: [
    () => "Describe a high-impact decision you made under significant uncertainty. What trade-offs did you evaluate?",
    () => "Tell me about a serious cross-functional conflict you resolved while preserving stakeholder trust.",
    () => "Give an example of leading through a major failure or crisis. How did you limit the impact?",
    () => "Describe a time you challenged an established process and produced measurable organizational improvement.",
    () => "Tell me about a complex initiative where you influenced outcomes without formal authority.",
    () => "Describe how you balanced speed, quality, and risk during a critical delivery.",
    () => "Give an example of identifying a hidden problem before it became a major issue.",
    ({ experience }) => `Using an example from ${experience}, evaluate your decisions, measurable impact, and what you would do differently now.`,
  ],
};

const TECHNICAL_TEMPLATES = {
  Beginner: [
    ({ skill }) => `What is ${skill}, and where would you use it in a real project?`,
    ({ skill }) => `Explain the core concepts of ${skill} to someone who is new to it.`,
    ({ skill, role }) => `How is ${skill} useful in the day-to-day work of a ${role}?`,
    ({ skill }) => `Describe a small project or feature you could build using ${skill}.`,
  ],
  Intermediate: [
    ({ skill }) => `Describe a practical problem you solved using ${skill} and the decisions you made.`,
    ({ skill }) => `What common mistakes or performance issues occur with ${skill}, and how do you avoid them?`,
    ({ skill, role }) => `How would you apply ${skill} when designing a production feature as a ${role}?`,
    ({ skill }) => `How would you test and debug a feature implemented with ${skill}?`,
  ],
  Advanced: [
    ({ skill }) => `Explain the major architectural trade-offs involved when using ${skill} at scale.`,
    ({ skill }) => `How would you diagnose and optimize a production bottleneck involving ${skill}?`,
    ({ skill, role }) => `Design a resilient solution using ${skill} for a complex ${role} scenario. Explain your trade-offs.`,
    ({ skill }) => `When would you avoid ${skill}, and what alternative would you choose?`,
  ],
};

const GENERAL_TECHNICAL_TEMPLATES = {
  Beginner: ({ role }) => `What foundational knowledge is most important for a ${role}, and why?`,
  Intermediate: ({ role }) => `Walk through how you would solve a realistic problem commonly faced by a ${role}.`,
  Advanced: ({ role }) => `Design a scalable solution to a complex problem in the ${role} domain and explain your trade-offs.`,
};

const expectedPointsFor = (type, skill) => {
  if (type === "Technical") {
    return [
      `Demonstrates accurate understanding${skill ? ` of ${skill}` : " of the role"}`,
      "Uses a clear real-world example",
      "Explains decisions and trade-offs",
    ];
  }
  if (type === "Behavioral") {
    return ["Describes a specific situation", "Explains personal actions", "States the measurable result or lesson"];
  }
  return ["Gives a concise and relevant answer", "Connects the answer to the target role", "Communicates with confidence"];
};

const generateLocalQuestions = ({ role, type, difficulty, count, resume }) => {
  const resumeSkills = resume.analysis.skills.length
    ? resume.analysis.skills
    : resume.analysis.keywords.slice(0, 5);
  const skills = [...new Set([...getRoleCompetencies(role), ...resumeSkills])];
  const experience = resume.analysis.experience[0] || "your academic or project experience";
  const typeSequence = TYPE_SEQUENCE[type];
  const questions = [];
  const usedQuestions = new Set();

  for (let index = 0; questions.length < count && index < count * 5; index += 1) {
    const questionType = typeSequence[index % typeSequence.length];
    const skill = questionType === "Technical" && skills.length
      ? skills[index % skills.length]
      : null;
    let template;

    if (questionType === "Technical") {
      const templates = TECHNICAL_TEMPLATES[difficulty];
      template = skill
        ? templates[Math.floor(index / typeSequence.length) % templates.length]
        : GENERAL_TECHNICAL_TEMPLATES[difficulty];
    } else if (questionType === "Behavioral") {
      const templates = BEHAVIORAL_TEMPLATES[difficulty];
      template = templates[Math.floor(index / typeSequence.length) % templates.length];
    } else {
      const templates = HR_TEMPLATES[difficulty];
      template = templates[Math.floor(index / typeSequence.length) % templates.length];
    }

    const baseQuestion = template({ role, skill, experience });
    const question = usedQuestions.has(baseQuestion)
      ? `${baseQuestion} Focus your answer specifically on ${FOCUS_AREAS[index % FOCUS_AREAS.length]}.`
      : baseQuestion;
    if (usedQuestions.has(question)) continue;
    usedQuestions.add(question);
    questions.push({
      order: questions.length + 1,
      question,
      type: questionType,
      difficulty,
      skill,
      expectedPoints: expectedPointsFor(questionType, skill),
    });
  }

  return questions;
};

module.exports = { generateLocalQuestions };
