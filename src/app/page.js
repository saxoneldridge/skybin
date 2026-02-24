'use client';

import { useState, useEffect, useCallback } from 'react';

const BINS = [
  { id: 'hero',       label: 'Hero Shots',   icon: '✦', color: '#FF6B35' },
  { id: 'landscape',  label: 'Landscapes',   icon: '◈', color: '#4ECDC4' },
  { id: 'action',     label: 'Action',       icon: '◉', color: '#FFE66D' },
  { id: 'cinematic',  label: 'Cinematic',    icon: '◐', color: '#A8DADC' },
  { id: 'broll',      label: 'B-Roll',       icon: '◫', color: '#C77DFF' },
  { id: 'transition', label: 'Transitions',  icon: '◧', color: '#F4A261' },
];

const BIN_GRADIENTS = {
  hero:       'linear-gradient(135deg, #FF6B35 0%, #FFD166 100%)',
  landscape:  'linear-gradient(135deg, #0077B6 0%, #90E0EF 100%)',
  action:     'linear-gradient(135deg, #F72585 0%, #3A0CA3 100%)',
  cinematic:  'linear-gradient(135deg, #2D6A4F 0%, #95D5B2 100%)',
  broll:      'linear-gradient(135deg, #4A4E69 0%, #C9ADA7 100%)',
  transition: 'linear-gradient(135deg, #E9C46A 0%, #E76F51 100%)',
};

