const puppeteer = require('puppeteer');
const states = require('./states');
const path = require('path');
const fs = require('fs');

let scrape = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://www.mountainproject.com/');

  const crags = await page.evaluate(() => {
    let cragArr = [];
    let cragEls = document.querySelectorAll('#route-guide > div > div > div > div > div > a');
    cragEls.forEach(el => {
      let name = el.textContent;
      if (name[0] === '*') {
        name = name.slice(1);
      }
      let url = el.href;
      let crag = { name, url };
      cragArr.push(crag);
    })
    return cragArr;
  });

  for (let i=0; i<117; i++) {
    await page.goto(crags[i].url);

    const loc = await page.evaluate(() => {
      let stateEl = document.querySelector('.m-b-half.small.text-warm a:nth-child(2)');
      let stateKey = stateEl.innerText.split(' ').join('_');

      let coordEl = document.querySelector('.description-details tbody tr:nth-child(2) td:nth-child(2)');
      let coords = coordEl.innerText.split(' ').slice(0, 2);
      let lat = parseFloat(coords[0].slice(0, -1));
      let lng = parseFloat(coords[1]);

      return { stateKey, lat, lng };
    });

    crags[i].state = states[loc.stateKey];
    crags[i].lat = loc.lat;
    crags[i].lng = loc.lng;
  }

  return crags.slice(0, 117);
  browser.close();
};

scrape().then(result => {
  const filePath = path.join(__dirname, 'crag_data.json');
  fs.writeFileSync(filePath, JSON.stringify(result));
});
