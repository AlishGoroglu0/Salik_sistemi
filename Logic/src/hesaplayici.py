import json
import os

# --- 1. Veri Yükleme Fonksiyonları ---
def json_yukle(dosya_adi):
    mevcut_dizin = os.path.dirname(os.path.abspath(__file__))
    yol = os.path.join(mevcut_dizin, '..', 'data', dosya_adi)
    try:
        with open(yol, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

# --- 2. Matematik Motoru ---
def tani_koy():
    # Verileri Çek
    hasta_profili = json_yukle('hastaprofil.json')
    hastaliklar_db = json_yukle('hastaliklar.json')
    dahiliye_db = json_yukle('dahiliyeler.json')

    if not hasta_profili or "Cevaplar" not in hasta_profili:
        return

    verilen_cevaplar = {kayit[0]: kayit[1] for kayit in hasta_profili["Cevaplar"]}
    ham_tani_listesi = []

    # --- YENİ: ARKA PLAN KANSER TARAMA DEĞİŞKENLERİ ---
    # Bu kelimeleri içeren hastalıklar "Kanser Riski" olarak ayrıca toplanacak
    kanser_anahtar_kelimeler = ["kanser", "tümör", "melanom", "lösemi", "lenfoma", "karsinom", "malign"]
    
    # En yüksek kanser riskini tutacak değişken
    maksimum_onkolojik_risk = 0 
    tespit_edilen_supheli_kanser = ""

    # A. Ham Puanlama
    for hastalik in hastaliklar_db:
        toplam_puan = 0
        maksimum_puan = 0 
        
        semptomlar = hastalik.get("semptom_agirliklari", {})
        for semptom_id, agirlik in semptomlar.items():
            maksimum_puan += agirlik
            if semptom_id in verilen_cevaplar and verilen_cevaplar[semptom_id] == 1:
                toplam_puan += agirlik

        if maksimum_puan > 0:
            olasilik_yuzdesi = (toplam_puan / maksimum_puan) * 100
        else:
            olasilik_yuzdesi = 0

        # --- YENİ: KANSER RİSKİ KONTROLÜ (ARKA PLAN) ---
        # Eğer hastalık bir kanser türüyse ve risk yüksekse bunu hafızaya al
        hastalik_adi_kucuk = hastalik["ad"].lower()
        if any(k in hastalik_adi_kucuk for k in kanser_anahtar_kelimeler) or hastalik.get("kategori") == "ONKOLOJI":
            if olasilik_yuzdesi > maksimum_onkolojik_risk:
                maksimum_onkolojik_risk = olasilik_yuzdesi
                tespit_edilen_supheli_kanser = hastalik["ad"]

        # Normal Liste İşlemleri
        if olasilik_yuzdesi >= hastalik["risk_esigi"]:
            bolum = "Genel Poliklinik"
            adres = "Danışmaya Sorunuz"

            for d in dahiliye_db:
                if d["hastalik_id"] == hastalik["id"]:
                    bolum = d["bolum_adi"]
                    if "adres" in d:
                        adres = d["adres"]
                    break
            
            kategori = hastalik.get("kategori", "FIZIKSEL")
            
            ham_tani_listesi.append({
                "hastalik_adi": hastalik["ad"],
                "ham_yuzde": olasilik_yuzdesi,
                "bolum": bolum,
                "adres": adres,
                "kategori": kategori
            })

    # B. Normalizasyon ve Filtreleme
    toplam_risk_puani = sum(tani['ham_yuzde'] for tani in ham_tani_listesi)
    gecici_liste = []
    
    if ham_tani_listesi:
        for tani in ham_tani_listesi:
            normalize_yuzde = (tani['ham_yuzde'] / toplam_risk_puani) * 100
            tani["yuzde"] = normalize_yuzde
            gecici_liste.append(tani)
        gecici_liste.sort(key=lambda x: x["yuzde"], reverse=True)

    # C. Güvenlik Filtresi ve KANSER UYARISI ENTEGRASYONU
    final_liste = []
    cop_puan = 0
    ESIK_DEGER = 15.0

    if gecici_liste:
        for tani in gecici_liste:
            if tani["yuzde"] < ESIK_DEGER:
                cop_puan += tani["yuzde"]
            else:
                final_liste.append(tani)
        
        # Eğer liste boşaldıysa en yüksek olanı geri al
        if not final_liste and gecici_liste:
            final_liste.append(gecici_liste[0])
            cop_puan -= gecici_liste[0]["yuzde"]

        if final_liste:
            final_liste[0]["yuzde"] += cop_puan

    # D. Kaydet
    for tani in final_liste:
        tani["yuzde"] = int(tani["yuzde"])

    # --- YENİ: EĞER ARKA PLANDA YÜKSEK KANSER RİSKİ ÇIKTIYSA EKLE ---
    # Eğer kanser riski %40'ın üzerindeyse ve listede adı açıkça geçmiyorsa,
    # kullanıcıyı uyarmak için listeye "Genel Onkolojik Risk" maddesi ekle.
    
    listede_kanser_var_mi = False
    for item in final_liste:
        item_ad = item["hastalik_adi"].lower()
        if any(k in item_ad for k in kanser_anahtar_kelimeler):
            listede_kanser_var_mi = True
            break
    
    if maksimum_onkolojik_risk > 45 and not listede_kanser_var_mi:
        # Uyarıyı listenin en başına ekle (En önemli olarak)
        final_liste.insert(0, {
            "hastalik_adi": f"Yüksek Onkolojik Risk Şüphesi ({tespit_edilen_supheli_kanser} Bulguları)",
            "yuzde": int(maksimum_onkolojik_risk),
            "bolum": "TIBBİ ONKOLOJİ / KANSER TARAMA MERKEZİ",
            "adres": "Lütfen vakit kaybetmeden uzman bir doktora başvurunuz.",
            "kategori": "ACIL_ONKOLOJI"
        })

    # Dosyaya Yaz
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'sonuc.json'), 'w', encoding='utf-8') as f:
         json.dump(final_liste, f, indent=4, ensure_ascii=False)

if __name__ == "__main__":
    tani_koy()