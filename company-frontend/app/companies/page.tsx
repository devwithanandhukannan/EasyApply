'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/app/lib/axios';
import { Building2, Search, CheckCircle, Briefcase } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  logoUrl: string | null;
  industry: string;
  size: string;
  tagline: string | null;
  verificationBadge: string;
  activeJobsCount: number;
}

export default function CompaniesDirectory() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, industryFilter, sizeFilter, verifiedOnly, companies]);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/public/companies');
      if (res.data.success) {
        setCompanies(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = companies;

    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.industry.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (industryFilter) {
      filtered = filtered.filter(c => c.industry === industryFilter);
    }

    if (sizeFilter) {
      filtered = filtered.filter(c => c.size === sizeFilter);
    }

    if (verifiedOnly) {
      filtered = filtered.filter(c => c.verificationBadge !== 'none');
    }

    setFilteredCompanies(filtered);
  };

  const getIndustries = () => [...new Set(companies.map(c => c.industry))];
  const getSizes = () => [...new Set(companies.map(c => c.size))];

  const slugify = (name: string) => name.toLowerCase().replace(/\s+/g, '-');

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400 text-sm">Loading companies...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      
      {/* Header */}
      <header className="border-b border-zinc-900 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Explore Companies</h1>
          <p className="text-lg text-zinc-400 max-w-2xl">
            Discover verified companies hiring talented professionals across industries
          </p>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
              />
            </div>

            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-zinc-700"
            >
              <option value="">All Industries</option>
              {getIndustries().map(ind => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>

            <select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-zinc-700"
            >
              <option value="">All Sizes</option>
              {getSizes().map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="w-4 h-4 rounded bg-zinc-900 border-zinc-800"
              />
              Show verified companies only
            </label>

            <div className="text-sm text-zinc-500">
              {filteredCompanies.length} companies found
            </div>
          </div>
        </div>

        {/* Companies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map(company => (
            <div
              key={company.id}
              onClick={() => router.push(`/careers/${slugify(company.name)}`)}
              className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 hover:bg-zinc-900/60 hover:border-zinc-700 transition cursor-pointer group"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                  {company.logoUrl ? (
                    <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-6 h-6 text-zinc-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <h3 className="font-semibold text-white group-hover:text-zinc-100 transition truncate">
                      {company.name}
                    </h3>
                    {company.verificationBadge !== 'none' && (
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                  <p className="text-sm text-zinc-500">{company.industry}</p>
                </div>
              </div>

              {company.tagline && (
                <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{company.tagline}</p>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">{company.size}</span>
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Briefcase className="w-4 h-4" />
                  <span>{company.activeJobsCount} jobs</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCompanies.length === 0 && (
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No companies found</h3>
            <p className="text-zinc-500">Try adjusting your filters</p>
          </div>
        )}
      </main>
    </div>
  );
}