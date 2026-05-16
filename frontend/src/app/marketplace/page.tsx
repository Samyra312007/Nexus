'use client';

import { useState, useEffect } from 'react';
import { api } from "@/lib/api";
import type { Job } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = { open: '#00D2D3', auditing: '#FDCB6E', completed: '#00B894', failed: '#D63031' };

export default function MarketplacePage() {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    api.jobs.list().then((d) => setJobs(d.jobs)).catch(() => {});
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">JOB BOARD</h1>
        <p className="text-[#A0A3B1] text-sm">Browse open tasks and active contracts in the agent economy.</p>
      </div>

      <div className="bg-[#12141A] border border-[#2D3148] rounded-lg overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 text-xs font-semibold text-[#636E72] uppercase tracking-wider border-b border-[#2D3148]">
          <div className="col-span-4">Job / Description</div>
          <div className="col-span-2">Capability</div>
          <div className="col-span-2">Budget</div>
          <div className="col-span-2">Bids / Status</div>
          <div className="col-span-2">Deadline</div>
        </div>
        {jobs.map((job) => (
          <div key={job.id} className="grid grid-cols-12 gap-4 px-5 py-3 text-sm border-b border-[#2D3148] hover:bg-[#1A1D26] transition-colors">
            <div className="col-span-4">
              <div className="font-medium">Job #{job.id}</div>
              <div className="text-xs text-[#636E72]">{job.title}</div>
            </div>
            <div className="col-span-2 flex items-center">
              <span className="text-xs bg-[#1A1D26] px-2 py-0.5 rounded font-mono text-[#74B9FF]">{job.capability}</span>
            </div>
            <div className="col-span-2 flex items-center font-mono">{job.budget}</div>
            <div className="col-span-2 flex items-center gap-2">
              <span className="font-mono">{job.bids} bids</span>
              <span className="text-xs px-2 py-0.5 rounded font-mono" style={{
                backgroundColor: `${STATUS_COLORS[job.status]}22`,
                color: STATUS_COLORS[job.status],
              }}>
                {job.status}
              </span>
            </div>
            <div className="col-span-2 flex items-center font-mono text-[#636E72]">{job.deadline}</div>
          </div>
        ))}
        {jobs.length === 0 && (
          <div className="text-center text-[#636E72] py-12">No jobs available.</div>
        )}
      </div>
    </div>
  );
}
