'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { rdListAssessments, rdCreateAssessment, rdGetAssessment } from './api';

/**
 * Hook: manages assessment ID in localStorage + auto-creates on first visit.
 * Returns { assessmentId, assessment, loading, refresh }
 */
export function useAssessment() {
  const router = useRouter();
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (id?: string) => {
    const aid = id ?? assessmentId;
    if (!aid) return;
    try {
      const data = await rdGetAssessment(aid);
      setAssessment(data);
    } catch {
      // assessment deleted or invalid
      try { localStorage.removeItem('_rd_assessment'); } catch {}
      setAssessmentId(null);
    }
  }, [assessmentId]);

  useEffect(() => {
    async function init() {
      try {
        // Check localStorage first
        let storedId: string | null = null;
        try { storedId = localStorage.getItem('_rd_assessment'); } catch {}

        if (storedId) {
          try {
            const data = await rdGetAssessment(storedId);
            setAssessmentId(storedId);
            setAssessment(data);
            setLoading(false);
            return;
          } catch {
            // Invalid stored ID, clear it
            try { localStorage.removeItem('_rd_assessment'); } catch {}
          }
        }

        // Check if user has any assessments
        const list = await rdListAssessments();
        if (list.length > 0) {
          const latest = list[0]; // sorted desc
          try { localStorage.setItem('_rd_assessment', latest.id); } catch {}
          setAssessmentId(latest.id);
          const data = await rdGetAssessment(latest.id);
          setAssessment(data);
        } else {
          // Auto-create first assessment
          const created = await rdCreateAssessment();
          try { localStorage.setItem('_rd_assessment', created.id); } catch {}
          setAssessmentId(created.id);
          const data = await rdGetAssessment(created.id);
          setAssessment(data);
        }
      } catch {
        // No business yet — redirect to select
        router.push('/select');
      }
      setLoading(false);
    }
    init();
  }, [router]);

  return { assessmentId, assessment, loading, refresh };
}

/** Get session completion flags from assessment */
export function getCompletedSessions(assessment: any): Record<string, boolean> {
  return (assessment?.assessment?.completedFlags as Record<string, boolean>) ?? {};
}
