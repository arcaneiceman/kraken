import jwt_decode from 'jwt-decode'
import axios from './AxiosInstance'

const register = (name, email, password, confirmPassword, recaptchaResponse) => {
    const data = { name, email, password, confirmPassword, recaptchaResponse}
    return axios.post('/account/register', data)
}

const resendActivationEmail = (email) => {
    const data = { email }
    return axios.post('/account/resend-activation-email', data)
}

const activate = (email, activationKey) => {
    const data = { email, activationKey }
    return axios.post('/account/activate/', data)
        .then(response => { setToken(response.data.token) })
}

const authenticate = (email, password, recaptchaResponse) => {
    const data = { email, password, recaptchaResponse }
    return axios.post('/account/authenticate', data)
        .then(response => { setToken(response.data.token) })
}

const socialAuthenticate = (provider, accessToken) => {
    const data = { provider, accessToken }
    return axios.post('/account/social-authenticate', data)
        .then(response => { setToken(response.data.token) })
}

const isLoggedIn = () => {
    const token = localStorage.getItem('currentToken');
    const user = localStorage.getItem('currentUser');
    const exp = localStorage.getItem('currentExp');
    if (token !== null && user !== null && exp !== null && new Date() < new Date(Number.parseInt(exp) * 1000))
        return true;
    else
        return false;
}

const logout = () => {
    clearInterval(refreshTimer)
    return axios.post('/account/logout')
        .finally(() => {
            localStorage.removeItem('currentToken')
            localStorage.removeItem('currentUser')
            localStorage.removeItem('currentExp')
            deactivateAuthRefresh()
        })
}

const requestNewPassword = (email) => {
    const data = { email }
    return axios.post('/account/request-new-password', data)
}

const changePassword = (oldPassword, newPassword, newConfirmPassword) => {
    const data = { oldPassword, newPassword, newConfirmPassword }
    return axios.post('/account/change-password', data)
}

const activeAuthRefresh = () => {
    if (refreshTimer != null)
        return; // Refresh Timer Already Set
    refreshTimer = setInterval(refresh, 90000)
}

const deactivateAuthRefresh = () => {
    clearInterval(refreshTimer);
    refreshTimer = null;
}

const setToken = (token) => {
    localStorage.setItem('currentToken', token)
    let decodedToken = jwt_decode(token);
    localStorage.setItem('currentUser', decodedToken.sub)
    localStorage.setItem('currentExp', decodedToken.exp)
}

const getToken = () => {
    return localStorage.getItem("currentToken");
}

// Private Functions
const refresh = () => {
    axios.post('/account/refresh')
        .then(response => {
            setToken(response.data.token)
        })
}

let refreshTimer = null

const AuthenticationService = {
    // Functions
    register,
    resendActivationEmail,
    activate,
    authenticate,
    socialAuthenticate,
    isLoggedIn,
    logout,
    requestNewPassword,
    changePassword,
    activeAuthRefresh,
    deactivateAuthRefresh,
    setToken,
    getToken,

    // Timer
    refreshTimer
}

export default AuthenticationService;

