import veri_okuyucu
import hesaplayici  # <--- YENİ: Hesaplayıcı modülünü çağırdık
import json
import os

# Verileri Yükle
veriBolge = veri_okuyucu.DosyaOKU()[0]
veriSemptomlar = veri_okuyucu.DosyaOKU()[4] # Semptomları çektik

seciliBolgeler = []
verilenCevaplar = [] # [SemptomID, 1/0] tutacak liste

# --- Fonksiyonlar ---

def bolgeleriCagirListele():
    print("\n--- Lütfen Şikayet Bölgenizi Seçin ---")
    i = -1
    for bolge in veriBolge:
        i += 1
        # Kullanıcıya sadece adı gösteriyoruz
        print(f"{i}: {bolge['ad']}")

def bolgeleriSec(index):
    if index < 0 or index >= len(veriBolge):
        print("Hatalı seçim! Lütfen listedeki numaralardan birini girin.")
        return

    secilecekBolge = veriBolge[index]
    bolgeID = secilecekBolge["id"]

    # Zaten ekli mi kontrolü
    if bolgeID in seciliBolgeler:
        print(f"UYARI: {secilecekBolge['ad']} zaten seçildi.")
        return
    
    # Listeye ekle (Sadece ID'yi tutuyoruz: 'bolge_bas' gibi)
    seciliBolgeler.append(bolgeID)
    print(f"EKLENDİ: {secilecekBolge['ad']}")

def sorulari_sor_ve_kaydet():
    print("\n" + "="*30)
    print("ŞİKAYET DETAYLARI SORGULANIYOR")
    print("="*30)
    
    # 1. Seçilen bölgelere ait soruları filtrele
    sorulacak_sorular = []
    for semptom in veriSemptomlar:
        # Eğer semptomun bölgesi, bizim seçtiklerimiz arasındaysa listeye al
        if semptom["bolge_id"] in seciliBolgeler:
            sorulacak_sorular.append(semptom)

    if not sorulacak_sorular:
        print("Seçilen bölgeler için kayıtlı soru bulunamadı.")
        return

    # 2. Soruları Kullanıcıya Sor
    for soru in sorulacak_sorular:
        print(f"\nSORU: {soru['soru_metni']}")
        print("1: Evet  |  0: Hayır")
        
        while True:
            cevap = input("Cevabınız (1 veya 0): ")
            if cevap == "1":
                # [ID, 1] olarak kaydet
                verilenCevaplar.append([soru["id"], 1])
                break
            elif cevap == "0":
                # [ID, 0] olarak kaydet
                verilenCevaplar.append([soru["id"], 0])
                break
            else:
                print("Lütfen sadece 1 veya 0 yazınız.")

    # 3. Verileri Dosyaya Yaz (Kayıt)
    Kaydet()

    # 4. HESAPLAYICIYI TETİKLE (BEYİN DEVREYE GİRİYOR)
    print("\nAnaliz yapılıyor, lütfen bekleyin...\n")
    hesaplayici.tani_koy()  # <--- İŞTE BÜTÜN OLAY BURADA!

def Kaydet():
    mevcut_dizin = os.path.dirname(os.path.abspath(__file__))
    dosya_yolu = os.path.join(mevcut_dizin, '..', 'data', 'hastaprofil.json')
    
    profil_data = {
        "SeciliBolgeler": seciliBolgeler,
        "Cevaplar": verilenCevaplar
    }

    try:
        os.makedirs(os.path.dirname(dosya_yolu), exist_ok=True)
        with open(dosya_yolu, 'w', encoding='utf-8') as dosya:
            json.dump(profil_data, dosya, indent=4, ensure_ascii=False)
    except Exception as e:
        print(f"Kayıt hatası: {e}")

# --- Ana Döngü ---
def main():
    while True:
        # Mevcut durumu göster
        if seciliBolgeler:
            print(f"\nŞu an seçili: {seciliBolgeler}")
        
        bolgeleriCagirListele()
        
        giris = input("\nBölge No girin (veya bitirmek için 'A' yazın): ")

        if giris.upper() == "A":
            if not seciliBolgeler:
                print("Lütfen önce en az bir bölge seçin!")
                continue
            
            # Sorulara geç
            sorulari_sor_ve_kaydet()
            break # Programı sonlandır (veya başa döndür)
        
        try:
            index = int(giris)
            bolgeleriSec(index)
        except ValueError:
            print("Lütfen geçerli bir sayı girin.")

if __name__ == "__main__":
    main()