const axios = require('axios');

const fetchToken = async (url) => {
    console.log("Getting token...")

    let response = await axios(url).catch((err) => console.log(err));
    if (response.status !== 200) {
        console.log("Error occurred while fetching data");
        return;
    }
    return response.data.token;
}

const mainFunc = async () => {
    const login_url = "https://motorway-challenge-api.herokuapp.com/api/login"

    let token = await fetchToken(login_url)
    if (!token) {
        console.log("Invalid token")
        return
    }
    const visits = []
    return new Promise((resolve, reject) => {
        getData(token, visits, resolve, reject)
    })
}
const getData = (token, visits, resolve, reject) => {
    const page = 1
    const visits_url = `https://motorway-challenge-api.herokuapp.com/api/visits?page=${page}&token=${token}`
    axios.get(visits_url).then(res => {
        const data_page = res.data
        const todays_visits = data_page.data
        let retrived_visits = visits.concat(todays_visits)
        const visits_left = (data_page.total - todays_visits.length)/todays_visits.length
        const requests = []
        for (let i = 1; i < visits_left + 1; i++) {
            const req = axios.get(`https://motorway-challenge-api.herokuapp.com/api/visits?page=${page+i}&token=${token}`)
            requests.push(req)
        }
        axios.all(requests).then(res_arr => {
            res_arr.forEach((response) => {
                if (response.status === 200) {
                    const response_data_page = response.data
                    retrived_visits = retrived_visits.concat(response_data_page.data)
                }
            })
            resolve(retrived_visits)
        })
    }).catch(err => {
        console.log(err)
        reject("Error occurred while fetching data")
    })
}

const isWeekend = (d) => {
    return (d.getDay() == 6 || d.getDay() == 0)
}

const processResults = (res) => {
    const today = new Date()
    let final_count = new Map()
    res.forEach((obj) => {
        const date = new Date(obj.date)
        if (today !== date && !isWeekend(date)) {
            const name = obj.name
            if (final_count.has(name)) {
                const new_val = final_count.get(name) + 1
                final_count.set(name, new_val)
            } else {
                final_count.set(name, 1)
            }
        }
    })

    console.log(JSON.stringify([...final_count]))
}

mainFunc().then((res) => {
    processResults(res)
})