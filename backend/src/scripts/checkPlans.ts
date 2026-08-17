import 'dotenv/config';
import { prisma } from '../utils/prisma.ts';

async function main() {
  const plans = await prisma.subscriptionPlan.findMany();
  console.log('--- PLANS IN DB ---');
  console.log(JSON.stringify(plans, null, 2));

  const subs = await prisma.companySubscription.findMany({
    include: { plan: true, company: { select: { id: true, name: true, email: true } } }
  });
  console.log('--- COMPANY SUBSCRIPTIONS IN DB ---');
  console.log(JSON.stringify(subs, null, 2));
}

main().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
