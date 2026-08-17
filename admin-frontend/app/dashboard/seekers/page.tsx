'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  Search,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface Seeker {
  id: string;
  fullName: string;
  email: string;
  location: string | null;
  availabilityStatus: string;
  discoverable: boolean;
  createdAt: string;
  _count: {
    applications: number;
    skills: number;
  };
}

export default function SeekersPage() {
  const [seekers, setSeekers] = useState<Seeker[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSeekers();
  }, [page, search]);

  const fetchSeekers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/seekers?page=${page}&limit=10&search=${encodeURIComponent(search)}`);
      if (res.data.success) {
        setSeekers(res.data.seekers);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Job Seeker Directory</h1>
          <p className="page-subtitle">All job seekers enjoy 100% free platform access with voluntary discovery opt-in</p>
        </div>
        <div style={{ width: '340px' }}>
          <div className="search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              className="input search-input"
              placeholder="Search seekers by name or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>
      </div>

      <div className="table-wrapper glass" style={{ width: '100%' }}>
        <table>
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Location</th>
              <th>Availability</th>
              <th>Discovery Opt-In</th>
              <th>Applications</th>
              <th>Plan</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--muted)' }}>
                  Loading seekers...
                </td>
              </tr>
            ) : seekers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--muted)' }}>
                  No job seekers found.
                </td>
              </tr>
            ) : (
              seekers.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: '600', color: '#fff' }}>{s.fullName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{s.email}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px' }}>{s.location || 'Not specified'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{s._count.skills} skills added</div>
                  </td>
                  <td>
                    <span className={`badge ${s.availabilityStatus === 'available' ? 'badge-green' : 'badge-yellow'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      {s.availabilityStatus === 'available' ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                      <span>{s.availabilityStatus}</span>
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${s.discoverable ? 'badge-green' : 'badge-yellow'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      {s.discoverable ? (
                        <>
                          <Eye size={13} />
                          <span>Opted-In (Visible to all)</span>
                        </>
                      ) : (
                        <>
                          <EyeOff size={13} />
                          <span>Hidden (Private)</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: '600' }}>{s._count.applications}</span>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}> applied</span>
                  </td>
                  <td>
                    <span className="badge badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <ShieldCheck size={13} />
                      <span>100% Free Forever</span>
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', width: '100%' }}>
        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
          Showing {seekers.length} of {total} candidates
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-ghost btn-sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <ChevronLeft size={16} />
            <span>Previous</span>
          </button>
          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 12px', fontSize: '13px', color: 'var(--muted)' }}>
            Page {page} of {totalPages || 1}
          </span>
          <button
            className="btn btn-ghost btn-sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
