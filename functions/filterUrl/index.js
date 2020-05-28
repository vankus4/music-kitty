module.exports = function (url) { // input is whatever user inputs and the output is a video link and a timestamp
    if (!url.includes("?")) return [url, 0]
    let parameterString = url.split("?")[1]
    url = url.split("?")[0]

    let parameters = parameterString.split("&")
    let parameterMap = {}
    parameters.forEach(parameter => {
        parameterMap[parameter.split("=")[0]] = parameter.split("=")[1]
    });
    let timestamp = 0
    if (parameterMap.t) timestamp = parseTime(parameterMap.t)
    if (parameterMap.v) url = "https://youtu.be/" + parameterMap.v
    return [url, timestamp]
}

function parseTime(tRaw) {
    let timestamp = 0
    if (tRaw.includes("m")) {
        timestamp += parseInt(tRaw.split("m")[0]) * 60
        tRaw = tRaw.split("m")[1]
    }
    if (tRaw.includes("s")) {
        timestamp += parseInt(tRaw.split("s")[0])
        tRaw = tRaw.split("s")[1]
    }
    if (tRaw) timestamp += parseInt(tRaw)
    return timestamp
}