const API_KEY = '4f2f9814c28b4036ad500721230204' 

function dataProcessing(){

    function processWeatherData(data){
        const undefinedFallback = "unknown";
        let formattedData = {
            'locationData':{
                'country':data.location.country||undefinedFallback,
                'city':data.location.name||undefinedFallback
            },
            'time':data.location.localtime||"",
            'weatherData':{
                'name':data.current.condition.text||undefinedFallback,
                'tempC':data.current.temp_c + "℃"||undefinedFallback,
                'tempF':data.current.temp_f + '℉'||undefinedFallback,
                'feelsLikeC':data.current.feelslike_c + "℃"||undefinedFallback,
                'feelsLikeF':data.current.feelslike_f + '℉'||undefinedFallback,
                'pressure':data.current.pressure_mb||undefinedFallback,
                'humidity':data.current.humidity||undefinedFallback,
            },
            'airQuality':{
                'co':data.current.air_quality.co? data.current.air_quality.co.toFixed(2):undefinedFallback,
                'no2':data.current.air_quality.no2? data.current.air_quality.no2.toFixed(2):undefinedFallback,
                'o3':data.current.air_quality.o3? data.current.air_quality.o3.toFixed(2):undefinedFallback,
                'pm10':data.current.air_quality.pm10? data.current.air_quality.pm10.toFixed(2):undefinedFallback,
                'pm2':data.current.air_quality.pm2_5? data.current.air_quality.pm2_5.toFixed(2):undefinedFallback,
                'so2':data.current.air_quality.so2? data.current.air_quality.so2.toFixed(2):undefinedFallback,
            },
            'is_day':(data.current.is_day === 0 || data.current.is_day === 1) ? data.current.is_day:1,
            'wind':{
              'wind':data.current.wind_kph || undefinedFallback,  
              'wind_dir':data.current.wind_dir ||undefinedFallback, 
              'wind_degree':data.current.wind_degree || undefinedFallback, 
              'gust_kph':data.current.gust_kph || undefinedFallback, 
              'uv':data.current.uv || undefinedFallback, 
            }
        }
        return formattedData
    }
    function processForecast(data,isHourly){
        const forecast = [... data.forecast.forecastday];
        let forecastData = [];
        let hourlyData = [];
        for(day of forecast){
            forecastData.push(
                {
                date: new Date(day.date),
                maxTemp:day.day.maxtemp_c,
                minTemp:day.day.mintemp_c,
                chanceOfRain:day.day.daily_chance_of_rain,
                description:day.day.condition.text,
                icon:day.day.condition.icon,
                }
            )
        }
            if(isHourly){
                for(let i=0;i<23;i++){                    
                    hourlyData.push(
                        {
                            date: new Date(day.date),
                            time: new Date(day.hour[i].time),
                            temp: day.hour[i].temp_c,
                            chanceOfRain: day.hour[i].chance_of_rain,
                        }
                    )
                }
            }
            return {forecastData,hourlyData};
        }
    
    function isHot(temp){
        temp = temp.slice(0, -1); 
        if(temp < 15){
            return false;
        }
        return true;
    }
    return{processWeatherData, processForecast, isHot}
}
function Fetching(processing){
    async function fetchCurrentData(location){
       try{
            let response = await fetch(`https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${location}&aqi=yes`, {mode: 'cors'});
            let data = await response.json();
            data = processing.processWeatherData(data);
            return data;
       }catch(err){
        console.error(err);
       }
    }
    async function fetchForecast(location,isHourly){
        try{
             let response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${location}&days=3&aqi=yes`, {mode: 'cors'});
             let data = await response.json();
             data = processing.processForecast(data,isHourly);
             return data;
        }catch(err){
            console.error(err);
        }
     }
    
    async function fetchLocations(query){
        if(query.length > 2){
            try{
                let response = await fetch(`https://api.weatherapi.com/v1/search.json?key=${API_KEY}&q=${query}`, {mode: 'cors'});
                let data = await response.json();
                console.log(data);
        }catch(err){
            console.error(err);
        }
        }
    }
   
    return{fetchCurrentData,fetchForecast,fetchLocations,processing}
}

