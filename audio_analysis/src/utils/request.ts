import axios from 'axios'
import { layer } from '@layui/layui-vue'
// import { baseUrl, pathUrl } from './env'
// import Qs from 'qs'
// import { Message } from 'element-ui'
// import { setLocalStorage, getLocalStorage } from '@/utils/utils'
// import logonApi from '../api/logon'

const instance = axios.create({
    baseURL: 'http://localhost:8081',
    timeout: 60000,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
})
// http request 请求拦截器
instance.interceptors.request.use(
    config => {
        // config.headers.AcceptLanguage = getLocalStorage("locale");
        if (localStorage.jwtToken) {
            // config.headers.Authorization = getLocalStorage("jwtToken");
        }
        // console.log('config', config);
        return config
    },
    err => {
        return Promise.reject(err)
    }
)
// http response 响应拦截器
instance.interceptors.response.use(
    response => {
        // console.log('response', response);
        return handleData(response.data)
    },
    error => {
        if (error.response.data.status === 500 && (error.response.data.message === 'token out time' || error.response.data.message === '登录失败或未登录')) {
            // logonApi.signOut();
            // window.location.href = baseUrl.url1;
            // setLocalStorage('jwtToken');
            // window.location.href = baseUrl.url1;
        }
        let err = error.response.data.message;
        if (err != '' && err != null && err != undefined) {
            layer.msg(error.response.data.message)
            return Promise.reject(error.response.data)
        } else {
            layer.msg('HTTP：服务器遇到错误，无法完成请求。')
        }
    })

// 生成新的url
function generateUrl(url: string): string {
    return 'http://localhost:8081' + url;
}

// 二次封装方法
const get = async (url: string, data?: any): Promise<any> => {
    let newurl = generateUrl(url);
    if (data) {
        newurl += '/'
        newurl += data
        // for (let i in data) {
        //     if (data[i] !== '' && data[i] !== null) {
        //         newurl += i + '=' + data[i] + '&'
        //     }
        // }
        // newurl = newurl.toString().substring(0, newurl.length - 1)
    }
    try {
        console.log('newurl', newurl);
        return await instance.get(newurl);
    } catch (error) {
        return handleError(error);
    }
}

const post = async (url: string, data: any) => {
    try {
        return await instance.post(generateUrl(url), data);
    } catch (error) {
        return handleError(error);
    }
}

// const delete = async (url: string, data: any) => {
//     try {
//         return await instance
//             .delete(generateUrl(url), data);
//     } catch (error) {
//         return handleError(error);
//     }
// }

const postJSON = async (url: string, data: any) => {
    // data = Qs.stringify(data);
    try {
        return await instance
            .post(generateUrl(url), data);
    } catch (error) {
        return handleError(error);
    }
}

const patch = async (url: string, data: any) => {
    try {
        return await instance
            .patch(generateUrl(url), data);
    } catch (error) {
        return handleError(error);
    }
}

const postFile = async (url: string, data: any, config: any) => {
    try {
        return await instance
            .post(generateUrl(url), data, config);
    } catch (error) {
        return handleError(error);
    }
}

// 捕获请求错误
function handleError(error: any) {
    // Promise.reject(error)
    return error
}

// 处理数据
function handleData(data: any) {
    if (data.hasOwnProperty('ret')) {
        if (data.ret !== null && data.ret.hasOwnProperty('token')) {
            // setLocalStorage('jwtToken', data.ret.token);
        }
    }
    if (data.errcode !== 0) {
        layer.msg(data.errmsg)
    }
    if (data.errcode === 200 && data.errmsg === "权限鉴定失败") {
        // setLocalStorage('jwtToken');
        // window.location.href = baseUrl.url1;
    }
    if (data.errcode === 300) { // token超时后 前端处理
        // setLocalStorage('jwtToken');
        // window.location.href = baseUrl.url1;
    }
    return data
}

const Request = {
    postFile,
    postJSON,
    post,
    get,
    // delete,
    patch
}

export default Request

