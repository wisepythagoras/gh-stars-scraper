const fs = require('fs');
const puppeteer = require('puppeteer');
const argv = require('minimist')(process.argv.slice(2));

if (!argv['u']) {
    console.log('Specify a username with -u <username>');
    process.exit(1);
}

const user = argv['u'];
const headless = false;
const width = 1680;
const height = 1002;
const rowSelector = '.col-12.d-block.width-full.py-4.border-bottom';
const buttonSelector = 'a.btn.btn-outline.BtnGroup-item:last-child:not(:disabled)';
let items = [];

const handlePage = async page => {
    let i = 1;

    while (true) {
        console.log(`- Page ${i}`);

        // Get the desired links from the page.
        const localItems = await page.$$eval(rowSelector, es => {
            // Here we get all the info possible from each row.
            const linkSelector = '.d-inline-block.mb-1 > h3 > a';
            const descSelector = 'p[itemprop="description"]';

            return es.map(e => {
                let link = e.querySelector(linkSelector);
                let url = 'https://github.com' + link.getAttribute('href');
                let title = link.innerText;
                let descHolder = e.querySelector(descSelector);
                let desc = null;

                if (descHolder) {
                    desc = descHolder.innerText;
                }

                return { url, title, desc };
            })
        });
        items = items.concat(localItems);
        console.log(localItems);
        fs.writeFileSync(`${user}_stars.json`, JSON.stringify(items));

        const nextPage = await page.$x('//a[contains(text(), "Next")]');

        if (!nextPage.length) {
            await browser.close();
            break;
        }

        // Go to the next page.
        await page.click(buttonSelector);
        await page.waitFor(5 * 1000);

        // Increment the page number.
        i++;
    }
};

(async () => {
    const browser = await puppeteer.launch({ headless });
    const page = await browser.newPage();
    await page.goto(`https://github.com/${user}?tab=stars`);
    await page.setViewport({ width, height });
    await handlePage(page);
})();

