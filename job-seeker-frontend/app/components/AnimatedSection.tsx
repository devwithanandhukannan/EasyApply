import React from 'react';
import { motion, useInView } from 'framer-motion';

/**
 * AnimatedSection provides a fade‑in effect when scrolled into view.
 * It can be used for any storytelling block on the landing page.
 */
const AnimatedSection: React.FC<{ id?: string; children: React.ReactNode }> = ({ id, children }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-150px' });

  return (
    <section id={id} ref={ref} className="relative z-10 w-full min-h-screen snap-start flex items-center justify-center py-20">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="max-w-7xl mx-auto"
      >
        {children}
      </motion.div>
    </section>
  );
};

export default AnimatedSection;
