const PORT = process.env.PORT || 8000
const express = require('express')
const axios = require('axios')
const cheerio = require('cheerio')

const app = express()

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
    },
    {
        name: 'mit',
        address: 'https://news.mit.edu/topic/artificial-intelligence2?page=',
        elementToTarget: 'a.term-page--news-article--item--title--link',
        base: 'https://news.mit.edu'
    },
    {
        name: 'wired',
        address: 'https://www.wired.com/tag/artificial-intelligence/?page=',
        elementToTarget: 'a.ejgyuy',
        base: 'https://www.wired.com'
    },
    /* fix later
    {
        name: 'financial-times',
        address: 'https://www.ft.com/artificial-intelligence?page=',
        elementToTarget: 'a.js-teaser-heading-link',
        base: 'https://www.ft.com'
    }, */
    {
        name: 'dailymail',
        address: 'https://www.dailymail.co.uk/sciencetech/ai/index.html?page=',
        elementToTarget: 'h2.linkro-darkred a',
        base: ''
    },
    /* fix later
    {
        name: 'independent',
        address: 'https://www.independent.co.uk/topic/ai',
        elementToTarget: 'a.title',
        base: 'https://www.independent.co.uk'
    },*/
    {
        name: 'foxbusiness',
        address: 'https://www.foxbusiness.com/category/artificial-intelligence?page=',
        elementToTarget: 'h3.title a',
        base: 'https://www.foxbusiness.com'
    },
    /* fix later
    {
        name: 'cbsnews',
        address: 'https://www.cbsnews.com/tag/artificial-intelligence/',
        elementToTarget: 'a.item__anchor',
        base: ''
    }*/
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
                    console.log('test1')
                    page++
                    totalPages++
                } else {
                    console.log('test')
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

ForEachSite()





app.get('/', (req, res) => {
    res.json('welcome')

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