import 'dotenv/config';
import { prisma } from '../utils/prisma.ts';
import fs from 'fs';
import path from 'path';

async function main() {
  const uploadDir = path.resolve(process.cwd(), 'uploads/resumes');
  const profiles = await prisma.jobSeekerProfile.findMany({
    include: { resumes: true }
  });
  console.log(`Found ${profiles.length} profiles.`);
  
  if (fs.existsSync(uploadDir)) {
    const files = fs.readdirSync(uploadDir).filter(f => f.endsWith('.pdf') || f.endsWith('.docx'));
    console.log('Files in uploads/resumes:', files);
    
    for (const p of profiles) {
      if (p.resumes.length === 0 && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const f = files[i]!;
          const filePath = path.join('uploads/resumes', f);
          const name = f.replace(/^\d+-/, '').replace(/\.pdf$/i, '');
          
          await prisma.resume.create({
            data: {
              jobSeekerProfileId: p.id,
              name,
              source: 'uploaded',
              filePath,
              atsScore: 82,
              isPrimary: i === 0,
              content: { rawText: 'Uploaded Resume Document' },
              aiSuggestions: {
                scores: { ats: 82, formatting: 88, keywords: 78, content: 82 },
                strengths: ['Uploaded PDF document preserved exactly', 'Clean structure'],
                improvements: {},
                missingSections: [],
                keywordGaps: [],
              },
            },
          });
          console.log(`Successfully synced resume ${name} to ${p.fullName}`);
        }
      }
    }
  }
}

main().catch(console.error).finally(() => process.exit(0));
