let url = "https://youtu.be/NC6URDtq0xk?t=25 mačka"
let parameter = url.substring(url.indexOf("t=")).split(" ")[0]
let timestamp = parameter.substring(2)

url = url.replace(parameter, "")

//console.log(url)
//console.log(timestamp)