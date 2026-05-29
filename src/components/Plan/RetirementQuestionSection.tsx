"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { type Lang, COPY } from "./plan-data";

export function RetirementQuestionSection({ lang }: { lang: Lang }) {
  const C = COPY.question[lang];
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="plan-v3-section" id="plan-question">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        style={{ marginBottom: 40 }}
      >
        <div className="plan-v3-overline">{C.overline}</div>
        <h2
          className="t-serif"
          style={{
            fontSize: "var(--text-display)",
            fontWeight: 400,
            color: "var(--ink)",
            lineHeight: 1.25,
            margin: "0 0 20px",
            maxWidth: 600,
          }}
        >
          {C.h1}
        </h2>
        <p className="plan-v3-body" style={{ maxWidth: 480 }}>{C.body}</p>
      </motion.div>
    </section>
  );
}
