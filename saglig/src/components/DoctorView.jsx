import { useState, useEffect } from 'react';
import { Stethoscope, RefreshCw, ShieldAlert, Activity, FileText, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DoctorView() {
  const [sonuclar, setSonuclar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const navigate = useNavigate();

  // Veri Çekme
  const veriCek = () => {
    fetch("http://192.168.1.168:5000/api/sonuclar")
      .then(res => res.json())
      .then(data => {
        setSonuclar(data);
        setYukleniyor(false);
        setLastUpdate(new Date());
      })
      .catch(err => {
        console.error("Hata:", err);
        setYukleniyor(false);
      });
  };

  useEffect(() => {
    veriCek();
    const interval = setInterval(veriCek, 3000);
    return () => clearInterval(interval);
  }, []);

  // --- RİSK HESAPLAMA ---
  // Onkolojik risk varsa onu al, yoksa 0 veya en yüksek diğer riskin %10'u gibi temsili bir değer
  const kanserRiskItem = sonuclar.find(s => 
      s.kategori === 'ACIL_ONKOLOJI' || 
      s.kategori === 'ONKOLOJI' ||
      s.hastalik_adi.toLowerCase().includes('kanser') ||
      s.hastalik_adi.toLowerCase().includes('tümör') ||
      s.hastalik_adi.toLowerCase().includes('melanom')
  );

  const riskYuzdesi = kanserRiskItem ? kanserRiskItem.yuzde : 0;
  
  // Risk Rengi Belirleme (Barın gölgesi ve metin için)
  const getRiskColor = (p) => {
    if (p < 20) return "text-emerald-400 shadow-emerald-500/20";
    if (p < 50) return "text-yellow-400 shadow-yellow-500/20";
    return "text-red-500 shadow-red-600/50 animate-pulse";
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-200 font-sans p-4 md:p-8 overflow-hidden">
      
      {/* HEADER */}
      <header className="flex justify-between items-center mb-10 border-b border-slate-800/60 pb-6">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600/20 p-3 rounded-xl border border-indigo-500/30">
            <Stethoscope size={32} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Doktor Paneli</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <p className="text-slate-500 text-xs font-mono font-medium">CANLI VERİ AKIŞI AKTİF</p>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-right hidden md:block">
            <p className="text-xs text-slate-500 font-bold uppercase">Son Güncelleme</p>
            <p className="font-mono text-sm text-slate-300">{lastUpdate.toLocaleTimeString()}</p>
          </div>
          <button onClick={() => navigate('/')} className="px-6 py-2 bg-slate-800 hover:bg-red-900/30 text-slate-300 hover:text-red-200 border border-slate-700 hover:border-red-800 rounded-lg transition-all font-bold text-sm">
            ÇIKIŞ
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
        
        {/* SOL TARAFTAKİ LİSTE (3/4 Genişlik) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-400 flex items-center gap-2 uppercase tracking-wider">
              <FileText size={18} /> Klinik Bulgular
            </h2>
            <span className="text-xs bg-slate-800 px-3 py-1 rounded-full text-slate-400 border border-slate-700">
              {sonuclar.length} Sonuç Listelendi
            </span>
          </div>

          {sonuclar.length === 0 ? (
             <div className="h-64 flex flex-col items-center justify-center bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-800 text-slate-600">
               <User size={48} className="mb-4 opacity-20" />
               <p className="text-xl">Hasta verisi bekleniyor...</p>
             </div>
          ) : (
            sonuclar.map((sonuc, idx) => {
               const isOnko = sonuc.kategori === 'ACIL_ONKOLOJI' || sonuc.hastalik_adi.toLowerCase().includes('kanser');
               return (
                <div key={idx} className={`p-6 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 relative overflow-hidden group
                  ${isOnko ? 'bg-red-950/20 border-red-500/40 hover:border-red-500' : 'bg-slate-900 border-slate-800 hover:border-indigo-500/50'}`}>
                  
                  {isOnko && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600 animate-pulse"></div>}

                  <div>
                    <h3 className={`text-xl font-bold ${isOnko ? 'text-red-200' : 'text-slate-100'}`}>{sonuc.hastalik_adi}</h3>
                    <div className="flex items-center gap-2 mt-2 text-sm text-slate-400">
                       <span className={`px-2 py-0.5 rounded text-xs font-bold ${isOnko ? 'bg-red-900 text-red-300' : 'bg-slate-800 text-indigo-300'}`}>
                         {sonuc.bolum}
                       </span>
                       <span className="opacity-50">{sonuc.adres}</span>
                    </div>
                  </div>

                  <div className={`text-2xl font-black font-mono ${isOnko ? 'text-red-500' : 'text-slate-500 group-hover:text-indigo-400'}`}>
                    %{sonuc.yuzde}
                  </div>
                </div>
               )
            })
          )}
        </div>

        {/* SAĞ TARAF: DİKEY KANSER RİSK BARI (1/4 Genişlik) */}
        <div className="lg:col-span-1">
          <div className={`sticky top-6 h-[600px] rounded-3xl p-6 border flex flex-col items-center relative overflow-hidden transition-all duration-500
            ${riskYuzdesi > 40 ? 'bg-red-950/10 border-red-500/30 shadow-[0_0_50px_rgba(220,38,38,0.15)]' : 'bg-slate-900 border-slate-800'}`}>
            
            {/* Başlık */}
            <div className="text-center mb-6 z-10">
              <div className="inline-flex p-3 rounded-full bg-slate-800 border border-slate-700 mb-3 text-slate-300">
                <ShieldAlert size={24} className={riskYuzdesi > 40 ? "text-red-500 animate-pulse" : ""} />
              </div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Onkolojik<br/>Risk Analizi</h3>
            </div>

            {/* Dikey Bar Konteyner */}
            <div className="flex-1 w-16 bg-slate-950 rounded-full border border-slate-800 relative overflow-hidden mb-6 shadow-inner z-10">
              
              {/* Arka plan çizgileri (Grid) */}
              <div className="absolute inset-0 flex flex-col justify-between py-4 px-2 opacity-30 z-20 pointer-events-none">
                 {[...Array(10)].map((_, i) => <div key={i} className="h-[1px] w-full bg-slate-600"></div>)}
              </div>

              {/* Doluluk (Gradyan) */}
              <div 
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-500 via-yellow-500 to-red-600 transition-all duration-1000 ease-out rounded-b-full opacity-90"
                style={{ height: `${riskYuzdesi}%` }}
              >
                {/* Parlama Efekti */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-white/50 blur-sm"></div>
              </div>
            </div>

            {/* Yüzde Göstergesi */}
            <div className="text-center z-10">
              <p className="text-xs text-slate-500 font-bold uppercase mb-1">Tespit Edilen Risk</p>
              <div className={`text-5xl font-black font-mono transition-all duration-500 ${getRiskColor(riskYuzdesi)}`}>
                %{riskYuzdesi}
              </div>
            </div>

            {/* Kritik Uyarı */}
            {riskYuzdesi > 40 && (
               <div className="absolute bottom-4 left-4 right-4 bg-red-600 text-white text-xs font-bold text-center py-2 rounded animate-bounce z-20 shadow-lg">
                 KRİTİK SEVİYE
               </div>
            )}
            
            {/* Arka Plan Glow Efekti (Risk yüksekse) */}
            {riskYuzdesi > 40 && (
                <div className="absolute inset-0 bg-red-600/5 blur-3xl z-0"></div>
            )}

          </div>
        </div>

      </main>
    </div>
  );
}