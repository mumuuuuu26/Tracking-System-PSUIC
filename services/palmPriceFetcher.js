const axios = require("axios");
const cheerio = require("cheerio");
const dayjs = require("dayjs");

const SOURCE_URL = process.env.PALM_PRICE_SOURCE_URL;
const SOURCE_NAME = process.env.PALM_PRICE_SOURCE_NAME || "External Source";

const toNum = (t = "") => parseFloat(String(t).replace(/[^\d.]+/g, "")) || 0;

const normalizeDate = (d) => {
  const dt = dayjs(d).hour(0).minute(0).second(0).millisecond(0);
  return dt.toDate();
};

async function fetchPalmPrice() {
  if (!SOURCE_URL) throw new Error("PALM_PRICE_SOURCE_URL is not set");

  const { data: html } = await axios.get(SOURCE_URL, { timeout: 15000 });
  const $ = cheerio.load(html);

  // 1) พยายามอ่าน "สรุปบนหัว" (ราคาเฉลี่ย/ต่ำสุด/สูงสุดวันนี้)
  // ถ้าโครงสร้างเว็บต่างจากนี้ จะข้ามไปอ่านจากตารางด้านล่างแทน
  let priceAvg = 0,
    priceMin = 0,
    priceMax = 0;

  // หาตัวเลขจากเนื้อความรวมๆ เผื่อไม่มี selector ชัดเจน
  const bodyText = $("body").text();
  const avgMatch = bodyText.match(/ราคาเฉลี่ย\s*([\d,.]+)/);
  const minMatch = bodyText.match(/ราคาต่ำสุด\s*([\d,.]+)/);
  const maxMatch = bodyText.match(/ราคาสูงสุด\s*([\d,.]+)/);
  if (avgMatch) priceAvg = toNum(avgMatch[1]);
  if (minMatch) priceMin = toNum(minMatch[1]);
  if (maxMatch) priceMax = toNum(maxMatch[1]);

  // 2) ถ้าไม่ได้จากสรุป ลองอ่าน "แถวแรกของตารางย้อนหลัง" (มักเป็นวันที่ล่าสุด)
  if (!(priceAvg && priceMin && priceMax)) {
    let found = false;
    $("table tr").each((i, el) => {
      const tds = $(el).find("td");
      if (tds.length >= 4 && !found) {
        const dateText = $(tds[0]).text().trim(); // คอลัมน์วันที่
        const minText = $(tds[1]).text().trim();
        const maxText = $(tds[2]).text().trim();
        const avgText = $(tds[3]).text().trim();

        const _avg = toNum(avgText),
          _min = toNum(minText),
          _max = toNum(maxText);
        if (_avg && _min && _max) {
          priceAvg = _avg;
          priceMin = _min;
          priceMax = _max;
          found = true;
        }
      }
    });
  }

  // วันอ้างอิง: วันนี้ (ตั้งค่า 00:00:00) — หากเว็บมีวันที่ชัดเจนจะปรับใช้ได้ภายหลัง
  const today = normalizeDate(new Date());

  if (!(priceAvg && priceMin && priceMax)) {
    throw new Error("Cannot parse palm prices from source");
  }

  return {
    date: today,
    priceMin,
    priceAvg,
    priceMax,
    sourceName: SOURCE_NAME,
    sourceUrl: SOURCE_URL,
  };
}

module.exports = { fetchPalmPrice };
