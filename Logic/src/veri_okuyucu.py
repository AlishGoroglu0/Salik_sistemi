import json
import os


#Bu kısımda mevcut dizin alınıyor.
mevcut_dizin = os.path.dirname(os.path.abspath(__file__))






def DosyaOKU():
    # Dosyayı yükle
    try:
        with open(os.path.join(mevcut_dizin, '..', 'data', 'bolgeler.json'), 'r', encoding='utf-8') as dosya:
            veriBolgeler = json.load(dosya)

        with open(os.path.join(mevcut_dizin, '..', 'data', 'dahiliyeler.json'), 'r', encoding='utf-8') as dosya:
            veriDahiliyeler = json.load(dosya)
        with open(os.path.join(mevcut_dizin, '..', 'data', 'hastaliklar.json'), 'r', encoding='utf-8') as dosya:
            verihastalıklar = json.load(dosya)
        
        with open(os.path.join(mevcut_dizin, '..', 'data', 'semptomlar.json'), 'r', encoding='utf-8') as dosya:
            verisemptomlar = json.load(dosya)
        
        with open(os.path.join(mevcut_dizin, '..', 'data', 'hastaprofil.json'), 'r', encoding='utf-8') as dosya:
            veriHastaprofil = json.load(dosya)

        # 'veri' artık bir Python listesi
        return [veriBolgeler , veriDahiliyeler , verihastalıklar , veriHastaprofil ,verisemptomlar]


    except FileNotFoundError:
        print("Hata: JSON dosyası bulunamadı!")

DosyaOKU()