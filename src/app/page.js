'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

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

function getDriveEmbedUrl(videoUrl) {
  if (!videoUrl) return null;
  const match = videoUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) return null;
  return `https://drive.google.com/file/d/${match[1]}/preview`;
}

function UploadModal({ onClose, onUploadComplete }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith('video/')) { setErrorMsg('Please select a video file'); return; }
    setFile(f);
    setErrorMsg('');
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    setProgress(0);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      const { uploadUrl, key, error } = await res.json();
      if (error) throw new Error(error);

      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100)); };
      await new Promise((resolve, reject) => {
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.onload = () => xhr.status === 200 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`));
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(file);
      });

      setProgress(100);
      setStatus('processing');

      const processRes = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, filename: file.name }),
      });
      const processData = await processRes.json();
      if (processData.error) throw new Error(processData.error);

      setStatus('done');
      setTimeout(() => { onUploadComplete(); onClose(); }, 2500);
    } catch (e) {
      setStatus('error');
      setErrorMsg(e.message);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 32, width: 480, maxWidth: '90vw' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: '0.12em' }}>UPLOAD FOOTAGE</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>

        {status === 'idle' && (<>
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => fileRef.current.click()}
            style={{ border: `2px dashed ${dragOver ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 6, padding: '40px 24px', textAlign: 'center', cursor: 'pointer', marginBottom: 16, background: dragOver ? 'rgba(255,255,255,0.04)' : 'transparent', transition: 'all 0.15s ease' }}
          >
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>▲</div>
            {file ? (
              <div>
                <div style={{ fontSize: 13, color: '#fff', marginBottom: 4 }}>{file.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{(file.size / 1024 / 1024).toFixed(1)}MB</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.12em', marginBottom: 6 }}>DROP VIDEO HERE OR CLICK TO BROWSE</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em' }}>MP4 · MOV · MKV · AVI</div>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
          {errorMsg && <div style={{ color: '#ff6b6b', fontSize: 11, marginBottom: 12 }}>{errorMsg}</div>}
          <button onClick={handleUpload} disabled={!file} style={{ width: '100%', padding: '12px', background: file ? '#FF6B35' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 4, color: file ? '#fff' : 'rgba(255,255,255,0.2)', fontFamily: "'Space Mono',monospace", fontSize: 11, letterSpacing: '0.12em', cursor: file ? 'pointer' : 'default', transition: 'all 0.15s ease' }}>
            {file ? '▲ UPLOAD & ANALYZE' : 'SELECT A VIDEO FIRST'}
          </button>
        </>)}

        {status === 'uploading' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em', marginBottom: 16 }}>UPLOADING TO SKYBIN...</div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: 8 }}>
              <div style={{ height: '100%', width: `${progress}%`, background: '#FF6B35', borderRadius: 2, transition: 'width 0.2s ease' }} />
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{progress}%</div>
          </div>
        )}

        {status === 'processing' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 32, height: 32, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#FF6B35', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <div style={{ fontSize: 11, color: '#FFE66D', letterSpacing: '0.15em', marginBottom: 12 }}>AI ANALYZING FOOTAGE...</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', lineHeight: 2 }}>Extracting frames · Identifying best moments<br />Cutting clips · Tagging & binning</div>
          </div>
        )}

        {status === 'done' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12, color: '#4ECDC4' }}>✓</div>
            <div style={{ fontSize: 11, color: '#4ECDC4', letterSpacing: '0.15em' }}>PROCESSING STARTED!</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>Clips will appear in your library in a few minutes</div>
          </div>
        )}

        {status === 'error' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 11, color: '#ff6b6b', letterSpacing: '0.15em', marginBottom: 12 }}>UPLOAD FAILED</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>{errorMsg}</div>
            <button onClick={() => { setStatus('idle'); setProgress(0); }} style={{ padding: '8px 20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 3, color: '#fff', fontFamily: "'Space Mono',monospace", fontSize: 10, cursor: 'pointer' }}>TRY AGAIN</button>
          </div>
        )}
      </div>
    </div>
  );
}

