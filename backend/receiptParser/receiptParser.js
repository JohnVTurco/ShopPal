const { Configuration, OpenAIApi } = require("openai");
const Tesseract =  require('tesseract.js');
require("dotenv").config();

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const parseReceipt = async (fileName) => {
    const receiptImagePath = './receiptParser/' + fileName;

    // Parse receipt using Tesseract
    const text = (await Tesseract.recognize(receiptImagePath, 'eng')).data.text;

    // Parses receipt using OpenAI api
    const response = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt: `Parse this receipt and return the store name, address, name and price of each item, 
        and total as a JavaScript JSON object. Do not include any extra information or characters in the JSON.
        Make the store name match up to an existing store.
        Do not include the subtotal, tax, cashtend, or changegiven. If you are unsure about any of the properties, set it to 
        "unknown". Do not combine items with the same name. If you are unsure about the price, set it to 0.00.
        If the text is not a receipt set the "storeName" and "address" to "unknown" and set "items" to an empty array. 
        Always return the results as an object wrapped in curly brackets.
        Text: ${text}`,
        temperature: 0,
        max_tokens: 2048,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
    });

    const items = response.data.choices[0].text;

    return items;
}

module.exports = parseReceipt;
