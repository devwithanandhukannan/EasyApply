import 'dotenv/config';
import { prisma } from '../utils/prisma.ts';

async function main() {
  console.log('🔍 Analyzing database for job seeker data...');

  const profileCount = await prisma.jobSeekerProfile.count();
  const resumeCount = await prisma.resume.count();
  const applicationCount = await prisma.application.count();
  const interviewCount = await prisma.interview.count();
  const crmCount = await prisma.companyCandidateProfile.count();
  const talentPoolMembersCount = await prisma.talentPoolMember.count();
  const walkinEntriesCount = await prisma.walkInQueueEntry.count();
  const spotBookingsCount = await prisma.spotJobBooking.count();
  
  // Find all users that have a job seeker profile or have globalRoles = 1 with NO team membership
  const jobSeekerUsers = await prisma.user.findMany({
    where: {
      OR: [
        { jobSeekerProfile: { isNot: null } },
        {
          AND: [
            { globalRoles: 1 },
            { teamMemberships: { none: {} } }
          ]
        }
      ]
    },
    select: { id: true, mobileNumber: true }
  });

  console.log('\n📊 Current Counts Found:');
  console.log(`- Job Seeker Profiles: ${profileCount}`);
  console.log(`- Candidate Resumes: ${resumeCount}`);
  console.log(`- Job Applications: ${applicationCount}`);
  console.log(`- Candidate Interviews: ${interviewCount}`);
  console.log(`- CRM Candidate Profiles: ${crmCount}`);
  console.log(`- Talent Pool Memberships: ${talentPoolMembersCount}`);
  console.log(`- Walk-in Queue Entries: ${walkinEntriesCount}`);
  console.log(`- Spot Job Bookings: ${spotBookingsCount}`);
  console.log(`- Job Seeker User Accounts: ${jobSeekerUsers.length}`);

  console.log('\n🗑️  Executing deletion of all job seeker data...');

  const userIdsToDelete = jobSeekerUsers.map(u => u.id);

  // 1. Delete all JobSeekerProfile records explicitly (Prisma cascading handles children)
  const deletedProfiles = await prisma.jobSeekerProfile.deleteMany({});
  console.log(`✅ Deleted ${deletedProfiles.count} JobSeekerProfile records and all cascading relations.`);

  // 2. Delete any lingering applications / resumes if any
  const deletedApps = await prisma.application.deleteMany({});
  const deletedResumes = await prisma.resume.deleteMany({});
  const deletedCrm = await prisma.companyCandidateProfile.deleteMany({});
  const deletedTalentPool = await prisma.talentPoolMember.deleteMany({});
  const deletedWalkin = await prisma.walkInQueueEntry.deleteMany({});
  const deletedSpotBookings = await prisma.spotJobBooking.deleteMany({});

  // 3. Delete job seeker user accounts
  let deletedUsersCount = 0;
  if (userIdsToDelete.length > 0) {
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        id: { in: userIdsToDelete }
      }
    });
    deletedUsersCount = deletedUsers.count;
  }
  console.log(`✅ Deleted ${deletedUsersCount} job seeker user accounts.`);

  // 4. Verify post-deletion counts
  const remainingProfiles = await prisma.jobSeekerProfile.count();
  const remainingApplications = await prisma.application.count();
  const remainingResumes = await prisma.resume.count();
  const remainingUsers = await prisma.user.count();
  const remainingCompanies = await prisma.company.count();
  const remainingTeamMembers = await prisma.teamMember.count();

  console.log('\n✨ Database State After Cleanup:');
  console.log(`- Remaining Job Seeker Profiles: ${remainingProfiles}`);
  console.log(`- Remaining Applications: ${remainingApplications}`);
  console.log(`- Remaining Resumes: ${remainingResumes}`);
  console.log(`- Remaining Total Users: ${remainingUsers} (Company team members & Admins preserved)`);
  console.log(`- Remaining Companies: ${remainingCompanies}`);
  console.log(`- Remaining Team Members: ${remainingTeamMembers}`);
  console.log('\n🎉 All job seeker data successfully purged from the database.');
}

main()
  .catch((e) => {
    console.error('❌ Error deleting job seeker data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
