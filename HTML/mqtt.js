/*

public broker and topic you can use for testing.

	var MQTTbroker = 'broker.mqttdashboard.com';
	var MQTTport = 8000;
	var MQTTsubTopic = 'dcsquare/cubes/#'; //works with wildcard # and + topics dynamically now

*/

//settings BEGIN
var MQTTbroker = 'broker.hivemq.com';
var MQTTport = 8000;
var MQTTsubTopic = 'BQ/txt/'; //works with wildcard # and + topics dynamically now
var temp_topic = "BQ/sensors/ctemperature";
var humi_topic = "BQ/sensors/humidity";
var klima_status_topic = "klima";
var txt_topic = "BQ/txt"
var retain_flag = true;

var user_name = "tksola";
var pass = "tksola2021";
//settings END

var chart; // global variuable for chart
var dataTopics = new Array();

//mqtt broker
var client = new Paho.MQTT.Client(MQTTbroker, MQTTport,
            "myclientid_" + parseInt(Math.random() * 100, 10));
client.onMessageArrived = onMessageArrived;
client.onConnectionLost = onConnectionLost;
//connect to broker is at the bottom of the init() function !!!!


//mqtt connecton options including the mqtt broker subscriptions
var options = {
    timeout: 3,
    onSuccess: function () {
        console.log("mqtt connected");
        // Connection succeeded; subscribe to our topics
        client.subscribe(MQTTsubTopic, {qos: 1});
        client.subscribe(temp_topic, {qos: 1});
        client.subscribe(humi_topic, {qos: 1});
        client.subscribe(klima_status_topic, {qos: 1});
    },
    onFailure: function (message) {
        console.log("Connection failed, ERROR: " + message.errorMessage);
        //window.setTimeout(location.reload(),20000); //wait 20seconds before trying to connect again.
    }
};

//can be used to reconnect on connection lost
function onConnectionLost(responseObject) {
    console.log("connection lost: " + responseObject.errorMessage);
    //window.setTimeout(location.reload(),20000); //wait 20seconds before trying to connect again.
};


function klima_switch(){
    if(current_state_of_klima == 0){
        send_message('1', 0, 'klima');
    }else{
        send_message('0', 0, 'klima');
    }
}

function send_message(msg, pqos, topic){
    if (pqos>2)
        pqos=0;

    console.log(msg);

    message = new Paho.MQTT.Message(msg);
    if (topic=="")
        message.destinationName = "test-topic";
    else
        message.destinationName = topic;
    message.qos=pqos;
    message.retained=retain_flag;
    client.send(message);
    return false;
}

//what is done when a message arrives from the broker
function onMessageArrived(message) {


    console.log(message.destinationName, '',message.payloadString);

    if(message.destinationName === temp_topic){
        document.getElementById("temperature").innerHTML ="";
        document.getElementById("temperature").innerHTML+=message.payloadString;
    }
    if(message.destinationName === humi_topic){
        document.getElementById("humidity").innerHTML ="";
        document.getElementById("humidity").innerHTML+=message.payloadString;
    }

    if(message.destinationName === txt_topic){
        document.getElementById("txt").innerHTML ="";
        document.getElementById("txt").innerHTML+=message.payloadString;
    }

    if(message.destinationName === klima_status_topic){
        /*
        document.getElementById("klima").innerHTML ="";
        document.getElementById("klima").innerHTML+=message.payloadString;
        */
       if(message.payloadString === "1"){
        current_state_of_klima = 1;
        document.getElementById("pub").value = "IZKLOPI KLIMO";
		var svgItem = document.getElementById("krog");
		//Set the colour to something else
		svgItem.setAttribute("src","FANO.png");
        //document.getElementById("klima").classList.remove("dot_off")
        //document.getElementById("klima").classList.add("dot_on")
       }else{
        current_state_of_klima = 0;
        document.getElementById("pub").value = "VKLOPI KLIMO";
        // Get one of the SVG items by ID;
        var svgItem = document.getElementById("krog");
        // Set the colour to something else
        svgItem.setAttribute("src","FAN.png");

        //document.getElementById("klima").classList.remove("dot_on")
        //document.getElementById("klima").classList.add("dot_off")
       }
    }



    //check if it is a new topic, if not add it to the array
    if (dataTopics.indexOf(message.destinationName) < 0){

        dataTopics.push(message.destinationName); //add new topic to array
        var y = dataTopics.indexOf(message.destinationName); //get the index no

        //create new data series for the chart
        var newseries = {
                id: y,
                name: message.destinationName,
                data: []
                };

        chart.addSeries(newseries); //add the series

        };

    var y = dataTopics.indexOf(message.destinationName); //get the index no of the topic from the array
    var myEpoch = new Date().getTime(); //get current epoch time
    var thenum = message.payloadString.replace( /^\D+/g, ''); //remove any text spaces from the message
    var plotMqtt = [myEpoch, Number(thenum)]; //create the array
    if (isNumber(thenum)) { //check if it is a real number and not text
        console.log('is a propper number, will send to chart.')
        plot(plotMqtt, y);	//send it to the plot function
    };
};

//check if a real number
function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

//function that is called once the document has loaded
function init() {

    //i find i have to set this to false if i have trouble with timezones.
    Highcharts.setOptions({
        global: {
            useUTC: false
        }
    });

    // Connect to MQTT broker
    options.userName=user_name;
    options.password=pass;
    client.connect(options);

};


//this adds the plots to the chart
function plot(point, chartno) {
    console.log(point);

        var series = chart.series[0],
            shift = series.data.length > 20; // shift if the series is
                                             // longer than 20
        // add the point
        chart.series[chartno].addPoint(point, true, shift);

};

//settings for the chart
$(document).ready(function() {
    chart = new Highcharts.Chart({
        chart: {
            renderTo: 'container',
            defaultSeriesType: 'spline'
        },
        title: {
            text: 'Graf izmerjene temperature v prostoru'
        },
        subtitle: {
                            text: 'broker: ' + MQTTbroker + ' | port: ' + MQTTport + ' | topic : ' + MQTTsubTopic
                    },
        xAxis: {
            type: 'datetime',
            tickPixelInterval: 150,
            maxZoom: 20 * 1000
        },
        yAxis: {
            minPadding: 0.2,
            maxPadding: 0.2,
            title: {
                text: 'Vrednosti',
                margin: 80
            }
        },
        series: []
    });
});


var moj_gumb = document.getElementById('gumb');
const moja_slika = document.getElementById("slika");

moj_gumb.addEventListener("click",function())
{
  var atributSlike = moja_slika.getAtribute("src");
  if(atributSlike == "FAN.png")
  {
    moja_slika.setAttribute("src","FANO.png");
  }
  else
  {
    moja_slika.setAttribute("src","FAN.png");
  }
}
