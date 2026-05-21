import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import PatientView from './components/PatientView';
import DoctorView from './components/DoctorView';
import Statistics from './components/Statistics'; // İstatistik bileşeni importu
import { User, Stethoscope, BarChart3 } from 'lucide-react';
import Logo from './assets/images/Logo.png';
function Home() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center space-y-8">
        
        {/* LOGO BURAYA EKLENDİ */}
        {/* Geçici olarak internetten şık bir sağlık ikonu koydum. Kendi logon varsa src="/logo.png" yapabilirsin. */}
        <img 
          src={Logo} 
          alt="DURU Logo" 
          className="h-32 mx-auto object-contain drop-shadow-xl hover:scale-110 transition-transform duration-300" 
        />

        <h1 className="text-3xl font-bold text-slate-800">DURU Sağlık Yönlendirme sistemi</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Hasta Girişi */}
          <Link to="/hasta" className="group bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all border border-slate-200 hover:border-blue-500">
             <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 transition-colors">
               <User size={40} className="text-blue-600 group-hover:text-white" />
             </div>
             <h2 className="text-xl font-bold text-slate-800">Hasta Sayfası</h2>
             <p className="text-slate-500 text-sm mt-2">Şikayetlerinizi bildirin.</p>
          </Link>

          {/* Doktor Girişi */}
          <Link to="/doktor" className="group bg-slate-900 p-8 rounded-3xl shadow-lg border border-slate-800 hover:border-indigo-500 transition-all">
             <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-600 transition-colors">
               <Stethoscope size={40} className="text-indigo-400 group-hover:text-white" />
             </div>
             <h2 className="text-xl font-bold text-white">Doktor Sayfası</h2>
             <p className="text-slate-400 text-sm mt-2">Raporları görüntüleyin.</p>
          </Link>

          {/* Canlı İstatistik */}
          <Link to="/istatistik" className="group bg-slate-800 p-8 rounded-3xl shadow-lg border border-slate-700 hover:border-green-500 transition-all">
            <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-600 transition-colors">
              <BarChart3 size={40} className="text-green-400 group-hover:text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Veri İstatistik</h2>
            <p className="text-slate-400 text-sm mt-2">Sağlık verilerini inceleyin.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/hasta" element={<PatientView />} />
        <Route path="/doktor" element={<DoctorView />} />
        <Route path="/istatistik" element={<Statistics />} />
      </Routes>
    </BrowserRouter>
  );
}