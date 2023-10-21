// Gerekli modulleri koda dahil edelim
const axios = require('axios') // HTTP sorguları icin
const cheerio = require('cheerio') // HTML ayıklama icin
const { children } = require('cheerio/lib/api/traversing')
const express = require('express') // Web uygulama frameworku

const veriTurleri = [ // tablo sütunları
    'Siralama',
    'Isim',
    'Fiyat',
    '1SaatlikDegisim',
    '24SaatlikDegisim',
    '7GunlukDegisim',
    'PazarBuyuklugu',
    '24SaatlikHacim',
    'TedavuldekiMiktar'
]

// Fiyat toplayici metod
async function fiyatVerisiniTopla() {
    try {
        const coinBilgileri = []
        const siteUrl = 'https://coinmarketcap.com/' // veriyi cekecegimiz site

        // Axios ile GET sorgusu atıyoruz
        const { data } = await axios({ // dönen objenin 'data' objesini alıyoruz
            method: "GET",
            url: siteUrl,
        }) 

        const $ = cheerio.load(data) // ayıklama aracımıza HTML textini veriyoruz
        const elemSecici = '#__next > div.sc-faa5ca00-1.cKgcaj.global-layout-v2 > div.main-content > div.cmc-body-wrapper > div > div:nth-child(1) > div.sc-66133f36-2.cgmess > table > tbody > tr'

        $(elemSecici).each((ustIndex, ustElem) => { // belirttigimiz secici referansı ile tüm elementleri dolasiyoruz
            let veriTuruIndeksi = 0;
            const coinBilgisi = {} // her coin icin bilgi objesi oluşturuyoruz

            if (ustIndex < 10) { // ilk 10 coin e bakalım
                $(ustElem).children().each((altIndex, altElem) => { // her alt element icin donguye giriyoruz
                    let tdDegeri = $(altElem).text() // alt elementin texti yani veri degeri
                    
                    if (veriTuruIndeksi === 6) // PazarBuyuklugu 2. span degerini alalım
                    {
                        tdDegeri = $('span:nth-child(2)', $(altElem).html()).text()
                    }
                    else if (veriTuruIndeksi === 7) // 24SaatlikHacim 1. a degerini alalım
                    {
                        tdDegeri = $('a:nth-child(1)', $(altElem).html()).text()
                    }

                    if (tdDegeri) { // eger boş değilse coin objesine ekliyoruz
                        coinBilgisi[veriTurleri[veriTuruIndeksi]] = tdDegeri
                        veriTuruIndeksi++
                    }
                })
                coinBilgileri.push(coinBilgisi)
            }
        })
        return coinBilgileri
    } catch (hata){
        console.error(hata) // olası hata durumunda console a yazdırıyoruz
    }
}

const app = express() // web uygulamamızı tanımlayalım.

app.get('/api/coin-fiyat', async (req, res) => { // api url ine get sorgusunda yapılacakları belirtelim
    try {
        const coinFiyatlari = await fiyatVerisiniTopla()

        return res.status(200).json({
            result: coinFiyatlari // coin fiyatlarını json olarak gösteriyoruz.
        })
    }
    catch (hata){
        return res.status(500).json({
            err: hata.toString(),
        })
    }
})

app.listen(3000, () => { // uygulamayı port 3000 üzeride dinlemeye alıyoruz
    console.log("web uygulaması port 3000 üzerinde calisiyor..")
})