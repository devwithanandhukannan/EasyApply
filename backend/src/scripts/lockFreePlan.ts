import 'dotenv/config';
import { prisma } from '../utils/prisma.ts';

const LOCKED_FREE_FEATURES = {
  jobPostings: true,
  kanban: true,
  atsScoring: false,
  aiResumeScan: false,
  aiResumeBuilder: false,
  walkinInterview: false,
  seekerDiscovery: false,
  crmTalentPool: false,
  spotJobs: false,
  offerLetters: false,
  interviewScheduling: false,
  teamWorkspace: false
};

async function updateFreePlan() {
  const freePlan = await prisma.subscriptionPlan.findUnique({
    where: { name: 'Free' }
  });

  if (freePlan) {
    const updated = await prisma.subscriptionPlan.update({
      where: { id: freePlan.id },
      data: {
        features: LOCKED_FREE_FEATURES,
        maxJobPostings: 3,
        maxTeamMembers: 1,
      }
    });
    console.log('Updated Free plan in DB:', JSON.stringify(updated, null, 2));
  } else {
    const created = await prisma.subscriptionPlan.create({
      data: {
        name: 'Free',
        description: 'Default Free Tier - Essential Job Postings & Kanban',
        features: LOCKED_FREE_FEATURES,
        maxJobPostings: 3,
        maxTeamMembers: 1,
        isActive: true,
        isPublic: true,
        isCustom: false,
        price: null,
      }
    });
    console.log('Created Free plan in DB:', JSON.stringify(created, null, 2));
  }
}

updateFreePlan().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
