// i suck at variable naming
// don't worry we all do
// heh

let clickAmount = [];
let deviations = [];
let timeDiff = [];

let isTestRunning = false;
let clickLimit;
let timeLimit;
let key1;
let key2;
let method;

let updater;
let endTimer;
let std;
let isMouseEnabled;
let variance;
let unstableRate;
let beginTime = -1;

let xVal = 0;
let yVal = 0;
let updateInterval = 100;
let dataLength = 50;
let runNumber = 0;
let counterNumber = 0;
let baseData = {
    type: "spline",
    dataPoints: []
};

$(document).ready(function () {
    $('#start').click(function () {
        if(isTestRunning == false){ // checks if the test is running, used to prevent bugs such as timer going up to absurd numbers
            if (parseInt($('#clickOrTimeAmount').val()) < 5) { // checks if the max clicks / time is less than 5
                alert("Please enter a value larger than 5");
                return false;
            }
            else if (($('#key1').val().length > 1) || ($('#key2').val().length > 1)) { // checks if there is more than one character in the input field
                alert("Please only enter a single character");
                return false;
            }
            else {
                $('#status').html('The test is ready, press either one of the keys or enter to start it!')
                $('html, body').animate({
                    scrollTop: $("#resultsAnchor").offset().top
                }, 500); // scroll to the bottom
                InitTest(); // initialize the test
            }
        }
    });

    $('#retry').click(function(){
            if (parseInt($('#clickOrTimeAmount').val()) < 5) { // checks if the max clicks / time is less than 5
                alert("Please enter a value larger than 5");
                return false;
            }
            else if (($('#key1').val().length > 1) || ($('#key2').val().length > 1)) { // checks if there is more than one character in the input field
                alert("Please only enter a single character");
                return false;
            }
            else {
                $('#status').html('The test is ready, press either one of the keys or enter to start it!')
                $('html, body').animate({
                    scrollTop: $("#resultsAnchor").offset().top
                }, 500); // scroll to the bottom
                InitTest(); // initialize the test
            }
    });

    $("#chartContainer").CanvasJSChart({ // setup the chart
        zoomEnabled: true,
        exportEnabled: true,
        title: {
        },
        axisY: {
            title: "BPM",
            includeZero: false
        },
        axisX: {
        },
        data: [
            {
                type: "spline",
                dataPoints: []
            }
        ]
    });

});

function InitTest() {
    switch ($('#method').val()) {
        case 'time':
            method = 'time';
            timeLimit = parseInt($('#clickOrTimeAmount').val());
            break;
        case 'clicks':
            method = 'clicks';
            clickLimit = parseInt($('#clickOrTimeAmount').val());
            break;
    }
    isTestRunning = true;
    clickAmount.length = 0;    
    deviations.length = 0;
    timeDiff.length = 0;
    counterNumber = 0;
    unstableRate = 0;    
    beginTime = -1;
    std = 0;    
    key1 = $('#key1').val().toLowerCase();
    key2 = $('#key2').val().toLowerCase();
    window.clearInterval(endTimer);
    isMouseEnabled = $('#mouseCheck').is(':checked')
    $('#retry').css('display', 'none');
    $("#result").html("\
    Click Amount: 0 clicks / 0 seconds\
    <br> Stream Speed: 0 BPM\
    <br> Unstable Rate: 0\
	");
    if (runNumber > 0) {
        $("#chartContainer").CanvasJSChart().options.data.push({
            type: "spline",
            dataPoints: []
        });
        $("#chartContainer").CanvasJSChart().options.data[runNumber - 1].visible = false;
    }
    $("#chartContainer").CanvasJSChart().render();
    counterNumber = 0;
    return true;
}

function StopTest() {

    isTestRunning = false;
    Update(false);
    beginTime = -1;

    $('#retry').css('display', 'block');
    $("#status").html("<br>Test Finished. Hit the retry button to try again.");

    if (method == 'time')
        window.clearInterval(endTimer);

    if (clickAmount.length == 0) // if user hasn't clicked at all, keep results at their defaults
        $("#result").html("\
	Click Amount: 0 clicks / 0 seconds<br>\
	Stream Speed: 0 BPM<br>\
	Unstable Rate: 0\
	")

    window.clearInterval(updater);
    runNumber++;
    return;
}

function stopEvent(event){
    if(event.preventDefault != undefined)
     event.preventDefault();
    if(event.stopPropagation != undefined)
     event.stopPropagation();
   }

