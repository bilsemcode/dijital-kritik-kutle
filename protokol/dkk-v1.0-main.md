# Dijital Kritik Kütle — Ana Çalışma v1.0 Protokolü

**Durum:** Ana çalışma teknik sürümü — gerçek veri toplama öncesi pilot/uzman doğrulaması gerekli  
**Uygulama sürümü:** `dkk-v1.0-main`  
**Koşul sürümü:** `fixed-peer-4-balanced-v1`

## 1. Araştırma sorusu
Çevrimiçi bir akran grubunda görünür biçimde karşı çıkan akranların oranı arttıkça öğrencinin grupta kamusal olarak karşı çıkma tercihi nasıl değişmektedir ve bu değişim doğrusal olmayan bir tepki örüntüsü gösterir mi?

## 2. Birincil sonuç
Birincil sonuç değişkeni `public_defend` kararının seçilip seçilmemesidir (0/1).

İkincil sonuçlar:
- aktif müdahale üst kategorisi: özelden yazma + kamusal karşı çıkma + bildirme/yardım,
- beş davranış seçeneğinin dağılımı,
- karar süresi (`rt_ms`),
- sınıf, site ve kaba cihaz sınıfına göre betimsel örüntüler.

## 3. Deneysel manipülasyon
Her koşulda kırıcı/hedefleyici mesajdan sonra **tam olarak dört** ek akran tepkisi gösterilir. Böylece toplam sosyal mesaj sayısı koşullar arasında sabittir.

Koşullar:
- 0/4 görünür karşı çıkma
- 1/4 görünür karşı çıkma
- 2/4 görünür karşı çıkma
- 3/4 görünür karşı çıkma
- 4/4 görünür karşı çıkma

Karşı çıkan ve nötr akran tepkileri aynı görsel biçimde gösterilir. Renk veya vurgu yoluyla deney koşuluna ek ipucu verilmez.

## 4. Karşı çıkma ve nötr mesaj eşleştirmesi
Her senaryo için ayrı bir **bağlama uygun akran tepki seti** kullanılır. Böylece grup konuşmasının konusu (ör. buluşma planı, takım seçimi, proje, fotoğraf, ders çözümü) ile akran tepkileri aynı konuşma akışı içinde kalır.

Her senaryoda:
- 4 adet nötr, konuya ilişkin fakat hedef kişiyi savunmayan tepki,
- 4 adet konuya ilişkin ve hedef kişiyi açıkça savunan/karşı çıkan tepki

önceden tanımlıdır.

Nötr ve karşı çıkan mesajlar mümkün olduğunca benzer uzunlukta ve aynı görsel biçimde sunulur. Ayrıca hedef alınan kişinin adı, görünür dört akran arasında yeniden kullanılmaz. Böylece örneğin dışlanan öğrencinin daha sonra savunucu akran gibi görünmesi engellenir.

Hangi dört akranın kaçının karşı çıktığı katılımcı ve senaryoya bağlı deterministik tohumla dengelenir.

## 5. Katılımcıya sunulan davranış seçenekleri
Ahlaki değer yargısı taşıyan etiketlerden kaçınılır. Katılımcı yalnız şu davranış ifadelerini görür:
- Grupta bu yoruma katıldığımı belirtirim.
- Grupta herhangi bir şey yazmadan devam ederim.
- Mesajda adı geçen kişiye özelden yazarım.
- Grupta bu yoruma katılmadığımı belirtirim.
- Durumu grup yöneticisine veya bir yetişkine iletirim.

Seçeneklerin ekran sırası, deneysel koşul ofsetinden **bağımsız** ikinci bir beşli rotasyonla dengelenir; anlam kodu sabit kalır. Böylece belirli bir deney koşulunun belirli bir cevap seçeneği konumuyla sistematik olarak eşleşmesi engellenir.

## 6. Koşul karşı-dengelemesi
Her katılımcı beş koşulun her birinde **6 senaryo**, toplam 30 senaryo değerlendirir.

Bir senaryonun koşulu:
`(senaryo_indeksi + katılımcı_ofseti) mod 5`

Katılımcı ofseti K014'ten itibaren beşli döngüyle ilerler. Böylece art arda gelen her beş katılımcıda her senaryo beş koşulun tamamında bir kez görünür. Cevap seçeneklerinin konum rotasyonu ise katılımcı sırasının ikinci, bağımsız beşli döngüsünden türetilir; 25 katılımcılık tam döngüde deneysel koşul grubu × seçenek sırası kombinasyonlarının tamamı oluşur.

## 7. Senaryo sırası
Senaryolar koşul kovaları içinde deterministik olarak karıştırılır. Altı tur boyunca her turda beş koşuldan birer senaryo gösterilir. Tur sınırlarında da aynı koşulun art arda gelmesi engellenir. Böylece uzun koşul serileri oluşmaz.

