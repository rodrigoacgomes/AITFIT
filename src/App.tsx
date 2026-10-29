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

const NEUTRALS = ['preto', 'branco', 'cinza', 'cinzento', 'bege', 'castanho', 'creme', 'off-white', 'marrom', 'navy', 'azul marinho', 'azul-marinho', 'jeans', 'ganga', 'caqui', 'kaki'];

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('outfit');
  const [selectedDay, setSelectedDay] = useState<string>('today');
  const [timeSlots, setTimeSlots] = useState<{ [key: string]: boolean }>({ morning: true, afternoon: true, night: false });
  const [formality, setFormality] = useState<number>(3);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

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
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [newItem, setNewItem] = useState<any>({
    name: '',
    category: 'tronco-base',
    fit: 'Normal',
    color1: '',
    color2: '',
    weather: 'Ameno',
    formality: 2
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

  const formalityLabels: { [key: number]: string } = {
    1: 'Desportivo',
    2: 'Casual',
    3: 'Smart Casual',
    4: 'Formal',
    5: 'Gala / Evento'
  };

  const isNeutralColor = (color: string) => {
    if (!color) return true;
    const c = color.toLowerCase().trim();
    return NEUTRALS.some(n => c.includes(n));
  };

  // --- FILTRAGEM RÍGIDA DE FORMALIDADE POR CATEGORIA ---
  const getCategoryPool = (category: string, targetFormality: number) => {
    const items = closet.filter((i: any) => i.category === category);
    if (!items.length) return [null];

    // Tier 1: Nível exato
    const tier1 = items.filter((i: any) => (Number(i.formality) || 2) === targetFormality);
    if (tier1.length > 0) return tier1;

    // Tier 2: Adjacente (|delta| == 1), bloqueando desportivo com formal
    const tier2 = items.filter((i: any) => {
      const f = Number(i.formality) || 2;
      if (targetFormality >= 4 && f <= 2) return false;
      if (targetFormality === 1 && f >= 3) return false;
      return Math.abs(f - targetFormality) === 1;
    });

    return tier2.length > 0 ? tier2 : [null];
  };

  // --- MOTOR GLOBAL DE ESTILO (Avaliador de Harmonia, Proporções, Layering e Cor) ---
  const evaluateGlobalHarmony = (candidate: any, targetFormality: number) => {
    let score = 50;

    const activeItems = [
      candidate.torsoBase,
      candidate.torsoMid,
      candidate.torsoOuter,
      candidate.legs,
      candidate.feet,
      candidate.head,
      candidate.accessory
    ].filter(Boolean);

    if (activeItems.length === 0) return 0;

    // 1. HARMONIA DE CORES (Regra 60-30-10 & Esquemas Cromáticos)
    const colors = activeItems.map((i: any) => (i.color1 || '').toLowerCase().trim()).filter(Boolean);
    const nonNeutrals = colors.filter((c: string) => !isNeutralColor(c));
    const uniqueNonNeutrals = Array.from(new Set(nonNeutrals));

    if (uniqueNonNeutrals.length === 0) {
      // Look All-Neutral / Tom sobre Tom
      score += 25;
    } else if (uniqueNonNeutrals.length === 1) {
      // Regra 60-30-10 ou Base Neutra + 1 Destaque de Cor (Pop de Cor Perfeito)
      score += 35;
    } else if (uniqueNonNeutrals.length === 2) {
      // 2 cores vivas -> Aceitável apenas com moderação
      score += 10;
    } else {
      // 3 ou mais cores não-neutras -> Choque cromático sem harmonia
      score -= 45;
    }

    // Regra Sanduíche (Topo espelha os Pés)
    const topItem = candidate.torsoOuter || candidate.torsoMid || candidate.torsoBase;
    if (topItem && candidate.feet) {
      const topColor = (topItem.color1 || '').toLowerCase().trim();
      const feetColor = (candidate.feet.color1 || '').toLowerCase().trim();
      if (topColor && feetColor && topColor === feetColor) {
        score += 15;
      }
    }

    // 2. PROPORÇÕES E SILHUETA (Lei do Contraponto de Fit)
    const topFit = (topItem?.fit || 'Normal').toLowerCase();
    const legsFit = (candidate.legs?.fit || 'Normal').toLowerCase();

    if (topFit === 'oversized') {
      if (legsFit === 'slim' || legsFit === 'normal') {
        score += 20; // Contraponto Perfeito: Cima largo + Baixo ajustado
      } else if (legsFit === 'oversized') {
        score -= 10; // Perda de estrutura
      }
    } else if (topFit === 'slim') {
      if (legsFit === 'oversized' || legsFit === 'normal') {
        score += 20; // Contraponto Perfeito: Cima ajustado + Baixo fluido
      }
    } else {
      score += 10; // Fit Normal equilibrado
    }

    // 3. LAYERING & REGRA DA TERCEIRA PEÇA
    const hasThirdPiece = Boolean(candidate.torsoMid || candidate.torsoOuter);
    if (hasThirdPiece) {
      score += 15; // Estrutura instantânea com terceira peça
    }

    // Contraste High-Low (Alfaiataria / Formal + Casual / Sapatilhas)
    if (candidate.legs && candidate.feet) {
      const legsFormality = Number(candidate.legs.formality) || 2;
      const feetFormality = Number(candidate.feet.formality) || 2;
      if (legsFormality >= 3 && feetFormality === 2) {
        score += 15; // High-Low Urbano Elegante
      }
    }

    // 4. FORMALIDADE E ÂNCORA DO OUTFIT
    activeItems.forEach((i: any) => {
      const f = Number(i.formality) || 2;
      if (f === targetFormality) score += 5;
    });

    return score;
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    const st = getStats();

    setTimeout(() => {
      const needsOuter = st.minTemp < 12 || st.rainProb > 30;
      const needsMid = st.minTemp < 18;

      const torsoBasePool = lockedItems.torsoBase ? [lockedItems.torsoBase] : getCategoryPool('tronco-base', formality);
      const legsPool = lockedItems.legs ? [lockedItems.legs] : getCategoryPool('pernas', formality);
      const feetPool = lockedItems.feet ? [lockedItems.feet] : getCategoryPool('pes', formality);
      
      const torsoMidPool = lockedItems.torsoMid 
        ? [lockedItems.torsoMid] 
        : (needsMid ? getCategoryPool('tronco-meio', formality) : [null]);

      const torsoOuterPool = lockedItems.torsoOuter 
        ? [lockedItems.torsoOuter] 
        : (needsOuter ? getCategoryPool('tronco-fora', formality) : [null]);

      const headBase = getCategoryPool('cabeca', formality).filter(Boolean);
      const headPool = lockedItems.head 
        ? [lockedItems.head] 
        : (headBase.length > 0 ? [...headBase, null] : [null]);

      const accessoryPool = lockedItems.accessory 
        ? [lockedItems.accessory] 
        : getCategoryPool('acessorios', formality);

      // Gerar amostras de combinações completas e avaliar com as regras de styling
      const candidateOutfits: any[] = [];
      const numSamples = 80;

      for (let i = 0; i < numSamples; i++) {
        const candidate = {
          head: headPool[Math.floor(Math.random() * headPool.length)],
          torsoBase: torsoBasePool[Math.floor(Math.random() * torsoBasePool.length)],
          torsoMid: torsoMidPool[Math.floor(Math.random() * torsoMidPool.length)],
          torsoOuter: torsoOuterPool[Math.floor(Math.random() * torsoOuterPool.length)],
          legs: legsPool[Math.floor(Math.random() * legsPool.length)],
          feet: feetPool[Math.floor(Math.random() * feetPool.length)],
          accessory: accessoryPool[Math.floor(Math.random() * accessoryPool.length)]
        };

        const globalScore = evaluateGlobalHarmony(candidate, formality);
        candidateOutfits.push({ candidate, score: globalScore });
      }

      // Selecionar o outfit com maior pontuação de styling
      candidateOutfits.sort((a, b) => b.score - a.score);
      const topScore = candidateOutfits[0]?.score || 0;
      const bestCandidates = candidateOutfits.filter(c => c.score >= topScore - 10);
      const selectedOutfit = bestCandidates[Math.floor(Math.random() * bestCandidates.length)].candidate;

      setGeneratedOutfit({
        id: Date.now().toString(),
        ...selectedOutfit,
        date: new Date().toLocaleDateString('pt-PT')
      });

      setIsGenerating(false);
    }, 500);
  };

  const openAddModal = () => {
    setEditingItemId(null);
    setNewItem({ name: '', category: 'tronco-base', fit: 'Normal', color1: '', color2: '', weather: 'Ameno', formality: 2 });
    setIsAddModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItemId(item.id);
    setNewItem({
      name: item.name || '',
      category: item.category || 'tronco-base',
      fit: item.fit || 'Normal',
      color1: item.color1 || '',
      color2: item.color2 || '',
      weather: item.weather || 'Ameno',
      formality: item.formality || 2
    });
    setIsAddModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name) return;

    if (editingItemId) {
      setCloset((prev: any[]) => prev.map((i: any) => i.id === editingItemId ? { ...newItem, id: editingItemId } : i));
    } else {
      setCloset((prev: any[]) => [...prev, { ...newItem, id: Date.now().toString() }]);
    }

    setEditingItemId(null);
    setNewItem({ name: '', category: 'tronco-base', fit: 'Normal', color1: '', color2: '', weather: 'Ameno', formality: 2 });
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
      { id: '1', name: 'Gorro Knit', category: 'cabeca', fit: 'Normal', color1: 'Preto', color2: '', weather: 'Frio', formality: 1 },
      { id: '2', name: 'T-Shirt Básica', category: 'tronco-base', fit: 'Normal', color1: 'Branco', color2: '', weather: 'Quente', formality: 2 },
      { id: '3', name: 'Quarter Zip Tricot', category: 'tronco-meio', fit: 'Normal', color1: 'Cinza', color2: '', weather: 'Frio', formality: 3 },
      { id: '4', name: 'Blazer Alfaiataria', category: 'tronco-fora', fit: 'Normal', color1: 'Preto', color2: '', weather: 'Ameno', formality: 4 },
      { id: '5', name: 'Calças Chino', category: 'pernas', fit: 'Slim', color1: 'Bege', color2: '', weather: 'Ameno', formality: 3 },
      { id: '6', name: 'Calças Alfaiataria', category: 'pernas', fit: 'Slim', color1: 'Preto', color2: '', weather: 'Ameno', formality: 4 },
      { id: '7', name: 'Calças Fato de Treino', category: 'pernas', fit: 'Normal', color1: 'Cinza', color2: '', weather: 'Ameno', formality: 1 },
      { id: '8', name: 'Sapatilhas Brancas Retro', category: 'pes', fit: 'Normal', color1: 'Branco', color2: '', weather: 'Ameno', formality: 2 },
      { id: '9', name: 'Sapatilhas Verdes Vintage', category: 'pes', fit: 'Normal', color1: 'Verde', color2: 'Branco', weather: 'Ameno', formality: 2 },
      { id: '10', name: 'Sapatilhas Pretas Urban', category: 'pes', fit: 'Normal', color1: 'Preto', color2: '', weather: 'Ameno', formality: 2 },
      { id: '11', name: 'Sapatos Clássicos', category: 'pes', fit: 'Normal', color1: 'Preto', color2: '', weather: 'Ameno', formality: 4 }
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

  const filteredCloset = closet.filter((item: any) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const catLabel = (categoryLabels[item.category] || item.category).toLowerCase();
    const formLabel = (formalityLabels[item.formality] || '').toLowerCase();
    return (
      (item.name || '').toLowerCase().includes(query) ||
      catLabel.includes(query) ||
      formLabel.includes(query) ||
      (item.fit || '').toLowerCase().includes(query) ||
      (item.color1 || '').toLowerCase().includes(query) ||
      (item.color2 || '').toLowerCase().includes(query) ||
      (item.weather || '').toLowerCase().includes(query)
    );
  });

  const ItemBox = ({ slotKey, item, placeholder }: { slotKey: string; item: any; placeholder: string }) => (
    <div className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${item ? 'bg-zinc-900 border-sky-500/50' : 'bg-zinc-950/40 border-zinc-800/80 border-dashed'}`}>
      <div className="overflow-hidden pr-2 flex-1">
        <div className="text-xs font-bold text-zinc-100 truncate">
          {item ? item.name : <span className="text-zinc-600 font-normal italic">{placeholder}</span>}
        </div>
        {item && (
          <div className="text-[10px] text-zinc-300 mt-1 flex items-center gap-1.5 flex-wrap">
            <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1.5 py-0.5 rounded font-semibold text-[9px] uppercase">
              Nvl {item.formality || 2}
            </span>
            <span className="bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-medium text-[9px]">
              {item.fit || 'Normal'}
            </span>
            <span className="bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded text-[9px]">
              {item.color1}{item.color2 ? ` / ${item.color2}` : ''}
            </span>
          </div>
        )}
      </div>
      {item && (
        <button onClick={() => setLockedItems((p: any) => ({ ...p, [slotKey]: p[slotKey] ? null : item }))} className="text-xs p-1 ml-1">
          {lockedItems[slotKey] ? <span className="text-sky-400 font-bold">🔒</span> : <span className="text-zinc-600">🔓</span>}
        </button>
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
              <span className="text-xs font-semibold">Nível de Formalidade Pretendido</span>
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
              {isGenerating ? 'A aplicar regras de styling...' : 'Gerar Outfit Personalizado'}
            </button>

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

                <div className="bg-zinc-900/70 rounded-2xl border border-zinc-800 p-3.5 space-y-4">
                  <div className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-4 flex flex-col items-center justify-center bg-zinc-950/60 border border-zinc-800/60 py-2.5 px-1 rounded-xl">
                      <svg viewBox="0 0 40 40" className="w-8 h-8 text-sky-400 fill-none stroke-current" style={{ strokeWidth: 2 }}>
                        <circle cx="20" cy="20" r="14" />
                      </svg>
                      <span className="text-[10px] font-bold text-zinc-300 mt-1">Cabeça</span>
                    </div>
                    <div className="col-span-8">
                      <ItemBox slotKey="head" item={generatedOutfit.head} placeholder="Sem peça" />
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-4 flex flex-col items-center justify-center bg-zinc-950/60 border border-zinc-800/60 py-6 px-1 rounded-xl">
                      <svg viewBox="0 0 50 50" className="w-10 h-10 text-sky-400 fill-none stroke-current" style={{ strokeWidth: 2, strokeLinecap: 'round' }}>
                        <path d="M12,12 L20,16 L30,16 L38,12 L44,22 L38,24 L38,44 L12,44 L12,24 L6,22 Z" />
                      </svg>
                      <span className="text-[10px] font-bold text-zinc-300 mt-1">Tronco</span>
                    </div>
                    <div className="col-span-8 space-y-1.5">
                      <ItemBox slotKey="torsoBase" item={generatedOutfit.torsoBase} placeholder="Tronco Base" />
                      <ItemBox slotKey="torsoMid" item={generatedOutfit.torsoMid} placeholder="Tronco Camada" />
                      <ItemBox slotKey="torsoOuter" item={generatedOutfit.torsoOuter} placeholder="Casaco / Exterior" />
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-4 flex flex-col items-center justify-center bg-zinc-950/60 border border-zinc-800/60 py-2.5 px-1 rounded-xl">
                      <svg viewBox="0 0 40 40" className="w-8 h-8 text-sky-400 fill-none stroke-current" style={{ strokeWidth: 2, strokeLinecap: 'round' }}>
                        <path d="M10,8 L30,8 L28,36 L22,36 L20,18 L18,18 L16,36 L10,36 Z" />
                      </svg>
                      <span className="text-[10px] font-bold text-zinc-300 mt-1">Pernas</span>
                    </div>
                    <div className="col-span-8">
                      <ItemBox slotKey="legs" item={generatedOutfit.legs} placeholder="Sem calças" />
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-4 flex flex-col items-center justify-center bg-zinc-950/60 border border-zinc-800/60 py-2.5 px-1 rounded-xl">
                      <svg viewBox="0 0 40 40" className="w-8 h-8 text-sky-400 fill-none stroke-current" style={{ strokeWidth: 2, strokeLinecap: 'round' }}>
                        <path d="M6,24 L16,20 L26,20 L34,26 L34,30 L6,30 Z" />
                      </svg>
                      <span className="text-[10px] font-bold text-zinc-300 mt-1">Pés</span>
                    </div>
                    <div className="col-span-8">
                      <ItemBox slotKey="feet" item={generatedOutfit.feet} placeholder="Sem calçado" />
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-3 items-center pt-2 border-t border-zinc-800/60">
                    <div className="col-span-4 flex flex-col items-center justify-center bg-zinc-950/60 border border-zinc-800/60 py-2.5 px-1 rounded-xl">
                      <svg viewBox="0 0 40 40" className="w-8 h-8 text-sky-400 fill-none stroke-current" style={{ strokeWidth: 2, strokeLinecap: 'round' }}>
                        <rect x="8" y="14" width="24" height="18" rx="3" />
                        <path d="M14,14 L14,10 C14,8 16,6 20,6 C24,6 26,8 26,10 L26,14" />
                      </svg>
                      <span className="text-[10px] font-bold text-zinc-300 mt-1">Acessórios</span>
                    </div>
                    <div className="col-span-8">
                      <ItemBox slotKey="accessory" item={generatedOutfit.accessory} placeholder="Sem acessório" />
                    </div>
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
                <p className="text-xs text-zinc-400">{closet.length} peças no total</p>
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
                <button onClick={openAddModal} className="py-2 px-3 bg-sky-500 text-black text-xs font-bold rounded-xl flex items-center gap-1">
                  + Adicionar
                </button>
              </div>
            </div>

            {closet.length > 0 && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Pesquisar por nome, cor, categoria, fit ou clima..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-sky-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {closet.length === 0 ? (
              <div className="text-center py-12 bg-zinc-900/40 rounded-2xl border border-zinc-800 space-y-3">
                <span className="text-2xl">👕</span>
                <p className="text-xs text-zinc-400">O teu Closet está vazio.</p>
                <button onClick={loadSampleCloset} className="text-xs text-sky-400 underline font-medium">
                  Carregar peças de exemplo
                </button>
              </div>
            ) : filteredCloset.length === 0 ? (
              <div className="text-center py-8 bg-zinc-900/20 rounded-2xl border border-zinc-800/60">
                <p className="text-xs text-zinc-500">Nenhuma peça encontrada para "{searchQuery}".</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {filteredCloset.map((item: any) => (
                  <div key={item.id} className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex flex-col justify-between space-y-2 relative">
                    <div className="flex items-start justify-between gap-1">
                      <div className="overflow-hidden">
                        <span className="text-[9px] uppercase font-semibold text-sky-400 block truncate">
                          {categoryLabels[item.category] || item.category}
                        </span>
                        <h4 className="text-xs font-bold text-zinc-100 truncate mt-0.5">{item.name}</h4>
                      </div>
                      <div className="flex items-center gap-0.5 -mr-1 -mt-1">
                        <button 
                          onClick={() => openEditModal(item)}
                          className="text-zinc-400 hover:text-sky-400 p-1 text-xs rounded-lg transition-colors"
                          title="Editar peça"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-zinc-500 hover:text-rose-400 p-1 text-xs rounded-lg transition-colors"
                          title="Remover peça"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="text-[10px] text-zinc-400 pt-1.5 border-t border-zinc-800/80 space-y-0.5">
                      <div className="flex justify-between">
                        <span>Formalidade:</span>
                        <strong className="text-sky-300">Nvl {item.formality || 2} ({formalityLabels[item.formality || 2]})</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Fit / Cores:</span>
                        <strong className="text-zinc-200">{item.fit || 'Normal'} • {item.color1}</strong>
                      </div>
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
                          <span className="font-medium text-zinc-200">{fav[s].name} (Nvl {fav[s].formality || 2})</span>
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

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE PEÇA */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-5 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <h3 className="font-bold text-white text-sm">
                {editingItemId ? 'Editar Peça' : 'Adicionar Nova Peça'}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-500 text-base">✕</button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
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
                <label className="block text-zinc-300 font-semibold mb-1.5">Nível de Formalidade da Peça</label>
                <div className="grid grid-cols-5 gap-1">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setNewItem((p: any) => ({ ...p, formality: lvl }))}
                      className={`py-2 rounded-lg border text-center text-[10px] font-bold ${newItem.formality === lvl ? 'bg-sky-500 text-black border-sky-400' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}
                    >
                      Nvl {lvl}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-sky-400 font-medium mt-1 block">
                  {formalityLabels[newItem.formality || 2]}
                </span>
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
                {editingItemId ? 'Guardar Alterações' : 'Guardar no Closet'}
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