$(document).keypress(function (event) {
    if (isTestRunning == true) {
        let key = event.key;
        if (key.toLowerCase().charCodeAt() == (key1.toLowerCase().charCodeAt()) || (key.toLowerCase().charCodeAt() == key2.toLowerCase().charCodeAt())) {
            switch (beginTime) {
                case -1:
                    beginTime = Date.now();
                    $("#status").html("Test currently running.");
                    updater = setInterval(function () {
                        Update(false);}, 16.6); // call the update function every 16.6ms (60Hz)
                    if (method == 'time') {
                        endTimer = setTimeout(function () {
                            StopTest();
                        }, timeLimit * 1000); // make sure to end the test after the time has ended 
                    }
                    break;
                default:
                    Update(true);
                    break;
            }
            if ((clickAmount.length == clickLimit) && (method == "clicks")) {
                StopTest();
                return;
            }
        }
    }
});



$(document).mousedown(function (event) {
    if (isMouseEnabled) {
        document.oncontextmenu = function (e) {
            stopEvent(e); return false;
        };
        if (isTestRunning == true) {
            if ((event.which) == 1 || (event.which) == 3) {
                switch (beginTime) {
                    case -1:
                        beginTime = Date.now();
                        $("#status").html("Test currently running.");
                        updater = setInterval(function () { Update(false); }, 16.6);
                        if (method == 'time') {
                            endTimer = setTimeout(function () {
                                StopTest();
                            }, timeLimit * 1000);
                        }
                    default:
                        Update(true);
                        break;
                }
                if ((clickAmount.length == clickLimit) && (method == 'clicks')) {
                    StopTest();
                    return;
                }
            }
        }
    }
    else {
        document.oncontextmenu = undefined;
    }
});

function Update(click) {
    if (click) {
        if (timeDiff.length > 0) {
            let sum = timeDiff.reduce(function (a, b) { return a + b });
            let avg = sum / timeDiff.length;
            $.each(timeDiff, function (i, v) {
                deviations[i] = (v - avg) * (v - avg);
            });
            variance = deviations.reduce(function (a, b) { return a + b; });
            std = Math.sqrt(variance / deviations.length);
            unstableRate = std * 10;
        }
        clickAmount.push(Date.now());
        if (clickAmount.length > 1)
            timeDiff.push(clickAmount[clickAmount.length - 1] - clickAmount[clickAmount.length - 2]);
        if (clickAmount.length > 2) {
            let chart = $("#chartContainer").CanvasJSChart();
            chart.options.data[runNumber].dataPoints.push({
                x: (Date.now() - beginTime) / 1000.0,
                y: (Math.round((((clickAmount.length) / (Date.now() - beginTime) * 60000) / 4) * 100) / 100)
            });
            chart.render();
        }
    }
    else {
        counterNumber = (counterNumber + 1) % 30;
        let streamTime = (Date.now() - beginTime) / 1000;
        if (timeDiff.length < 2) {
            $("#result").html("\
			Click Amount: " + (clickAmount.length.toString() + " clicks / " + streamTime.toFixed(3)) + " seconds<br>\
			Stream Speed: " + (Math.round((((clickAmount.length) / (Date.now() - beginTime) * 60000) / 4) * 100) / 100).toFixed(2) + " BPM<br>\
			Unstable Rate: n/a\
		");
        }
        else {
            $("#result").html("\
				Click Amount: " + (clickAmount.length.toString() + " clicks / " + streamTime.toFixed(3)) + " seconds.<br>\
				Stream Speed: " + (Math.round((((clickAmount.length) / (Date.now() - beginTime) * 60000) / 4) * 100) / 100).toFixed(2) + " BPM<br>\
				Unstable Rate: " + (Math.round(unstableRate * 100000) / 100000).toFixed(3) + "\
			");
            if (counterNumber == 0) {
                let chart = $("#chartContainer").CanvasJSChart();
                chart.options.data[runNumber].dataPoints.push({
                    x: (Date.now() - beginTime) / 1000.0,
                    y: (Math.round((((clickAmount.length) / (Date.now() - beginTime) * 60000) / 4) * 100) / 100)
                });
                chart.render();
            }
        }
    }
}

function stopEvent(event) {
    if (event.preventDefault != undefined)
        event.preventDefault();
    if (event.stopPropagation != undefined)
        event.stopPropagation();
}


