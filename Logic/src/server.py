from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import time
import hesaplayici
import veri_okuyucu

app = Flask(__name__)
CORS(app)

# --- KLASÖR VE DOSYA YOLLARI ---
mevcut_dizin = os.path.dirname(os.path.abspath(__file__))
# 'data' klasörünün yolu (Bir üst dizinde)
data_klasoru = os.path.join(mevcut_dizin, '..', 'data')

# Eğer 'data' klasörü yoksa oluştur (Hata önleyici)
if not os.path.exists(data_klasoru):
    os.makedirs(data_klasoru)

fuar_veri_yolu = os.path.join(data_klasoru, 'FuarIstatistik.json')
hastaprofil_yolu = os.path.join(data_klasoru, 'hastaprofil.json')
sonuc_yolu = os.path.join(data_klasoru, 'sonuc.json')

# --- YARDIMCI FONKSİYONLAR ---
def dosya_oku_guvenli(yol):
    """Dosyayı güvenli bir şekilde okur, bozuksa boş liste döner."""
    if not os.path.exists(yol):
        return []
    try:
        with open(yol, 'r', encoding='utf-8') as f:
            icerik = f.read().strip()
            if not icerik: return [] # Dosya boşsa
            return json.loads(icerik)
    except Exception as e:
        print(f"Dosya Okuma Hatası ({yol}): {e}")
        return []

def istatistik_ekle(yas, cinsiyet, sonuclar):
    try:
        mevcut_veriler = dosya_oku_guvenli(fuar_veri_yolu)

        # Verileri Analiz Et
        en_yuksek_tani = "Belirtisiz"
        kanser_riski = 0
        
        if sonuclar:
            en_yuksek_tani = sonuclar[0]['hastalik_adi']
            # Kanser Riski Var mı?
            for s in sonuclar:
                if s.get('kategori') in ['ACIL_ONKOLOJI', 'ONKOLOJI'] or \
                   'kanser' in s['hastalik_adi'].lower() or \
                   'tümör' in s['hastalik_adi'].lower():
                    if s['yuzde'] > kanser_riski:
                        kanser_riski = s['yuzde']

        # Yeni Kayıt
        yeni_kayit = {
            "id": len(mevcut_veriler) + 1,
            "tarih": time.strftime("%H:%M"),
            "yas": yas,
            "cinsiyet": cinsiyet,
            "tani": en_yuksek_tani,
            "kanser_riski": kanser_riski
        }

        mevcut_veriler.append(yeni_kayit)
        
        with open(fuar_veri_yolu, 'w', encoding='utf-8') as f:
            json.dump(mevcut_veriler, f, indent=4, ensure_ascii=False)
            
    except Exception as e:
        print(f"İstatistik Kayıt Hatası: {e}")

# --- ENDPOINTLER ---

@app.route('/api/bolgeler', methods=['GET'])
def get_bolgeler():
    veriler = veri_okuyucu.DosyaOKU()
    return jsonify(veriler[0] if veriler else [])

@app.route('/api/sorular/<bolge_id>', methods=['GET'])
def get_sorular(bolge_id):
    veriler = veri_okuyucu.DosyaOKU()
    if not veriler: return jsonify([])
    tum_semptomlar = veriler[4]
    filtrelenmis = [s for s in tum_semptomlar if s.get('bolge_id') == bolge_id]
    return jsonify(filtrelenmis)

@app.route('/api/hesapla', methods=['POST'])
def hesapla():
    gelen_veri = request.json
    print("--- HESAPLAMA İSTEĞİ ---")
    
    yas = gelen_veri.get('Yas', 'Belirsiz')
    cinsiyet = gelen_veri.get('Cinsiyet', 'Belirsiz')
    
    # Profili Kaydet
    with open(hastaprofil_yolu, 'w', encoding='utf-8') as f:
        # Sadece hesaplayıcının ihtiyacı olanı al
        temiz_veri = {
            "SeciliBolgeler": gelen_veri.get("SeciliBolgeler", []),
            "Cevaplar": gelen_veri.get("Cevaplar", [])
        }
        json.dump(temiz_veri, f, indent=4, ensure_ascii=False)
    
    # Motoru Çalıştır
    try:
        hesaplayici.tani_koy()
    except Exception as e:
        print(f"Hesaplayıcı Hatası: {e}")
        return jsonify([]), 500
    
    # Sonucu Oku
    sonuclar = dosya_oku_guvenli(sonuc_yolu)
    
    # İstatistiğe Ekle
    istatistik_ekle(yas, cinsiyet, sonuclar)
    
    return jsonify(sonuclar)

@app.route('/api/sonuclar', methods=['GET'])
def get_sonuclar():
    return jsonify(dosya_oku_guvenli(sonuc_yolu))

@app.route('/api/istatistikler', methods=['GET'])
def get_istatistikler():
    # Burası artık hata vermez, dosya yoksa boş liste döner
    return jsonify(dosya_oku_guvenli(fuar_veri_yolu))

if __name__ == '__main__':
    print(f"Server Aktif! Veri Klasörü: {os.path.abspath(data_klasoru)}")
    app.run(host='0.0.0.0', debug=True, port=5000)