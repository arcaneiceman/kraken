import axios from 'axios';

const instance = axios.create({
    baseURL: process.env.REACT_APP_API_URL
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
instance.defaults.headers.common['Version'] = process.env.REACT_APP_API_VERSION

export default instance;