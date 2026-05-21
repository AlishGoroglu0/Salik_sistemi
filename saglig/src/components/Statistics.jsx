import { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, Users, Activity, ShieldAlert, TrendingUp, 
  RefreshCcw, User, ArrowLeft, HeartPulse, Stethoscope, 
  MapPin, AlertTriangle, ChevronRight, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Statistics() {
  const [veriler, setVeriler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hataMesaji, setHataMesaji] = useState(null);
  const [sonGuncelleme, setSonGuncelleme] = useState(new Date().toLocaleTimeString());
  
  const [ozet, setOzet] = useState({
    toplam: 0,
    ortYas: 0,
    erkekYuzde: 0,
    kadinYuzde: 0,
    topHastaliklar: [],
    ortKanserRiski: 0,
    kritikVakaSayisi: 0,
    bolgeselDagilim: {},
    riskGruplari: { dusuk: 0, orta: 0, yuksek: 0 }
  });
  
  const navigate = useNavigate();

  const hesapla = useCallback((data) => {
    if (!data || data.length === 0) return;

    try {
        const toplam = data.length;
        const toplamYas = data.reduce((acc, curr) => acc + (parseInt(curr.yas) || 0), 0);
        const toplamKanser = data.reduce((acc, curr) => acc + (parseFloat(curr.kanser_riski) || 0), 0);
        const erkekSayisi = data.filter(d => d.cinsiyet === 'Erkek').length;
        
        // Kritik Vaka (Risk > %50)
        const kritikVakalar = data.filter(d => parseFloat(d.kanser_riski) > 50).length;

        // Risk Grupları
        const gruplar = { dusuk: 0, orta: 0, yuksek: 0 };
        data.forEach(d => {
            const r = parseFloat(d.kanser_riski);
            if (r < 25) gruplar.dusuk++;
            else if (r < 50) gruplar.orta++;
            else gruplar.yuksek++;
        });

        // Bölgesel Dağılım
        const bolgeSayimlari = {};
        data.forEach(d => {
            if(d.bolge) bolgeSayimlari[d.bolge] = (bolgeSayimlari[d.bolge] || 0) + 1;
        });

        // En Sık Görülen Hastalıklar
        const hastalikSayimlari = {};
        data.forEach(d => {
            if(d.tani) hastalikSayimlari[d.tani] = (hastalikSayimlari[d.tani] || 0) + 1;
        });

        const siraliHastaliklar = Object.entries(hastalikSayimlari)
            .sort((a, b) => b[1] - a[1]) 
            .slice(0, 6);

        setOzet({
            toplam,
            ortYas: Math.round(toplamYas / toplam),
            erkekYuzde: Math.round((erkekSayisi / toplam) * 100),
            kadinYuzde: 100 - Math.round((erkekSayisi / toplam) * 100),
            topHastaliklar: siraliHastaliklar,
            ortKanserRiski: Math.round(toplamKanser / toplam),
            kritikVakaSayisi: kritikVakalar,
            bolgeselDagilim: bolgeSayimlari,
            riskGruplari: gruplar
        });
    } catch (error) {
        console.error("Hesaplama Hatası:", error);
    }
  }, []);

  const veriGuncelle = useCallback(async () => {
    try {
      const res = await fetch("http://192.168.1.168:5000/api/istatistikler");;
      if (!res.ok) throw new Error("Sunucu bağlantı hatası");
      
      const data = await res.json();
      setVeriler(data);
      hesapla(data);
      setHataMesaji(null);
      setSonGuncelleme(new Date().toLocaleTimeString());
    } catch (err) {
      setHataMesaji("Canlı veri akışı durdu. Lütfen server.py'yi kontrol edin.");
    } finally {
      setYukleniyor(false);
    }
  }, [hesapla]);

  useEffect(() => {
    veriGuncelle();
    const interval = setInterval(veriGuncelle, 5000); 
    return () => clearInterval(interval);
  }, [veriGuncelle]);

  if (yukleniyor) {
    return (
        <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center">
            <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-blue-500/10 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin"></div>
                <HeartPulse className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500" size={32} />
            </div>
            <p className="mt-8 text-blue-400 font-mono tracking-widest animate-pulse">SİSTEM VERİLERİ ÇEKİLİYOR...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 p-4 lg:p-10 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* HEADER SECTION */}
      <header className="max-w-[1600px] mx-auto mb-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
            <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000"></div>
                <div className="relative p-4 bg-slate-900 rounded-2xl border border-slate-800">
                    <BarChart3 size={32} className="text-blue-500" />
                </div>
            </div>
            <div>
                <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    Med-Data <span className="text-blue-500 font-light">Analytics</span>
                </h1>
                <div className="flex items-center gap-4 mt-2">
                    <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        Sunucu Aktif
                    </div>
                    <span className="text-slate-500 text-[11px] font-mono">SENKRONİZASYON: {sonGuncelleme}</span>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-3">
            <button 
                onClick={() => navigate('/')} 
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl text-sm font-bold text-white transition-all shadow-xl hover:shadow-blue-500/10"
            >
                <ArrowLeft size={18} />
                Panelden Çık
            </button>
            <button className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all shadow-lg shadow-blue-600/20">
                <RefreshCcw size={20} />
            </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto grid grid-cols-12 gap-6">
        
        {/* KPI CARDS */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Toplam Tarama" value={ozet.toplam} icon={<Users className="text-blue-500" />} color="blue" />
            <StatCard label="Kritik Vakalar" value={ozet.kritikVakaSayisi} icon={<AlertTriangle className="text-red-500" />} color="red" trend="Yüksek Risk" />
            <StatCard label="Yaş Ortalaması" value={ozet.ortYas} icon={<Activity className="text-purple-500" />} color="purple" />
            <StatCard label="Genel Risk" value={`%${ozet.ortKanserRiski}`} icon={<ShieldAlert className="text-emerald-500" />} color="emerald" />
        </div>

        {/* LEFT: MAIN ANALYSIS */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
            
            {/* Şikayet Analizi */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-[2.5rem] p-8">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                        <TrendingUp size={24} className="text-blue-500" />
                        Tanı Dağılım Analizi
                    </h3>
                    <div className="px-4 py-1.5 bg-slate-800/50 rounded-full text-xs font-medium border border-slate-700">En Sık 6 Tanı</div>
                </div>

                <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                    {ozet.topHastaliklar.map(([tani, sayi], idx) => (
                        <div key={idx} className="group cursor-default">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-bold text-slate-300 group-hover:text-blue-400 transition-colors">
                                    {idx + 1}. {tani}
                                </span>
                                <span className="text-xs font-mono text-slate-500">{sayi} Vaka</span>
                            </div>
                            <div className="h-3 w-full bg-slate-800/50 rounded-full overflow-hidden p-0.5 border border-slate-700/30">
                                <div 
                                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${(sayi / ozet.toplam) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Orta Bölüm: Risk Dağılımı ve Cinsiyet */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Risk Grupları */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-[2.5rem] p-8">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Zap size={20} className="text-yellow-500" /> Risk Spektrumu
                    </h3>
                    <div className="flex h-12 w-full rounded-2xl overflow-hidden border border-slate-800 p-1">
                        <div style={{ width: `${(ozet.riskGruplari.dusuk / ozet.toplam) * 100}%` }} className="h-full bg-emerald-500/80 hover:brightness-110 transition-all cursor-help" title="Düşük Risk"></div>
                        <div style={{ width: `${(ozet.riskGruplari.orta / ozet.toplam) * 100}%` }} className="h-full bg-yellow-500/80 hover:brightness-110 transition-all cursor-help" title="Orta Risk"></div>
                        <div style={{ width: `${(ozet.riskGruplari.yuksek / ozet.toplam) * 100}%` }} className="h-full bg-red-500/80 hover:brightness-110 transition-all cursor-help" title="Yüksek Risk"></div>
                    </div>
                    <div className="grid grid-cols-3 mt-6 text-[11px] font-bold tracking-tighter uppercase">
                        <div className="text-emerald-500">Düşük (%{Math.round((ozet.riskGruplari.dusuk / ozet.toplam) * 100)})</div>
                        <div className="text-yellow-500 text-center">Orta (%{Math.round((ozet.riskGruplari.orta / ozet.toplam) * 100)})</div>
                        <div className="text-red-500 text-right">Yüksek (%{Math.round((ozet.riskGruplari.yuksek / ozet.toplam) * 100)})</div>
                    </div>
                </div>

                {/* Cinsiyet Dağılımı */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-[2.5rem] p-8 flex flex-col justify-center">
                    <div className="flex justify-between items-end gap-4 h-24">
                        <div className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full bg-blue-600/20 rounded-t-xl relative overflow-hidden flex flex-col justify-end" style={{ height: '100%' }}>
                                <div className="w-full bg-blue-500 transition-all duration-1000 shadow-[0_0_15px_rgba(59,130,246,0.5)]" style={{ height: `${ozet.erkekYuzde}%` }}></div>
                            </div>
                            <span className="text-[10px] font-black text-blue-500 uppercase">Erkek %{ozet.erkekYuzde}</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full bg-pink-600/20 rounded-t-xl relative overflow-hidden flex flex-col justify-end" style={{ height: '100%' }}>
                                <div className="w-full bg-pink-500 transition-all duration-1000 shadow-[0_0_15px_rgba(236,72,153,0.5)]" style={{ height: `${ozet.kadinYuzde}%` }}></div>
                            </div>
                            <span className="text-[10px] font-black text-pink-500 uppercase">Kadın %{ozet.kadinYuzde}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT: ACTIVITY FEED */}
        <div className="col-span-12 lg:col-span-4">
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-[2.5rem] h-full flex flex-col overflow-hidden max-h-[850px]">
                <div className="p-8 border-b border-slate-800/50 bg-slate-900/20">
                    <h3 className="text-lg font-bold text-white flex items-center gap-3">
                        <RefreshCcw size={18} className="text-blue-500 animate-spin-slow" />
                        Canlı İşlem Akışı
                    </h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {veriler.length > 0 ? [...veriler].reverse().slice(0, 15).map((veri) => (
                        <div key={veri.id} className="p-5 rounded-3xl bg-slate-800/20 border border-slate-700/30 hover:border-blue-500/30 transition-all group relative overflow-hidden">
                            {parseFloat(veri.kanser_riski) > 50 && (
                                <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 blur-2xl -mr-8 -mt-8"></div>
                            )}
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="text-xs font-mono text-slate-500 mb-1">#{veri.id} • {veri.tarih}</p>
                                    <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">{veri.tani}</h4>
                                </div>
                                <div className={`px-2 py-1 rounded-lg text-[10px] font-black ${parseFloat(veri.kanser_riski) > 50 ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                    %{veri.kanser_riski}
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium">
                                <span className="flex items-center gap-1"><User size={12} /> {veri.yas} Yaş, {veri.cinsiyet}</span>
                                <span className="flex items-center gap-1"><MapPin size={12} /> {veri.bolge || 'Genel'}</span>
                            </div>
                        </div>
                    )) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                            <Stethoscope size={48} className="opacity-10" />
                            <p className="text-xs uppercase tracking-[0.2em]">Veri bekleniyor...</p>
                        </div>
                    )}
                </div>
                
                <div className="p-6 bg-slate-900/50 border-t border-slate-800/50 text-center">
                    <button className="text-[10px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-widest flex items-center justify-center gap-2 mx-auto">
                        Tüm Geçmişi Gör <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </div>

      </main>

      {/* ERROR TOAST */}
      {hataMesaji && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-red-500 text-white px-8 py-4 rounded-3xl shadow-[0_20px_50px_rgba(239,68,68,0.3)] flex items-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-500">
                <div className="bg-white/20 p-2 rounded-xl">
                    <ShieldAlert size={24} />
                </div>
                <div>
                    <p className="text-sm font-black uppercase tracking-wider">Bağlantı Kesildi</p>
                    <p className="text-xs opacity-90">{hataMesaji}</p>
                </div>
                <button onClick={() => window.location.reload()} className="ml-4 px-4 py-2 bg-white text-red-600 rounded-xl text-xs font-black hover:bg-slate-100 transition-colors">YENİLE</button>
            </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
      `}} />
    </div>
  );
}

function StatCard({ label, value, icon, color, trend }) {
  const colors = {
    blue: "border-blue-500/20 bg-blue-500/5",
    red: "border-red-500/20 bg-red-500/5",
    purple: "border-purple-500/20 bg-purple-500/5",
    emerald: "border-emerald-500/20 bg-emerald-500/5"
  };

  return (
    <div className={`p-8 rounded-[2.5rem] border backdrop-blur-md transition-all hover:scale-[1.02] duration-300 ${colors[color]}`}>
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 shadow-inner">
                {icon}
            </div>
            {trend && <span className="text-[10px] font-black text-red-500 bg-red-500/10 px-2 py-1 rounded-lg uppercase tracking-tighter">{trend}</span>}
        </div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
        <h4 className="text-5xl font-black text-white tracking-tighter">{value}</h4>
    </div>
  );
}