export default function SKYBIN() {
  const [clips, setClips]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [activeBin, setActiveBin]       = useState('all');
  const [searchQuery, setSearchQuery]   = useState('');
  const [selectedClip, setSelectedClip] = useState(null);
  const [viewMode, setViewMode]         = useState('grid');
  const [lastRefresh, setLastRefresh]   = useState(null);

  const fetchClips = useCallback(async () => {
    try {
      const res = await fetch('/api/clips');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setClips(data.clips);
      setLastRefresh(new Date());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClips();
    const interval = setInterval(fetchClips, 60000);
    return () => clearInterval(interval);
  }, [fetchClips]);

  const filtered = clips.filter(clip => {
    const matchBin = activeBin === 'all' || clip.bin === activeBin;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      clip.title.toLowerCase().includes(q) ||
      clip.tags.some(t => t.toLowerCase().includes(q)) ||
      clip.bin.includes(q) ||
      clip.notes.toLowerCase().includes(q);
    return matchBin && matchSearch;
  });

  const binCounts = BINS.reduce((acc, b) => {
    acc[b.id] = clips.filter(c => c.bin === b.id).length;
    return acc;
  }, {});

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#080810' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
        @keyframes spin { to { transform: rotate(360deg); } }
        .clip-card { animation: fadeUp 0.3s ease both; transition: transform 0.15s ease, box-shadow 0.15s ease; cursor: pointer; }
        .clip-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,0.7) !important; }
        .bin-btn { transition: all 0.15s ease; cursor: pointer; border: none; background: none; }
        .tag { display:inline-block; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:2px; padding:2px 7px; font-size:10px; margin:2px; letter-spacing:0.05em; cursor:pointer; transition: background 0.1s; }
        .tag:hover { background: rgba(255,255,255,0.12); }
        .search-input:focus { outline:none; border-color:rgba(255,255,255,0.25) !important; }
        .score { font-family:'Bebas Neue',sans-serif; }
        .refresh-btn { cursor:pointer; background:none; border:none; color:rgba(255,255,255,0.3); font-size:14px; transition:color 0.15s; }
        .refresh-btn:hover { color:rgba(255,255,255,0.7); }
      `}</style>

      {/* Header */}
      <header style={{ height:56, borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 28px', background:'rgba(255,255,255,0.015)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, letterSpacing:'0.15em' }}>SKYBIN</span>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.25)', letterSpacing:'0.2em', borderLeft:'1px solid rgba(255,255,255,0.08)', paddingLeft:14 }}>DRONE ASSET MANAGER</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          {lastRefresh && (
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)', letterSpacing:'0.08em' }}>
              SYNCED {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button className="refresh-btn" onClick={fetchClips} title="Refresh">↺</button>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background: loading ? '#FFE66D' : '#4ECDC4', animation: loading ? 'pulse 1s infinite' : 'none' }} />
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.25)', letterSpacing:'0.1em' }}>{clips.length} CLIPS</span>
          </div>
        </div>
      </header>

      <div style={{ display:'flex', flex:1, overflow:'hidden', height:'calc(100vh - 56px)' }}>

        {/* Sidebar */}
        <aside style={{ width:210, borderRight:'1px solid rgba(255,255,255,0.06)', padding:'20px 0', display:'flex', flexDirection:'column', overflowY:'auto', flexShrink:0 }}>
          {/* Search */}
          <div style={{ padding:'0 14px 18px' }}>
            <input
              className="search-input"
              placeholder="SEARCH..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width:'100%', padding:'8px 10px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:3, color:'#fff', fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:'0.1em' }}
            />
          </div>

          {/* Bins */}
          <div style={{ padding:'0 14px' }}>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.2)', letterSpacing:'0.2em', marginBottom:8 }}>BINS</div>

            <button className="bin-btn" onClick={() => setActiveBin('all')} style={{ width:'100%', textAlign:'left', padding:'7px 10px', borderRadius:3, background: activeBin==='all' ? 'rgba(255,255,255,0.08)' : 'transparent', color: activeBin==='all' ? '#fff' : 'rgba(255,255,255,0.45)', fontSize:11, letterSpacing:'0.06em', display:'flex', justifyContent:'space-between', marginBottom:2 }}>
              <span>◈ ALL CLIPS</span>
              <span style={{ opacity:0.5, fontSize:10 }}>{clips.length}</span>
            </button>

            {BINS.map(bin => (
              <button key={bin.id} className="bin-btn" onClick={() => setActiveBin(bin.id)} style={{ width:'100%', textAlign:'left', padding:'7px 10px', borderRadius:3, background: activeBin===bin.id ? `${bin.color}15` : 'transparent', color: activeBin===bin.id ? bin.color : 'rgba(255,255,255,0.45)', fontSize:11, letterSpacing:'0.06em', display:'flex', justifyContent:'space-between', marginBottom:2, borderLeft: activeBin===bin.id ? `2px solid ${bin.color}` : '2px solid transparent' }}>
                <span>{bin.icon} {bin.label.toUpperCase()}</span>
                <span style={{ opacity:0.5, fontSize:10 }}>{binCounts[bin.id] || 0}</span>
              </button>
            ))}
          </div>

          {/* Drive Link */}
          <div style={{ padding:'20px 14px 0', marginTop:'auto', borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:16 }}>
            <a href="https://drive.google.com" target="_blank" rel="noopener noreferrer" style={{ display:'block', padding:'8px 10px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:3, color:'rgba(255,255,255,0.5)', fontSize:10, letterSpacing:'0.1em', textDecoration:'none', textAlign:'center' }}>
              ▲ UPLOAD TO DRIVE
            </a>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {/* Toolbar */}
          <div style={{ padding:'14px 22px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, letterSpacing:'0.1em' }}>
                {activeBin === 'all' ? 'ALL CLIPS' : BINS.find(b => b.id===activeBin)?.label.toUpperCase()}
              </span>
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.25)' }}>{filtered.length} RESULTS</span>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              {['grid','list'].map(m => (
                <button key={m} onClick={() => setViewMode(m)} style={{ padding:'4px 10px', background: viewMode===m ? 'rgba(255,255,255,0.1)' : 'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:3, color: viewMode===m ? '#fff' : 'rgba(255,255,255,0.35)', fontFamily:"'Space Mono',monospace", fontSize:10, cursor:'pointer', letterSpacing:'0.08em' }}>
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div style={{ flex:1, overflowY:'auto', padding:'18px 22px' }}>
            {loading && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60%', flexDirection:'column', gap:16 }}>
                <div style={{ width:32, height:32, border:'2px solid rgba(255,255,255,0.1)', borderTopColor:'#FF6B35', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)', letterSpacing:'0.15em' }}>LOADING CLIPS...</span>
              </div>
            )}

            {error && (
              <div style={{ padding:20, background:'rgba(255,50,50,0.08)', border:'1px solid rgba(255,50,50,0.2)', borderRadius:4, color:'rgba(255,150,150,0.8)', fontSize:11 }}>
                Error connecting to Airtable: {error}
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60%', flexDirection:'column', gap:12 }}>
                <span style={{ fontSize:32, opacity:0.15 }}>◈</span>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.25)', letterSpacing:'0.15em' }}>NO CLIPS FOUND</span>
                <span style={{ fontSize:10, color:'rgba(255,255,255,0.15)' }}>Upload footage to your Google Drive folder</span>
              </div>
            )}

            {!loading && viewMode === 'grid' && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(230px, 1fr))', gap:14 }}>
                {filtered.map((clip, idx) => {
                  const bin = BINS.find(b => b.id === clip.bin) || BINS[4];
                  return (
                    <div key={clip.id} className="clip-card" onClick={() => setSelectedClip(clip)} style={{ animationDelay:`${idx*0.04}s`, background:'#0f0f1a', borderRadius:6, overflow:'hidden', border:`1px solid ${selectedClip?.id===clip.id ? bin.color+'50' : 'rgba(255,255,255,0.06)'}`, boxShadow: selectedClip?.id===clip.id ? `0 0 24px ${bin.color}25` : '0 4px 20px rgba(0,0,0,0.4)' }}>
                      <div style={{ height:120, background: BIN_GRADIENTS[clip.bin] || BIN_GRADIENTS.broll, position:'relative' }}>
                        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.65) 100%)' }} />
                        <div style={{ position:'absolute', top:8, right:8, background:'rgba(0,0,0,0.55)', borderRadius:2, padding:'2px 6px', fontSize:10 }}>{clip.duration}</div>
                        <div className="score" style={{ position:'absolute', bottom:8, right:8, color:bin.color, fontSize:22, lineHeight:1 }}>{clip.score}</div>
                        <div style={{ position:'absolute', bottom:8, left:8, fontSize:9, color:'rgba(255,255,255,0.45)', letterSpacing:'0.08em' }}>{clip.timecode}</div>
                      </div>
                      <div style={{ padding:'11px 13px' }}>
                        <div style={{ fontSize:12, fontWeight:'bold', marginBottom:6, letterSpacing:'0.03em', lineHeight:1.3 }}>{clip.title}</div>
                        <div style={{ marginBottom:7 }}>
                          <span style={{ fontSize:9, color:bin.color, background:`${bin.color}15`, border:`1px solid ${bin.color}35`, padding:'2px 7px', borderRadius:2, letterSpacing:'0.08em' }}>{bin.icon} {bin.label.toUpperCase()}</span>
                        </div>
                        <div>{clip.tags.slice(0,4).map(tag => <span key={tag} className="tag" onClick={e => { e.stopPropagation(); setSearchQuery(tag); }} style={{ color:'rgba(255,255,255,0.45)' }}>{tag}</span>)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!loading && viewMode === 'list' && (
              <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                {filtered.map((clip, idx) => {
                  const bin = BINS.find(b => b.id === clip.bin) || BINS[4];
                  return (
                    <div key={clip.id} className="clip-card" onClick={() => setSelectedClip(clip)} style={{ animationDelay:`${idx*0.03}s`, display:'flex', alignItems:'center', gap:12, padding:'11px 14px', background: selectedClip?.id===clip.id ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)', borderRadius:4, border:`1px solid ${selectedClip?.id===clip.id ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'}` }}>
                      <div style={{ width:52, height:34, borderRadius:3, background: BIN_GRADIENTS[clip.bin] || BIN_GRADIENTS.broll, flexShrink:0 }} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, marginBottom:3 }}>{clip.title}</div>
                        <div>{clip.tags.slice(0,3).map(tag => <span key={tag} className="tag" style={{ color:'rgba(255,255,255,0.35)', fontSize:9 }}>{tag}</span>)}</div>
                      </div>
                      <div className="score" style={{ color:bin.color, fontSize:20, flexShrink:0 }}>{clip.score}</div>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', flexShrink:0, width:50, textAlign:'right' }}>{clip.duration}</div>
                      <span style={{ fontSize:9, color:bin.color, background:`${bin.color}15`, padding:'3px 8px', borderRadius:2, letterSpacing:'0.08em', flexShrink:0 }}>{bin.label.toUpperCase()}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* Detail Panel */}
        {selectedClip && (() => {
          const bin = BINS.find(b => b.id === selectedClip.bin) || BINS[4];
          return (
            <aside style={{ width:270, borderLeft:'1px solid rgba(255,255,255,0.06)', padding:18, overflowY:'auto', flexShrink:0, background:'rgba(255,255,255,0.01)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <span style={{ fontSize:9, letterSpacing:'0.2em', color:'rgba(255,255,255,0.25)' }}>CLIP DETAILS</span>
                <button onClick={() => setSelectedClip(null)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.35)', cursor:'pointer', fontSize:18, lineHeight:1 }}>×</button>
              </div>

              <div style={{ height:150, borderRadius:5, background: BIN_GRADIENTS[selectedClip.bin] || BIN_GRADIENTS.broll, marginBottom:14, position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {selectedClip.videoUrl ? (
                    <a href={selectedClip.videoUrl} target="_blank" rel="noopener noreferrer" style={{ width:42, height:42, borderRadius:'50%', background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, textDecoration:'none' }}>▶</a>
                  ) : (
                    <div style={{ width:42, height:42, borderRadius:'50%', background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>▶</div>
                  )}
                </div>
                <div className="score" style={{ position:'absolute', bottom:10, right:10, color:bin.color, fontSize:34 }}>{selectedClip.score}</div>
              </div>

              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:17, letterSpacing:'0.08em', marginBottom:4, lineHeight:1.2 }}>{selectedClip.title}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginBottom:14 }}>{selectedClip.timecode} · {selectedClip.duration}</div>

              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:9, color:'rgba(255,255,255,0.2)', letterSpacing:'0.15em', marginBottom:5 }}>BIN</div>
                <span style={{ color:bin.color, background:`${bin.color}15`, border:`1px solid ${bin.color}35`, padding:'4px 12px', borderRadius:3, fontSize:11, letterSpacing:'0.08em' }}>{bin.icon} {bin.label.toUpperCase()}</span>
              </div>

              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:9, color:'rgba(255,255,255,0.2)', letterSpacing:'0.15em', marginBottom:5 }}>TAGS</div>
                {selectedClip.tags.map(tag => (
                  <span key={tag} className="tag" onClick={() => { setSearchQuery(tag); setSelectedClip(null); }} style={{ color:'rgba(255,255,255,0.55)', fontSize:10 }}>{tag}</span>
                ))}
              </div>

              {selectedClip.notes && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.2)', letterSpacing:'0.15em', marginBottom:5 }}>AI NOTES</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)', lineHeight:1.65 }}>{selectedClip.notes}</div>
                </div>
              )}

              {selectedClip.videoUrl && (
                <a href={selectedClip.videoUrl} target="_blank" rel="noopener noreferrer" style={{ display:'block', width:'100%', padding:'9px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:3, color:'rgba(255,255,255,0.6)', fontFamily:"'Space Mono',monospace", fontSize:10, cursor:'pointer', letterSpacing:'0.1em', textDecoration:'none', textAlign:'center', marginBottom:8 }}>
                  ▶ VIEW IN DRIVE
                </a>
              )}
            </aside>
          );
        })()}
      </div>
    </div>
  );
}
