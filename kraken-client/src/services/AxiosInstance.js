import axios from 'axios';

const instance = axios.create({
    baseURL: localStorage.getItem("url") == null ? "http://localhost:5000/api" : localStorage.getItem("url")
});

instance.interceptors.request.use(
    function (config) {
        const token = localStorage.getItem("currentToken");
        if (token !== null)
            config.headers.Authorization = "Bearer " + token;
        return config;
    });

instance.interceptors.response.use(
    function (response) {
        return response;
    },
    function (error) {
        if (error.response != null && error.response.status != null) {
            if (error.response.status === 401 && !error.response.config.url.includes("/authenticate"))
                window.location = '/login'
            if (error.response.status === 412)
                window.location = '/upgrade'
        }
        else {
            error.response = { data: { message: error.message } }
        }
        return Promise.reject(error);
    });

instance.defaults.headers.post['Content-Type'] = 'application/json'
instance.defaults.headers.common['Version'] = '1.0.0'

export default instance;