function ClipCard({ clip, isSelected, onSelect, onTagClick }) {
  const [hovered, setHovered] = useState(false);
  const bin = BINS.find(b => b.id === clip.bin) || BINS[4];
  const embedUrl = getDriveEmbedUrl(clip.videoUrl);

  return (
    <div className="clip-card" onClick={() => onSelect(clip)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ background: '#0f0f1a', borderRadius: 6, overflow: 'hidden', border: `1px solid ${isSelected ? bin.color + '50' : 'rgba(255,255,255,0.06)'}`, boxShadow: isSelected ? `0 0 24px ${bin.color}25` : hovered ? '0 16px 48px rgba(0,0,0,0.7)' : '0 4px 20px rgba(0,0,0,0.4)', transform: hovered ? 'translateY(-4px)' : 'translateY(0)', transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease', cursor: 'pointer' }}
    >
      <div style={{ height: 140, position: 'relative', overflow: 'hidden', background: BIN_GRADIENTS[clip.bin] || BIN_GRADIENTS.broll }}>
        {embedUrl && <iframe src={hovered ? embedUrl : ''} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', opacity: hovered ? 1 : 0, transition: 'opacity 0.3s ease' }} allow="autoplay" allowFullScreen />}
        {clip.videoUrl && !embedUrl && hovered && <video src={clip.videoUrl} autoPlay muted loop style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7) 100%)', opacity: hovered ? 0 : 1, transition: 'opacity 0.3s ease', pointerEvents: 'none' }} />
        {!hovered && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>▶</div></div>}
        <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', borderRadius: 2, padding: '2px 6px', fontSize: 10, opacity: hovered ? 0 : 1, transition: 'opacity 0.2s ease' }}>{clip.duration}</div>
        <div className="score" style={{ position: 'absolute', bottom: 8, right: 8, color: bin.color, fontSize: 22, lineHeight: 1, opacity: hovered ? 0 : 1, transition: 'opacity 0.2s ease' }}>{clip.score || ''}</div>
        <div style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', opacity: hovered ? 0 : 1, transition: 'opacity 0.2s ease' }}>{clip.timecode}</div>
      </div>
      <div style={{ padding: '11px 13px' }}>
        <div style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 6, letterSpacing: '0.03em', lineHeight: 1.3 }}>{clip.title}</div>
        <div style={{ marginBottom: 7 }}><span style={{ fontSize: 9, color: bin.color, background: `${bin.color}15`, border: `1px solid ${bin.color}35`, padding: '2px 7px', borderRadius: 2, letterSpacing: '0.08em' }}>{bin.icon} {bin.label.toUpperCase()}</span></div>
        <div>{clip.tags.slice(0, 4).map(tag => <span key={tag} className="tag" onClick={e => { e.stopPropagation(); onTagClick(tag); }} style={{ color: 'rgba(255,255,255,0.45)' }}>{tag}</span>)}</div>
      </div>
    </div>
  );
}

