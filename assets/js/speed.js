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

let updater;
let endTimer;
let std;
let mouse;
let variance;
let unstableRate;
let beginTime;

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
    $('#start').click(function(){
        $('html, body').animate({
            scrollTop: $("#resultsAnchor").offset().top
        }, 500);
        beginTest();
    });

    if (!localStorage.getItem('clickLimit'))
        $("input#clickNum").val("20");
    else
        $("input#clickNum").val(localStorage.getItem('clickLimit'));
    if (!localStorage.getItem('key1'))
        $("input#key1").val("z");
    else
        $("input#key1").val(localStorage.getItem('key1'));
    if (!localStorage.getItem('key2'))
        $("input#key2").val("x");
    else
        $("input#key2").val(localStorage.getItem('key2'));
    if (!localStorage.getItem('timeLimit'))
        $("input#clickTime").val("10");
    else
        $("input#clickTime").val(localStorage.getItem('timeLimit'));
    if (!localStorage.getItem('mouse'))
        $("input[name='cmouse']").prop("checked", false);
    else
        $("input[name='cmouse']").prop("checked", localStorage.getItem('mouse') == "true");

    $("#chartContainer").CanvasJSChart({
        zoomEnabled: true,
        exportEnabled: true,
        title: {
            text: "BPM Chart"
        },
        axisY: {
            title: "BPM",
            includeZero: false
        },
        axisX: {
            title: "Time elapsed",
        },
        data: [
            {
                type: "spline",
                dataPoints: []
            }
        ]
    });

});

function beginTest() {
    if ($('#method').value == 'time') {
        timeLimit = Math.round(parseInt($('#clickOrTimeAmount').value));
    alert(timeLimit);
        if (timeLimit < 5) {
            alert("Please enter a value larger than 5");
            return false;
        }

    }

    else {
        clickLimit = Math.round(parseInt($('#clickOrTimeAmount').value));
        if (clickLimit < 5) {
            alert("Please enter a value larger than 5");
            return false;
        }
    }

    isTestRunning = true;
    clickAmount.length = 0;
    deviations.length = 0;
    timeDiff.length = 0;
    beginTime = -1;
    key1 = $('#key1').val();
    key2 = $('#key2').val();
    mouse = $("input[name='cmouse']").prop("checked");

    $("div#status").html("Test ready, press key 1 or key 2 to begin.");
    $("div#Result").html("\
        Click Amount: 0 taps / 0 seconds<br>\
        Stream Speed: 0 bpm<br>\
        Unstable Rate: 0\
	");

    localStorage.setItem('clickLimit', clickLimit);
    localStorage.setItem('timeLimit', timeLimit);
    localStorage.setItem('key1', key1);
    localStorage.setItem('key2', key2);
    localStorage.setItem('mouse', mouse);
    std = 0;

    $("button#submit").hide();
    $("button#stopbtn").show();

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

function endTest() {
    isTestRunning = false;
    update(false);
    beginTime = -1;

    $("button#submit").html("Retry");
    $("button#submit").show();
    $("button#stopbtn").hide();
    $("div#status").html("Test Finished. Hit the Retry button or press Enter to try again.");

    if ($("input[name='roption']:checked").val() == "time")
        window.clearInterval(endTimer);

    if (clickAmount.length == 0) // if user hasn't clicked at all, keep results at their defaults
        $("div#Result").html("\
	Click Amount: 0 taps / 0 seconds<br>\
	Stream Speed: 0 bpm<br>\
	Unstable Rate: 0\
	")

    window.clearInterval(updater);
    runNumber++;
    return;
}

function update(click) {
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
        let streamtime = (Date.now() - beginTime) / 1000;
        if (timeDiff.length < 2) {
            $("div#Result").html("\
			Click Amount: " + (clickAmount.length.toString() + " taps / " + streamtime.toFixed(3)) + " seconds<br>\
			Stream Speed: " + (Math.round((((clickAmount.length) / (Date.now() - beginTime) * 60000) / 4) * 100) / 100).toFixed(2) + " bpm<br>\
			Unstable Rate: n/a\
		");
        }
        else {
            $("div#Result").html("\
				Click Amount: " + (clickAmount.length.toString() + " taps / " + streamtime.toFixed(3)) + " seconds.<br>\
				Stream Speed: " + (Math.round((((clickAmount.length) / (Date.now() - beginTime) * 60000) / 4) * 100) / 100).toFixed(2) + " bpm.<br>\
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

$(document).keypress(function (event) {
    if (event.keyCode == 13 && isTestRunning == false)
        beginTest();
    if (isTestRunning == true) {
        if ((String.fromCharCode(event.which) == key1) || (String.fromCharCode(event.which) == key2)) {
            switch (beginTime) {
                case -1:
                    beginTime = Date.now();
                    $("div#status").html("Test currently running.");
                    updater = setInterval(function () { update(false); }, 16.6);
                    if ($("input[name='roption']:checked").val() == "time") {
                        endTimer = setTimeout(function () {
                            endTest();
                        }, timeLimit * 1000);
                    }

                default:
                    update(true);
                    break;
            }
            if ((clickAmount.length == clickLimit) && ($("input[name='roption']:checked").val() == "clicks")) {
                endTest();
                return;
            }
        }
    }
});

$(document).mousedown(function (event) {
    if ($("input[name='cmouse']").prop("checked")) {
        document.oncontextmenu = function (e) { stopEvent(e); return false; };

        if (event.keyCode == 13 && isTestRunning == false)
            beginTest();
        if (isTestRunning == true) {
            if ((event.which) == 1 || (event.which) == 3) {
                switch (beginTime) {
                    case -1:
                        beginTime = Date.now();
                        $("div#status").html("Test currently running.");
                        updater = setInterval(function () { update(false); }, 16.6);
                        if ($("input[name='roption']:checked").val() == "time") {
                            endTimer = setTimeout(function () {
                                endTest();
                            }, timeLimit * 1000);
                        }
                    default:
                        update(true);
                        break;
                }
                if ((clickAmount.length == clickLimit) && ($("input[name='roption']:checked").val() == "clicks")) {
                    endTest();
                    return;
                }
            }
        }
    }
    else {
        document.oncontextmenu = undefined;
    }
});

function stopEvent(event) {
    if (event.preventDefault != undefined)
        event.preventDefault();
    if (event.stopPropagation != undefined)
        event.stopPropagation();
}


