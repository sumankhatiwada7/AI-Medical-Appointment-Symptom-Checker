import axios from 'axios';

export const infermedicalApi = axios.create({
    baseURL: "https://api.infermedica.com/v3",
    headers: {
        "App-Id": process.env.INFERMEDICAL_APP_ID,
        "App-Key": process.env.INFERMEDICAL_APP_KEY,
        "Content-Type": "application/json",
    }
});