function Ui(fetching){

    const ui= {
        'city':document.getElementById('city'),
        'country':document.getElementById('country'),
        'temperature':document.getElementById('temperature'),
        'feels_like':document.getElementById('temperature_feels_like'),
        'pressure':document.getElementById('pressure'),
        'humidity':document.getElementById('humidity'),
        'airQuality':{
            'pm10':document.getElementById('pm10'),
            'pm2':document.getElementById('pm2'),
            'co':document.getElementById('co'),
            'no2':document.getElementById('no2'),
            'o3':document.getElementById('o3'),
            'so2':document.getElementById('so2'),
        },
        'wind':{
            'wind_speed':document.getElementById('wind_speed'),
            'wind_dir':document.getElementById('wind_dir'),
            'gust':document.getElementById('gust_speed'),
            'uv':document.getElementById('uv'),
        }
    }
    initUi();
    const button = document.getElementById('search');
    const input = document.querySelector('input');
    //input.addEventListener('keyup',()=>{fetching.fetchLocations(input.value)})
    input.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            updateUI(fetching.fetchCurrentData(input.value));
            updateForecast(fetching.fetchForecast(input.value,isHourly()));
        }
    })
    button.addEventListener('click',()=>{
        updateUI(fetching.fetchCurrentData(input.value));
        updateForecast(fetching.fetchForecast(input.value,isHourly()));
    })

    async function initUi(){     

        const options = {
            enableHighAccuracy: true,
            maximumAge: 0,
        };

        async function success(pos) {
            const crd = pos.coords;
            updateUI(await fetching.fetchCurrentData(crd.latitude+","+crd.longitude))
            updateForecast(await fetching.fetchForecast(crd.latitude+","+crd.longitude))
        }
          
        function error(err) {
            console.warn(`ERROR(${err.code}): ${err.message}`);
            updateUI(fetching.fetchCurrentData('London'));
            updateForecast(fetching.fetchForecast('London'));
        }

        navigator.geolocation.getCurrentPosition(success, error, options);

    }

    async function updateUI(inputData){
        let data = await inputData;
        changeBackground(data.is_day,fetching.processing.isHot(data.weatherData.tempC));
        ui.city.innerText = data.locationData.city ;
        ui.country.innerText = data.locationData.country ;
    
        ui.temperature.innerText = data.weatherData.tempC + " " + data.weatherData.name;
        ui.feels_like.innerText = data.weatherData.feelsLikeC ;
        ui.pressure.innerText = data.weatherData.pressure ;
        ui.humidity.innerText = data.weatherData.humidity ;
    
        ui.airQuality.pm10.innerText = data.airQuality.pm10;
        ui.airQuality.pm2.innerText = data.airQuality.pm2;
        ui.airQuality.co.innerText = data.airQuality.co;
        ui.airQuality.no2.innerText = data.airQuality.no2;
        ui.airQuality.o3.innerText = data.airQuality.o3;
        ui.airQuality.so2.innerText = data.airQuality.so2;
    
        ui.wind.wind_speed.innerText = data.wind.wind;
        ui.wind.wind_dir.innerText = data.wind.wind_dir;
        ui.wind.gust.innerText = data.wind.gust_kph;
        ui.wind.uv.innerText = data.wind.uv;
    }

    async function changeBackground(isDay, isHot){
        const colors = {
            night:{
                cold:'#00214F',
                hot:'#4F092C',
            },
            day:{
                cold:'#CCE1FF',
                hot:'#FFEECC',
            }
        }
        const img = {
            night:{
                cold:'img/coldnight.png',
                hot:'img/hotnight.png',
            },
            day:{
                cold:'img/coldday.png',
                hot:'img/hotday.png',
            }
        }
        let currentColor;
        let currenImg;
        if(!isDay){
            currentColor=colors.night
            currenImg=img.night
        }
        else{
            currentColor=colors.day
            currenImg=img.day
        }
        if(isHot){
            currentColor=currentColor.hot
            currenImg=currenImg.hot
        }
        else{
            currentColor=currentColor.cold
            currenImg=currenImg.cold
        }
        document.documentElement.style.setProperty('--bg-color', currentColor);
        document.documentElement.style.setProperty('--bg-img', `url('${currenImg}')`);
    }
    async function updateForecast(inputData){
        const forecastContainer = document.querySelector('.forecast');
        const loader = document.querySelector('.loader');
        loader.classList = 'loader';
        document.querySelectorAll('.forecast-element').forEach(el => {
            forecastContainer.removeChild(el)
          })
        let data = await inputData;
        if(isHourly()){
            for(let i=0;i<23;i++){
                let dateText = document.createElement('p');
                let timeText = document.createElement('p');
                let tempText = document.createElement('p');
                let rainText = document.createElement('p');
                dateText.innerText = data.hourlyData[i].date.toLocaleDateString("en-GB", { day: 'numeric', month: 'long', year: 'numeric' });
                timeText.innerText = data.hourlyData[i].time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
                tempText.innerText = data.hourlyData[i].temp + '°C';
                rainText.innerText = data.hourlyData[i].chanceOfRain + '% chance of rain';

                let elementContainer = document.createElement('div');
                elementContainer.classList = 'forecast-element';
                elementContainer.appendChild(dateText);
                elementContainer.appendChild(timeText);
                elementContainer.appendChild(tempText);
                elementContainer.appendChild(rainText);
                forecastContainer.appendChild(elementContainer);          
            }

        }
        else{
            for(day of data.forecastData){
                let dateText = document.createElement('p');
                let maxTemp = document.createElement('p');
                let minTemp = document.createElement('p');
                let chanceOfRain = document.createElement('p');
                let description = document.createElement('p');
                let icon = document.createElement('img');
                dateText.innerText = day.date.toLocaleDateString("en-GB", { day: 'numeric', month: 'long', year: 'numeric' });
                icon.src = 'https:'+ day.icon;
                description.innerText = day.description;
                maxTemp.innerText = day.maxTemp + '°C';
                minTemp.innerText = day.minTemp + '°C';
                chanceOfRain.innerText = day.chanceOfRain + '% chance of rain';
                let elementContainer = document.createElement('div');
                let temperatureContainer = document.createElement('div');
                let temperatureIconContainer = document.createElement('div');
                temperatureIconContainer.classList = 'forecast-temperature-mini';
                elementContainer.classList = 'forecast-element';
                
                temperatureContainer.appendChild(maxTemp);
                temperatureContainer.appendChild(minTemp);

                temperatureIconContainer.appendChild(icon);
                temperatureIconContainer.appendChild(temperatureContainer);

                elementContainer.appendChild(dateText);
                elementContainer.appendChild(temperatureIconContainer);
                elementContainer.appendChild(description);
                elementContainer.appendChild(chanceOfRain);
                forecastContainer.appendChild(elementContainer);
            }
        }
        loader.classList += ' smooth-hide'; 
    }
    function isHourly(){
        //check from ui if checkbox or sth
        return false;
    }
    
    return {updateUI,updateForecast}
}

//main
const process = dataProcessing();
const fetching = Fetching(process);
const ui = Ui(fetching);

/* TO DO
* add popup for city search suggestions (when typing)
* 3 days to hourly forecast switch:
    - a button/checkbox to do that
    - styling and pagination so there is no more than 5 flex items at a time
    - arrows to scroll pages
* maybe animated loaders for every box
*/