export default function SKYBIN() {
  const [clips, setClips]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [activeBin, setActiveBin]       = useState('all');
  const [searchQuery, setSearchQuery]   = useState('');
  const [selectedClip, setSelectedClip] = useState(null);
  const [viewMode, setViewMode]         = useState('grid');
  const [lastRefresh, setLastRefresh]   = useState(null);
  const [showUpload, setShowUpload]     = useState(false);

  const fetchClips = useCallback(async () => {
    try {
      const res = await fetch('/api/clips');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setClips(data.clips);
      setLastRefresh(new Date());
      setError(null);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchClips();
    const interval = setInterval(fetchClips, 60000);
    return () => clearInterval(interval);
  }, [fetchClips]);

  const filtered = clips.filter(clip => {
    const matchBin = activeBin === 'all' || clip.bin === activeBin;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || clip.title.toLowerCase().includes(q) || clip.tags.some(t => t.toLowerCase().includes(q)) || clip.bin.includes(q) || clip.notes.toLowerCase().includes(q);
    return matchBin && matchSearch;
  });

  const binCounts = BINS.reduce((acc, b) => { acc[b.id] = clips.filter(c => c.bin === b.id).length; return acc; }, {});

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#080810' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
        @keyframes spin { to { transform: rotate(360deg); } }
        .clip-card { animation: fadeUp 0.3s ease both; }
        .bin-btn { transition: all 0.15s ease; cursor: pointer; border: none; background: none; }
        .tag { display:inline-block; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:2px; padding:2px 7px; font-size:10px; margin:2px; letter-spacing:0.05em; cursor:pointer; transition: background 0.1s; }
        .tag:hover { background: rgba(255,255,255,0.12); }
        .search-input:focus { outline:none; border-color:rgba(255,255,255,0.25) !important; }
        .score { font-family:'Bebas Neue',sans-serif; }
        .upload-btn:hover { background: #e55a25 !important; }
      `}</style>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUploadComplete={fetchClips} />}

      <header style={{ height: 56, borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', background: 'rgba(255,255,255,0.015)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, letterSpacing: '0.15em' }}>SKYBIN</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.2em', borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: 14 }}>DRONE ASSET MANAGER</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {lastRefresh && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em' }}>SYNCED {lastRefresh.toLocaleTimeString()}</span>}
          <button className="upload-btn" onClick={() => setShowUpload(true)} style={{ padding: '7px 16px', background: '#FF6B35', border: 'none', borderRadius: 3, color: '#fff', fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: '0.12em', cursor: 'pointer', transition: 'background 0.15s ease' }}>▲ UPLOAD</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: loading ? '#FFE66D' : '#4ECDC4', animation: loading ? 'pulse 1s infinite' : 'none' }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>{clips.length} CLIPS</span>
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: 'calc(100vh - 56px)' }}>
        <aside style={{ width: 210, borderRight: '1px solid rgba(255,255,255,0.06)', padding: '20px 0', display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0 }}>
          <div style={{ padding: '0 14px 18px' }}>
            <input className="search-input" placeholder="SEARCH..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3, color: '#fff', fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: '0.1em' }} />
          </div>
          <div style={{ padding: '0 14px' }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em', marginBottom: 8 }}>BINS</div>
            <button className="bin-btn" onClick={() => setActiveBin('all')} style={{ width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: 3, background: activeBin === 'all' ? 'rgba(255,255,255,0.08)' : 'transparent', color: activeBin === 'all' ? '#fff' : 'rgba(255,255,255,0.45)', fontSize: 11, letterSpacing: '0.06em', display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span>◈ ALL CLIPS</span><span style={{ opacity: 0.5, fontSize: 10 }}>{clips.length}</span>
            </button>
            {BINS.map(bin => (
              <button key={bin.id} className="bin-btn" onClick={() => setActiveBin(bin.id)} style={{ width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: 3, background: activeBin === bin.id ? `${bin.color}15` : 'transparent', color: activeBin === bin.id ? bin.color : 'rgba(255,255,255,0.45)', fontSize: 11, letterSpacing: '0.06em', display: 'flex', justifyContent: 'space-between', marginBottom: 2, borderLeft: activeBin === bin.id ? `2px solid ${bin.color}` : '2px solid transparent' }}>
                <span>{bin.icon} {bin.label.toUpperCase()}</span><span style={{ opacity: 0.5, fontSize: 10 }}>{binCounts[bin.id] || 0}</span>
              </button>
            ))}
          </div>
        </aside>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: '0.1em' }}>{activeBin === 'all' ? 'ALL CLIPS' : BINS.find(b => b.id === activeBin)?.label.toUpperCase()}</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{filtered.length} RESULTS</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['grid', 'list'].map(m => (
                <button key={m} onClick={() => setViewMode(m)} style={{ padding: '4px 10px', background: viewMode === m ? 'rgba(255,255,255,0.1)' : 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3, color: viewMode === m ? '#fff' : 'rgba(255,255,255,0.35)', fontFamily: "'Space Mono',monospace", fontSize: 10, cursor: 'pointer', letterSpacing: '0.08em' }}>{m.toUpperCase()}</button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
            {loading && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60%', flexDirection: 'column', gap: 16 }}><div style={{ width: 32, height: 32, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#FF6B35', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em' }}>LOADING CLIPS...</span></div>}
            {error && <div style={{ padding: 20, background: 'rgba(255,50,50,0.08)', border: '1px solid rgba(255,50,50,0.2)', borderRadius: 4, color: 'rgba(255,150,150,0.8)', fontSize: 11 }}>Error: {error}</div>}
            {!loading && !error && filtered.length === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60%', flexDirection: 'column', gap: 12 }}>
                <span style={{ fontSize: 32, opacity: 0.15 }}>◈</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.15em' }}>NO CLIPS FOUND</span>
                <button onClick={() => setShowUpload(true)} style={{ marginTop: 8, padding: '8px 20px', background: '#FF6B35', border: 'none', borderRadius: 3, color: '#fff', fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: '0.12em', cursor: 'pointer' }}>▲ UPLOAD FOOTAGE</button>
              </div>
            )}
            {!loading && viewMode === 'grid' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 14 }}>
                {filtered.map((clip, idx) => <div key={clip.id} style={{ animationDelay: `${idx * 0.04}s` }}><ClipCard clip={clip} isSelected={selectedClip?.id === clip.id} onSelect={setSelectedClip} onTagClick={setSearchQuery} /></div>)}
              </div>
            )}
            {!loading && viewMode === 'list' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filtered.map(clip => {
                  const bin = BINS.find(b => b.id === clip.bin) || BINS[4];
                  return <div key={clip.id} onClick={() => setSelectedClip(clip)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: selectedClip?.id === clip.id ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)', borderRadius: 4, border: `1px solid ${selectedClip?.id === clip.id ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'}`, cursor: 'pointer' }}>
                    <div style={{ width: 52, height: 34, borderRadius: 3, background: BIN_GRADIENTS[clip.bin] || BIN_GRADIENTS.broll, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12, marginBottom: 3 }}>{clip.title}</div><div>{clip.tags.slice(0, 3).map(tag => <span key={tag} className="tag" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9 }}>{tag}</span>)}</div></div>
                    <div className="score" style={{ color: bin.color, fontSize: 20, flexShrink: 0 }}>{clip.score || ''}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', flexShrink: 0, width: 50, textAlign: 'right' }}>{clip.duration}</div>
                    <span style={{ fontSize: 9, color: bin.color, background: `${bin.color}15`, padding: '3px 8px', borderRadius: 2, letterSpacing: '0.08em', flexShrink: 0 }}>{bin.label.toUpperCase()}</span>
                  </div>;
                })}
              </div>
            )}
          </div>
        </main>

        {selectedClip && (() => {
          const bin = BINS.find(b => b.id === selectedClip.bin) || BINS[4];
          const embedUrl = getDriveEmbedUrl(selectedClip.videoUrl);
          return (
            <aside style={{ width: 270, borderLeft: '1px solid rgba(255,255,255,0.06)', padding: 18, overflowY: 'auto', flexShrink: 0, background: 'rgba(255,255,255,0.01)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)' }}>CLIP DETAILS</span>
                <button onClick={() => setSelectedClip(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
              </div>
              <div style={{ height: 150, borderRadius: 5, overflow: 'hidden', marginBottom: 14, background: BIN_GRADIENTS[selectedClip.bin] || BIN_GRADIENTS.broll, position: 'relative' }}>
                {embedUrl ? <iframe src={embedUrl} style={{ width: '100%', height: '100%', border: 'none' }} allow="autoplay" allowFullScreen /> : selectedClip.videoUrl ? <video src={selectedClip.videoUrl} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontSize: 24, opacity: 0.3 }}>◈</div></div>}
                <div className="score" style={{ position: 'absolute', bottom: 10, right: 10, color: bin.color, fontSize: 34, pointerEvents: 'none' }}>{selectedClip.score || ''}</div>
              </div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, letterSpacing: '0.08em', marginBottom: 4, lineHeight: 1.2 }}>{selectedClip.title}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>{selectedClip.timecode} · {selectedClip.duration}</div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em', marginBottom: 5 }}>BIN</div>
                <span style={{ color: bin.color, background: `${bin.color}15`, border: `1px solid ${bin.color}35`, padding: '4px 12px', borderRadius: 3, fontSize: 11, letterSpacing: '0.08em' }}>{bin.icon} {bin.label.toUpperCase()}</span>
              </div>
              {selectedClip.tags.length > 0 && <div style={{ marginBottom: 12 }}><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em', marginBottom: 5 }}>TAGS</div>{selectedClip.tags.map(tag => <span key={tag} className="tag" onClick={() => { setSearchQuery(tag); setSelectedClip(null); }} style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10 }}>{tag}</span>)}</div>}
              {selectedClip.notes && <div style={{ marginBottom: 14 }}><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em', marginBottom: 5 }}>AI NOTES</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65 }}>{selectedClip.notes}</div></div>}
              {selectedClip.videoUrl && <a href={selectedClip.videoUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', padding: '9px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3, color: 'rgba(255,255,255,0.6)', fontFamily: "'Space Mono',monospace", fontSize: 10, cursor: 'pointer', letterSpacing: '0.1em', textDecoration: 'none', textAlign: 'center' }}>↗ OPEN VIDEO</a>}
            </aside>
          );
        })()}
      </div>
    </div>
  );
}
