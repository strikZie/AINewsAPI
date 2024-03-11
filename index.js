const PORT = process.env.PORT || 8000
const express = require('express')
const axios = require('axios')
const cheerio = require('cheerio')


const app = express()
app.use('/favicon.ico', express.static('favicon.ico'));
const newspapers = [
    {
        name: 'theguardian',
        address: 'https://www.theguardian.com/technology/artificialintelligenceai?page=',
        elementToTarget: 'a.js-headline-text',
        base: ''
    },
    {
        name: 'bbc',
        address: 'https://www.bbc.com/news/topics/ce1qrvleleqt?page=',
        elementToTarget: 'a.exn3ah91, a.ej9ium92',
        base: 'https://www.bbc.com'
    }
]

const articles = []
const articlesRecent = []


let page = 1
let totalPages = 1




async function scrapeSite(newspaper) {
    page = 1
    totalPages = 1


    while(page <= totalPages) {
        await axios.get(newspaper.address + page)
            .then((response) => {
                console.log('site: ' + newspaper.name +' page: '+newspaper.address + page)


                if(response.request._redirectable._redirectCount === 0){
                    console.log('not redirected')
                    page++
                    totalPages++
                } else {
                    console.log('redirected')
                    totalPages = totalPages-1


                }


                const html = response.data
                const $ = cheerio.load(html)
                console.log($(newspaper.elementToTarget, html).length)
                if($(newspaper.elementToTarget, html).length > 0){
                    $(newspaper.elementToTarget, html).each(function () {

                        const title = $(this).text()
                        const url = $(this).attr('href')



                        articles.push({
                            title,
                            url: newspaper.base + url,
                            source: newspaper.name
                        })


                    })
                } else{
                    console.log("")
                    totalPages = totalPages-1

                }


            }).catch((err) => {
                console.log('ERROR site:' + newspaper.name + ' Page:' + page)
                totalPages = totalPages-1
            })
    }
}

async function ForEachSite(){
    for (let i = 0 ; i < newspapers.length ; i++){
        await scrapeSite(newspapers[i])
    }

}
await ForEachSite().then(r => console.log('succesful scrape')).then(r => console.log('test succes'))





app.get('/', async (req, res) => {
    await ForEachSite().then(r => console.log('succesful scrape')).then(r => res.json('welcome'))



})

//get ai news from all newspapers registered
app.get('/news', (req, res) => {
    res.json(articles)
})

app.get('/news/recent', async (req, res) => {

    const n = 50;
    const articlesNthFromEachSource = [];
    for (let i = 0; i < newspapers.length; i++) {
        const filteredArticles = articles.filter((article, index) => article.source === newspapers[i].name);
        const filteredArticlesNthElements = filteredArticles.filter((article, index) => index < n);
        articlesNthFromEachSource.push(filteredArticlesNthElements)
    }

    res.json(articlesNthFromEachSource)
})

app.get('/news/recent/:articlesToShow', async (req, res) => {
    const articlesToShow = req.params.articlesToShow
    const articlesNthFromEachSource = [];
    for (let i = 0; i < newspapers.length; i++) {
        const filteredArticles = articles.filter((article, index) => article.source === newspapers[i].name);
        const filteredArticlesNthElements = filteredArticles.filter((article, index) => index < articlesToShow);
        articlesNthFromEachSource.push(filteredArticlesNthElements)
    }

    res.json(articlesNthFromEachSource)
})



//get ai news from specific newspaper
app.get('/news/:newsPaperName', (req,res) => {
    const newsPaperName = req.params.newsPaperName

    const newspaperTarget = newspapers.filter(newspaper => newspaper.name === newsPaperName)[0]
    const filteredArticles = articles.filter(article => {
        return article.source === newsPaperName;
    });

    res.json(filteredArticles)


})

app.get('/news/:newsPaperName/recent', (req,res) => {
    const newsPaperName = req.params.newsPaperName

    const newspaperTarget = newspapers.filter(newspaper => newspaper.name === newsPaperName )[0]
    let i = 50;
    const filteredArticles = articles.filter((article, index) => article.source === newspaperTarget.name);
    const filteredArticlesRecent = filteredArticles.filter((article, index) => index < i);
    res.json(filteredArticlesRecent)


})

app.get('/news/:newsPaperName/recent/:articlesToShow', (req,res) => {
    const newsPaperName = req.params.newsPaperName
    const articlesToShow = req.params.articlesToShow

    const newspaperTarget = newspapers.filter(newspaper => newspaper.name === newsPaperName )[0]

    const filteredArticles = articles.filter((article, index) => article.source === newspaperTarget.name);
    const filteredArticlesRecent = filteredArticles.filter((article, index) => index < articlesToShow);
    res.json(filteredArticlesRecent)


})



app.listen(PORT, () => console.log('server running on port ${PORT}'))