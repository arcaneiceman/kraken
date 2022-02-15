import axios from './AxiosInstance'

const getPasswordLists = () => {
    return axios.get('/password-list')
}

const PasswordListService = {
    getPasswordLists
}

export default PasswordListService;