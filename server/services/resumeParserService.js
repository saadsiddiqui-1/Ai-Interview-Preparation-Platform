const fs = require("fs/promises");
const mammoth = require("mammoth");
const { PDFParse } = require("pdf-parse");

const SKILLS = [
  "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Express.js",
  "HTML", "CSS", "Python", "Java", "C++", "C#", "PHP", "Ruby", "Go",
  "SQL", "MongoDB", "MySQL", "PostgreSQL", "Redis", "Firebase", "AWS",
  "Azure", "Google Cloud", "Docker", "Kubernetes", "Git", "GitHub",
  "REST API", "GraphQL", "Machine Learning", "Deep Learning", "TensorFlow",
  "PyTorch", "Pandas", "NumPy", "Data Analysis", "Power BI", "Tableau",
  "Figma", "UI/UX", "Agile", "Scrum", "Linux", "DevOps",
];

const SKILL_ALIASES = {
  "Next.js": ["next.js", "nextjs"],
  "Node.js": ["node.js", "nodejs"],
  "Express.js": ["express.js", "expressjs", "express"],
  "C++": ["c++"],
  "C#": ["c#", "c sharp"],
  "Google Cloud": ["google cloud", "gcp"],
  "REST API": ["rest api", "restful api", "restful services"],
  "Machine Learning": ["machine learning", "ml"],
  "Deep Learning": ["deep learning"],
  "Power BI": ["power bi", "powerbi"],
  "UI/UX": ["ui/ux", "user interface", "user experience"],
};

const STOP_WORDS = new Set([
  "about", "after", "also", "and", "are", "been", "being", "but", "can",
  "for", "from", "had", "has", "have", "into", "its", "more", "not",
  "our", "that", "the", "their", "them", "they", "this", "through", "to",
  "using", "was", "were", "with", "work", "worked", "your",
]);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeText = (text) =>
  text.replace(/\r/g, "").replace(/[\t ]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();

const extractDocumentText = async (filePath, mimeType) => {
  if (mimeType === "application/pdf") {
    const parser = new PDFParse({ data: await fs.readFile(filePath) });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  throw new Error("Only PDF and DOCX resumes can be analyzed.");
};

const extractSkills = (text) => {
  const lowerText = text.toLowerCase();
  return SKILLS.filter((skill) => {
    const aliases = SKILL_ALIASES[skill] || [skill.toLowerCase()];
    return aliases.some((alias) => {
      const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(alias)}([^a-z0-9]|$)`, "i");
      return pattern.test(lowerText);
    });
  });
};

const extractSection = (text, headings) => {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const allHeadings = [
    "education", "academic background", "qualifications", "experience",
    "work experience", "employment history", "professional experience",
    "skills", "technical skills", "projects", "certifications", "summary",
    "profile", "achievements", "languages", "interests",
  ];
  const startIndex = lines.findIndex((line) =>
    headings.some((heading) => line.toLowerCase().replace(/:$/, "") === heading)
  );
  if (startIndex === -1) return [];

  const sectionLines = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const normalizedLine = lines[index].toLowerCase().replace(/:$/, "");
    if (allHeadings.includes(normalizedLine)) break;
    sectionLines.push(lines[index]);
  }
  return sectionLines.slice(0, 12);
};

const extractEducation = (text) => {
  const section = extractSection(text, ["education", "academic background", "qualifications"]);
  if (section.length) return section;
  const pattern = /\b(b\.?tech|b\.?e\.?|m\.?tech|m\.?e\.?|bca|mca|bsc|msc|bachelor(?:'s)?|master(?:'s)?|ph\.?d|diploma|university|college)\b/i;
  return text.split("\n").map((line) => line.trim()).filter((line) => pattern.test(line)).slice(0, 8);
};

const extractExperience = (text) => {
  const section = extractSection(text, ["experience", "work experience", "employment history", "professional experience"]);
  if (section.length) return section;
  const pattern = /\b(intern(?:ship)?|developer|engineer|analyst|designer|manager|consultant|\d+\+?\s+years?)\b/i;
  return text.split("\n").map((line) => line.trim()).filter((line) => pattern.test(line)).slice(0, 10);
};

const extractKeywords = (text, skills) => {
  const frequencies = new Map();
  const words = text.toLowerCase().match(/[a-z][a-z+#.]{2,}/g) || [];
  words.forEach((word) => {
    const cleaned = word.replace(/[.]$/, "");
    if (!STOP_WORDS.has(cleaned)) frequencies.set(cleaned, (frequencies.get(cleaned) || 0) + 1);
  });
  const frequentWords = [...frequencies.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([word]) => word);
  return [...new Set([...skills, ...frequentWords])].slice(0, 20);
};

const parseResume = async (filePath, mimeType) => {
  const rawText = normalizeText(await extractDocumentText(filePath, mimeType));
  if (!rawText) throw new Error("No readable text was found in the resume.");

  const skills = extractSkills(rawText);
  return {
    skills,
    education: extractEducation(rawText),
    experience: extractExperience(rawText),
    keywords: extractKeywords(rawText, skills),
    rawText,
  };
};

module.exports = { parseResume };
