import * as https from 'node:https'
import * as fs from 'node:fs/promises'

const url = 'https://api.coinbase.com/v2/prices/ETH-USD/spot'

const request = https.request(url, response => {
  let data = ''
  response.on('data', chunk => {
    data = data + chunk.toString()
  })

  response.on('end', async () => {
    const body = JSON.parse(data)
    const price = body.data.amount
    const output = `${new Date().toISOString()},${price}\n`

    const outputDir = './output'
    await fs.mkdir(outputDir, { recursive: true })
    fs.appendFile(`${outputDir}/prices.csv`, output).catch(err => {
      console.error('Error writing output file', err)
    })
  })
})

request.on('error', error => {
  console.log('Error requesting price data', error)
})

request.end()
