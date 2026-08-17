import React from 'react';
import { motion } from 'framer-motion';

/**
 * Simple subscription plan showcase.
 * Replace the mock data with real plans when available.
 */
const plans = [
  { name: 'Free', price: '$0', features: ['Basic matching', 'Limited alerts'] },
  { name: 'Pro', price: '$9/mo', features: ['Unlimited alerts', 'Priority support', 'Resume scoring'] },
  { name: 'Enterprise', price: 'Contact us', features: ['Team dashboard', 'Custom branding', 'Dedicated manager'] },
];

export default function SubscriptionPlan() {
  return (
    <section className="relative z-10 max-w-7xl mx-auto px-6 py-24" id="pricing">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-5xl font-bold mb-4">Pricing Plans</h2>
        <p className="text-sm max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Choose the plan that fits your job‑search needs. All plans include AI‑powered matching.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, i) => (
          <motion.div
            key={i}
            className="glass-card rounded-2xl p-6 flex flex-col items-center text-center"
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.9)' }}>{plan.name}</h3>
            <p className="text-2xl font-bold mb-4" style={{ color: 'rgba(255,255,255,0.8)' }}>{plan.price}</p>
            <ul className="text-sm space-y-2 mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {plan.features.map((f, idx) => (
                <li key={idx}>• {f}</li>
              ))}
            </ul>
            <button className="btn-primary px-5 py-2 rounded-xl text-sm">Select</button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
