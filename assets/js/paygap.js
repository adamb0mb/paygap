function loadCountryData() {
    $.ajax({
        url: '/data/united-states.txt',
        dataType: 'json',
        cache: false,
        success: function (data) {
            countryData = data;
            buildReportMenu();
            readUrl(); // check to see if we need to load the page from the URL
        }
    });
}


function buildReportMenu() {
    var options = '';
    for (var i = 0; i < countryData.length; i++) {
        options += "<option value='" + countryData[i][0].title + "'>" + countryData[i][0].title + "</options>";
    }
    options = "<option value='national'>National Data</option>" + options;
    $('#chartDataSelect').html(options);
}

function populateText(divId, values, templateDivId) {

    if (divId.indexOf("#") != 0) divId = "#" + divId;
    if (templateDivId.indexOf("#") != 0) templateDivId = "#" + templateDivId;

    template = $(templateDivId).html();
    if (template == null || typeof (template) == 'undefined') {
        return;
    }
    for (var value in values) {
        template = template.replace(new RegExp("#" + value + "#", 'gi'), values[value]);
    }
    $(divId).html(template);
}

function loadDefaultChart() {
    // get new data
    chart = new google.visualization.LineChart(document.getElementById('chart_div'));
    var options = {
        title: 'National Salaries'
                    , axisTitlesPosition: "out"
                    , chartArea: { left: "10%", top: "20%", width: "90%", height: "50%" }
                    , legend: {
                        position: "top"
                    }
                    , height: 500
                    , hAxis: {
                        title: "Jobs, from low- to high- paying"
                        , textPosition: "out"
                        //                        , showTextEvery: 1
                        , slantedText: 1
                        , maxAlternation: 10
                    }
                    , vAxis: {
                        title: "pay, in US$"
                        , minValue: 0
                    }
    };

    var chartData = new google.visualization.DataTable();

    //add columns
    chartData.addColumn("string", "Job");
    chartData.addColumn("number", "Male National Median Uncontrolled Salary");
    chartData.addColumn("number", "Female National Median Uncontrolled Salary")

    //add rows
    filteredRows = Array();
    for (var i = 0; i < countryData.length; i++) {
        job = countryData[i][0];
        maleNationalPay = job.rows[0][2];
        femaleNationalPay = job.rows[1][2];
        filteredRows.push([job.title, maleNationalPay, femaleNationalPay]);
    }

    // hide the old data first
    $("#country_page").show();
    $("#job_page").hide();

    chartData.addRows(filteredRows);
    chart.draw(chartData, options);

}

function buildPieChart(jobDataEntry) {
    var GENDER = 0; COUNT = 3; // array positions
    var pieData = new google.visualization.DataTable();
    pieData.addColumn("string","Gender");
    pieData.addColumn("number","Percentage per Gender");
    filteredData = Array(), totalCount = 0;
    for (i in jobDataEntry.rows) {
        totalCount += jobDataEntry.rows[i][COUNT];
    }
    for (i in jobDataEntry.rows) {
        filteredData.push([jobDataEntry.rows[i][GENDER], jobDataEntry.rows[i][COUNT]/totalCount]);
    }
    pieData.addRows(filteredData);
    options = {
        //title: 'Gender Distribution'
        };

    pieChart = new google.visualization.PieChart(document.getElementById('job_chart_pie_div'));
    pieChart.draw(pieData,options);
}

function init() {
    History = window.History; // Note: We are using a capital H instead of a lower h
    if (!History.enabled) {
        // do nothing, but maybe something later
    }

}

function setUrl(selectedOption) {
    //window.location.hash == encodeURI(selectedOption);
    if (History.enabled) {
        History.pushState(null, null, "?job="+ encodeURI(selectedOption));
    }
}


function getUrlJob() {
    var job;
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
        if (key.toLowerCase() == "job")
            job = decodeURI(value);
    });
    return job;
}


function readUrl() {
    // stub method
    // this will set the selectedOption when a use comes straight to the page (needs to be called from .ready() on the document)
    job = getUrlJob();
    if (job == null || typeof (job) == 'undefined') {
        loadDefaultChart();
    }
    else {
        $("#chartDataSelect").val(job).attr("selected", true);
        updateChart(job);
    }
}

function jobDropdownHandler() {
    selectedOption = $('#chartDataSelect').val();
    if (typeof(selectedOption) == 'undefined' || selectedOption == '' || selectedOption == 'national') {
        loadDefaultChart();
        setUrl("");
    }
    else {
        setUrl(selectedOption);
        updateChart(selectedOption);
    }
}

