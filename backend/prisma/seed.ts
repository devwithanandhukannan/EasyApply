import 'dotenv/config';
import { prisma } from '../src/utils/prisma.ts';
import bcrypt from 'bcrypt';

async function main() {
  console.log('🌱 Starting seed...');

  // ─── 1. PLATFORM ADMIN ───────────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@easyapply.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.platformAdmin.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: { email: adminEmail, passwordHash, name: 'Platform Admin' }
  });
  console.log(`✅ Admin created: ${adminEmail}`);

  // ─── 2. PLATFORM SETTINGS SINGLETON ──────────────────────────────────────────
  await prisma.platformSettings.upsert({
    where: { id: 'singleton' },
    update: {}, // don't override existing settings on re-seed
    create: {
      id: 'singleton',
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: process.env.SMTP_USER ?? null,
      emailFrom: process.env.EMAIL_FROM ?? null,
      emailFromName: 'EasyApply',
      groqModel: 'llama-3.3-70b-versatile',
      livekitApiUrl: process.env.LIVEKIT_API_URL ?? null,
      livekitApiKey: process.env.LIVEKIT_API_KEY ?? null,
      platformName: 'EasyApply',
      maintenanceMode: false,
      allowNewCompanyReg: true,
      allowNewSeekerReg: true,
      walkInQueueMaxGlobal: 200,
    }
  });
  console.log('✅ PlatformSettings singleton created');

  // ─── 3. DEFAULT SUBSCRIPTION PLANS ───────────────────────────────────────────
  const freeFeatures = {
    jobPostings: true, atsScoring: true, aiResumeScan: true, aiResumeBuilder: true,
    walkinInterview: false, seekerDiscovery: false, crmTalentPool: false, spotJobs: false,
    offerLetters: true, interviewScheduling: true, kanban: true
  };

  const proFeatures = {
    jobPostings: true, atsScoring: true, aiResumeScan: true, aiResumeBuilder: true,
    walkinInterview: true, seekerDiscovery: true, crmTalentPool: true, spotJobs: true,
    offerLetters: true, interviewScheduling: true, kanban: true
  };

  const enterpriseFeatures = { ...proFeatures };

  const plans = [
    { name: 'Free', description: 'Get started with essential hiring tools', features: freeFeatures, maxJobPostings: 3, maxTeamMembers: 2, price: null, isCustom: false },
    { name: 'Pro', description: 'Full platform access for growing teams', features: proFeatures, maxJobPostings: 50, maxTeamMembers: 15, price: 2999, isCustom: false },
    { name: 'Enterprise', description: 'Unlimited access with priority support', features: enterpriseFeatures, maxJobPostings: 9999, maxTeamMembers: 9999, price: 9999, isCustom: false },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: { description: plan.description, features: plan.features, maxJobPostings: plan.maxJobPostings, maxTeamMembers: plan.maxTeamMembers },
      create: plan as any
    });
    console.log(`✅ Plan: ${plan.name}`);
  }

  console.log('\n🎉 Seed completed successfully!');
  console.log(`📧 Admin login: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
