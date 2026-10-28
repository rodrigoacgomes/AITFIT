import React, { useState, useEffect } from 'react';

// Logótipo Vetorial Oficial AITFIT
const LogoAITFIT = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full text-white fill-none stroke-current" style={{ strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
    <polygon points="15,20 45,30 45,170 15,180" />
    <polygon points="185,20 155,30 155,170 185,180" />
    <rect x="45" y="30" width="110" height="140" />
    <line x1="45" y1="42" x2="155" y2="42" />
    <path d="M 100,42 C 100,34 106,34 106,37 C 106,41 93,48 80,54 L 120,54 Z" fill="none" />
    <path d="M 80,54 C 88,60 112,60 120,54 L 136,68 L 122,80 L 115,74 L 115,122 L 85,122 L 85,74 L 78,80 L 64,68 Z" fill="#09090b" stroke="#ffffff" strokeWidth="3" />
    <text x="100" y="152" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="22" letterSpacing="1" stroke="none">
      <tspan fill="#38bdf8">AI</tspan>
      <tspan fill="#ffffff">TFIT</tspan>
    </text>
  </svg>
);

// Silhueta de Fundo do Corpo Humano
const BodySilhouette = () => (
  <svg viewBox="0 0 100 220" className="w-full h-full text-zinc-800 fill-current opacity-30">
    <circle cx="50" cy="18" r="11" />
    <path d="M30,36 C30,36 38,34 50,34 C62,34 70,36 70,36 C75,37 78,41 78,46 L74,90 C73,93 70,95 67,95 L64,95 L64,145 C64,148 61,150 58,150 L54,150 L54,200 C54,203 51,205 48,205 L45,205 C42,205 40,203 40,200 L40,150 L36,150 C33,150 30,148 30,145 L30,95 L27,95 C24,95 21,93 20,90 L16,46 C16,41 19,37 24,36 Z" />
  </svg>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('outfit');
  const [selectedDay, setSelectedDay] = useState<string>('today');
  const [timeSlots, setTimeSlots] = useState<{ [key: string]: boolean }>({ morning: true, afternoon: true, night: false });
  const [formality, setFormality] = useState<number>(3);
  const [weatherData, setWeatherData] = useState<any>(null);

  useEffect(() => {
    if (!document.getElementById('tailwind-cdn')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(script);
    }
  }, []);

  const [closet, setCloset] = useState<any[]>(() => {
    const saved = localStorage.getItem('aitfit_closet');
    return saved ? JSON.parse(saved) : [];
  });

  const [favorites, setFavorites] = useState<any[]>(() => {
    const saved = localStorage.getItem('aitfit_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [styleProfile, setStyleProfile] = useState<any>(() => {
    const saved = localStorage.getItem('aitfit_style_profile');
    return saved ? JSON.parse(saved) : {
      primaryStyle: 'Casual Urbano',
      preferredColors: ['Preto', 'Branco', 'Azul'],
      customPrompt: 'Gosto de looks confortáveis e estruturados. Prefiro tons neutros.'
    };
  });

  const [generatedOutfit, setGeneratedOutfit] = useState<any>(null);
  const [lockedItems, setLockedItems] = useState<any>({});
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  const [newItem, setNewItem] = useState<any>({
    name: '',
    category: 'tronco-base',
    fit: 'Normal',
    color1: '',
    color2: '',
    weather: 'Ameno'
  });

  useEffect(() => {
    localStorage.setItem('aitfit_closet', JSON.stringify(closet));
  }, [closet]);

  useEffect(() => {
    localStorage.setItem('aitfit_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('aitfit_style_profile', JSON.stringify(styleProfile));
  }, [styleProfile]);

  const fetchWeather = () => {
    if (!navigator.geolocation) {
      fetchWeatherByCoords(41.1579, -8.6291, "Porto");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude, "Localização Atual"),
      () => fetchWeatherByCoords(41.1579, -8.6291, "Porto"),
      { timeout: 10000 }
    );
  };

  const fetchWeatherByCoords = async (lat: number, lon: number, label: string) => {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation_probability,weathercode&current_weather=true&timezone=auto`);
      const data = await res.json();
      setWeatherData({
        location: label,
        currentTemp: Math.round(data.current_weather.temperature),
        hourly: data.hourly
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  const getStats = () => {
    if (!weatherData?.hourly) return { minTemp: 16, maxTemp: 21, rainProb: 15 };
    const offset = selectedDay === 'today' ? 0 : 24;
    const temps = weatherData.hourly.temperature_2m || [];
    const rains = weatherData.hourly.precipitation_probability || [];
    let idxs: number[] = [];
    if (timeSlots.morning) for (let i = 8 + offset; i <= 12 + offset; i++) idxs.push(i);
    if (timeSlots.afternoon) for (let i = 13 + offset; i <= 19 + offset; i++) idxs.push(i);
    if (timeSlots.night) for (let i = 20 + offset; i <= 28 + offset; i++) idxs.push(i);
    if (idxs.length === 0) for (let i = offset; i < 24 + offset; i++) idxs.push(i);

    const selTemps = idxs.map((i: number) => temps[i]).filter((v: any) => v !== undefined);
    const selRains = idxs.map((i: number) => rains[i]).filter((v: any) => v !== undefined);

    return {
      minTemp: Math.round(Math.min(...(selTemps.length ? selTemps : [18]))),
      maxTemp: Math.round(Math.max(...(selTemps.length ? selTemps : [22]))),
      rainProb: Math.max(...(selRains.length ? selRains : [0]))
    };
  };

  const toggleTimeSlot = (key: string) => {
    setTimeSlots((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    const st = getStats();
    setTimeout(() => {
      setGeneratedOutfit({
        id: Date.now().toString(),
        head: lockedItems.head || pickItem('cabeca', st),
        torsoBase: lockedItems.torsoBase || pickItem('tronco-base', st),
        torsoMid: lockedItems.torsoMid || (st.minTemp < 18 ? pickItem('tronco-meio', st) : null),
        torsoOuter: lockedItems.torsoOuter || (st.minTemp < 15 || st.rainProb > 30 ? pickItem('tronco-fora', st) : null),
        legs: lockedItems.legs || pickItem('pernas', st),
        feet: lockedItems.feet || pickItem('pes', st),
        accessory: lockedItems.accessory || pickItem('acessorios', st),
        date: new Date().toLocaleDateString('pt-PT')
      });
      setIsGenerating(false);
    }, 600);
  };

  const pickItem = (cat: string, st: any) => {
    const candidates = closet.filter((i: any) => i.category === cat);
    if (!candidates.length) return null;

    const preferredMatches = candidates.filter((i: any) => 
      styleProfile.preferredColors.some((c: string) => 
        c.toLowerCase() === (i.color1 || '').toLowerCase() || 
        c.toLowerCase() === (i.color2 || '').toLowerCase()
      )
    );

    const pool = preferredMatches.length > 0 ? preferredMatches : candidates;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name) return;
    setCloset((prev: any[]) => [...prev, { 
      ...newItem, 
      id: Date.now().toString()
    }]);
    setNewItem({ name: '', category: 'tronco-base', fit: 'Normal', color1: '', color2: '', weather: 'Ameno' });
    setIsAddModalOpen(false);
  };

  const handleRemoveItem = (id: string) => {
    setCloset((prev: any[]) => prev.filter((item: any) => item.id !== id));
  };

  const clearWholeCloset = () => {
    if (window.confirm('Tem a certeza que deseja apagar todas as peças do Closet?')) {
      setCloset([]);
    }
  };

  const saveToFavorites = () => {
    if (!generatedOutfit) return;
    if (favorites.some((f: any) => f.id === generatedOutfit.id)) return;
    setFavorites((prev: any[]) => [generatedOutfit, ...prev]);
  };

  const loadSampleCloset = () => {
    const samples = [
      { id: '1', name: 'Gorro Knit', category: 'cabeca', fit: 'Normal', color1: 'Preto', color2: '', weather: 'Frio' },
      { id: '2', name: 'T-Shirt Branca', category: 'tronco-base', fit: 'Oversized', color1: 'Branco', color2: '', weather: 'Quente' },
      { id: '3', name: 'Camisola Tricot', category: 'tronco-meio', fit: 'Normal', color1: 'Cinza', color2: '', weather: 'Frio' },
      { id: '4', name: 'Casaco Bomber', category: 'tronco-fora', fit: 'Normal', color1: 'Preto', color2: 'Laranja', weather: 'Frio' },
      { id: '5', name: 'Calças Chino', category: 'pernas', fit: 'Slim', color1: 'Bege', color2: '', weather: 'Ameno' },
      { id: '6', name: 'Sapatilhas Retro', category: 'pes', fit: 'Normal', color1: 'Branco', color2: 'Azul', weather: 'Ameno' },
      { id: '7', name: 'Mochila Urbana', category: 'acessorios', fit: 'Normal', color1: 'Preto', color2: '', weather: 'Ameno' }
    ];
    setCloset(samples);
  };

  const stats = getStats();

  const categoryLabels: { [key: string]: string } = {
    'cabeca': 'Cabeça',
    'tronco-base': 'Tronco Base',
    'tronco-meio': 'Tronco Camada',
    'tronco-fora': 'Casaco',
    'pernas': 'Pernas',
    'pes': 'Pés',
    'acessorios': 'Acessórios'
  };

  // Componente de Slot do Esqueleto
  const SlotBox = ({ label, slotKey, item }: { label: string; slotKey: string; item: any }) => (
    <div className={`p-2 rounded-xl border backdrop-blur-md transition-all ${item ? 'bg-zinc-900/90 border-sky-500/50' : 'bg-zinc-950/40 border-zinc-800/80 border-dashed'}`}>
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase font-bold text-sky-400 tracking-wider">{label}</span>
        {item && (
          <button onClick={() => setLockedItems((p: any) => ({ ...p, [slotKey]: p[slotKey] ? null : item }))} className="text-xs">
            {lockedItems[slotKey] ? <span className="text-sky-400">🔒</span> : <span className="text-zinc-600">🔓</span>}
          </button>
        )}
      </div>
      <div className="text-xs font-semibold text-zinc-100 truncate mt-0.5">
        {item ? item.name : <span className="text-zinc-600 font-normal italic">Sem peça</span>}
      </div>
      {item && (
        <div className="text-[9px] text-zinc-400 mt-0.5 flex gap-2">
          <span>{item.fit || 'Normal'}</span>
          <span>•</span>
          <span>{item.color1}{item.color2 ? `/${item.color2}` : ''}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-24">
      <header className="sticky top-0 z-40 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-center p-1 shadow-sm">
            <LogoAITFIT />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight flex items-center leading-none">
              <span className="text-sky-400">AI</span>
              <span className="text-white">TFIT</span>
            </h1>
            <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">Smart Outfit Assistant</p>
          </div>
        </div>

        <button onClick={fetchWeather} className="flex items-center gap-2 bg-zinc-800/80 px-3 py-1.5 rounded-full border border-zinc-700/50 text-xs">
          <span className="text-sky-400 font-bold">☁</span>
          <span className="font-semibold">{weatherData ? `${weatherData.currentTemp}°C` : '--°C'}</span>
        </button>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4">
        {activeTab === 'outfit' && (
          <div className="space-y-4">
            <div className="bg-zinc-900 p-1 rounded-xl border border-zinc-800 flex text-xs font-semibold">
              <button 
                onClick={() => setSelectedDay('today')}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 ${selectedDay === 'today' ? 'bg-sky-500 text-black font-bold' : 'text-zinc-400'}`}
              >
                📅 Hoje
              </button>
              <button 
                onClick={() => setSelectedDay('tomorrow')}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 ${selectedDay === 'tomorrow' ? 'bg-sky-500 text-black font-bold' : 'text-zinc-400'}`}
              >
                📆 Amanhã
              </button>
            </div>

            <div className="bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Momento do Dia</span>
                <span className="text-sky-400 font-normal">{stats.minTemp}°C - {stats.maxTemp}°C • Chuva: {stats.rainProb}%</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'morning', label: 'Manhã', sub: '08h-12h' },
                  { key: 'afternoon', label: 'Tarde', sub: '12h-20h' },
                  { key: 'night', label: 'Noite', sub: '20h-04h' }
                ].map((s: any) => (
                  <button
                    key={s.key}
                    onClick={() => toggleTimeSlot(s.key)}
                    className={`py-2 rounded-xl border text-center ${timeSlots[s.key] ? 'bg-sky-950/60 border-sky-500 text-sky-200' : 'bg-zinc-800/30 border-zinc-800 text-zinc-400'}`}
                  >
                    <div className="text-xs font-semibold">{s.label}</div>
                    <div className="text-[9px] opacity-60">{s.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800 space-y-2">
              <span className="text-xs font-semibold">Nível de Formalidade</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { level: 1, name: 'Desportivo' },
                  { level: 2, name: 'Casual' },
                  { level: 3, name: 'Smart Casual' },
                  { level: 4, name: 'Formal' },
                  { level: 5, name: 'Evento / Gala' }
                ].map((f: any) => (
                  <button
                    key={f.level}
                    onClick={() => setFormality(f.level)}
                    className={`p-2.5 rounded-xl border text-left flex justify-between items-center ${formality === f.level ? 'bg-sky-950/60 border-sky-500 text-sky-100' : 'bg-zinc-800/30 border-zinc-800 text-zinc-400'}`}
                  >
                    <span className="text-xs font-medium">{f.name}</span>
                    <span className="text-[10px] opacity-60">Nvl {f.level}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 font-bold text-black text-sm shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 hover:opacity-95"
            >
              <span>✨</span>
              {isGenerating ? 'A alinhar estilo e clima...' : 'Gerar Outfit Personalizado'}
            </button>

            {/* ESQUEMA ESQUELÉTICO DE OUTFIT */}
            {generatedOutfit && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Sugestão Adaptada</h3>
                  <button 
                    onClick={saveToFavorites}
                    className="flex items-center gap-1.5 text-xs text-rose-400 font-medium bg-rose-950/30 px-2.5 py-1 rounded-lg border border-rose-800/40"
                  >
                    ❤️ Guardar Look
                  </button>
                </div>

                <div className="relative bg-zinc-900/80 rounded-2xl border border-zinc-800 p-4 overflow-hidden min-h-[460px] flex flex-col justify-between">
                  {/* Silhueta de Corpo ao Fundo */}
                  <div className="absolute inset-0 flex items-center justify-center p-2 pointer-events-none">
                    <BodySilhouette />
                  </div>

                  {/* Conteúdo Sobreposto nos Slots do Corpo */}
                  <div className="relative z-10 space-y-3">
                    {/* ZONA DA CABEÇA (1 SLOT) */}
                    <div className="max-w-[180px] mx-auto">
                      <SlotBox label="Cabeça" slotKey="head" item={generatedOutfit.head} />
                    </div>

                    {/* ZONA DO TRONCO (3 SLOTS) */}
                    <div className="grid grid-cols-1 gap-1.5">
                      <SlotBox label="Tronco Base" slotKey="torsoBase" item={generatedOutfit.torsoBase} />
                      <SlotBox label="Camada Meio" slotKey="torsoMid" item={generatedOutfit.torsoMid} />
                      <SlotBox label="Casaco / Exterior" slotKey="torsoOuter" item={generatedOutfit.torsoOuter} />
                    </div>

                    {/* ZONA DAS PERNAS (1 SLOT) */}
                    <div className="max-w-[240px] mx-auto">
                      <SlotBox label="Pernas" slotKey="legs" item={generatedOutfit.legs} />
                    </div>

                    {/* ZONA DOS PÉS (1 SLOT) */}
                    <div className="max-w-[200px] mx-auto">
                      <SlotBox label="Pés" slotKey="feet" item={generatedOutfit.feet} />
                    </div>
                  </div>

                  {/* ZONA DE ACESSÓRIOS (POR BAIXO DO ESQUELETO) */}
                  <div className="relative z-10 pt-3 mt-3 border-t border-zinc-800/80">
                    <SlotBox label="Acessório" slotKey="accessory" item={generatedOutfit.accessory} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'closet' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">O Meu Closet</h2>
                <p className="text-xs text-zinc-400">{closet.length} peças guardadas</p>
              </div>
              <div className="flex gap-2">
                {closet.length > 0 && (
                  <button onClick={clearWholeCloset} className="py-1.5 px-2.5 bg-rose-950/40 text-rose-400 hover:bg-rose-900/50 border border-rose-800/50 text-xs font-medium rounded-xl">
                    Limpar Tudo
                  </button>
                )}
                {closet.length === 0 && (
                  <button onClick={loadSampleCloset} className="py-1.5 px-2.5 bg-zinc-800 text-zinc-300 text-xs rounded-xl">
                    Amostras
                  </button>
                )}
                <button onClick={() => setIsAddModalOpen(true)} className="py-2 px-3 bg-sky-500 text-black text-xs font-bold rounded-xl flex items-center gap-1">
                  + Adicionar
                </button>
              </div>
            </div>

            {closet.length === 0 ? (
              <div className="text-center py-12 bg-zinc-900/40 rounded-2xl border border-zinc-800 space-y-3">
                <span className="text-2xl">👕</span>
                <p className="text-xs text-zinc-400">O teu Closet está vazio.</p>
                <button onClick={loadSampleCloset} className="text-xs text-sky-400 underline font-medium">
                  Carregar peças de exemplo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {closet.map((item: any) => (
                  <div key={item.id} className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex flex-col justify-between space-y-2 relative">
                    <div className="flex items-start justify-between gap-1">
                      <div className="overflow-hidden">
                        <span className="text-[9px] uppercase font-semibold text-sky-400 block truncate">
                          {categoryLabels[item.category] || item.category}
                        </span>
                        <h4 className="text-xs font-bold text-zinc-100 truncate mt-0.5">{item.name}</h4>
                      </div>
                      <button 
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-zinc-500 hover:text-rose-400 p-1 text-xs -mr-1 -mt-1 rounded-lg transition-colors"
                        title="Remover peça"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="text-[10px] text-zinc-400 pt-1.5 border-t border-zinc-800/80 flex flex-wrap gap-x-2 gap-y-0.5">
                      <span>Fit: <strong className="text-zinc-200">{item.fit || 'Normal'}</strong></span>
                      <span>Cores: <strong className="text-zinc-200">{item.color1 || 'N/A'}{item.color2 ? ` / ${item.color2}` : ''}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white">Outfits Favoritos</h2>
            {favorites.length === 0 ? (
              <div className="text-center py-12 bg-zinc-900/40 rounded-2xl border border-zinc-800">
                <span className="text-2xl">❤️</span>
                <p className="text-xs text-zinc-400 mt-2">Ainda não guardaste nenhum look.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {favorites.map((fav: any) => (
                  <div key={fav.id} className="bg-zinc-900 p-3.5 rounded-2xl border border-zinc-800 space-y-2">
                    <div className="flex justify-between items-center text-xs border-b border-zinc-800 pb-2">
                      <span className="font-semibold text-sky-400">Look de {fav.date}</span>
                      <button onClick={() => setFavorites((p: any[]) => p.filter((f: any) => f.id !== fav.id))} className="text-zinc-500 hover:text-rose-400">
                        🗑️
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-1 pt-1">
                      {['head', 'torsoBase', 'torsoMid', 'torsoOuter', 'legs', 'feet', 'accessory'].map((s: string) => fav[s] && (
                        <div key={s} className="text-xs text-zinc-300 flex justify-between bg-zinc-950 px-2.5 py-1.5 rounded-lg border border-zinc-800/60">
                          <span className="text-sky-400 text-[10px] uppercase font-semibold">{s.replace('torso', 'tronco ')}:</span>
                          <span className="font-medium text-zinc-200">{fav[s].name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'style' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">O Meu Perfil de Estilo</h2>
              <p className="text-xs text-zinc-400">Personaliza as regras para a IA.</p>
            </div>

            <div className="bg-zinc-900 p-3.5 rounded-2xl border border-zinc-800 space-y-2">
              <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                🎛️ Estilo Predominante
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Casual Urbano', 'Minimalista', 'Streetwear', 'Smart / Elegante', 'Desportivo / Comfort'].map((st: string) => (
                  <button
                    key={st}
                    onClick={() => setStyleProfile((p: any) => ({ ...p, primaryStyle: st }))}
                    className={`p-2 rounded-xl text-xs border text-left font-medium ${styleProfile.primaryStyle === st ? 'bg-sky-950/60 border-sky-500 text-sky-200' : 'bg-zinc-800/30 border-zinc-800 text-zinc-400'}`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900 p-3.5 rounded-2xl border border-zinc-800 space-y-2">
              <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                🎨 Cores Preferidas
              </label>
              <div className="flex flex-wrap gap-2">
                {['Preto', 'Branco', 'Cinza', 'Azul', 'Bege', 'Verde Oliva', 'Castanho'].map((color: string) => {
                  const isSelected = styleProfile.preferredColors.includes(color);
                  return (
                    <button
                      key={color}
                      onClick={() => setStyleProfile((p: any) => ({
                        ...p,
                        preferredColors: isSelected 
                          ? p.preferredColors.filter((c: string) => c !== color)
                          : [...p.preferredColors, color]
                      }))}
                      className={`px-3 py-1.5 rounded-xl text-xs border ${isSelected ? 'bg-sky-500 text-black font-bold border-sky-400' : 'bg-zinc-800/40 border-zinc-800 text-zinc-400'}`}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-zinc-900 p-3.5 rounded-2xl border border-zinc-800 space-y-2">
              <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                💬 Instruções Pessoais
              </label>
              <textarea
                rows={3}
                value={styleProfile.customPrompt}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setStyleProfile((p: any) => ({ ...p, customPrompt: e.target.value }))}
                placeholder="Ex: Prefiro tons neutros..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        )}
      </main>

      {/* MODAL DE ADICIONAR PEÇA */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-5 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <h3 className="font-bold text-white text-sm">Adicionar Nova Peça</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-500 text-base">✕</button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Nome</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: T-Shirt Básica"
                  value={newItem.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItem((p: any) => ({ ...p, name: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-zinc-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1.5">Categoria</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'cabeca', label: 'Cabeça' },
                    { id: 'tronco-base', label: 'Tronco Base' },
                    { id: 'tronco-meio', label: 'Tronco Camada' },
                    { id: 'tronco-fora', label: 'Casaco' },
                    { id: 'pernas', label: 'Pernas' },
                    { id: 'pes', label: 'Pés' },
                    { id: 'acessorios', label: 'Acessórios' }
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNewItem((p: any) => ({ ...p, category: c.id }))}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium ${newItem.category === c.id ? 'bg-sky-500 text-black font-bold border-sky-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1.5">Fit</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['Slim', 'Normal', 'Oversized'].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setNewItem((p: any) => ({ ...p, fit: f }))}
                      className={`py-1.5 rounded-lg border text-center text-[11px] font-medium ${newItem.fit === f ? 'bg-sky-500 text-black font-bold border-sky-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Cor 1</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Preto"
                    value={newItem.color1}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItem((p: any) => ({ ...p, color1: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-zinc-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Cor 2 (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: Branco"
                    value={newItem.color2}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItem((p: any) => ({ ...p, color2: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-zinc-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1.5">Clima</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'Frio', label: 'Frio ❄️' },
                    { id: 'Ameno', label: 'Ameno ⛅' },
                    { id: 'Quente', label: 'Quente ☀️' }
                  ].map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setNewItem((p: any) => ({ ...p, weather: w.id }))}
                      className={`py-1.5 rounded-lg border text-center text-[10px] font-medium ${newItem.weather === w.id ? 'bg-sky-500 text-black font-bold border-sky-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-sky-500 text-black font-bold text-xs rounded-xl mt-3 shadow-lg shadow-sky-500/20">
                Guardar no Closet
              </button>
            </form>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-md border-t border-zinc-800 py-2.5">
        <div className="max-w-md mx-auto grid grid-cols-4 text-center text-xs">
          <button onClick={() => setActiveTab('outfit')} className={`flex flex-col items-center gap-1 ${activeTab === 'outfit' ? 'text-sky-400 font-bold' : 'text-zinc-500'}`}>
            <span>✨</span> Outfit
          </button>
          <button onClick={() => setActiveTab('closet')} className={`flex flex-col items-center gap-1 ${activeTab === 'closet' ? 'text-sky-400 font-bold' : 'text-zinc-500'}`}>
            <span>👕</span> Closet
          </button>
          <button onClick={() => setActiveTab('favorites')} className={`flex flex-col items-center gap-1 ${activeTab === 'favorites' ? 'text-sky-400 font-bold' : 'text-zinc-500'}`}>
            <span>❤️</span> Favoritos
          </button>
          <button onClick={() => setActiveTab('style')} className={`flex flex-col items-center gap-1 ${activeTab === 'style' ? 'text-sky-400 font-bold' : 'text-zinc-500'}`}>
            <span>👤</span> Estilo
          </button>
        </div>
      </nav>
    </div>
  );
}