function updateChart(selectedOption) {
    // get new data
    chart = new google.visualization.ColumnChart(document.getElementById('job_chart_div'));
    chart2 = new google.visualization.ColumnChart(document.getElementById('job_chart2_div'));

    max = 0;
    // data to be used for page text
    var pageData = { "jobtitle": selectedOption };


    // build up the DataTables for the chart
    var chartData = new google.visualization.DataTable();
    chartData.addColumn("string", "Uncontrolled Pay");
    chartData.addColumn("number", "Male");
    chartData.addColumn("number", "Female");
    filteredRows = Array();
    var chartData2 = new google.visualization.DataTable();
    chartData2.addColumn("string", "Controlled Pay");
    chartData2.addColumn("number", "Male");
    chartData2.addColumn("number", "Female");
    filteredRows2 = Array();
    for (var i = 0, match = false; i < countryData.length; i++ && !match) {
        job = countryData[i][0];
        if (job.title == selectedOption) {
            // we found the job in our data set
            var CONTROLLED = 1, UNCONTROLLED = 2, MALE = 0, FEMALE = 1; // array positions

            // building the rows for our google DataTable
            filteredRows.push(["Uncontrolled", job.rows[MALE][UNCONTROLLED], job.rows[FEMALE][UNCONTROLLED]]);
            filteredRows2.push(["Controlled", job.rows[MALE][CONTROLLED], job.rows[FEMALE][CONTROLLED]]);

            // finding the vertical max, to make the charts have the same scale
            max = Math.max(
                        Math.max(job.rows[MALE][CONTROLLED], job.rows[FEMALE][CONTROLLED]),
                        Math.max(job.rows[MALE][UNCONTROLLED], job.rows[FEMALE][UNCONTROLLED]));

            // build pie chart
            buildPieChart(job);

            // data to be populated into the text template
            pageData["Controlled-Male"] = job.rows[MALE][CONTROLLED];
            pageData["Controlled-Female"] = job.rows[FEMALE][CONTROLLED];
            pageData["Uncontrolled-Male"] = job.rows[MALE][UNCONTROLLED];
            pageData["Uncontrolled-Female"] = job.rows[FEMALE][UNCONTROLLED];
            if (job.rows[MALE][UNCONTROLLED] > job.rows[FEMALE][UNCONTROLLED]) {
                pageData["uc_gender_paid_more"] = "men";
                pageData["uc_gender_paid_less"] = "women";
                pageData["uc_percent_better"] = Math.round(((job.rows[MALE][UNCONTROLLED] - job.rows[FEMALE][UNCONTROLLED])
                                                                    / job.rows[FEMALE][UNCONTROLLED]) // percent difference [0..1]
                                                                        * 10000) / 100; // this gets a number rounded to two decimal places [0..100]
            }
            else {
                pageData["uc_gender_paid_more"] = "<b>women</b>";
                pageData["uc_gender_paid_less"] = "men";
                pageData["uc_percent_better"] = Math.round(((job.rows[FEMALE][UNCONTROLLED] - job.rows[MALE][UNCONTROLLED]) / job.rows[MALE][UNCONTROLLED]) * 10000) / 100;
            }
            if (job.rows[MALE][CONTROLLED] > job.rows[FEMALE][CONTROLLED]) {
                pageData["c_gender_paid_more"] = "men";
                pageData["c_gender_paid_less"] = "women";
                pageData["c_percent_better"] = Math.round(((job.rows[MALE][CONTROLLED] - job.rows[FEMALE][CONTROLLED]) / job.rows[FEMALE][CONTROLLED]) * 10000) / 100;
            }
            else {
                pageData["c_gender_paid_more"] = "<b>women</b>";
                pageData["c_gender_paid_less"] = "men";
                pageData["c_percent_better"] = Math.round(((job.rows[FEMALE][CONTROLLED] - job.rows[MALE][CONTROLLED]) / job.rows[MALE][CONTROLLED]) * 10000) / 100;
            }
        }
    }
    chartData.addRows(filteredRows);
    chartData2.addRows(filteredRows2);

    // chart options
    var options = {
        axisTitlesPosition: "out"
                , chartArea: { left: "10%", top: "20%", width: "90%", height: "100%" }
                , legend: {
                    position: "top"
                }
                , hAxis: {
                    title: "Male vs Female"
                    , textPosition: "out"
                }
                , vAxis: {
                    title: "pay, in US$"
                    , minValue: 0
                    , maxValue: max
                }
    };

    // Adding all the data to the dive
    chart.draw(chartData, options);
    chart2.draw(chartData2, options);
    populateText("#job_chart_text_div", pageData, "#job_chart_text_div_template");
    populateText("#job_chart2_text_div", pageData, "#job_chart2_text_div_template");

    // hide the old data
    $("#country_page").hide();
    $("#job_page").show();

}
