const regex1 = /(?:\s|—|-|–)*\(?((?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4}|\d{4})\s*(?:-|—|–|to)\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4}|\d{4}|Present|In Progress))\)?\s*$/i;
const texts = [
  "Technical Mentor — Application Development 2024-2025",
  "Data Science Intern Apr 2024 - May 2024",
  "Master of Computer Applications (MCA) in Computer Applications 2023-2025",
  "PG Diploma in Blockchain Technology in Blockchain Technology 2025-In Progress"
];

texts.forEach(t => {
  const match = t.match(regex1);
  console.log(`"${t}" =>`, match ? match[1] : 'NO MATCH');
});
