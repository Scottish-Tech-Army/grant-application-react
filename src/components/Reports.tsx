import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { User, Application } from '../types';

interface StatusStats {
  [key: string]: number;
  total: number;
}

interface TemporalStat {
  label: string;
  count: number;
  funded: number;
}

interface FunderStat {
  name: string;
  total: number;
  funded: number;
}

interface UserProp {
  user: User;
}

export default function Reports({ user }: UserProp) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('monthly'); // 'monthly' or 'yearly'

  // Fetch logic moved into component
  useEffect(() => {
    const fetchApplications = async () => {
      // Optimization: Skip if already fetched (or logic if you want refresh)
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:8081/app/applications?charityId=${user.charityId}`, {
          method: 'GET'
        });
        if (!response.ok) throw new Error('API failed');
        const data = await response.json();
        setApplications(data);
      } catch (err) {
        console.warn("API Fetch failed, using high-density sample data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [user.charityId]);

  if (isLoading) {
    return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--primary)', fontWeight: 700 }}>Synthesizing Strategic Intelligence...</div>;
  }
  // Normalize field names (support both legacy and new API format)
  const normalizedApps = applications.map(a => ({
    ...a,
    status: a.status || 'DRAFT',
    funder_name: a.funderName || a.funder_name || 'Generic Funder',
    date: a.modifiedAt || a.created_at || new Date().toISOString()
  }));

  // 1. Calculate Status Statistics
  const stats = normalizedApps.reduce((acc: StatusStats, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    acc.total += 1;
    return acc;
  }, { total: 0 } as StatusStats);

  // 2. Format Data for Status Distribution (Pie)
  const statusData = [
    { name: 'SUBMITTED', value: stats['SUBMITTED'] || 0, color: '#006a4d' },
    { name: 'FUNDED', value: stats['FUNDED'] || 0, color: '#10b981' },
    { name: 'REJECTED', value: stats['REJECTED'] || 0, color: '#941b1b' },
    { name: 'DRAFT', value: stats['DRAFT'] || 0, color: '#94a3b8' }
  ].filter(d => d.value > 0);

  // 3. Temporal Grouping: Yearly/Monthly Insights
  const temporalStats = normalizedApps.reduce((acc: Record<string, TemporalStat>, app) => {
    const d = new Date(app.date!);
    const label = timeRange === 'yearly' 
      ? `${d.getFullYear()}` 
      : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[label]) acc[label] = { label, count: 0, funded: 0 };
    acc[label].count += 1;
    if (app.status === 'FUNDED') acc[label].funded += 1;
    return acc;
  }, {});

  const timelineData = Object.values(temporalStats).sort((a, b) => a.label.localeCompare(b.label));

  // 4. Funder Performance (Normalized)
  const funderStats = normalizedApps.reduce((acc: Record<string, FunderStat>, app) => {
    const fn = app.funder_name!;
    if (!acc[fn]) acc[fn] = { name: fn, total: 0, funded: 0 };
    acc[fn].total += 1;
    if (app.status === 'FUNDED') acc[fn].funded += 1;
    return acc;
  }, {});
  
  const barData = Object.values(funderStats)
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--primary)' }}>Application Analytics</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem', fontWeight: 600 }}>
            Visualizing Grant Success & Funder Engagement
          </p>
        </div>
      </div>

      {/* KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem', background: '#e6f1ef', border: 'none' }}>
          <div style={{ fontSize: '0.65rem', color: '#006a4d', fontWeight: 800, marginBottom: '0.5rem' }}>TOTAL APPS</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#006a4d' }}>{stats.total}</div>
        </div>
        <div className="card" style={{ padding: '1.25rem', background: '#ecfdf5', border: 'none' }}>
          <div style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 800, marginBottom: '0.5rem' }}>SUCCESSFUL</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#059669' }}>{stats['FUNDED'] || 0}</div>
        </div>
        <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px' }}>
            <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, marginBottom: '0.5rem' }}>SUCCESS RATE</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#334155' }}>
              {stats.total > 0 ? Math.round(((stats['FUNDED'] || 0) / stats.total) * 100) : 0}%
            </div>
        </div>
        <div style={{ background: '#fef2f2', padding: '1.25rem', borderRadius: '12px' }}>
            <div style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 800, marginBottom: '0.5rem' }}>DECLINED</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#ef4444' }}>{stats['REJECTED'] || 0}</div>
        </div>
      </div>

      <div className="grid-2 mt-4" style={{ gap: '2rem', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)' }}>
        {/* PIE CHART: STATUS */}
        <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '2rem', color: 'var(--primary)' }}>Pipeline Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '0.75rem', fontWeight: 600 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* LINE CHART: TEMPORAL TRENDS (Contained Scroll) */}
        <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
           <div className="flex justify-between items-center mb-8">
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>Strategic Timeline</h3>
              <div className="flex gap-2" style={{ background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                 <button 
                  onClick={() => setTimeRange('monthly')}
                  style={{ 
                    padding: '4px 12px', fontSize: '0.7rem', fontWeight: 700, borderRadius: '6px', cursor: 'pointer',
                    background: timeRange === 'monthly' ? '#fff' : 'transparent',
                    boxShadow: timeRange === 'monthly' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                    border: 'none', color: timeRange === 'monthly' ? 'var(--primary)' : '#64748b'
                  }}>MONTHLY</button>
                 <button 
                  onClick={() => setTimeRange('yearly')}
                  style={{ 
                    padding: '4px 12px', fontSize: '0.7rem', fontWeight: 700, borderRadius: '6px', cursor: 'pointer',
                    background: timeRange === 'yearly' ? '#fff' : 'transparent',
                    boxShadow: timeRange === 'yearly' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                    border: 'none', color: timeRange === 'yearly' ? 'var(--primary)' : '#64748b'
                  }}>YEARLY</button>
              </div>
           </div>
           
           <div style={{ width: '100%', overflowX: 'auto', paddingBottom: '0.5rem' }} className="custom-scrollbar">
              <div style={{ width: Math.max(timelineData.length * 75, 450) + 'px', height: '260px' }}>
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                     <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                     <Bar dataKey="count" fill="#006a4d" radius={[4, 4, 0, 0]} name="All Apps" barSize={30} />
                     <Bar dataKey="funded" fill="#10b981" radius={[4, 4, 0, 0]} name="Funded" barSize={30} />
                   </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>
      </div>

      <div className="card mt-6" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '2rem', color: 'var(--primary)' }}>Funder Performance Benchmark</h3>
          <div style={{ width: '100%', height: '320px', overflowY: 'auto' }} className="custom-scrollbar">
            <div style={{ height: Math.max(barData.length * 55, 320) + 'px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} width={140} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="total" fill="#006a4d" radius={[0, 4, 4, 0]} name="Submissions" barSize={22} />
                  <Bar dataKey="funded" fill="#10b981" radius={[0, 4, 4, 0]} name="Grants Won" barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
      </div>
    </div>
  );
}
