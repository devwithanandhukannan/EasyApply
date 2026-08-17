import React, { ReactNode } from 'react';
import { motion, useInView } from 'framer-motion';

/**
 * StorySection wraps a full‑screen section and applies a subtle fade‑up animation
 * when the section scrolls into view. It also supports an optional `id` prop for
 * navigation via anchor links.
 */
const StorySection: React.FC<{ id?: string; children: ReactNode }> = ({ id, children }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section
      id={id}
      ref={ref}
      className="relative z-10 w-full min-h-screen snap-start flex flex-col items-center justify-center py-20"
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-7xl mx-auto"
      >
        {children}
      </motion.div>
    </section>
  );
};

export default StorySection;
