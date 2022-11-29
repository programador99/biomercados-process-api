const { Axios } = require('axios');
import https from 'https';

const axios = new Axios({
    baseURL: process.env.BASE_URL_API_MAGENTO,
    httpsAgent: https.Agent({
        rejectUnauthorized: false
    }),
    headers:{
    "Authorization": `Bearer ${process.env.BASE_BEARER_TOKEN_MAGENTO}`,
    "Content-Type": "application/json",
  }
});

const httpGet = async (url) => {
  const {data} = await axios.get(url);
  return JSON.parse(data);
}

const httpPost = async (url, payload) => {
  const {data} = await axios.post(url, payload);
  return JSON.parse(data);
}

const httpPut = async (url, payload) => {
  const {data} = await axios.put(url, payload);
  return JSON.parse(data);
}

const httpDelete = async (url) => {
  const {data} = await axios.delete(url);
  return JSON.parse(data);
}

module.exports = { httpGet, httpPost, httpPut, httpDelete };