## 8. Talep özelliğini azaltma
Katılımcı sayfasında “kritik kütle”, “savunucu sayısı”, “eşik”, “akran normu” gibi hipotezi açığa çıkaran ifadeler kullanılmaz. Sayfa adı **Dijital Grup İletişimi Araştırması** olarak tutulur.

Ana 30 senaryo öncesinde iki alıştırma yapılır. Alıştırma yanıtları veri setine kaydedilmez.

10. ve 20. senaryodan sonra nötr kısa ara ekranı gösterilir.

Uygulama sonunda araştırmanın manipülasyonunun fark edilip edilmediğini ölçmek için tek bir farkındalık sorusu sorulur; bu soru birincil sonuca dahil edilmez. Sonrasında katılımcıya kısa debriefing yapılır.

## 9. Gizlilik ve teknik veri
Doğrudan kimlik bilgisi, ses, video, fotoğraf, cihaz kimliği veya fingerprint kaydedilmez.

Kaydedilenler:
- anonim K kodu,
- sınıf düzeyi,
- anonim site/okul kodu,
- kaba cihaz sınıfı: mobile / tablet / desktop,
- senaryo kodu,
- gösterim sırası,
- görünür karşı çıkan akran sayısı,
- toplam akran tepkisi (=4),
- davranış kararı,
- karar süresi,
- uygulama sürümü ve zaman damgası.

## 10. Örneklem hedefi ve ön doğrulama
Ana çalışma için hedef 240 tamamlanmış katılımcıdır; 9, 10, 11 ve 12. sınıfların her birinden 60 katılımcı hedeflenir.

Gerçek ana veri toplamadan önce 30–40 kişilik pilot uygulanmalı ve pilot verisi ana araştırma verisine dahil edilmemelidir.

## 11. Ön doğrulama ve kalite uyarıları
Bu eşikler otomatik dışlama oluşturmaz; yalnız materyal revizyonu için uyarıdır:
- 0/4 koşulunda kamusal karşı çıkma > %70: tavan / sosyal beğenirlik riski,
- 4/4 koşulunda kamusal karşı çıkma < %30: manipülasyon duyarlılığı zayıf olabilir,
- herhangi bir davranış seçeneğinin toplam kullanımı < %2: seçenek işlevi/dili incelenir,
- senaryo genelinde kamusal karşı çıkma > %80 veya < %10: aşırı kolay/zor senaryo olarak incelenir,
- pilot farkındalık sorusunda “diğer akran tepkileri” seçeneği > %70: talep özelliği riski incelenir.

## 12. Veri kalitesi
Ana çalışma sırasında hiçbir kayıt otomatik silinmez.

İnceleme bayrakları:
- 30 senaryodan az yanıt,
- tamamlanmış oturumda toplam karar süresi <150 saniye,
- tamamlanmış oturumda medyan karar süresi <3,5 saniye,
- tamamlanmış oturumda herhangi bir koşulun 6'dan farklı sayıda görünmesi.

Dışlama kriterleri gerçek ana veri toplanmadan önce nihai olarak kilitlenmelidir.

## 13. Uzman değerlendirmesi
Ana çalışmadan önce 3–5 uzmandan her senaryo için şu boyutlarda 1–5 puan alınması hedeflenir:
- gerçekçilik,
- açıklık,
- inciticilik/şiddet düzeyi,
- lise yaşına uygunluk,
- akran tepkilerinin senaryo bağlamına uygunluğu,
- yönlendiricilik riski.

Uzman değerlendirmeleri gerçek uygulama olarak yapılmadan sonuç raporlanmaz.

## 14. Ana çalışma analiz planı
Ana çalışma için birincil analiz:

`public_defend ~ defender_count + grade + device_class + option_order_group + (1 | participant_code) + (1 | scenario_id)`

binom dağılımlı karma etkili lojistik regresyon ile yapılacaktır.

Doğrusal savunucu sayısı modeli, savunucu sayısını kategorik ele alan modelle karşılaştırılacaktır. Gerekirse önceden tanımlı kırılma adayları için parçalı modeller incelenecektir. “Kritik eşik” ifadesi yalnız doğrusal olmayan model desteği ve ardışık koşul karşılaştırmaları birlikte destekliyorsa kullanılacaktır.

## 15. Sürüm kilidi
Ana çalışma v1.0 teknik sürümü hazırdır. Gerçek veri toplama başlamadan önce pilot ve uzman değerlendirmesi tamamlanmalı; ardından senaryolar, seçenekler, dışlama kriterleri ve analiz planı nihai commit kimliğiyle kilitlenmelidir. Ana veri toplama başladıktan sonra materyal değiştirilmemelidir.
