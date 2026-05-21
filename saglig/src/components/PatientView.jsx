import { useState, useEffect } from 'react';
import { Activity, ChevronRight, Check, MapPin, Mic, MicOff, Stethoscope, ArrowLeft, User, Calendar, PersonStanding } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PatientView() {
  // --- STATE ---
  const [step, setStep] = useState('bolgeler'); 
  const [bolgeler, setBolgeler] = useState([]);
  const [seciliBolgeIdleri, setSeciliBolgeIdleri] = useState([]);
  const [sorular, setSorular] = useState([]);
  const [aktifSoruIndeks, setAktifSoruIndeks] = useState(0);
  const [cevaplar, setCevaplar] = useState({});
  const [sonucOzet, setSonucOzet] = useState(null);
  
  // Demografik Veri State'leri
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [yas, setYas] = useState("");
  const [cinsiyet, setCinsiyet] = useState("");
  const [bekleyenCevaplar, setBekleyenCevaplar] = useState(null);

  // Mikrofon State
  const [dinliyor, setDinliyor] = useState(false);
  const [sesMetni, setSesMetni] = useState("");

  const navigate = useNavigate();
  const API_URL = "http://192.168.1.168:5000/api";

  useEffect(() => {
    fetch(`${API_URL}/bolgeler`).then(res => res.json()).then(setBolgeler);
  }, []);

  // --- SES TANIMA ---
  const sesleCevapla = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tarayıcınız sesli komutu desteklemiyor.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR'; 
    recognition.continuous = false;
    
    setDinliyor(true);
    setSesMetni("Dinliyorum...");

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      setSesMetni(`Algılandı: "${transcript}"`);
      
      if (transcript.includes("evet") || transcript.includes("var")) {
         setTimeout(() => cevapVer(1), 800);
      } else if (transcript.includes("hayır") || transcript.includes("yok")) {
         setTimeout(() => cevapVer(0), 800);
      } else {
         setSesMetni("Anlaşılamadı.");
      }
      setDinliyor(false);
    };
    recognition.onerror = () => { setDinliyor(false); setSesMetni(""); };
    recognition.onend = () => setDinliyor(false);
    recognition.start();
  };

  // --- LOGIC ---
  const bolgeToggle = (id) => setSeciliBolgeIdleri(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const sorulariBaslat = async () => {
    if (seciliBolgeIdleri.length === 0) return;
    setStep('yukleniyor');
    const istekler = seciliBolgeIdleri.map(id => fetch(`${API_URL}/sorular/${id}`).then(res => res.json()));
    const yanitlar = await Promise.all(istekler);
    let birlesmis = yanitlar.flat().filter((v,i,a)=>a.findIndex(v2=>(v2.id===v.id))===i);
    
    if(birlesmis.length === 0) {
        alert("Soru bulunamadı.");
        setStep('bolgeler');
        return;
    }
    setSorular(birlesmis);
    setAktifSoruIndeks(0);
    setSesMetni("");
    setStep('sorular');
  };

  const cevapVer = (deger) => {
    const suanki = sorular[aktifSoruIndeks];
    const yeniCevaplar = { ...cevaplar, [suanki.id]: deger };
    setCevaplar(yeniCevaplar);
    setSesMetni("");
    
    if (aktifSoruIndeks < sorular.length - 1) {
        setAktifSoruIndeks(p => p + 1);
    } else {
        // Test bitti, MODAL AÇIYORUZ
        setBekleyenCevaplar(yeniCevaplar);
        setStep('demografi'); // Yeni step
        setShowDemoModal(true);
    }
  };

  // MODAL ONAYLANDIĞINDA ÇALIŞIR
  const sonuclariGonder = () => {
    if (!yas || !cinsiyet) {
        alert("Lütfen yaş ve cinsiyet seçiniz.");
        return;
    }

    setShowDemoModal(false);
    setStep('yukleniyor');

    const veri = { 
        SeciliBolgeler: seciliBolgeIdleri, 
        Cevaplar: Object.entries(bekleyenCevaplar),
        Yas: yas,       // <--- EKLENDİ
        Cinsiyet: cinsiyet // <--- EKLENDİ
    };
    
    fetch(`${API_URL}/hesapla`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(veri)
    })
    .then(res => res.json())
    .then(data => {
      if(data.length > 0) {
        setSonucOzet({ bolum: data[0].bolum, adres: data[0].adres });
      } else {
        setSonucOzet({ bolum: "Belirsiz", adres: "Genel Dahiliye polikliniğine başvurunuz." });
      }
      setStep('sonuc');
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 text-slate-800 flex items-center justify-center p-4 font-sans">
      
      <div className="w-full max-w-lg bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/50 overflow-hidden min-h-[600px] flex flex-col transition-all duration-500 relative">
        
        {/* Header */}
        <div className="px-8 py-6 bg-white/50 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10 backdrop-blur-md">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-500/30">
                    <Activity size={24} />
                </div>
                <div>
                    <h1 className="font-bold text-lg text-slate-800">Sağlık Asistanı</h1>
                    <p className="text-xs text-slate-500 font-medium">Hasta Modülü</p>
                </div>
            </div>
            <button onClick={() => navigate('/')} className="text-xs font-bold text-slate-400 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-3 py-1.5 rounded-full transition-colors">
                Çıkış
            </button>
        </div>

        <div className="p-8 flex-1 flex flex-col relative">
          
          {/* STEP 1: BÖLGELER */}
          {step === 'bolgeler' && (
            <div className="animate-in slide-in-from-bottom-4 duration-500 flex flex-col h-full">
               <div className="text-center mb-8">
                   <h2 className="text-2xl font-bold text-slate-800 mb-2">Nereniz Ağrıyor?</h2>
                   <p className="text-slate-500">Lütfen şikayetiniz olan bölgeleri seçin.</p>
               </div>
               <div className="grid grid-cols-2 gap-3 mb-6 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                 {bolgeler.map(b => (
                    <button key={b.id} onClick={() => bolgeToggle(b.id)} 
                        className={`p-4 rounded-2xl text-left transition-all duration-200 border-2 relative group ${seciliBolgeIdleri.includes(b.id) ? 'border-indigo-500 bg-indigo-50/50 shadow-inner' : 'border-slate-100 bg-white hover:border-indigo-200'}`}>
                        <span className={`font-bold block ${seciliBolgeIdleri.includes(b.id) ? 'text-indigo-700' : 'text-slate-600'}`}>{b.ad}</span>
                        {seciliBolgeIdleri.includes(b.id) && <div className="absolute top-3 right-3 text-indigo-500"><Check size={18}/></div>}
                    </button>
                 ))}
               </div>
               <button onClick={sorulariBaslat} disabled={!seciliBolgeIdleri.length} className={`mt-auto w-full py-4 rounded-xl font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-2 ${seciliBolgeIdleri.length ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.02]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                   Devam Et <ChevronRight size={20} />
               </button>
            </div>
          )}

          {/* STEP 2: SORULAR */}
          {step === 'sorular' && sorular.length > 0 && (
            <div className="flex flex-col h-full animate-in zoom-in-95 duration-500">
               <div className="w-full h-1.5 bg-slate-100 rounded-full mb-8 overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-500 ease-out" style={{ width: `${((aktifSoruIndeks + 1) / sorular.length) * 100}%` }}></div>
               </div>
               <div className="flex-1 flex flex-col justify-center items-center text-center relative">
                   <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold mb-6 tracking-wide uppercase">Soru {aktifSoruIndeks + 1} / {sorular.length}</span>
                   <h2 className="text-3xl md:text-4xl font-black text-slate-800 leading-tight mb-8">{sorular[aktifSoruIndeks].soru_metni}</h2>
                   <div className={`h-8 text-sm font-medium transition-all duration-300 ${dinliyor ? 'text-indigo-600 animate-pulse' : 'text-slate-400'}`}>
                       {sesMetni || (dinliyor ? "Dinliyorum..." : "Cevaplamak için butona basın veya konuşun")}
                   </div>
               </div>
               <div className="mt-auto grid grid-cols-5 gap-4 items-center">
                 <button onClick={() => cevapVer(0)} className="col-span-2 py-5 rounded-2xl bg-white border-2 border-slate-100 hover:border-red-200 hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold text-lg transition-all active:scale-95 shadow-sm">Hayır</button>
                 <button onClick={sesleCevapla} className={`col-span-1 h-16 w-16 mx-auto rounded-full flex items-center justify-center transition-all shadow-xl ${dinliyor ? 'bg-red-500 text-white animate-pulse' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-110'}`}>{dinliyor ? <MicOff size={24} /> : <Mic size={28} />}</button>
                 <button onClick={() => cevapVer(1)} className="col-span-2 py-5 rounded-2xl bg-indigo-600 text-white font-bold text-lg shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95">Evet</button>
               </div>
            </div>
          )}

          {/* STEP 3: DEMOGRAFİ MODALI (YENİ) */}
          {step === 'demografi' && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-500">
               {/* Arka Plan Blur */}
               <div className="absolute inset-0 bg-white/60 backdrop-blur-xl"></div>
               
               <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 text-center animate-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Sizi Tanıyalım</h2>
                  <p className="text-slate-500 text-sm mb-6">İstatistiksel amaçla sadece yaş ve cinsiyet bilgisi gereklidir. İsim alınmaz.</p>
                  
                  {/* Yaş Input */}
                  <div className="mb-4 text-left">
                      <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Yaşınız</label>
                      <div className="relative">
                          <input 
                            type="number" 
                            value={yas} 
                            onChange={(e) => setYas(e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 font-bold text-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="Örn: 25"
                          />
                          <Calendar size={18} className="absolute left-3 top-3.5 text-slate-400" />
                      </div>
                  </div>

                  {/* Cinsiyet Seçimi */}
                  <div className="mb-8 text-left">
                      <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Cinsiyet</label>
                      <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => setCinsiyet('Kadın')}
                            className={`py-3 rounded-xl border-2 font-bold transition-all ${cinsiyet === 'Kadın' ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-300'}`}
                          >
                              Kadın
                          </button>
                          <button 
                            onClick={() => setCinsiyet('Erkek')}
                            className={`py-3 rounded-xl border-2 font-bold transition-all ${cinsiyet === 'Erkek' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-300'}`}
                          >
                              Erkek
                          </button>
                      </div>
                  </div>

                  <button 
                    onClick={sonuclariGonder}
                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg"
                  >
                      Analizi Gör
                  </button>
               </div>
            </div>
          )}

          {/* STEP 4: YÜKLENİYOR */}
          {step === 'yukleniyor' && (
             <div className="h-full flex flex-col items-center justify-center text-center animate-pulse space-y-6">
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center">
                    <Activity className="text-indigo-600 animate-spin" size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Sonuçlar Oluşturuluyor...</h3>
             </div>
          )}

          {/* STEP 5: SONUÇ ÖZETİ */}
          {step === 'sonuc' && sonucOzet && (
            <div className="text-center flex flex-col items-center justify-center h-full space-y-8 animate-in zoom-in duration-500">
               <div className="relative">
                   <div className="absolute inset-0 bg-green-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
                   <div className="w-28 h-28 bg-gradient-to-tr from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white shadow-2xl relative z-10">
                     <Stethoscope size={48} />
                   </div>
                   <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-lg z-20">
                     <Check className="text-green-500" size={24} />
                   </div>
               </div>
               <div>
                 <h2 className="text-3xl font-black text-slate-800 mb-2">Tamamlandı</h2>
                 <p className="text-slate-500 text-lg">Verileriniz işlendi ve doktora iletildi.</p>
               </div>
               <div className="w-full bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-inner">
                 <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Önerilen Bölüm</p>
                 <h3 className="text-2xl md:text-3xl font-black text-indigo-600 mb-2">{sonucOzet.bolum}</h3>
                 <div className="flex items-center justify-center gap-2 text-slate-500 mt-4 bg-white py-2 px-4 rounded-lg inline-block shadow-sm">
                    <MapPin size={16} />
                    <span>{sonucOzet.adres}</span>
                 </div>
               </div>
               <button onClick={() => navigate('/')} className="mt-auto flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors font-medium">
                   <ArrowLeft size={18} /> Ana Ekrana Dön
               </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}